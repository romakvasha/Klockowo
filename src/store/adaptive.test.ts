import { describe, expect, it } from 'vitest';
import { STEP_MIN } from '../curriculum/adaptivity';
import { emptyProgress, emptySkill } from './defaults';
import { normalizeProgress } from './normalize';
import { addRetry, isMastered, recordAnswer, removeRetry, skillState, updateSkill } from './progress';
import type { AnswerEntry, SkillRecord } from './types';

const entry = (firstTry: boolean, day: string): AnswerEntry => ({
  t: 0, day, skill: 'count-line', game: 'policzIDotknij', level: 'w1-2', firstTry, attempts: firstTry ? 1 : 2, hints: 0, together: false, ms: 1000,
});

function answer(skill: SkillRecord, oks: readonly boolean[], day: string): SkillRecord {
  return oks.reduce((s, ok) => updateSkill(s, { firstTry: ok, day }), skill);
}

describe('навичка в сховищі: крок складності, опанування й повторення разом', () => {
  it('опанування вимагає кроку ≥ 0 (без додаткової опори)', () => {
    const recent = [...Array(5).fill({ ok: true, day: '2026-10-01' }), ...Array(5).fill({ ok: true, day: '2026-10-02' })];
    expect(isMastered(recent)).toBe(true);
    expect(isMastered(recent, -1)).toBe(false);
  });

  it('10 правильних за 2 дні: крок угору, опановано, повторення завтра; невдале повторення → «Do powtórki» на стежці', () => {
    let s = answer(emptySkill(), Array(5).fill(true), '2026-10-01');
    expect(s.step).toBe(1);
    s = answer(s, Array(5).fill(true), '2026-10-02');
    expect(s).toMatchObject({ step: 2, stage: 1, due: '2026-10-03', needsReview: false });
    expect(skillState(s)).toBe('mastered');
    s = updateSkill(s, { firstTry: false, day: '2026-10-03' });
    expect(s).toMatchObject({ needsReview: true, stage: 1 });
    expect(skillState(s)).toBe('review');
    s = answer(s, [true, true, true], '2026-10-03');
    expect(s).toMatchObject({ needsReview: false, due: '2026-10-04' });
  });

  it('помилки на найнижчому кроці: інша гра, потім прапорець для батьків; опанування знімає прапорець', () => {
    let s = answer(emptySkill(), [false, false, false, false], '2026-10-01');
    expect(s.step).toBe(STEP_MIN);
    s = answer(s, [false, false], '2026-10-01');
    expect(s).toMatchObject({ struggle: 1, flagged: false });
    s = answer(s, [false, false], '2026-10-01');
    expect(s).toMatchObject({ struggle: 2, flagged: true });
    s = answer(s, Array(10).fill(true), '2026-10-01');
    expect(s).toMatchObject({ step: 0, struggle: 0, flagged: true }); // один день — ще не опановано
    s = answer(s, Array(10).fill(true), '2026-10-02');
    expect(s.flagged).toBe(false);
  });

  it('recordAnswer пише історію й навичку; черга «разом» додається й знімається', () => {
    let p = recordAnswer(emptyProgress(), entry(true, '2026-10-01'));
    expect(p.skills['count-line']).toMatchObject({ attempts: 1, streak: 1, sinceStep: 1 });
    p = addRetry(p, { level: 'w1-2', index: 3 }, '2026-10-01');
    expect(p.retry).toEqual([{ level: 'w1-2', index: 3, day: '2026-10-01' }]);
    expect(removeRetry(p, { level: 'w1-2', index: 3 }).retry).toEqual([]);
  });
});

describe('нормалізація нових полів', () => {
  it('крок обмежується −2…2, сміття в черзі й забігах відкидається', () => {
    const p = normalizeProgress({
      skills: { 'count-line': { attempts: 3, step: -9, struggle: 7, flagged: 'так' } },
      retry: [{ level: 'w1-2', index: 1, day: '2026-10-01' }, { level: 'w1-2', index: 99, day: '2026-10-01' }, { level: 'zzz', index: 0, day: '2026-10-01' }, 'x'],
      runs: {
        'w1-4': {
          seed: 3, results: [], startedAt: 's', warmup: true,
          swaps: [
            { level: 'w1-3', index: 0, at: 4, kind: 'retry' },
            { level: 'w1-3', index: 0, at: 0, kind: 'retry' }, // слот 0 — не повторення
            { level: 'w1-3', index: 1, at: 4, kind: 'review' }, // слот уже зайнятий
            { level: 'w1-2', index: 0, at: 5, kind: 'boom' },
          ],
        },
        'w1-5': { seed: 3, results: [], startedAt: 's', warmup: true, swaps: [] },
      },
    });
    expect(p.skills['count-line']).toMatchObject({ step: -2, struggle: 2, flagged: false });
    expect(p.retry).toEqual([{ level: 'w1-2', index: 1, day: '2026-10-01' }]);
    expect(p.runs['w1-4']).toMatchObject({ swaps: [{ level: 'w1-3', index: 0, at: 4, kind: 'retry' }], warmup: true });
    expect(p.runs['w1-5']?.warmup).toBe(false);
  });
});
