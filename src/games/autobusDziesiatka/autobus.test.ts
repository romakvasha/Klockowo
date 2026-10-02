import { describe, expect, it } from 'vitest';
import { LEVELS, levelById } from '../../curriculum/levels';
import type { BusTask } from '../../curriculum/types';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext } from '../engine/types';
import { BUS_ROOF, SEAT_COLS, busGeometry, busWidthFor, seatCount } from '../../components/math/busLayout';
import { countedSeats, helpCountSeats, hintBus, introBus, seatMarks, togetherBus, usesRowHint } from './assist';
import { BUS_CAPACITY, busAnswer, busComplement, checkBus, generateBus, pickBusOptions, seatsTaken, type BusInstance } from './generate';
import { autobusDziesiatka } from './index';
import { busPlacement } from './View';

const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => {
  const level = levelById('w2-7');
  return { level, world: level.world, index: previous.length, rng: createRng(seed), previous };
};
const spec = (over: Partial<BusTask> = {}): BusTask => ({
  game: 'autobusDziesiatka', skill: 'bonds-5-10', count: [0, 10], ask: 'full', exposureMs: 0, answers: 'digit', ...over,
});
const instance = (over: Partial<BusInstance> = {}): BusInstance => ({
  game: 'autobusDziesiatka', skill: 'bonds-5-10', review: false, passengers: 7, riders: Array.from({ length: 7 }, () => 'mis' as const),
  ask: 'empty', exposureMs: 0, answers: 'digit', mascot: 'mis', options: [3, 4, 7], ...over,
});

describe('відповідь автобуса', () => {
  it('full — скільки їде, empty — скільки місць вільних; доповнення — друга частина десятки', () => {
    expect(busAnswer(7, 'full')).toBe(7);
    expect(busAnswer(7, 'empty')).toBe(3);
    expect(busComplement(7, 'full')).toBe(3);
    expect(busComplement(7, 'empty')).toBe(7);
    expect(busAnswer(0, 'empty')).toBe(10);
    expect(busAnswer(10, 'empty')).toBe(0);
  });

  it('місця: перші n зайняті (спершу перший ряд)', () => {
    expect(seatsTaken(0).filter(Boolean)).toHaveLength(0);
    expect(seatsTaken(7)).toEqual([true, true, true, true, true, true, true, false, false, false]);
    expect(seatsTaken(10).every(Boolean)).toBe(true);
    expect(seatsTaken(3)).toHaveLength(BUS_CAPACITY);
  });
});

describe('pickBusOptions', () => {
  it('три різні числа в [0, 10] за зростанням; серед них відповідь і «друга частина», коли вона інша', () => {
    for (let p = 0; p <= 10; p++) {
      for (const ask of ['full', 'empty'] as const) {
        const answer = busAnswer(p, ask);
        const options = pickBusOptions(answer, busComplement(p, ask), createRng(p * 3 + 1));
        expect(options, `${p} ${ask}`).toHaveLength(3);
        expect(new Set(options).size).toBe(3);
        expect(options).toEqual([...options].sort((a, b) => a - b));
        expect(options).toContain(answer);
        for (const n of options) {
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(10);
        }
        if (busComplement(p, ask) !== answer) expect(options, `${p} ${ask}`).toContain(busComplement(p, ask));
      }
    }
  });
});

describe('generateBus', () => {
  it('пасажири в діапазоні, riders відповідає числу, тваринок не більше двох видів, детерміновано', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const i = generateBus(spec({ count: [2, 8], ask: 'mixed' }), ctxFor(seed));
      expect(i.passengers).toBeGreaterThanOrEqual(2);
      expect(i.passengers).toBeLessThanOrEqual(8);
      expect(i.riders).toHaveLength(i.passengers);
      expect(new Set(i.riders).size).toBeLessThanOrEqual(2);
      expect(i.options).toContain(busAnswer(i.passengers, i.ask));
      expect(generateBus(spec({ count: [2, 8], ask: 'mixed' }), ctxFor(seed))).toEqual(i);
    }
  });

  it('діапазон обрізається до 0–10; обидва запитання трапляються; відповідь не повторюється підряд', () => {
    const asks = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) {
      const i = generateBus(spec({ count: [-3, 15], ask: 'mixed' }), ctxFor(seed));
      expect(i.passengers).toBeGreaterThanOrEqual(0);
      expect(i.passengers).toBeLessThanOrEqual(10);
      asks.add(i.ask);
      const prev = generateBus(spec({ count: [1, 9], ask: 'full' }), ctxFor(seed, [4]));
      expect(busAnswer(prev.passengers, 'full')).not.toBe(4);
    }
    expect(asks).toEqual(new Set(['full', 'empty']));
  });

  it('усі «Autobus dziesiątka» у W2: пасажири в межах рівня', () => {
    const tasks = LEVELS.filter((l) => l.world === 'w2').flatMap((l) => l.tasks.filter((t): t is BusTask => t.game === 'autobusDziesiatka').map((t) => ({ l, t })));
    expect(tasks.length).toBeGreaterThan(6);
    for (const { l, t } of tasks) {
      for (let seed = 1; seed <= 25; seed++) {
        const i = generateBus(t, ctxFor(seed));
        expect(i.passengers, l.id).toBeGreaterThanOrEqual(t.count[0]);
        expect(i.passengers, l.id).toBeLessThanOrEqual(t.count[1]);
      }
    }
  });
});

describe('checkBus / репліки', () => {
  it('правильно, на 1 поряд — «Prawie!», далі — просто хибно', () => {
    expect(checkBus({ passengers: 7, ask: 'empty' }, 3)).toEqual({ ok: true });
    expect(checkBus({ passengers: 7, ask: 'empty' }, 4)).toEqual({ ok: false, almost: true });
    expect(checkBus({ passengers: 7, ask: 'empty' }, 7)).toEqual({ ok: false, almost: false });
    expect(checkBus({ passengers: 7, ask: 'full' }, 7)).toEqual({ ok: true });
  });

  it('інструкція за запитанням, похвала — склад десятки', () => {
    expect(autobusDziesiatka.prompt(instance({ ask: 'full' }))).toBe('Ile zwierzątek jedzie autobusem?');
    expect(autobusDziesiatka.prompt(instance({ ask: 'empty' }))).toBe('Ile miejsc jest wolnych?');
    expect(autobusDziesiatka.praise(instance(), 'Brawo!')).toBe('Brawo! Siedem i trzy to dziesięć.');
    expect(autobusDziesiatka.praise(instance({ passengers: 10, ask: 'full' }), 'Super!')).toBe('Super! Dziesięć i zero to dziesięć.');
    expect(autobusDziesiatka.answer(instance())).toBe(3);
  });

  it('плитки: цифри (без крапок) чи цифри з крапками', () => {
    expect(autobusDziesiatka.tiles(instance())).toEqual([{ value: 3 }, { value: 4 }, { value: 7 }].map((t) => ({ ...t, dots: undefined })));
    expect(autobusDziesiatka.tiles(instance({ answers: 'digitDots' }))).toEqual([3, 4, 7].map((value) => ({ value, dots: value })));
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

  it('місця, які лічить допомога: їдуть — зайняті, вільні — решта', () => {
    expect(countedSeats({ passengers: 7, ask: 'full' })).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(countedSeats({ passengers: 7, ask: 'empty' })).toEqual([7, 8, 9]);
    expect(countedSeats({ passengers: 10, ask: 'empty' })).toEqual([]);
    expect(countedSeats({ passengers: 0, ask: 'full' })).toEqual([]);
  });

  it('номери на місцях: step перших місць отримують 1, 2, 3…', () => {
    expect(seatMarks([7, 8, 9], 0)).toEqual(Array.from({ length: 10 }, () => null));
    expect(seatMarks([7, 8, 9], 2)[7]).toBe(1);
    expect(seatMarks([7, 8, 9], 2)[8]).toBe(2);
    expect(seatMarks([7, 8, 9], 2)[9]).toBeNull();
    expect(seatMarks([7, 8, 9], 99).filter((m) => m !== null)).toHaveLength(3);
  });

  it('1-ша підказка при ряді ≥ 5: рамка першого ряду й «Pełny rząd to pięć. Policz resztę.»', async () => {
    const { said, assists, ctx } = recorder();
    await hintBus(instance(), ctx, { nth: 1, response: null });
    expect(said).toEqual(['Pełny rząd to pięć. Policz resztę.']);
    expect(assists).toEqual([{ mode: 'hint', step: 1, level: 1 }]);
    expect(usesRowHint(instance())).toBe(true);
    expect(helpCountSeats(instance(), { mode: 'hint', level: 1 })).toEqual([]);
  });

  it('1-ша підказка, коли їде менше за п’ять: Kubik лічить тваринок («jeden, dwa, trzy»)', async () => {
    const { said, assists, ctx } = recorder();
    const small = instance({ passengers: 3, riders: ['mis', 'mis', 'mis'] });
    expect(usesRowHint(small)).toBe(false);
    await hintBus(small, ctx, { nth: 1, response: null });
    expect(said).toEqual(['Policz zwierzątka.', 'jeden', 'dwa', 'trzy']);
    expect(assists.map((a) => a.step)).toEqual([1, 2, 3]);
    expect(helpCountSeats(small, { mode: 'hint', level: 1 })).toEqual([0, 1, 2]);
  });

  it('2-га підказка: лічимо те, про що питають (вільні місця — «jeden, dwa, trzy»)', async () => {
    const { said, assists, ctx } = recorder();
    await hintBus(instance(), ctx, { nth: 2, response: null });
    expect(said).toEqual(['jeden', 'dwa', 'trzy']);
    expect(assists.map((a) => [a.step, a.level])).toEqual([[1, 2], [2, 2], [3, 2]]);
    expect(helpCountSeats(instance(), { mode: 'hint', level: 2 })).toEqual([7, 8, 9]);
  });

  it('показ разом: лічба й «Siedem i trzy to dziesięć.»', async () => {
    const { said, ctx } = recorder();
    await togetherBus(instance(), ctx);
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'Siedem i trzy to dziesięć.']);
    const full = recorder();
    await togetherBus(instance({ ask: 'full', passengers: 2, riders: ['mis', 'mis'] }), full.ctx);
    expect(full.said).toEqual(['jeden', 'dwa', 'Dwa i osiem to dziesięć.']);
  });

  it('вступний показ: відкрито на exposureMs, потім закрито; без exposureMs — нічого', async () => {
    const waits: number[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = {
      say: async () => undefined,
      wait: async (ms) => { waits.push(ms); },
      setAssist: (a) => { assists.push(a); },
    };
    await introBus(instance({ exposureMs: 2500 }), ctx);
    expect(assists).toEqual([{ mode: 'intro', step: 1 }, { mode: 'intro', step: 2 }]);
    expect(waits).toEqual([2500]);
    const none = recorder();
    await introBus(instance({ exposureMs: 0 }), none.ctx);
    expect(none.assists).toEqual([]);
  });

  it('реплік без цифр', async () => {
    const { said, ctx } = recorder();
    await hintBus(instance(), ctx, { nth: 1, response: null });
    await hintBus(instance(), ctx, { nth: 2, response: null });
    await togetherBus(instance(), ctx);
    for (const line of said) expect(line).not.toMatch(/\d/);
  });
});

describe('busLayout', () => {
  it('геометрія: 5 місць у ряду, місця в межах автобуса й не перекриваються', () => {
    for (const width of [200, 320, 360, 500, 600]) {
      for (const rows of [2, 4]) {
        const g = busGeometry(width, rows);
        expect(seatCount(rows)).toBe(rows * SEAT_COLS);
        const boxes = Array.from({ length: seatCount(rows) }, (_, i) => ({ ...g.seat(i), w: g.cell, h: g.cell }));
        boxes.forEach((b, i) => {
          expect(b.x, `${width}`).toBeGreaterThanOrEqual(0);
          expect(b.x + b.w, `${width}`).toBeLessThanOrEqual(width);
          expect(b.y, `${width}`).toBeGreaterThanOrEqual(BUS_ROOF);
          expect(b.y + b.h, `${width}`).toBeLessThanOrEqual(g.bodyH);
          for (let j = i + 1; j < boxes.length; j++) {
            const o = boxes[j]!;
            expect(b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h, `${width} ${i}/${j}`).toBe(false);
          }
        });
        // рамка ряду охоплює п'ять місць
        const box = g.rowBox(0);
        expect(box.w).toBeGreaterThan(5 * g.cell);
      }
    }
  });

  it('ширина автобуса вміщається в область: ширина ≤ 90 %, висота ≤ області', () => {
    for (const area of [{ w: 1180, h: 420 }, { w: 390, h: 390 }, { w: 716, h: 294 }, { w: 768, h: 768 }]) {
      const width = busWidthFor(area);
      expect(width).toBeLessThanOrEqual(600);
      expect(width).toBeLessThanOrEqual(Math.max(150, Math.floor(area.w * 0.9)));
      expect(busGeometry(width).height).toBeLessThanOrEqual(area.h);
    }
  });

  it('розміщення на сцені: у межах, під смугою кісточок, повз ділянку Kubika', () => {
    const wide = busPlacement({ w: 1180, h: 420 }, [{ x: 0, y: 296, w: 313, h: 124 }]);
    const g = busGeometry(wide.width);
    expect(wide.x).toBeGreaterThanOrEqual(0);
    expect(wide.x + wide.width).toBeLessThanOrEqual(1180);
    expect(wide.y + g.height).toBeLessThanOrEqual(420);
    const phone = busPlacement({ w: 716, h: 340 }, [{ x: 0, y: 0, w: 716, h: 46 }]);
    expect(phone.y).toBeGreaterThanOrEqual(46);
    expect(phone.y + busGeometry(phone.width).height).toBeLessThanOrEqual(340);
    // автобус, що зачіпав би Kubika, зсувається праворуч за нього
    const hit = busPlacement({ w: 700, h: 300 }, [{ x: 0, y: 150, w: 420, h: 150 }]);
    expect(hit.x).toBeGreaterThanOrEqual(420);
  });
});
