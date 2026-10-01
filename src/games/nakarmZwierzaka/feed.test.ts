import { describe, expect, it } from 'vitest';
import { levelById, LEVELS } from '../../curriculum/levels';
import type { FeedTask } from '../../curriculum/types';
import { ANIMAL_IDS } from '../../speech/nouns';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext } from '../engine/types';
import { hintFeed, togetherFeed } from './assist';
import { FOOD_IDS, checkFeed, generateFeed, type FeedInstance } from './generate';
import { nakarmZwierzaka } from './index';
import { supplyCount } from './layout';
import { plateBox, plateItemSize } from './View';

const ctxFor = (id: Parameters<typeof levelById>[0], seed: number, previous: readonly number[] = []): GenContext => {
  const level = levelById(id);
  return { level, world: level.world, index: previous.length, rng: createRng(seed), previous };
};
const feedTasks = LEVELS.filter((l) => l.world === 'w1').flatMap((l) => l.tasks.filter((t): t is FeedTask => t.game === 'nakarmZwierzaka').map((t) => ({ level: l, task: t })));

const instance = (over: Partial<FeedInstance> = {}): FeedInstance => ({
  game: 'nakarmZwierzaka', skill: 'give-n', review: false, animal: 'mis', food: 'jablko', n: 5, slots: false, supply: 8, seed: 1, ...over,
});

describe('generateFeed', () => {
  it('усі «Nakarm zwierzaka» у W1: число в діапазоні, тваринка й їжа з каталогу, запас = n + 3', () => {
    expect(feedTasks.length).toBeGreaterThan(5);
    for (const { level, task } of feedTasks) {
      for (let seed = 1; seed <= 20; seed++) {
        const i = generateFeed(task, ctxFor(level.id, seed));
        expect(i.n).toBeGreaterThanOrEqual(task.count[0]);
        expect(i.n).toBeLessThanOrEqual(task.count[1]);
        expect(ANIMAL_IDS as readonly string[]).toContain(i.animal);
        expect(FOOD_IDS as readonly string[]).toContain(i.food);
        expect(i.supply).toBe(supplyCount(i.n));
        expect(i.supply).toBeGreaterThan(i.n - 1);
        expect(i.slots).toBe(task.slots);
      }
    }
  });

  it('детермінований; різні зерна дають різні завдання', () => {
    const task = feedTasks[0]?.task as FeedTask;
    expect(generateFeed(task, ctxFor('w1-4', 7))).toEqual(generateFeed(task, ctxFor('w1-4', 7)));
    const variants = new Set([1, 2, 3, 4, 5, 6].map((s) => JSON.stringify(generateFeed(task, ctxFor('w1-4', s)))));
    expect(variants.size).toBeGreaterThan(3);
  });

  it('число не повторюється двічі поспіль', () => {
    const task = feedTasks.find((t) => t.task.count[1] === 5)?.task as FeedTask;
    const answers: number[] = [];
    for (let k = 0; k < 6; k++) answers.push(generateFeed(task, { ...ctxFor('w1-8', 80 + k), previous: [...answers], index: k }).n);
    for (let k = 1; k < answers.length; k++) expect(answers[k]).not.toBe(answers[k - 1]);
  });
});

describe('checkFeed', () => {
  it('рівно N — правильно; ±1 — «Prawie!»; решта — звичайна помилка', () => {
    expect(checkFeed({ n: 5 }, 5)).toEqual({ ok: true });
    expect(checkFeed({ n: 5 }, 4)).toEqual({ ok: false, almost: true });
    expect(checkFeed({ n: 5 }, 6)).toEqual({ ok: false, almost: true });
    expect(checkFeed({ n: 5 }, 2)).toEqual({ ok: false, almost: false });
    expect(checkFeed({ n: 5 }, 0)).toEqual({ ok: false, almost: false });
  });
});

describe('гра-модуль «Nakarm zwierzaka»', () => {
  it('інструкція — дослівно BRIEF §7 гра 5: «Daj misiowi pięć jabłek.»', () => {
    expect(nakarmZwierzaka.prompt(instance())).toBe('Daj misiowi pięć jabłek.');
    expect(nakarmZwierzaka.prompt(instance({ n: 1, food: 'gruszka', animal: 'kotek' }))).toBe('Daj kotkowi jedną gruszkę.');
    expect(nakarmZwierzaka.prompt(instance({ n: 2, food: 'gruszka', animal: 'zabka' }))).toBe('Daj żabce dwie gruszki.');
  });

  it('похвала — «Brawo! Pięć jabłek.» (BRIEF §7)', () => {
    expect(nakarmZwierzaka.praise(instance(), 'Brawo!')).toBe('Brawo! Pięć jabłek.');
  });

  it('гра-конструктор без плиток; відповідь — N', () => {
    expect(nakarmZwierzaka.kind).toBe('build');
    expect(nakarmZwierzaka.tiles(instance())).toEqual([]);
    expect(nakarmZwierzaka.answer(instance({ n: 7 }))).toBe(7);
  });
});

describe('допомога в «Nakarm zwierzaka»', () => {
  const recorder = () => {
    const said: string[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = { say: async (t) => { said.push(t); }, wait: async () => undefined, setAssist: (a) => { assists.push(a); } };
    return { said, assists, ctx };
  };

  it('1-ша підказка лічить те, що лежить на тарілці', async () => {
    const { said, assists, ctx } = recorder();
    await hintFeed(instance(), ctx, { nth: 1, response: 3 });
    expect(said).toEqual(['jeden', 'dwa', 'trzy']);
    expect(assists).toEqual([{ mode: 'hint', step: 1, level: 1 }, { mode: 'hint', step: 2, level: 1 }, { mode: 'hint', step: 3, level: 1 }]);
  });

  it('якщо тарілка порожня, підказка нагадує завдання', async () => {
    const { said, ctx } = recorder();
    await hintFeed(instance(), ctx, { nth: 1, response: null });
    expect(said).toEqual(['Daj misiowi pięć jabłek.']);
  });

  it('2-га підказка вмикає слоти й нагадує завдання', async () => {
    const { said, assists, ctx } = recorder();
    await hintFeed(instance(), ctx, { nth: 2, response: 3 });
    expect(assists).toEqual([{ mode: 'hint', step: 0, level: 2 }]);
    expect(said).toEqual(['Daj misiowi pięć jabłek.']);
  });

  it('показ разом: Kubik кладе по одному, лічить і підсумовує «Trzy jabłka.»', async () => {
    const { said, assists, ctx } = recorder();
    await togetherFeed(instance({ n: 3 }), ctx);
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'Trzy jabłka.']);
    expect(assists.map((a) => a.step)).toEqual([1, 2, 3]);
    expect(assists.every((a) => a.mode === 'together')).toBe(true);
  });
});

describe('тарілка в лотку', () => {
  it('розміри за виглядом: ПК 360×108, портрет 312×96, телефон 88×220 (коробка)', () => {
    expect(plateBox('wide')).toMatchObject({ width: 360, height: 108, shape: 'plate' });
    expect(plateBox('portrait')).toMatchObject({ width: 312, height: 96, shape: 'plate' });
    expect(plateBox('phone')).toMatchObject({ width: 88, height: 220, shape: 'box', cols: 2 });
  });

  it('предмети зменшуються, коли їх понад 6', () => {
    expect(plateItemSize(50, 3)).toBe(50);
    expect(plateItemSize(50, 6)).toBe(50);
    expect(plateItemSize(50, 7)).toBe(40);
  });
});
