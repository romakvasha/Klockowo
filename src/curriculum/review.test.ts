import { describe, expect, it } from 'vitest';
import { levelById } from './levels';
import {
  MAX_RETRY, addDays, chooseSwaps, dropRetry, dueSkills, isDue, levelSpecs, nextReview, queueRetry, reviewLevelIds, reviewSource,
  type ReviewSnapshot, type ReviewState,
} from './review';

const NEW: ReviewState = { stage: 0, due: null, needsReview: false };
const DAY = '2026-10-02';
const done = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, {}]));

describe('інтервальні повторення 1/3/7/14/30 днів', () => {
  it('addDays за місцевим календарем (кінець місяця й року)', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-28', 30)).toBe('2026-04-27');
  });

  it('опанували → завтра; вдалі повторення відсувають на 3, 7, 14, 30, далі кожні 30 днів', () => {
    expect(nextReview(NEW, { ok: true, day: DAY, mastered: false, streak: 3 })).toBe(NEW);
    let s = nextReview(NEW, { ok: true, day: DAY, mastered: true, streak: 8 });
    expect(s).toEqual({ stage: 1, due: '2026-10-03', needsReview: false });
    // того ж дня відповіді розклад не змінюють
    expect(nextReview(s, { ok: false, day: DAY, mastered: true, streak: 0 })).toBe(s);
    const gaps: number[] = [];
    for (let i = 0; i < 5; i++) {
      const day = s.due!;
      s = nextReview(s, { ok: true, day, mastered: true, streak: 9 });
      gaps.push((Date.parse(s.due!) - Date.parse(day)) / 86_400_000);
    }
    expect(gaps).toEqual([3, 7, 14, 30, 30]);
    expect(s.stage).toBe(5);
  });

  it('невдале повторення → «Do powtórki»; 3 з першого разу поспіль знімають його й ставлять повторення на завтра', () => {
    const due: ReviewState = { stage: 3, due: DAY, needsReview: false };
    const failed = nextReview(due, { ok: false, day: DAY, mastered: true, streak: 0 });
    expect(failed).toEqual({ stage: 1, due: null, needsReview: true });
    expect(nextReview(failed, { ok: true, day: DAY, mastered: true, streak: 2 })).toBe(failed);
    expect(nextReview(failed, { ok: true, day: DAY, mastered: true, streak: 3 })).toEqual({ stage: 1, due: '2026-10-03', needsReview: false });
  });

  it('isDue і порядок черги: «Do powtórki» першими, далі за датою', () => {
    expect(isDue(NEW, DAY)).toBe(false);
    expect(isDue({ stage: 2, due: '2026-10-03', needsReview: false }, DAY)).toBe(false);
    expect(isDue({ stage: 2, due: DAY, needsReview: false }, DAY)).toBe(true);
    const skills = {
      'give-n': { stage: 2, due: '2026-10-01', needsReview: false },
      'count-line': { stage: 1, due: '2026-09-20', needsReview: false },
      'subitize-5': { stage: 1, due: null, needsReview: true },
      'zero': { stage: 1, due: '2026-10-09', needsReview: false },
    };
    expect(dueSkills(skills, DAY)).toEqual(['subitize-5', 'count-line', 'give-n']);
  });
});

describe('черга завдань', () => {
  it('reviewSource: останній пройдений рівень, де навичку тренують (не як повторення)', () => {
    expect(reviewSource('count-line', done('w1-1', 'w1-2', 'w1-3'))).toEqual({ level: 'w1-2', index: 0 });
    expect(reviewSource('subitize-5', done('w1-1'))).toBeNull();
    expect(reviewLevelIds({ levels: done('w1-1', 'w1-2', 'w1-3'), skills: { 'count-line': { stage: 1, due: null, needsReview: true } } }))
      .toEqual(new Set(['w1-2']));
  });

  it('queueRetry без повторів і з обмеженням; dropRetry', () => {
    let list = queueRetry([], { level: 'w1-2', index: 1 }, DAY);
    list = queueRetry(list, { level: 'w1-2', index: 1 }, '2026-10-03');
    expect(list).toEqual([{ level: 'w1-2', index: 1, day: '2026-10-03' }]);
    for (let i = 0; i < 10; i++) list = queueRetry(list, { level: 'w1-3', index: i % 6 }, DAY);
    expect(list).toHaveLength(MAX_RETRY);
    expect(dropRetry(list, { level: 'w1-3', index: 0 })).toHaveLength(MAX_RETRY - 1);
  });

  const snapshot = (over: Partial<ReviewSnapshot> = {}): ReviewSnapshot => ({
    levels: done('w1-1', 'w1-2', 'w1-3'),
    skills: { 'count-line': { stage: 1, due: null, needsReview: true }, 'give-n': { stage: 1, due: DAY, needsReview: false } },
    retry: [{ level: 'w1-3', index: 0, day: '2026-10-01' }],
    history: [{ day: DAY }],
    ...over,
  });

  it('chooseSwaps: спершу «разом», далі навички до повторення (крім тієї, яку рівень тренує), лише в слоти-повторення', () => {
    const level = levelById('w1-4'); // 4 × «Nakarm» (give-n) + 2 повторення (слоти 4, 5)
    expect(chooseSwaps(level, snapshot(), DAY)).toEqual({
      swaps: [
        { level: 'w1-3', index: 0, kind: 'retry', at: 4 },
        { level: 'w1-2', index: 0, kind: 'review', at: 5 },
      ],
      warmup: false,
    });
    // «разом» з цього ж рівня не повертається в ньому самому; лише дві навички — два слоти
    expect(chooseSwaps(level, snapshot({ retry: [{ level: 'w1-4', index: 0, day: DAY }] }), DAY).swaps).toEqual([
      { level: 'w1-2', index: 0, kind: 'review', at: 4 },
    ]);
    expect(chooseSwaps(levelById('w1-1'), snapshot(), DAY).swaps).toEqual([]);
    expect(chooseSwaps(level, snapshot(), DAY, () => false).swaps).toEqual([]);
  });

  it('перший рівень дня — розминка: завдання з черги йдуть першими', () => {
    const level = levelById('w1-4');
    const queue = chooseSwaps(level, snapshot({ history: [{ day: '2026-10-01' }] }), DAY);
    expect(queue.warmup).toBe(true);
    const specs = levelSpecs(level, queue);
    expect(specs.map((s) => s.kind)).toEqual(['retry', 'review', 'own', 'own', 'own', 'own']);
    expect(specs[0]).toMatchObject({ ref: { level: 'w1-3', index: 0 }, spec: { game: 'blysk', review: true } });
    expect(specs[2]?.ref).toEqual({ level: 'w1-4', index: 0 });
    expect(levelSpecs(level, { ...queue, warmup: false }).map((s) => s.kind)).toEqual(['own', 'own', 'own', 'own', 'retry', 'review']);
    expect(levelSpecs(level, { swaps: [], warmup: false }).map((s) => s.spec)).toEqual(level.tasks);
  });
});
