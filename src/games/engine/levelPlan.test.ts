import { describe, expect, it } from 'vitest';
import { levelById } from '../../curriculum/levels';
import type { TaskSpec } from '../../curriculum/types';
import { buildEntry, playMinutes } from './entry';
import { TASKS_PER_LEVEL, isLevelFinished, planLevel, resumeIndex, summarize, taskRng, type GameResolver } from './levelPlan';
import type { GameDef, GenContext, TaskBase } from './types';

/** Підроблена гра: правильна відповідь = випадкове 1–5; пам'ятає, що їй передали як previous. */
const seen: (readonly number[])[] = [];
const fake: GameDef = {
  id: 'policzIDotknij',
  generate: (spec: TaskSpec, ctx: GenContext) => {
    seen.push(ctx.previous);
    return { game: spec.game, skill: spec.skill, review: spec.review === true, n: ctx.rng.int(1, 5) } as TaskBase & { n: number };
  },
  prompt: () => '',
  bubble: () => null,
  sceneLabel: () => '',
  tiles: () => [],
  answer: (i) => (i as TaskBase & { n: number }).n,
  check: () => ({ ok: true }),
  praise: () => '',
  hint: async () => undefined,
  together: async () => undefined,
  Scene: () => null,
};
const resolve: GameResolver = (game) => (game === 'policzIDotknij' ? fake : undefined);

describe('planLevel', () => {
  const level = levelById('w1-1');

  it('6 завдань за номерами 0…5, із гри-модуля', () => {
    const plan = planLevel(level, 123, resolve);
    expect(plan).toHaveLength(TASKS_PER_LEVEL);
    expect(plan.map((p) => p.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(plan.every((p) => p.def === fake)).toBe(true);
  });

  it('те саме зерно — ті самі завдання (продовження після «Mapa»), інше зерно — інші', () => {
    const answers = (seed: number) => planLevel(level, seed, resolve).map((p) => fake.answer(p.instance));
    expect(answers(5)).toEqual(answers(5));
    const variants = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => answers(s).join()));
    expect(variants.size).toBeGreaterThan(3);
  });

  it('завдання не залежить від попередніх у потоці випадковості: його число однакове, що б не передувало', () => {
    expect(taskRng('w1-1', 9, 3).int(1, 100)).toBe(taskRng('w1-1', 9, 3).int(1, 100));
    expect(taskRng('w1-1', 9, 3).int(1, 100000)).not.toBe(taskRng('w1-1', 9, 4).int(1, 100000));
  });

  it('генератор отримує правильні відповіді попередніх завдань', () => {
    seen.length = 0;
    const plan = planLevel(level, 77, resolve);
    expect(seen[0]).toEqual([]);
    expect(seen[3]).toEqual(plan.slice(0, 3).map((p) => fake.answer(p.instance)));
  });

  it('гра без модуля дає заглушку, а не помилку', () => {
    const plan = planLevel(levelById('w1-3'), 1, resolve); // «Błysk!» ще не реалізовано
    const placeholder = plan.find((p) => p.def === null);
    expect(placeholder).toBeDefined();
    expect(placeholder?.instance).toMatchObject({ placeholder: true, game: 'blysk' });
  });

  it('заготовки без завдань (W2+) дають порожній план', () => {
    expect(planLevel(levelById('w2-1'), 1, resolve)).toEqual([]);
  });
});

describe('summarize, resumeIndex, isLevelFinished', () => {
  it('підсумок: скільки з першого разу й чи був «разом»', () => {
    expect(summarize(['first', 'first', 'retry', 'together', 'first', 'first'])).toEqual({ firstTry: 4, togetherUsed: true });
    expect(summarize(['first', 'retry'])).toEqual({ firstTry: 1, togetherUsed: false });
    expect(summarize([])).toEqual({ firstTry: 0, togetherUsed: false });
  });

  it('продовження з першого завдання без результату', () => {
    expect(resumeIndex(undefined)).toBe(0);
    expect(resumeIndex({ results: ['first', 'retry'] })).toBe(2);
    expect(resumeIndex({ results: Array(9).fill('first') })).toBe(TASKS_PER_LEVEL);
  });

  it('рівень закінчено, коли всі завдання мають результат', () => {
    expect(isLevelFinished(['first', 'first'])).toBe(false);
    expect(isLevelFinished(Array(6).fill('first'))).toBe(true);
    expect(isLevelFinished(['first'], 1)).toBe(true);
  });
});

describe('buildEntry', () => {
  const level = levelById('w1-1');
  const instance: TaskBase = { game: 'policzIDotknij', skill: 'count-line', review: false };
  const now = new Date(2026, 9, 1, 12, 30, 0);

  it('з першого разу: 1 спроба, без хибних', () => {
    const e = buildEntry({ instance, level, state: { mistakes: 0, hints: 0, together: false, wrong: [] }, answer: 3, ms: 4210.7, now });
    expect(e).toEqual({
      t: now.getTime(), day: '2026-10-01', skill: 'count-line', game: 'policzIDotknij', level: 'w1-1', firstTry: true, attempts: 1,
      hints: 0, together: false, ms: 4211, answer: 3,
    });
  });

  it('після двох помилок разом із Kubikom: 3 спроби, хибні вибори записано', () => {
    const e = buildEntry({ instance, level, state: { mistakes: 2, hints: 1, together: true, wrong: [4, 2] }, answer: 3, ms: 9000, now });
    expect(e).toMatchObject({ firstTry: false, attempts: 3, hints: 1, together: true, wrong: [4, 2] });
  });

  it('більше трьох помилок усе одно 3 спроби; від’ємний час — нуль', () => {
    expect(buildEntry({ instance, level, state: { mistakes: 5, hints: 0, together: true, wrong: [1] }, answer: 3, ms: -5, now })).toMatchObject({ attempts: 3, ms: 0 });
  });
});

describe('playMinutes', () => {
  it('мс → хвилини з округленням; не більше 2 хв за завдання', () => {
    expect(playMinutes(30_000)).toBe(0.5);
    expect(playMinutes(600_000)).toBe(2);
    expect(playMinutes(-1)).toBe(0);
  });
});
