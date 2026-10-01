import { describe, expect, it } from 'vitest';
import { levelById, LEVELS } from '../../curriculum/levels';
import type { CountTask } from '../../curriculum/types';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext } from '../engine/types';
import { hintCount, hintSteps, togetherCount } from './assist';
import { checkCount } from './check';
import { generateCount, pickCount, pickOptions, type CountInstance } from './generate';
import { policzIDotknij } from './index';
import { variation } from './look';

const ctxFor = (levelId: Parameters<typeof levelById>[0], seed: number, previous: readonly number[] = []): GenContext => {
  const level = levelById(levelId);
  return { level, world: level.world, index: previous.length, rng: createRng(seed), previous };
};

const countTasks = LEVELS.filter((l) => l.world === 'w1').flatMap((l) => l.tasks.filter((t): t is CountTask => t.game === 'policzIDotknij').map((t) => ({ level: l, task: t })));

describe('pickCount', () => {
  it('число з діапазону; не повторює попереднє, коли є вибір', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const n = pickCount([1, 3], [2], createRng(seed));
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
      expect(n).not.toBe(2);
    }
  });

  it('діапазон з одного числа — це число, навіть якщо воно було', () => {
    expect(pickCount([4, 4], [4], createRng(1))).toBe(4);
  });

  it('усі числа діапазону трапляються', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) seen.add(pickCount([1, 5], [], createRng(seed)));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('pickOptions', () => {
  it('три різні числа за зростанням, серед них правильне', () => {
    for (let count = 1; count <= 10; count++) {
      for (let seed = 1; seed <= 20; seed++) {
        const o = pickOptions(count, 10, createRng(seed));
        expect(o).toHaveLength(3);
        expect(new Set(o).size).toBe(3);
        expect(o).toEqual([...o].sort((a, b) => a - b));
        expect(o).toContain(count);
        expect(Math.min(...o)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...o)).toBeLessThanOrEqual(10);
      }
    }
  });

  it('біля краю діапазону добирає найближчі: 1 → 1, 2, 3; 10 (стеля 10) → 8, 9, 10', () => {
    expect(pickOptions(1, 10, createRng(1))).toEqual([1, 2, 3]);
    expect(pickOptions(10, 10, createRng(1))).toEqual([8, 9, 10]);
  });

  it('хоча б одна хибна відповідь — поряд (±1), типова помилка лічби', () => {
    for (let count = 2; count <= 9; count++) {
      for (let seed = 1; seed <= 20; seed++) {
        const o = pickOptions(count, 10, createRng(seed));
        expect(o.some((v) => Math.abs(v - count) === 1), `${count}`).toBe(true);
      }
    }
  });
});

describe('generateCount', () => {
  it('усі 6 завдань рівня 1 (W1): число 1–3, предмет — kaczuszka, рядок, крапки на плитках', () => {
    const level = levelById('w1-1');
    const spec = level.tasks[0] as CountTask;
    for (let seed = 1; seed <= 30; seed++) {
      const i = generateCount(spec, ctxFor('w1-1', seed));
      expect(i.count).toBeGreaterThanOrEqual(1);
      expect(i.count).toBeLessThanOrEqual(3);
      expect(i.object).toBe('kaczuszka');
      expect(i.arrangement).toBe('line');
      expect(i.answers).toBe('digitDots');
      expect(i.options).toContain(i.count);
    }
  });

  it('усі «Policz i dotknij» у W1 дають коректні завдання для 25 зерен: число в діапазоні, плитки в межах 1–10', () => {
    for (const { level, task } of countTasks) {
      for (let seed = 1; seed <= 25; seed++) {
        const i = generateCount(task, ctxFor(level.id, seed));
        expect(i.count, `${level.id}`).toBeGreaterThanOrEqual(task.count[0]);
        expect(i.count, `${level.id}`).toBeLessThanOrEqual(task.count[1]);
        expect(i.options.every((o) => o >= 1 && o <= 10), `${level.id}: ${i.options}`).toBe(true);
        expect(i.review).toBe(task.review === true);
      }
    }
  });

  it('детермінований за потоком rng', () => {
    const spec = levelById('w1-2').tasks[0] as CountTask;
    expect(generateCount(spec, ctxFor('w1-2', 9))).toEqual(generateCount(spec, ctxFor('w1-2', 9)));
  });

  it('шість завдань підряд не повторюють число двічі поспіль (діапазон 1–5)', () => {
    const level = levelById('w1-2');
    const answers: number[] = [];
    level.tasks.forEach((t, index) => {
      const spec = t as CountTask;
      const i = generateCount(spec, { ...ctxFor('w1-2', 100 + index), index, previous: [...answers] });
      answers.push(i.count);
    });
    for (let k = 1; k < answers.length; k++) expect(answers[k]).not.toBe(answers[k - 1]);
  });
});

describe('checkCount', () => {
  it('рівно кількість — правильно', () => {
    expect(checkCount({ count: 7 }, 7)).toEqual({ ok: true });
  });

  it('на 1 більше чи менше — «Prawie!»; решта — звичайна помилка', () => {
    expect(checkCount({ count: 7 }, 8)).toEqual({ ok: false, almost: true });
    expect(checkCount({ count: 7 }, 6)).toEqual({ ok: false, almost: true });
    expect(checkCount({ count: 7 }, 5)).toEqual({ ok: false, almost: false });
    expect(checkCount({ count: 7 }, 9)).toEqual({ ok: false, almost: false });
  });
});

describe('гра-модуль', () => {
  const instance: CountInstance = {
    game: 'policzIDotknij', skill: 'count-line', review: false, object: 'biedronka', count: 7, arrangement: 'line',
    look: 'distinct', answers: 'digitDots', options: [6, 7, 8], seed: 5,
  };

  it('інструкція — дослівно BRIEF §7', () => {
    expect(policzIDotknij.prompt(instance)).toBe('Policz biedronki. Dotykaj po kolei. Ile jest biedronek?');
  });

  it('похвала: слово + «Jest siedem biedronek!»', () => {
    expect(policzIDotknij.praise(instance, 'Brawo!')).toBe('Brawo! Jest siedem biedronek!');
    expect(policzIDotknij.praise({ ...instance, count: 3, object: 'kaczuszka' }, 'Świetnie!')).toBe('Świetnie! Są trzy kaczuszki!');
    expect(policzIDotknij.praise({ ...instance, count: 1, object: 'motyl' }, 'Udało się!')).toBe('Udało się! Jest jeden motyl!');
  });

  it('плитки W1 — цифра з крапками, без крапок для answers: digit', () => {
    expect(policzIDotknij.tiles(instance)).toEqual([{ value: 6, dots: 6 }, { value: 7, dots: 7 }, { value: 8, dots: 8 }]);
    expect(policzIDotknij.tiles({ ...instance, answers: 'digit' }).every((t) => t.dots === undefined)).toBe(true);
  });

  it('підпис сцени й правильна відповідь', () => {
    expect(policzIDotknij.sceneLabel(instance)).toBe('Policz biedronki');
    expect(policzIDotknij.answer(instance)).toBe(7);
  });
});

describe('варіації вигляду (look)', () => {
  it('similar — без змін; distinct — детерміновано, у межах ±6° і 94–106 %', () => {
    expect(variation({ look: 'similar', seed: 3 }, 2)).toEqual({ flip: false, tilt: 0, scale: 1 });
    const a = variation({ look: 'distinct', seed: 3 }, 2);
    expect(variation({ look: 'distinct', seed: 3 }, 2)).toEqual(a);
    for (let i = 0; i < 40; i++) {
      const v = variation({ look: 'distinct', seed: 11 }, i);
      expect(Math.abs(v.tilt)).toBeLessThanOrEqual(6);
      expect(v.scale).toBeGreaterThanOrEqual(0.94);
      expect(v.scale).toBeLessThanOrEqual(1.06);
    }
  });
});

describe('допомога Kubika', () => {
  const instance: CountInstance = {
    game: 'policzIDotknij', skill: 'count-line', review: false, object: 'biedronka', count: 7, arrangement: 'line',
    look: 'similar', answers: 'digitDots', options: [6, 7, 8], seed: 1,
  };
  const recorder = () => {
    const said: string[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = {
      say: async (text) => { said.push(text); },
      wait: async () => undefined,
      setAssist: (a) => { assists.push(a); },
    };
    return { said, assists, ctx };
  };

  it('hintSteps: до трьох, але ніколи не всі', () => {
    expect([1, 2, 3, 4, 7, 10].map(hintSteps)).toEqual([1, 1, 2, 3, 3, 3]);
  });

  it('підказка для 7 предметів: Kubik лічить «jeden, dwa, trzy», стадії 1–3 у режимі hint', async () => {
    const { said, assists, ctx } = recorder();
    await hintCount(instance, ctx);
    expect(said).toEqual(['jeden', 'dwa', 'trzy']);
    expect(assists).toEqual([{ mode: 'hint', step: 1 }, { mode: 'hint', step: 2 }, { mode: 'hint', step: 3 }]);
  });

  it('підказка для 2 предметів показує лише перший', async () => {
    const { said, ctx } = recorder();
    await hintCount({ ...instance, count: 2 }, ctx);
    expect(said).toEqual(['jeden']);
  });

  it('показ разом для 3 kaczuszek: лічить усі, потім «Są trzy kaczuszki!», остання стадія = count + 1', async () => {
    const { said, assists, ctx } = recorder();
    await togetherCount({ ...instance, count: 3, object: 'kaczuszka' }, ctx);
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'Są trzy kaczuszki!']);
    expect(assists.at(-1)).toEqual({ mode: 'together', step: 4 });
    expect(assists.every((a) => a.mode === 'together')).toBe(true);
  });
});
