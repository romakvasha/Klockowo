import { describe, expect, it } from 'vitest';
import { emptyProgress, emptySkill } from './defaults';
import {
  MAX_HISTORY, RECENT_WINDOW, addPlayTime, clearRun, completeLevel, dayKey, diligenceBadgesOf, isMastered, recordAnswer, saveRun,
  skillState, skillsToReview, stickersOf, totalMinutes,
} from './progress';
import type { AnswerEntry, RecentAnswer, SkillRecord } from './types';

const answer = (over: Partial<AnswerEntry> = {}): AnswerEntry => ({
  t: 1, day: '2026-10-01', skill: 'count-line', game: 'policzIDotknij', level: 'w1-1', firstTry: true, attempts: 1, hints: 0,
  together: false, ms: 1200, ...over,
});
const recent = (oks: boolean[], days: string[]): RecentAnswer[] => oks.map((ok, i) => ({ ok, day: days[i % days.length] ?? '2026-10-01' }));

describe('dayKey', () => {
  it('місцевий день YYYY-MM-DD з нулями', () => {
    expect(dayKey(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01');
    expect(dayKey(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 11, 31, 12, 0))).toBe('2026-12-31');
  });
});

describe('isMastered / skillState (PEDAGOGY §3: ≥ 80 % за останні 10 на ≥ 2 різні дні)', () => {
  const ok8 = [true, true, true, true, true, true, true, true, false, false];

  it('8 з 10 за два дні — опановано', () => {
    expect(isMastered(recent(ok8, ['2026-10-01', '2026-10-02']))).toBe(true);
    expect(isMastered(recent(Array(10).fill(true), ['2026-10-01', '2026-10-03']))).toBe(true);
  });

  it('усе за один день — ще ні, навіть 10 з 10', () => {
    expect(isMastered(recent(Array(10).fill(true), ['2026-10-01']))).toBe(false);
  });

  it('7 з 10 — менше 80 %; менше 10 елементів — рано', () => {
    const seven = [true, true, true, true, true, true, true, false, false, false];
    expect(isMastered(recent(seven, ['2026-10-01', '2026-10-02']))).toBe(false);
    expect(isMastered(recent(Array(9).fill(true), ['2026-10-01', '2026-10-02']))).toBe(false);
    expect(RECENT_WINDOW).toBe(10);
  });

  it('стани карти навичок: Nowa → W trakcie → Opanowana; «Do powtórki» важливіша за опанування', () => {
    expect(skillState(undefined)).toBe('new');
    expect(skillState(emptySkill())).toBe('new');
    const learning: SkillRecord = { ...emptySkill(), attempts: 3, firstTry: 2, recent: recent([true, false, true], ['2026-10-01']) };
    expect(skillState(learning)).toBe('learning');
    const mastered: SkillRecord = { ...learning, attempts: 12, recent: recent(ok8, ['2026-10-01', '2026-10-02']) };
    expect(skillState(mastered)).toBe('mastered');
    expect(skillState({ ...mastered, needsReview: true })).toBe('review');
  });
});

describe('recordAnswer', () => {
  it('лічильники навички, вікно останніх 10, дні без дублів; вхідний прогрес не змінюється', () => {
    const start = emptyProgress();
    let p = start;
    for (let i = 0; i < 12; i++) p = recordAnswer(p, answer({ firstTry: i % 3 !== 0, day: i < 6 ? '2026-10-01' : '2026-10-02' }));
    const skill = p.skills['count-line'];
    expect(skill?.attempts).toBe(12);
    expect(skill?.firstTry).toBe(8); // не з першого разу: i = 0, 3, 6, 9
    expect(skill?.recent).toHaveLength(10);
    expect(skill?.days).toEqual(['2026-10-01', '2026-10-02']);
    expect(p.history).toHaveLength(12);
    expect(start.history).toEqual([]);
    expect(start.skills).toEqual({});
  });

  it('історія обмежена останніми MAX_HISTORY, найновіші лишаються', () => {
    let p = emptyProgress();
    for (let i = 0; i < MAX_HISTORY + 50; i++) p = recordAnswer(p, answer({ t: i }));
    expect(p.history).toHaveLength(MAX_HISTORY);
    expect(p.history[0]?.t).toBe(50);
    expect(p.history[MAX_HISTORY - 1]?.t).toBe(MAX_HISTORY + 49);
  });

  it('дні навички — не більше 30 останніх', () => {
    let p = emptyProgress();
    for (let d = 1; d <= 40; d++) p = recordAnswer(p, answer({ day: `2026-01-${String(d).padStart(2, '0')}` }));
    expect(p.skills['count-line']?.days).toHaveLength(30);
    expect(p.skills['count-line']?.days[0]).toBe('2026-01-11');
  });

  it('різні навички ведуться окремо', () => {
    let p = recordAnswer(emptyProgress(), answer({ skill: 'count-line' }));
    p = recordAnswer(p, answer({ skill: 'give-n', game: 'nakarmZwierzaka', firstTry: false }));
    expect(p.skills['count-line']?.attempts).toBe(1);
    expect(p.skills['give-n']?.firstTry).toBe(0);
  });
});

describe('completeLevel / runs', () => {
  const t1 = new Date('2026-10-01T10:00:00.000Z');
  const t2 = new Date('2026-10-05T10:00:00.000Z');

  it('перше проходження: час, plays = 1; розпочатий забіг знімається', () => {
    const started = saveRun(emptyProgress(), 'w1-1', { seed: 7, results: ['first', 'retry'], startedAt: t1.toISOString() });
    expect(started.runs['w1-1']?.results).toHaveLength(2);
    const done = completeLevel(started, 'w1-1', { firstTry: 5, togetherUsed: false }, t1);
    expect(done.levels['w1-1']).toEqual({ completedAt: t1.toISOString(), plays: 1, togetherUsed: false, firstTry: 5 });
    expect(done.runs['w1-1']).toBeUndefined();
  });

  it('переграш: plays росте, перший час лишається, «разом із Kubikom» не зникає', () => {
    let p = completeLevel(emptyProgress(), 'w1-1', { firstTry: 4, togetherUsed: true }, t1);
    p = completeLevel(p, 'w1-1', { firstTry: 6, togetherUsed: false }, t2);
    expect(p.levels['w1-1']).toEqual({ completedAt: t1.toISOString(), plays: 2, togetherUsed: true, firstTry: 6 });
  });

  it("clearRun знімає забіг; без забігу повертає той самий об'єкт", () => {
    const run = { seed: 1, results: [], startedAt: t1.toISOString() };
    const p = saveRun(emptyProgress(), 'w1-2', run);
    expect(clearRun(p, 'w1-2').runs).toEqual({});
    expect(clearRun(p, 'w1-3')).toBe(p);
  });
});

describe('хвилини, наліпки, значки', () => {
  it('addPlayTime складає хвилини дня; сміття ігнорується', () => {
    let p = addPlayTime(emptyProgress(), '2026-10-01', 4.25);
    p = addPlayTime(p, '2026-10-01', 3.1);
    p = addPlayTime(p, '2026-10-02', 5);
    expect(p.minutesByDay).toEqual({ '2026-10-01': 7.35, '2026-10-02': 5 });
    expect(totalMinutes(p)).toBe(12.35);
    for (const bad of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) expect(addPlayTime(p, '2026-10-03', bad)).toBe(p);
  });

  it('наліпка за кожен пройдений рівень — у порядку програми, ★ теж', () => {
    const t = new Date('2026-10-01T10:00:00.000Z');
    let p = emptyProgress();
    for (const id of ['w1-3', 'w1-1', 'w4-s1', 'w2-1'] as const) p = completeLevel(p, id, { firstTry: 6, togetherUsed: false }, t);
    expect(stickersOf(p)).toEqual(['w1-1', 'w1-3', 'w2-1', 'w4-s1']);
  });

  it("значок «Nie poddajesz się!» — рівні, де розв'язували разом із Kubikom", () => {
    const t = new Date('2026-10-01T10:00:00.000Z');
    let p = completeLevel(emptyProgress(), 'w1-1', { firstTry: 6, togetherUsed: false }, t);
    p = completeLevel(p, 'w1-2', { firstTry: 4, togetherUsed: true }, t);
    expect(diligenceBadgesOf(p)).toEqual(['w1-2']);
  });

  it('skillsToReview — навички з прапором «Do powtórki»', () => {
    const p = { ...emptyProgress(), skills: { 'count-line': { ...emptySkill(), attempts: 5, needsReview: true }, 'give-n': { ...emptySkill(), attempts: 2 } } };
    expect(skillsToReview(p)).toEqual(['count-line']);
  });
});
