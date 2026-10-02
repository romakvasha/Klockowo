import { describe, expect, it } from 'vitest';
import type { Level, TenTask } from '../../curriculum/types';
import { sceneReserved } from '../engine/frameMath';
import { createRng } from '../engine/rng';
import { placeContent } from '../engine/placeContent';
import type { Assist, AssistContext, GenContext, SceneKind } from '../engine/types';
import { frameView, hintTen, togetherTen } from './assist';
import { TEN, checkTen, generateTen, missing, type TenInstance } from './generate';
import { zrobDziesiatke } from './index';
import { CELL, DESIGN, capacity } from './View';

const level: Level = { id: 'w3-1', world: 'w3', index: 1, kind: 'main', newIdea: false, skills: ['bonds-5-10'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w3', index: previous.length, rng: createRng(seed), previous });
const spec = (over: Partial<TenTask> = {}): TenTask => ({ game: 'zrobDziesiatke', skill: 'bonds-5-10', known: [4, 9], show: 'frame', ...over });
const instance = (over: Partial<TenInstance> = {}): TenInstance => ({ game: 'zrobDziesiatke', skill: 'bonds-5-10', review: false, known: 7, show: 'frame', ...over });

describe('відповідь «Zrób dziesiątkę»', () => {
  it('бракує 10 − відомих; check: правильно, на 1 поряд — «Prawie!», далі — хибно', () => {
    expect(missing({ known: 7 })).toBe(3);
    expect(checkTen({ known: 7 }, 3)).toEqual({ ok: true });
    expect(checkTen({ known: 7 }, 2)).toEqual({ ok: false, almost: true });
    expect(checkTen({ known: 7 }, 4)).toEqual({ ok: false, almost: true });
    expect(checkTen({ known: 7 }, 1)).toEqual({ ok: false, almost: false });
  });
});

describe('generateTen', () => {
  it('відомих 1–9 у межах діапазону, відповідь 1–9, детерміновано', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const i = generateTen(spec({ known: [4, 8] }), ctxFor(seed));
      expect(i.known).toBeGreaterThanOrEqual(4);
      expect(i.known).toBeLessThanOrEqual(8);
      expect(missing(i)).toBeGreaterThanOrEqual(1);
      expect(generateTen(spec({ known: [4, 8] }), ctxFor(seed))).toEqual(i);
    }
  });

  it('межі зрізаються до 1…9: десять відомих чи нуль не бувають', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateTen(spec({ known: [0, 12] }), ctxFor(seed));
      expect(i.known).toBeGreaterThanOrEqual(1);
      expect(i.known).toBeLessThanOrEqual(9);
    }
  });

  it('не повторює відповідь двічі поспіль, коли є з чого вибрати', () => {
    for (let seed = 1; seed <= 100; seed++) expect(missing(generateTen(spec(), ctxFor(seed, [3])))).not.toBe(3);
  });

  it('вузький діапазон з однієї відповіді не зависає', () => {
    const i = generateTen(spec({ known: [7, 7] }), ctxFor(1, [3]));
    expect(i.known).toBe(7);
  });

  it('переносить режим і прапорець повторення', () => {
    expect(generateTen(spec({ show: 'digit', review: true }), ctxFor(1))).toMatchObject({ show: 'digit', review: true, skill: 'bonds-5-10' });
  });
});

describe('гра як модуль рушія', () => {
  it('репліка — обидва рядки POLISH_COPY §5: «Ile brakuje do dziesięciu? Dołóż tyle, żeby było dziesięć.»', () => {
    expect(zrobDziesiatke.prompt(instance())).toBe('Ile brakuje do dziesięciu? Dołóż tyle, żeby było dziesięć.');
  });

  it('похвала: «Brawo! Siedem i trzy to dziesięć.»; build-гра без плиток; відповідь — скільки бракує', () => {
    expect(zrobDziesiatke.praise(instance(), 'Brawo!')).toBe('Brawo! Siedem i trzy to dziesięć.');
    expect(zrobDziesiatke.kind).toBe('build');
    expect(zrobDziesiatke.tiles(instance())).toEqual([]);
    expect(zrobDziesiatke.answer(instance())).toBe(3);
  });

  it('generate відхиляє чужу гру', () => {
    expect(() => zrobDziesiatke.generate({ game: 'blysk', skill: 'subitize-5', count: [1, 5], pattern: 'dice', exposureMs: 1000, answers: 'digit' }, ctxFor(1))).toThrow('cannot generate');
  });
});

describe('frameView: що малює сцена', () => {
  const counts = (cells: readonly string[]) => cells.filter((c) => c === 'solid').length;

  it('відомі видно: відомі займають перші комірки, докладені — наступні', () => {
    const v = frameView(7, 2, { knownShown: true, hintStep: 0, togetherStep: 0 });
    expect(v.cells.slice(0, 9)).toEqual(Array(9).fill('solid'));
    expect(v.cells[9]).toBe('empty');
    expect(v.marks.every((m) => m === null)).toBe(true);
  });

  it('відомі сховані (режим цифр): докладені лягають із першої комірки', () => {
    const v = frameView(7, 2, { knownShown: false, hintStep: 0, togetherStep: 0 });
    expect(v.cells.slice(0, 2)).toEqual(['solid', 'solid']);
    expect(counts(v.cells)).toBe(2);
  });

  it('підказка 2: номери 1…step на порожніх комірках одразу після докладених', () => {
    const v = frameView(7, 1, { knownShown: true, hintStep: 2, togetherStep: 0 });
    expect(v.marks[7]).toBeNull();
    expect(v.marks[8]).toBe(1);
    expect(v.marks[9]).toBe(2);
  });

  it('підказка 2 не виходить за рамку', () => {
    const v = frameView(9, 0, { knownShown: true, hintStep: 5, togetherStep: 0 });
    expect(v.marks.filter((m) => m !== null)).toEqual([1]);
  });

  it('показ разом: номери 1…step на докладених комірках', () => {
    const v = frameView(7, 3, { knownShown: true, hintStep: 0, togetherStep: 2 });
    expect(v.marks.slice(7)).toEqual([1, 2, null]);
    expect(counts(v.cells)).toBe(10);
  });

  it('докладених не більше, ніж комірок', () => {
    expect(counts(frameView(7, 99, { knownShown: true, hintStep: 0, togetherStep: 0 }).cells)).toBe(10);
  });

  it('capacity: з відомими — решта до десяти; у режимі цифр — десять', () => {
    expect(capacity(7, true)).toBe(3);
    expect(capacity(7, false)).toBe(TEN);
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

  it('1-ша підказка: порожні комірки пульсують і «Ile brakuje do pełnej dziesiątki?»', async () => {
    const { said, assists, ctx } = recorder();
    await hintTen(instance(), ctx, { nth: 1, response: null });
    expect(said).toEqual(['Ile brakuje do pełnej dziesiątki?']);
    expect(assists).toEqual([{ mode: 'hint', step: 0, level: 1 }]);
  });

  it('2-га підказка: лічить порожні комірки «jeden, dwa, trzy»', async () => {
    const { said, assists, ctx } = recorder();
    await hintTen(instance(), ctx, { nth: 2, response: null });
    expect(said).toEqual(['jeden', 'dwa', 'trzy']);
    expect(assists.at(-1)).toEqual({ mode: 'hint', step: 3, level: 2 });
  });

  it('показ разом: фішки лягають по одній з лічбою й «Siedem i trzy to dziesięć.»', async () => {
    const { said, assists, ctx } = recorder();
    await togetherTen(instance(), ctx);
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'Siedem i trzy to dziesięć.']);
    expect(assists.every((a) => a.mode === 'together')).toBe(true);
    expect(assists.at(-1)?.step).toBe(3);
  });
});

describe('рамка у сцені', () => {
  const cases: { kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
    { kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
    { kind: 'wide', vw: 1024, area: { w: 880, h: 400 } },
    { kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
    { kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
  ];

  it('рамка вміщується в сцену, не заходить на Kubika; комірка-кнопка ≥ 64 px (ПК) і ≥ 56 px (найвужчий екран)', () => {
    for (const { kind, vw, area } of cases) {
      const reserved = sceneReserved(kind, vw, area);
      const p = placeContent(area, reserved, DESIGN, { maxScale: 1.7 });
      expect(p.x + p.w, kind).toBeLessThanOrEqual(area.w);
      expect(p.y + p.h, kind).toBeLessThanOrEqual(area.h);
      for (const r of reserved) expect(p.x < r.x + r.w && r.x < p.x + p.w && p.y < r.y + r.h && r.y < p.y + p.h, kind).toBe(false);
      // дитині на телефоні потрібно ≥ 64 px у реальних пікселях
      expect(CELL * p.scale, kind).toBeGreaterThanOrEqual(kind === 'phone' || kind === 'portrait' ? 56 : 64);
    }
  });
});
