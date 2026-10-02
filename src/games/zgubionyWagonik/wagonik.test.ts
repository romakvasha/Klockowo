import { describe, expect, it } from 'vitest';
import type { Level, TrainTask } from '../../curriculum/types';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext } from '../engine/types';
import { hintQuestion, hintTrain, readOrder, togetherTrain } from './assist';
import { checkTrain, firstRange, generateTrain, pickGapIndex, pickOptions, trainNumbers, type TrainInstance } from './generate';
import { zgubionyWagonik } from './index';
import { helpFocus } from './View';

const LEVEL: Level = { id: 'w2-5', world: 'w2', index: 5, kind: 'main', newIdea: false, skills: ['order-around'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level: LEVEL, world: 'w2', index: previous.length, rng: createRng(seed), previous });
const spec = (over: Partial<TrainTask> = {}): TrainTask => ({
  game: 'zgubionyWagonik', skill: 'order-around', range: [1, 10], length: 5, gap: 'any', step: 1, answers: 'digit', ...over,
});

describe('trainNumbers / firstRange', () => {
  it('зростає чи спадає з кроком', () => {
    expect(trainNumbers(3, 5, 1, false)).toEqual([3, 4, 5, 6, 7]);
    expect(trainNumbers(9, 4, 1, true)).toEqual([9, 8, 7, 6]);
    expect(trainNumbers(10, 4, 10, false)).toEqual([10, 20, 30, 40]);
  });

  it('межі першого вагона: усі вагони лишаються в діапазоні', () => {
    expect(firstRange([1, 10], 5, 1, false)).toEqual([1, 6]);
    expect(firstRange([1, 10], 5, 1, true)).toEqual([5, 10]);
    expect(firstRange([10, 100], 6, 10, false)).toEqual([10, 50]);
  });
});

describe('pickGapIndex', () => {
  it('end — останній, start — перший, middle — не з країв, any — будь-який', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const rng = createRng(seed);
      expect(pickGapIndex('end', 6, rng)).toBe(5);
      expect(pickGapIndex('start', 6, rng)).toBe(0);
      const mid = pickGapIndex('middle', 6, rng);
      expect(mid).toBeGreaterThanOrEqual(1);
      expect(mid).toBeLessThanOrEqual(4);
    }
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) seen.add(pickGapIndex('any', 5, createRng(seed)));
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('у короткому потязі «середини» немає: прогалина в кінці', () => {
    expect(pickGapIndex('middle', 2, createRng(1))).toBe(1);
  });
});

describe('pickOptions', () => {
  it('три різні числа за зростанням у діапазоні; жодна хибна не збігається з вагоном, що є в потязі', () => {
    for (const [first, gapIndex] of [[1, 4], [3, 2], [6, 0], [5, 3]] as const) {
      const numbers = trainNumbers(first, 5, 1, false);
      for (let seed = 1; seed <= 40; seed++) {
        const o = pickOptions(numbers, gapIndex, 1, [1, 10], createRng(seed));
        expect(o).toHaveLength(3);
        expect(new Set(o).size).toBe(3);
        expect(o).toEqual([...o].sort((a, b) => a - b));
        expect(o).toContain(numbers[gapIndex]);
        expect(Math.min(...o)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...o)).toBeLessThanOrEqual(10);
        for (const wrong of o.filter((n) => n !== numbers[gapIndex])) expect(numbers).not.toContain(wrong);
      }
    }
  });

  it('крок 10: усі плитки — круглі числа', () => {
    const numbers = trainNumbers(20, 5, 10, false); // 20…60
    for (let seed = 1; seed <= 40; seed++) {
      const o = pickOptions(numbers, 2, 10, [10, 100], createRng(seed));
      expect(o.every((n) => n % 10 === 0)).toBe(true);
      expect(new Set(o).size).toBe(3);
    }
  });

  it('майже вся смуга діапазону зайнята потягом: хибні добираються, навіть якщо довелося взяти вагон із потяга', () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const o = pickOptions(numbers, 3, 1, [1, 6], createRng(3));
    expect(o).toHaveLength(3);
    expect(new Set(o).size).toBe(3);
    expect(o).toContain(4);
  });
});

describe('generateTrain', () => {
  const specs: TrainTask[] = [
    spec(),
    spec({ gap: 'end', range: [0, 10], length: 5 }),
    spec({ gap: 'middle', range: [1, 20], length: 6 }),
    spec({ gap: 'start', range: [1, 20], length: 7 }),
    spec({ gap: 'any', range: [10, 100], length: 6, step: 10 }),
    spec({ gap: 'middle', range: [1, 20], length: 6, backwards: true }),
    spec({ gap: 'any', range: [1, 100], length: 7 }),
  ];

  it('інваріанти: вагони за кроком і в діапазоні, прогалина за правилом, три різні плитки з відповіддю', () => {
    for (const s of specs) {
      for (let seed = 1; seed <= 60; seed++) {
        const t = generateTrain(s, ctxFor(seed));
        expect(t.numbers).toHaveLength(s.length);
        expect(t.numbers[t.gapIndex]).toBe(t.missing);
        t.numbers.forEach((n, i) => {
          expect(n).toBeGreaterThanOrEqual(s.range[0]);
          expect(n).toBeLessThanOrEqual(s.range[1]);
          if (i > 0) expect(n - t.numbers[i - 1]!).toBe(s.backwards ? -s.step : s.step);
        });
        if (s.gap === 'end') expect(t.gapIndex).toBe(s.length - 1);
        if (s.gap === 'start') expect(t.gapIndex).toBe(0);
        if (s.gap === 'middle') expect(t.gapIndex > 0 && t.gapIndex < s.length - 1).toBe(true);
        expect(t.options).toHaveLength(3);
        expect(new Set(t.options).size).toBe(3);
        expect(t.options).toContain(t.missing);
        expect(t.backwards).toBe(s.backwards === true);
      }
    }
  });

  it('крок 10: вагони — десятки (від 10), «dziesięć, dwadzieścia…»', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const t = generateTrain(spec({ range: [10, 100], length: 6, step: 10 }), ctxFor(seed));
      expect(t.numbers.every((n) => n % 10 === 0 && n >= 10)).toBe(true);
    }
  });

  it('детермінований: те саме зерно — те саме завдання', () => {
    expect(generateTrain(spec(), ctxFor(11))).toEqual(generateTrain(spec(), ctxFor(11)));
  });

  it('не повторює число, якого бракувало щойно, коли є з чого вибрати', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const t = generateTrain(spec({ gap: 'end', range: [1, 20], length: 5 }), ctxFor(seed, [8]));
      expect(t.missing).not.toBe(8);
    }
  });

  it('діапазон закороткий для потяга — помилка програми, а не мовчазний вихід за межі', () => {
    expect(() => generateTrain(spec({ range: [1, 4], length: 6 }), ctxFor(1))).toThrow(RangeError);
  });

  it('гра: бракує вагона → плитки, перевірка, підказка не видає відповідь', () => {
    const t = generateTrain(spec({ gap: 'middle' }), ctxFor(5));
    expect(zgubionyWagonik.answer(t)).toBe(t.missing);
    expect(zgubionyWagonik.tiles(t).map((x) => x.value)).toEqual([...t.options]);
    expect(zgubionyWagonik.tiles(t).every((x) => x.dots === undefined)).toBe(true);
    expect(zgubionyWagonik.prompt(t)).toBe('Jakiej liczby brakuje w pociągu?');
    expect(zgubionyWagonik.prompt({ ...t, backwards: true })).toBe('Pociąg jedzie do tyłu. Czego brakuje?');
    expect(zgubionyWagonik.praise({ ...t, missing: 5 }, 'Brawo!')).toBe('Brawo! Pięć.');
  });

  it('плитки з крапками — лише для малих чисел і лише коли так задано', () => {
    const t = generateTrain(spec({ answers: 'digitDots', range: [1, 10] }), ctxFor(5));
    expect(zgubionyWagonik.tiles(t).every((x) => x.dots === x.value)).toBe(true);
    const big = generateTrain(spec({ answers: 'digitDots', range: [10, 100], length: 6, step: 10 }), ctxFor(5));
    expect(zgubionyWagonik.tiles(big).every((x) => x.dots === undefined)).toBe(true);
  });
});

describe('checkTrain', () => {
  it('правильна; сусідній вагон за кроком — «Prawie!»; решта — просто хибно', () => {
    expect(checkTrain({ missing: 5, step: 1 }, 5)).toEqual({ ok: true });
    expect(checkTrain({ missing: 5, step: 1 }, 6)).toEqual({ ok: false, almost: true });
    expect(checkTrain({ missing: 5, step: 1 }, 7)).toEqual({ ok: false, almost: false });
    expect(checkTrain({ missing: 30, step: 10 }, 40)).toEqual({ ok: false, almost: true });
    expect(checkTrain({ missing: 30, step: 10 }, 31)).toEqual({ ok: false, almost: false });
  });
});

describe('допомога Kubika', () => {
  const base: TrainInstance = {
    game: 'zgubionyWagonik', skill: 'order-around', review: false, numbers: [3, 4, 5, 6, 7], gapIndex: 2, missing: 5,
    step: 1, backwards: false, answers: 'digit', options: [4, 5, 7],
  };
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

  it('readOrder: 1-ша підказка — два вагони перед прогалиною, 2-га — усі від початку', () => {
    expect(readOrder(base, 1)).toEqual([0, 1]);
    expect(readOrder(base, 2)).toEqual([0, 1]);
    expect(readOrder({ ...base, gapIndex: 4 }, 1)).toEqual([2, 3]);
    expect(readOrder({ ...base, gapIndex: 4 }, 2)).toEqual([0, 1, 2, 3]);
    expect(readOrder({ ...base, gapIndex: 1 }, 1)).toEqual([0]);
  });

  it('прогалина першою: читаємо вагони після неї, а питаємо про те, що перед ними', () => {
    const first = { ...base, gapIndex: 0 };
    expect(readOrder(first, 1)).toEqual([1, 2]);
    expect(readOrder(first, 2)).toEqual([1, 2, 3, 4]);
    expect(hintQuestion(first)).toBe('A co jest przed nimi?');
    expect(hintQuestion(base)).toBe('I co dalej?');
  });

  it('1-ша підказка: «trzy», «cztery», «I co dalej?»; сцена підсвічує вагони, наприкінці — прогалину; відповіді не звучить', async () => {
    const { said, assists, ctx } = recorder();
    await hintTrain(base, ctx, { nth: 1, response: 7 });
    expect(said).toEqual(['trzy', 'cztery', 'I co dalej?']);
    expect(said).not.toContain('pięć');
    expect(assists).toEqual([
      { mode: 'hint', step: 1, level: 1 },
      { mode: 'hint', step: 2, level: 1 },
      { mode: 'hint', step: 3, level: 1 },
    ]);
  });

  it('2-га підказка читає від початку й також не називає загублене число', async () => {
    const { said, ctx } = recorder();
    await hintTrain({ ...base, numbers: [3, 4, 5, 6, 7, 8], gapIndex: 4, missing: 7 }, ctx, { nth: 2, response: null });
    expect(said).toEqual(['trzy', 'cztery', 'pięć', 'sześć', 'I co dalej?']);
  });

  it('десятки: «dziesięć, dwadzieścia… I co dalej?»', async () => {
    const { said, ctx } = recorder();
    await hintTrain({ ...base, numbers: [10, 20, 30, 40, 50], gapIndex: 2, missing: 30, step: 10 }, ctx, { nth: 1, response: null });
    expect(said).toEqual(['dziesięć', 'dwadzieścia', 'I co dalej?']);
  });

  it('показ разом: читає весь потяг по порядку, останній крок = кількість вагонів', async () => {
    const { said, assists, ctx } = recorder();
    await togetherTrain(base, ctx);
    expect(said).toEqual(['trzy', 'cztery', 'pięć', 'sześć', 'siedem']);
    expect(assists.map((a) => a.step)).toEqual([1, 2, 3, 4, 5]);
    expect(assists.every((a) => a.mode === 'together')).toBe(true);
  });

  it('helpFocus: що підсвічує сцена', () => {
    expect(helpFocus(base, { mode: 'none', step: 0 })).toEqual({ reading: -1, gap: false });
    expect(helpFocus(base, { mode: 'hint', step: 1, level: 1 })).toEqual({ reading: 0, gap: false });
    expect(helpFocus(base, { mode: 'hint', step: 2, level: 1 })).toEqual({ reading: 1, gap: false });
    expect(helpFocus(base, { mode: 'hint', step: 3, level: 1 })).toEqual({ reading: -1, gap: true });
    expect(helpFocus(base, { mode: 'together', step: 3 })).toEqual({ reading: 2, gap: false });
  });
});
