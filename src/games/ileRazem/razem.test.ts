import { describe, expect, it } from 'vitest';
import type { Level, SumTask } from '../../curriculum/types';
import { sceneReserved } from '../engine/frameMath';
import { createRng } from '../engine/rng';
import { placeContent } from '../engine/placeContent';
import type { Assist, AssistContext, GenContext, SceneKind } from '../engine/types';
import { basketMarks, hintSum, mergedItems, togetherSum } from './assist';
import { SUM_MAX, SUM_MIN, checkSum, generateSum, pickSumOptions, splitSum, sumAnswer, type SumInstance } from './generate';
import { ileRazem } from './index';
import { BASKET, DESIGN, POUR_SIZE, pourButtonCenter } from './View';

const level: Level = { id: 'w3-1', world: 'w3', index: 1, kind: 'main', newIdea: false, skills: ['add-combine'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w3', index: previous.length, rng: createRng(seed), previous });
const spec = (over: Partial<SumTask> = {}): SumTask => ({
  game: 'ileRazem', skill: 'add-combine', sum: [3, 8], lid: false, order: 'any', doubles: false, symbols: false, answers: 'digit', ...over,
});
const instance = (over: Partial<SumInstance> = {}): SumInstance => ({
  game: 'ileRazem', skill: 'add-combine', review: false, object: 'rybka', a: 3, b: 2, lid: false, symbols: false, answers: 'digit', options: [4, 5, 6], ...over,
});

describe('відповідь «Ile razem?»', () => {
  it('сума; check: правильно, на 1 поряд — «Prawie!», далі — хибно', () => {
    expect(sumAnswer({ a: 3, b: 2 })).toBe(5);
    expect(checkSum({ a: 3, b: 2 }, 5)).toEqual({ ok: true });
    expect(checkSum({ a: 3, b: 2 }, 4)).toEqual({ ok: false, almost: true });
    expect(checkSum({ a: 3, b: 2 }, 3)).toEqual({ ok: false, almost: false });
  });
});

describe('splitSum', () => {
  it('подвоєння — рівні доданки; bigFirst: a ≥ b; smallFirst: a ≤ b; any: обидва ≥ 1', () => {
    for (let sum = 2; sum <= 20; sum++) {
      for (let seed = 1; seed <= 12; seed++) {
        const rng = () => createRng(sum * 100 + seed);
        const [a, b] = splitSum(sum, 'any', false, rng());
        expect(a + b).toBe(sum);
        expect(a).toBeGreaterThanOrEqual(1);
        expect(b).toBeGreaterThanOrEqual(1);
        const [big, small] = splitSum(sum, 'bigFirst', false, rng());
        expect(big).toBeGreaterThanOrEqual(small);
        expect(big + small).toBe(sum);
        const [sm, bg] = splitSum(sum, 'smallFirst', false, rng());
        expect(sm).toBeLessThanOrEqual(bg);
        expect(sm + bg).toBe(sum);
        if (sum % 2 === 0) expect(splitSum(sum, 'any', true, rng())).toEqual([sum / 2, sum / 2]);
      }
    }
  });
});

describe('pickSumOptions', () => {
  it('три різні числа в [1, стеля] за зростанням; серед них сума й «лише більший доданок», коли вона інша', () => {
    for (let sum = 2; sum <= 20; sum++) {
      for (let a = 1; a < sum; a++) {
        const b = sum - a;
        const ceiling = Math.max(sum, 3);
        const options = pickSumOptions(a, b, ceiling, createRng(sum * 31 + a));
        expect(options, `${a}+${b}`).toHaveLength(3);
        expect(new Set(options).size).toBe(3);
        expect(options).toEqual([...options].sort((x, y) => x - y));
        expect(options).toContain(sum);
        for (const n of options) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(ceiling);
        }
      }
    }
  });
});

describe('generateSum', () => {
  it('сума й доданки в межах, відповідь є серед плиток, детерміновано', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateSum(spec({ sum: [4, 9] }), ctxFor(seed));
      expect(sumAnswer(i)).toBeGreaterThanOrEqual(4);
      expect(sumAnswer(i)).toBeLessThanOrEqual(9);
      expect(i.a).toBeGreaterThanOrEqual(1);
      expect(i.b).toBeGreaterThanOrEqual(1);
      expect(i.options).toContain(sumAnswer(i));
      expect(generateSum(spec({ sum: [4, 9] }), ctxFor(seed))).toEqual(i);
    }
  });

  it('діапазон обрізається до 2–20', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const s = sumAnswer(generateSum(spec({ sum: [-4, 99] }), ctxFor(seed)));
      expect(s).toBeGreaterThanOrEqual(SUM_MIN);
      expect(s).toBeLessThanOrEqual(SUM_MAX);
    }
  });

  it('подвоєння: a = b і парна сума, навіть коли діапазон починається з непарного', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const i = generateSum(spec({ sum: [3, 9], doubles: true }), ctxFor(seed));
      expect(i.a).toBe(i.b);
      expect(sumAnswer(i) % 2).toBe(0);
    }
  });

  it('більший доданок першим / другим', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const first = generateSum(spec({ order: 'bigFirst' }), ctxFor(seed));
      expect(first.a).toBeGreaterThanOrEqual(first.b);
      const second = generateSum(spec({ order: 'smallFirst' }), ctxFor(seed));
      expect(second.a).toBeLessThanOrEqual(second.b);
    }
  });

  it('прапорці кришки й символів переходять у завдання; відповідь не повторюється підряд', () => {
    const i = generateSum(spec({ lid: true, symbols: true }), ctxFor(1));
    expect(i.lid).toBe(true);
    expect(i.symbols).toBe(true);
    for (let seed = 1; seed <= 80; seed++) {
      expect(sumAnswer(generateSum(spec({ sum: [3, 8] }), ctxFor(seed, [5])))).not.toBe(5);
    }
  });

  it('generate з іншої гри — помилка', () => {
    expect(() => ileRazem.generate({ game: 'blysk', skill: 'subitize-5', count: [1, 3], pattern: 'dice', exposureMs: 2000, answers: 'digit' }, ctxFor(1))).toThrow();
  });
});

describe('гра «Ile razem?»', () => {
  it('інструкція: з предметами — «Trzy ryby i dwie ryby. Ile razem?», з символами — «Ile to jest trzy dodać dwa?»', () => {
    expect(ileRazem.prompt(instance({ object: 'jablko' }))).toBe('Trzy jabłka i dwa jabłka. Ile razem?');
    expect(ileRazem.prompt(instance({ symbols: true }))).toBe('Ile to jest trzy dodać dwa?');
  });

  it('похвала читає рівняння: «Trzy dodać dwa równa się pięć.»', () => {
    expect(ileRazem.praise(instance(), 'Brawo!')).toBe('Brawo! Trzy dodać dwa równa się pięć.');
    expect(ileRazem.answer(instance())).toBe(5);
  });

  it('плитки: цифри чи цифри з крапками', () => {
    expect(ileRazem.tiles(instance())).toEqual([4, 5, 6].map((value) => ({ value, dots: undefined })));
    expect(ileRazem.tiles(instance({ answers: 'digitDots' }))).toEqual([4, 5, 6].map((value) => ({ value, dots: value })));
  });
});

describe('спільний кошик і номерки', () => {
  it('mergedItems: a + b предметів; під кришкою перша група — одна плашка з числом', () => {
    expect(mergedItems(3, 2, false)).toHaveLength(5);
    expect(mergedItems(3, 2, false).every((i) => i.kind === 'object')).toBe(true);
    const lidded = mergedItems(3, 2, true);
    expect(lidded).toHaveLength(3);
    expect(lidded[0]).toEqual({ kind: 'chip', value: 3 });
  });

  it('basketMarks: лічба 1, 2, 3… до step', () => {
    expect(basketMarks(3, 2, false, 0)).toEqual([null, null, null, null, null]);
    expect(basketMarks(3, 2, false, 3)).toEqual([1, 2, 3, null, null]);
    expect(basketMarks(3, 2, false, 99)).toEqual([1, 2, 3, 4, 5]);
  });

  it('basketMarks під кришкою: лічба продовжується від числа на кришці — перший предмет другої групи отримує a + 1', () => {
    expect(basketMarks(3, 2, true, 3)).toEqual([null, null, null]);
    expect(basketMarks(3, 2, true, 4)).toEqual([null, 4, null]);
    expect(basketMarks(3, 2, true, 5)).toEqual([null, 4, 5]);
  });
});

describe('допомога', () => {
  const recorder = () => {
    const said: string[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = {
      say: async (t) => { said.push(t); },
      wait: async () => undefined,
      setAssist: (a) => { assists.push(a); },
    };
    return { said, assists, ctx };
  };

  it('1-ша підказка: лічить першу групу й «Zacznij od trzech i licz dalej.»', async () => {
    const { said, assists, ctx } = recorder();
    await hintSum(instance(), ctx, { nth: 1, response: null });
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'Zacznij od trzech i licz dalej.']);
    expect(assists[0]).toEqual({ mode: 'hint', step: 0, level: 1 });
    expect(assists.at(-1)).toEqual({ mode: 'hint', step: 3, level: 1 });
  });

  it('1-ша підказка з кришкою: перша група закрита — лише «Zacznij od trzech i licz dalej.»', async () => {
    const { said, ctx } = recorder();
    await hintSum(instance({ lid: true }), ctx, { nth: 1, response: null });
    expect(said).toEqual(['Zacznij od trzech i licz dalej.']);
  });

  it('2-га підказка: лічба «від числа» до суми', async () => {
    const { said, assists, ctx } = recorder();
    await hintSum(instance(), ctx, { nth: 2, response: null });
    expect(said).toEqual(['Zacznij od trzech i licz dalej.', 'cztery', 'pięć']);
    expect(assists.at(-1)).toEqual({ mode: 'hint', step: 5, level: 2 });
  });

  it('показ разом: лічба від числа й рівняння «Trzy dodać dwa równa się pięć.»', async () => {
    const { said, assists, ctx } = recorder();
    await togetherSum(instance(), ctx);
    expect(said).toEqual(['Zacznij od trzech i licz dalej.', 'cztery', 'pięć', 'Trzy dodać dwa równa się pięć.']);
    expect(assists.every((a) => a.mode === 'together')).toBe(true);
    expect(assists.at(-1)?.step).toBe(5);
  });
});

describe('композиція й кнопка «Wsyp!»', () => {
  const cases: { kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
    { kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
    { kind: 'wide', vw: 1024, area: { w: 880, h: 400 } },
    { kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
    { kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
  ];

  it('композиція вміщується в сцену й не заходить на Kubika', () => {
    for (const { kind, vw, area } of cases) {
      const reserved = sceneReserved(kind, vw, area);
      const p = placeContent(area, reserved, DESIGN);
      expect(p.scale).toBeGreaterThan(0.35);
      expect(p.x + p.w).toBeLessThanOrEqual(area.w);
      expect(p.y + p.h).toBeLessThanOrEqual(area.h);
      for (const r of reserved) expect(p.x < r.x + r.w && r.x < p.x + p.w && p.y < r.y + r.h && r.y < p.y + p.h, kind).toBe(false);
    }
  });

  it('кнопка «Wsyp!» ≥ 64 px і стоїть у межах сцени між кошиками', () => {
    expect(POUR_SIZE).toBeGreaterThanOrEqual(64);
    for (const { kind, vw, area } of cases) {
      const p = placeContent(area, sceneReserved(kind, vw, area), DESIGN);
      const c = pourButtonCenter(p);
      expect(c.x - POUR_SIZE / 2, kind).toBeGreaterThanOrEqual(0);
      expect(c.x + POUR_SIZE / 2, kind).toBeLessThanOrEqual(area.w);
      expect(c.y - POUR_SIZE / 2, kind).toBeGreaterThanOrEqual(0);
      expect(c.y + POUR_SIZE / 2, kind).toBeLessThanOrEqual(area.h);
      // посередині між краями кошиків
      expect(Math.abs(c.x - (p.x + p.w / 2))).toBeLessThanOrEqual(1);
    }
    expect(BASKET.w * 2).toBeLessThan(DESIGN.w);
  });
});
