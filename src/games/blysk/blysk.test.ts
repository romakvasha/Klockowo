import { describe, expect, it } from 'vitest';
import { dotLayout } from '../../components/math/dotPatterns';
import { levelById, LEVELS } from '../../curriculum/levels';
import type { FlashTask } from '../../curriculum/types';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext } from '../engine/types';
import { hintFlash, introFlash, longFlashMs, togetherFlash } from './assist';
import { flashLayout, generateFlash, type FlashInstance } from './generate';
import { blysk } from './index';
import { cardSize } from './View';

const ctxFor = (id: Parameters<typeof levelById>[0], seed: number, previous: readonly number[] = []): GenContext => {
  const level = levelById(id);
  return { level, world: level.world, index: previous.length, rng: createRng(seed), previous };
};
const flashTasks = LEVELS.filter((l) => l.world === 'w1').flatMap((l) => l.tasks.filter((t): t is FlashTask => t.game === 'blysk').map((t) => ({ level: l, task: t })));

const instance = (over: Partial<FlashInstance> = {}): FlashInstance => ({
  game: 'blysk', skill: 'subitize-5', review: false, count: 5, pattern: 'dice', exposureMs: 1500, answers: 'digitDots',
  options: [4, 5, 6], seed: 3, groups: [3, 2], ...over,
});

describe('generateFlash', () => {
  it('усі «Błysk!» у W1: число в діапазоні, візерунок і тривалість зі специфікації, плитки в межах 1–10', () => {
    expect(flashTasks.length).toBeGreaterThan(5);
    for (const { level, task } of flashTasks) {
      for (let seed = 1; seed <= 20; seed++) {
        const i = generateFlash(task, ctxFor(level.id, seed));
        expect(i.count).toBeGreaterThanOrEqual(task.count[0]);
        expect(i.count).toBeLessThanOrEqual(task.count[1]);
        expect(i.pattern).toBe(task.pattern);
        expect(i.exposureMs).toBe(task.exposureMs);
        expect(i.options).toContain(i.count);
        expect(i.options.every((o) => o >= 1 && o <= 10)).toBe(true);
      }
    }
  });

  it('групи для репліки в сумі дають кількість крапок; розкладка детермінована', () => {
    for (const { level, task } of flashTasks) {
      for (let seed = 1; seed <= 10; seed++) {
        const i = generateFlash(task, ctxFor(level.id, seed));
        expect(i.groups.reduce((s, g) => s + g, 0)).toBe(i.count);
        expect(flashLayout(i).dots).toHaveLength(i.count);
        expect(flashLayout(i)).toEqual(flashLayout(i));
      }
    }
  });

  it('не повторює число підряд (діапазон 1–5)', () => {
    const task = flashTasks.find((t) => t.task.count[1] === 5)?.task;
    expect(task).toBeDefined();
    const answers: number[] = [];
    for (let k = 0; k < 6; k++) {
      const i = generateFlash(task as FlashTask, { ...ctxFor('w1-3', 50 + k), previous: [...answers], index: k });
      answers.push(i.count);
    }
    for (let k = 1; k < answers.length; k++) expect(answers[k]).not.toBe(answers[k - 1]);
  });
});

describe('гра-модуль «Błysk!»', () => {
  it('інструкція — дослівно BRIEF §7: «Patrz uważnie! Ile kropek?»', () => {
    expect(blysk.prompt(instance())).toBe('Patrz uważnie! Ile kropek?');
  });

  it('похвала: слово + «Trzy i dwa to pięć.»; для однієї групи — лише число', () => {
    expect(blysk.praise(instance(), 'Brawo!')).toBe('Brawo! Trzy i dwa to pięć.');
    expect(blysk.praise(instance({ count: 1, groups: [1] }), 'Świetnie!')).toBe('Świetnie! Jeden.');
  });

  it('перевірка як у лічбі: рівно — так, на 1 — «Prawie!»', () => {
    expect(blysk.check(instance(), 5)).toEqual({ ok: true });
    expect(blysk.check(instance(), 4)).toEqual({ ok: false, almost: true });
    expect(blysk.check(instance(), 2)).toEqual({ ok: false, almost: false });
  });

  it('плитки W1 — цифра з крапками; відповідь — кількість', () => {
    expect(blysk.tiles(instance())).toEqual([{ value: 4, dots: 4 }, { value: 5, dots: 5 }, { value: 6, dots: 6 }]);
    expect(blysk.answer(instance())).toBe(5);
    expect(blysk.kind).toBe('choice');
  });
});

describe('допомога в «Błysk!»', () => {
  const recorder = () => {
    const said: string[] = [];
    const waits: number[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = {
      say: async (text) => { said.push(text); },
      wait: async (ms) => { waits.push(ms); },
      setAssist: (a) => { assists.push(a); },
    };
    return { said, waits, assists, ctx };
  };

  it('вступний спалах: показ на exposureMs, потім повернення зворотом', async () => {
    const { assists, waits, ctx } = recorder();
    await introFlash(instance({ exposureMs: 1200 }), ctx);
    expect(assists).toEqual([{ mode: 'intro', step: 1 }, { mode: 'intro', step: 2 }]);
    expect(waits).toEqual([1200]);
  });

  it('1-ша підказка — довший спалах; 2-га й далі — картка лишається з групами', async () => {
    const one = recorder();
    await hintFlash(instance({ exposureMs: 800 }), one.ctx, { nth: 1, response: null });
    expect(one.assists).toEqual([{ mode: 'hint', step: 1, level: 1 }]);
    expect(one.waits[0]).toBe(longFlashMs(800));
    expect(longFlashMs(800)).toBeGreaterThan(800);

    const two = recorder();
    await hintFlash(instance(), two.ctx, { nth: 2, response: 3 });
    expect(two.assists).toEqual([{ mode: 'hint', step: 1, level: 2 }]);
  });

  it('довший спалах не коротший за 2,5 с і удвічі довший за звичайний', () => {
    expect(longFlashMs(500)).toBe(2500);
    expect(longFlashMs(2000)).toBe(4600);
  });

  it('показ разом: картка з групами й репліка «Trzy i dwa to pięć.»', async () => {
    const { said, assists, ctx } = recorder();
    await togetherFlash(instance(), ctx);
    expect(assists).toEqual([{ mode: 'together', step: 1 }]);
    expect(said).toEqual(['Trzy i dwa to pięć.']);
  });
});

describe('cardSize', () => {
  it('до 60 % ширини й 78 % висоти, у межах 120…260', () => {
    expect(cardSize({ w: 1280, h: 432 })).toBe(260);
    expect(cardSize({ w: 342, h: 342 })).toBe(205);
    expect(cardSize({ w: 200, h: 100 })).toBe(120);
  });
});

describe('візерунки W1 у картці', () => {
  it('кубик 1–5 і випадкові 1–5 мають по дві групи, крім 1', () => {
    for (let n = 2; n <= 5; n++) {
      expect(dotLayout('dice', n, createRng(1)).groups).toHaveLength(2);
      expect(dotLayout('random', n, createRng(n)).groups).toHaveLength(2);
    }
  });
});
