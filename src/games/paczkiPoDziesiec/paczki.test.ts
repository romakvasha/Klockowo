import { describe, expect, it } from 'vitest';
import { placeValueMatSize } from '../../components/math/PlaceValueMat';
import type { Level, PackTask } from '../../curriculum/types';
import { sceneReserved } from '../engine/frameMath';
import { createRng } from '../engine/rng';
import { placeContent } from '../engine/placeContent';
import type { Assist, AssistContext, GenContext, SceneKind } from '../engine/types';
import { boxesFor, hintPack, tensCount, togetherPack } from './assist';
import { LOOSE_MAX, PACK_MAX, PACK_MIN, checkPack, digitsOf, generatePack, packAnswer, pickPackOptions, swapDigits, type PackInstance } from './generate';
import { paczkiPoDziesiec, promptOf } from './index';
import { BOX, BOX_GAP, BUILD_BUTTON, BUILD_DESIGN, CELL, LOOSE_ZONE, PACK_BUTTON, PACK_DESIGN, RIGHT_X, boxPosition } from './View';

const level: Level = { id: 'w5-3', world: 'w5', index: 3, kind: 'main', newIdea: true, skills: ['bundle-ten'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w5', index: previous.length, rng: createRng(seed), previous });
const spec = (over: Partial<PackTask> = {}): PackTask => ({
  game: 'paczkiPoDziesiec', skill: 'bundle-ten', total: [21, 49], mode: 'packed', contrast: false, answers: 'digit', ...over,
});
const instance = (over: Partial<PackInstance> = {}): PackInstance => ({
  game: 'paczkiPoDziesiec', skill: 'bundle-ten', review: false, object: 'jagoda', total: 47, mode: 'packed', answers: 'digit', options: [37, 47, 74], ...over,
});

describe('цифри й контраст', () => {
  it('digitsOf: 47 → 4 десятки, 7 одиниць', () => {
    expect(digitsOf(47)).toEqual({ tens: 4, ones: 7 });
    expect(digitsOf(30)).toEqual({ tens: 3, ones: 0 });
    expect(digitsOf(99)).toEqual({ tens: 9, ones: 9 });
  });

  it('swapDigits: 26 ↔ 62; немає пари для 30, 33, 10, 50 (нуль на кінці) і виходу за межі', () => {
    expect(swapDigits(26)).toBe(62);
    expect(swapDigits(62)).toBe(26);
    expect(swapDigits(13)).toBe(31);
    expect(swapDigits(30)).toBeNull();
    expect(swapDigits(33)).toBeNull();
    expect(swapDigits(10)).toBeNull();
    for (let n = PACK_MIN; n <= PACK_MAX; n++) {
      const s = swapDigits(n);
      if (s !== null) {
        expect(swapDigits(s)).toBe(n);
        expect(s).toBeGreaterThanOrEqual(PACK_MIN);
        expect(s).toBeLessThanOrEqual(PACK_MAX);
        expect(s).not.toBe(n);
      }
    }
  });
});

describe('pickPackOptions', () => {
  it('три різні числа в [11, 99] за зростанням; відповідь серед них; при contrast — число з переставленими цифрами', () => {
    for (let n = PACK_MIN; n <= PACK_MAX; n++) {
      for (const contrast of [false, true]) {
        const options = pickPackOptions(n, contrast, createRng(n * 3 + (contrast ? 1 : 0)));
        expect(options, `${n}/${contrast}`).toHaveLength(3);
        expect(new Set(options).size, `${n}/${contrast}`).toBe(3);
        expect(options).toEqual([...options].sort((a, b) => a - b));
        expect(options).toContain(n);
        for (const m of options) {
          expect(m).toBeGreaterThanOrEqual(PACK_MIN);
          expect(m).toBeLessThanOrEqual(PACK_MAX);
        }
        const swapped = swapDigits(n);
        if (contrast && swapped !== null) expect(options, `${n}`).toContain(swapped);
      }
    }
  });

  it('26 → серед плиток 62; 47 → 74', () => {
    expect(pickPackOptions(26, true, createRng(1))).toContain(62);
    expect(pickPackOptions(47, true, createRng(2))).toContain(74);
  });
});

describe('generatePack', () => {
  it('число в межах, відповідь серед плиток, детерміновано', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const i = generatePack(spec({ total: [21, 69] }), ctxFor(seed));
      expect(i.total).toBeGreaterThanOrEqual(21);
      expect(i.total).toBeLessThanOrEqual(69);
      expect(i.options).toContain(i.total);
      expect(generatePack(spec({ total: [21, 69] }), ctxFor(seed))).toEqual(i);
    }
  });

  it('loose не більше 59, packed і build — до 99; нижня межа 11', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(generatePack(spec({ mode: 'loose', total: [40, 99] }), ctxFor(seed)).total).toBeLessThanOrEqual(LOOSE_MAX);
      expect(generatePack(spec({ mode: 'packed', total: [80, 120] }), ctxFor(seed)).total).toBeLessThanOrEqual(PACK_MAX);
      expect(generatePack(spec({ mode: 'build', total: [0, 20] }), ctxFor(seed)).total).toBeGreaterThanOrEqual(PACK_MIN);
    }
  });

  it('build: плиток нема; контраст завжди має пару 26 ↔ 62 (число без пари перебирається)', () => {
    expect(generatePack(spec({ mode: 'build' }), ctxFor(1)).options).toEqual([]);
    for (let seed = 1; seed <= 100; seed++) {
      const i = generatePack(spec({ contrast: true, total: [21, 69] }), ctxFor(seed));
      const swapped = swapDigits(i.total);
      if (swapped !== null) expect(i.options).toContain(swapped);
    }
  });

  it('не повторює відповідь двічі поспіль', () => {
    for (let seed = 1; seed <= 100; seed++) expect(generatePack(spec(), ctxFor(seed, [30])).total).not.toBe(30);
  });

  it('check: правильно, на 1 — «Prawie!», на 10 — хибно; відповідь — загальна кількість', () => {
    expect(packAnswer({ total: 47 })).toBe(47);
    expect(checkPack({ total: 47 }, 47)).toEqual({ ok: true });
    expect(checkPack({ total: 47 }, 46)).toEqual({ ok: false, almost: true });
    expect(checkPack({ total: 47 }, 37)).toEqual({ ok: false, almost: false });
    expect(checkPack({ total: 47 }, 74)).toEqual({ ok: false, almost: false });
  });
});

describe('гра як модуль рушія', () => {
  it('репліки: loose — «Zapakuj jagody po dziesięć. Ile jest jagód razem?», packed — лише питання, build — «Zbuduj liczbę czterdzieści siedem.»', () => {
    expect(promptOf(instance({ mode: 'loose' }))).toBe('Zapakuj jagody po dziesięć. Ile jest jagód razem?');
    expect(promptOf(instance({ mode: 'packed' }))).toBe('Ile jest jagód razem?');
    expect(promptOf(instance({ mode: 'build' }))).toBe('Zbuduj liczbę czterdzieści siedem.');
    expect(promptOf(instance({ mode: 'loose', object: 'grzybek' }))).toBe('Zapakuj grzybki po dziesięć. Ile jest grzybków razem?');
  });

  it('похвала: «Brawo! Cztery dziesiątki i siedem jedności to czterdzieści siedem.»; 40 — «zero jedności»', () => {
    expect(paczkiPoDziesiec.praise(instance(), 'Brawo!')).toBe('Brawo! Cztery dziesiątki i siedem jedności to czterdzieści siedem.');
    expect(paczkiPoDziesiec.praise(instance({ total: 21 }), 'Brawo!')).toBe('Brawo! Dwie dziesiątki i jedna jedność to dwadzieścia jeden.');
    expect(paczkiPoDziesiec.praise(instance({ total: 40 }), 'Brawo!')).toMatch(/zero jedności/);
  });

  it('kindOf: build збирає на сцені, решта — плитки', () => {
    expect(paczkiPoDziesiec.kindOf?.(instance({ mode: 'build' }))).toBe('build');
    expect(paczkiPoDziesiec.kindOf?.(instance({ mode: 'loose' }))).toBe('choice');
    expect(paczkiPoDziesiec.kindOf?.(instance({ mode: 'packed' }))).toBe('choice');
    expect(paczkiPoDziesiec.tiles(instance()).map((t) => t.value)).toEqual([37, 47, 74]);
  });

  it('generate відхиляє чужу гру', () => {
    expect(() => paczkiPoDziesiec.generate({ game: 'blysk', skill: 'subitize-5', count: [1, 5], pattern: 'dice', exposureMs: 1000, answers: 'digit' }, ctxFor(1))).toThrow('cannot generate');
  });
});

describe('допомога', () => {
  const recorder = () => {
    const said: string[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = { say: async (t) => { said.push(t); }, wait: async () => undefined, setAssist: (a) => { assists.push(a); } };
    return { said, assists, ctx };
  };

  it('1-ша підказка: лічба десятками «dziesięć, dwadzieścia, trzydzieści, czterdzieści»', async () => {
    const { said, assists, ctx } = recorder();
    await hintPack(instance(), ctx, { nth: 1, response: null });
    expect(said).toEqual(['dziesięć', 'dwadzieścia', 'trzydzieści', 'czterdzieści']);
    expect(assists.at(-1)).toEqual({ mode: 'hint', step: 4, level: 1 });
  });

  it('2-га підказка: мат і «Cztery dziesiątki i siedem jedności to czterdzieści siedem.»', async () => {
    const { said, assists, ctx } = recorder();
    await hintPack(instance(), ctx, { nth: 2, response: null });
    expect(said).toEqual(['Cztery dziesiątki i siedem jedności to czterdzieści siedem.']);
    expect(assists).toEqual([{ mode: 'hint', step: 0, level: 2 }]);
  });

  it('показ разом: десятки, далі одиниці «від десятків» («czterdzieści jeden»…) і розряди; step: десятки 1…4, одиниці 5…11', async () => {
    const { said, assists, ctx } = recorder();
    await togetherPack(instance(), ctx);
    expect(said).toEqual([
      'dziesięć', 'dwadzieścia', 'trzydzieści', 'czterdzieści',
      'czterdzieści jeden', 'czterdzieści dwa', 'czterdzieści trzy', 'czterdzieści cztery', 'czterdzieści pięć', 'czterdzieści sześć', 'czterdzieści siedem',
      'Cztery dziesiątki i siedem jedności to czterdzieści siedem.',
    ]);
    expect(assists.at(-1)?.step).toBe(11);
  });

  it('tensCount і boxesFor', () => {
    expect(tensCount(3)).toBe('trzydzieści');
    expect(tensCount(10)).toBe('sto');
    expect(boxesFor(47)).toBe(4);
    expect(boxesFor(99)).toBe(9);
  });
});

describe('композиція', () => {
  const cases: { kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
    { kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
    { kind: 'wide', vw: 1024, area: { w: 880, h: 400 } },
    { kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
    { kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
  ];
  const intersects = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  it('коробки 3×3 не перекриваються й лежать у правій зоні', () => {
    for (let i = 0; i < 9; i++) {
      const p = boxPosition(i);
      expect(p.x).toBeGreaterThanOrEqual(RIGHT_X);
      expect(p.x + BOX).toBeLessThanOrEqual(PACK_DESIGN.w);
      expect(p.y + BOX).toBeLessThanOrEqual(PACK_DESIGN.h);
      for (let j = i + 1; j < 9; j++) {
        const q = boxPosition(j);
        expect(intersects({ ...p, w: BOX, h: BOX }, { ...q, w: BOX, h: BOX }), `${i}/${j}`).toBe(false);
      }
    }
    expect(BOX_GAP).toBeGreaterThan(0);
    expect(LOOSE_ZONE.w).toBeLessThan(RIGHT_X);
  });

  it('пакування вміщується в сцену, не заходить на Kubika; «Zapakuj» ≥ 64 px і не виходить за сцену', () => {
    expect(PACK_BUTTON).toBeGreaterThanOrEqual(64);
    for (const { kind, vw, area } of cases) {
      const reserved = sceneReserved(kind, vw, area);
      const p = placeContent(area, reserved, PACK_DESIGN, { maxScale: 1.4 });
      expect(p.x + p.w, kind).toBeLessThanOrEqual(area.w);
      expect(p.y + p.h, kind).toBeLessThanOrEqual(area.h);
      for (const r of reserved) expect(intersects({ x: p.x, y: p.y, w: p.w, h: p.h }, r), kind).toBe(false);
      const x = Math.round(p.x + (RIGHT_X - 20) * p.scale);
      const y = Math.round(p.y + (PACK_DESIGN.h / 2) * p.scale);
      expect(x - PACK_BUTTON / 2, kind).toBeGreaterThanOrEqual(0);
      expect(x + PACK_BUTTON / 2, kind).toBeLessThanOrEqual(area.w);
      expect(y - PACK_BUTTON / 2, kind).toBeGreaterThanOrEqual(0);
      expect(y + PACK_BUTTON / 2, kind).toBeLessThanOrEqual(area.h);
    }
  });

  it('мат у правій зоні вміщується (cell 17); режим «Zbuduj»: мат + кнопки вміщуються, кнопка +10/+1 ≥ 64 px (≥ 56 на вузьких екранах)', () => {
    expect(placeValueMatSize(CELL).w).toBeLessThanOrEqual(PACK_DESIGN.w - RIGHT_X);
    expect(placeValueMatSize(CELL).h).toBeLessThanOrEqual(PACK_DESIGN.h);
    for (const { kind, vw, area } of cases) {
      const reserved = sceneReserved(kind, vw, area);
      const p = placeContent(area, reserved, BUILD_DESIGN, { maxScale: 1.4 });
      expect(p.x + p.w, kind).toBeLessThanOrEqual(area.w);
      expect(p.y + p.h, kind).toBeLessThanOrEqual(area.h);
      for (const r of reserved) expect(intersects({ x: p.x, y: p.y, w: p.w, h: p.h }, r), kind).toBe(false);
      expect(BUILD_BUTTON * p.scale, kind).toBeGreaterThanOrEqual(kind === 'wide' ? 64 : 56);
    }
  });
});
