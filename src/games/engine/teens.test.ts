import { describe, expect, it } from 'vitest';
import { busGeometry, busWidthFor } from '../../components/math/busLayout';
import type { BusTask, CountTask, Level, StoryTask, SumTask } from '../../curriculum/types';
import { autobusDziesiatka } from '../autobusDziesiatka';
import { countedSeats, seatMarks, usesRowHint } from '../autobusDziesiatka/assist';
import { BUS_CAPACITY, DOUBLE_DECKER_CAPACITY, busAnswer, capacityOf, checkBus, generateBus, seatsTaken, type BusInstance } from '../autobusDziesiatka/generate';
import { busPlacement } from '../autobusDziesiatka/View';
import { generateStory, storyAnswer } from '../historyjki/generate';
import { NO_BRIDGE_MIN_SUM, generateSum, splitNoBridge, sumAnswer } from '../ileRazem/generate';
import { generateCount } from '../policzIDotknij/generate';
import { sceneReserved } from './frameMath';
import { countingOrder, layoutObjects, type Rect } from './layoutObjects';
import { createRng } from './rng';
import type { GenContext, SceneKind } from './types';

const level: Level = { id: 'w4-1', world: 'w4', index: 1, kind: 'main', newIdea: true, skills: ['teens'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w4', index: previous.length, rng: createRng(seed), previous });

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('розкладка «десять і ще n» (arrangement tens)', () => {
  const cases: { kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
    { kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
    { kind: 'wide', vw: 1024, area: { w: 880, h: 400 } },
    { kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
    { kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
  ];

  it('усі предмети 11–20 розкладено, не перекриваються, не виходять за область і не заходять на Kubika', () => {
    for (const { kind, vw, area } of cases) {
      const reserved = sceneReserved(kind, vw, area);
      for (let count = 11; count <= 20; count++) {
        const { size, items } = layoutObjects({ arrangement: 'tens', count, area, size: 84, rng: createRng(count), reserved });
        const name = `${kind}/${count}`;
        expect(items, name).toHaveLength(count);
        expect(size, name).toBeGreaterThanOrEqual(40);
        items.forEach((p, i) => {
          expect(p.x, name).toBeGreaterThanOrEqual(0);
          expect(p.y, name).toBeGreaterThanOrEqual(0);
          expect(p.x + size, name).toBeLessThanOrEqual(area.w + 0.5);
          expect(p.y + size, name).toBeLessThanOrEqual(area.h + 0.5);
          for (let j = i + 1; j < items.length; j++) {
            const q = items[j]!;
            expect(Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)), `${name} ${i}/${j}`).toBeGreaterThanOrEqual(size - 0.5);
          }
        });
      }
    }
  });

  it('перші десять — один блок 5×2, решта — другий блок поруч (13 = 10 + 3): ті самі рядки, інші колонки', () => {
    const { size, items } = layoutObjects({ arrangement: 'tens', count: 13, area: { w: 1152, h: 430 }, size: 84, rng: createRng(1) });
    const block1 = items.slice(0, 10);
    const block2 = items.slice(10);
    expect(new Set(block1.map((p) => p.y)).size).toBe(2);
    expect(new Set(block1.map((p) => p.x)).size).toBe(5);
    expect(Math.min(...block2.map((p) => p.x))).toBeGreaterThan(Math.max(...block1.map((p) => p.x)) + size * 0.5);
    expect(block2.map((p) => p.y)).toEqual([block1[0]!.y, block1[0]!.y, block1[0]!.y]);
  });

  it('до десяти — один блок; порядок лічби — як розкладено', () => {
    const { items } = layoutObjects({ arrangement: 'tens', count: 8, area: { w: 880, h: 400 }, size: 84, rng: createRng(2) });
    expect(items).toHaveLength(8);
    expect(countingOrder('tens', items, 84)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('генератор «Policz i dotknij» 11–20: число в діапазоні, плитки в межах до 20 і містять відповідь', () => {
    const spec: CountTask = { game: 'policzIDotknij', skill: 'teens', count: [11, 20], arrangement: 'tens', look: 'distinct', answers: 'digit' };
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateCount(spec, ctxFor(seed));
      expect(i.count).toBeGreaterThanOrEqual(11);
      expect(i.options).toContain(i.count);
      for (const n of i.options) expect(n).toBeLessThanOrEqual(21);
      expect(i.arrangement).toBe('tens');
    }
  });
});

describe('двоповерховий автобус на 20', () => {
  const spec = (over: Partial<BusTask> = {}): BusTask => ({
    game: 'autobusDziesiatka', skill: 'bonds-5-10', count: [11, 19], ask: 'mixed', exposureMs: 0, answers: 'digit', floors: 2, ...over,
  });
  const instance = (over: Partial<BusInstance> = {}): BusInstance => ({
    game: 'autobusDziesiatka', skill: 'bonds-5-10', review: false, passengers: 14, capacity: 20, riders: Array.from({ length: 14 }, () => 'mis' as const),
    ask: 'empty', exposureMs: 0, answers: 'digit', mascot: 'mis', options: [6, 14, 15], ...over,
  });

  it('місць за поверхами: 1 → 10, 2 → 20, без поля — 10', () => {
    expect(capacityOf(undefined)).toBe(BUS_CAPACITY);
    expect(capacityOf(1)).toBe(10);
    expect(capacityOf(2)).toBe(DOUBLE_DECKER_CAPACITY);
  });

  it('генератор: до 20 пасажирів, місць 20, відповідь серед плиток, плитки в [0, 20], детерміновано', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateBus(spec(), ctxFor(seed));
      expect(i.capacity).toBe(20);
      expect(i.passengers).toBeGreaterThanOrEqual(11);
      expect(i.passengers).toBeLessThanOrEqual(19);
      const answer = busAnswer(i.passengers, i.ask, i.capacity);
      expect(i.options).toContain(answer);
      expect(new Set(i.options).size).toBe(3);
      for (const n of i.options) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(20);
      }
      expect(generateBus(spec(), ctxFor(seed))).toEqual(i);
    }
  });

  it('одноповерховий — як і раніше (10 місць, діапазон зрізається до 10)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const i = generateBus(spec({ floors: undefined, count: [0, 25] }), ctxFor(seed));
      expect(i.capacity).toBe(10);
      expect(i.passengers).toBeLessThanOrEqual(10);
    }
  });

  it('відповідь і перевірка: вільних = 20 − пасажирів; «Prawie!» на 1 поряд', () => {
    expect(busAnswer(14, 'empty', 20)).toBe(6);
    expect(busAnswer(14, 'full', 20)).toBe(14);
    expect(checkBus(instance(), 6)).toEqual({ ok: true });
    expect(checkBus(instance(), 7)).toEqual({ ok: false, almost: true });
    expect(autobusDziesiatka.answer(instance())).toBe(6);
    expect(autobusDziesiatka.praise(instance(), 'Brawo!')).toBe('Brawo! Czternaście i sześć to dwadzieścia.');
  });

  it('місця й допомога: зайнято 14 з 20; лічба вільних — місця 14…19; номери не виходять за 20 місць', () => {
    expect(seatsTaken(14, 20).filter(Boolean)).toHaveLength(14);
    expect(seatsTaken(14, 20)).toHaveLength(20);
    expect(countedSeats(instance())).toEqual([14, 15, 16, 17, 18, 19]);
    expect(countedSeats(instance({ ask: 'full' }))).toHaveLength(14);
    const marks = seatMarks(countedSeats(instance()), 3, 20);
    expect(marks).toHaveLength(20);
    expect(marks.slice(14, 18)).toEqual([1, 2, 3, null]);
    expect(usesRowHint(instance())).toBe(true);
  });

  it('геометрія: 4 ряди по 5; автобус вміщується в сцену й не заходить на Kubika', () => {
    expect(busGeometry(400, 4).rows).toBe(4);
    expect(busGeometry(400, 4).height).toBeGreaterThan(busGeometry(400, 2).height);
    const cases: { kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
      { kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
      { kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
      { kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
    ];
    for (const { kind, vw, area } of cases) {
      const reserved = sceneReserved(kind, vw, area);
      const p = busPlacement(area, reserved, 4);
      const g = busGeometry(p.width, 4);
      expect(p.x, kind).toBeGreaterThanOrEqual(0);
      expect(p.x + p.width, kind).toBeLessThanOrEqual(area.w);
      expect(p.y, kind).toBeGreaterThanOrEqual(0);
      expect(p.y + g.height, kind).toBeLessThanOrEqual(area.h);
      for (const r of reserved) expect(intersects({ x: p.x, y: p.y, w: p.width, h: g.height }, r), kind).toBe(false);
      expect(g.cell, kind).toBeGreaterThanOrEqual(24);
      expect(busWidthFor(area, 4)).toBeGreaterThanOrEqual(150);
    }
  });
});

describe('додавання без переходу через десяток (13 + 4)', () => {
  const sumSpec = (over: Partial<SumTask> = {}): SumTask => ({
    game: 'ileRazem', skill: 'add-no-bridge-20', sum: [12, 20], lid: false, order: 'bigFirst', doubles: false, symbols: false, noBridge: true, answers: 'digit', ...over,
  });
  const storySpec = (over: Partial<StoryTask> = {}): StoryTask => ({ game: 'historyjki', skill: 'add-no-bridge-20', sum: [12, 20], kind: 'join', noBridge: true, answers: 'digit', ...over });

  it('splitNoBridge: перший доданок ≥ 11, другий ≥ 1, сума збігається; ones не переходять десяток', () => {
    for (let sum = NO_BRIDGE_MIN_SUM; sum <= 20; sum++) {
      for (let seed = 1; seed <= 20; seed++) {
        const [a, b] = splitNoBridge(sum, createRng(sum * 50 + seed));
        expect(a + b).toBe(sum);
        expect(a).toBeGreaterThanOrEqual(11);
        expect(b).toBeGreaterThanOrEqual(1);
        expect((a % 10) + b).toBeLessThanOrEqual(10);
      }
    }
  });

  it('ileRazem з noBridge: перший доданок «-nastu», сума 12–20, відповідь серед плиток; «Wsyp!» і кришка працюють на тих самих числах', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const i = generateSum(sumSpec(), ctxFor(seed));
      expect(i.a).toBeGreaterThanOrEqual(11);
      expect(sumAnswer(i)).toBeGreaterThanOrEqual(12);
      expect(sumAnswer(i)).toBeLessThanOrEqual(20);
      expect(i.options).toContain(sumAnswer(i));
    }
    // менший діапазон, ніж «12»: ним керує мінімальна сума без переходу
    expect(sumAnswer(generateSum(sumSpec({ sum: [2, 5] }), ctxFor(1)))).toBeGreaterThanOrEqual(12);
  });

  it('historyjki з noBridge: те саме', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const i = generateStory(storySpec(), ctxFor(seed));
      expect(i.a).toBeGreaterThanOrEqual(11);
      expect(i.b).toBeGreaterThanOrEqual(1);
      expect(storyAnswer(i)).toBeLessThanOrEqual(20);
    }
  });

  it('без noBridge нічого не змінилось: суми 3–8 з доданками від 1', () => {
    const i = generateSum(sumSpec({ noBridge: false, sum: [3, 8] }), ctxFor(3));
    expect(sumAnswer(i)).toBeLessThanOrEqual(8);
  });
});
