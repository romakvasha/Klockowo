import { describe, expect, it } from 'vitest';
import { dotsFor, handsFor, kindAllowed, objectCols, objectGrid } from './setFaces';

describe('kindAllowed', () => {
  it('предмети — до 20, крапки, пальці й рамка — до 10', () => {
    expect(kindAllowed('objects', 0)).toBe(true);
    expect(kindAllowed('objects', 20)).toBe(true);
    expect(kindAllowed('objects', 21)).toBe(false);
    for (const kind of ['dots', 'fingers', 'tenFrame'] as const) {
      expect(kindAllowed(kind, 10)).toBe(true);
      expect(kindAllowed(kind, 11)).toBe(false);
    }
  });
});

describe('handsFor', () => {
  it('0–5 — одна рука, 6–10 — п\'ять і решта', () => {
    expect(handsFor(0)).toEqual([0]);
    expect(handsFor(5)).toEqual([5]);
    expect(handsFor(6)).toEqual([5, 1]);
    expect(handsFor(10)).toEqual([5, 5]);
    expect(() => handsFor(11)).toThrow(RangeError);
  });
});

describe('dotsFor', () => {
  it('стільки крапок, скільки порахувати; ту саму картку дає те саме зерно', () => {
    for (let n = 1; n <= 10; n++) {
      expect(dotsFor('dots', n, 7).dots).toHaveLength(n);
      expect(dotsFor('tenFrame', n, 7).dots).toHaveLength(n);
    }
    expect(dotsFor('dots', 8, 3)).toEqual(dotsFor('dots', 8, 3));
  });

  it('до шести — канонічний кубик (однакова розкладка за будь-якого зерна)', () => {
    expect(dotsFor('dots', 5, 1)).toEqual(dotsFor('dots', 5, 99));
  });

  it('нуль: порожня картка; для рамки-десятки — порожня рамка', () => {
    expect(dotsFor('dots', 0, 1)).toMatchObject({ dots: [], frame: false });
    expect(dotsFor('tenFrame', 0, 1)).toMatchObject({ dots: [], frame: true });
    expect(dotsFor('tenFrame', 4, 1).frame).toBe(true);
  });
});

describe('objectGrid', () => {
  it('предмети рядами по п\'ять, усі вміщуються в квадрат без накладання', () => {
    for (const inner of [120, 180, 90]) {
      for (let n = 1; n <= 20; n++) {
        const { size, items } = objectGrid(n, inner);
        expect(items).toHaveLength(n);
        expect(size).toBeGreaterThan(0);
        for (const it of items) {
          expect(it.x).toBeGreaterThanOrEqual(0);
          expect(it.y).toBeGreaterThanOrEqual(0);
          expect(it.x + size).toBeLessThanOrEqual(inner + 1);
          expect(it.y + size).toBeLessThanOrEqual(inner + 1);
        }
        const keys = new Set(items.map((i) => `${i.x},${i.y}`));
        expect(keys.size).toBe(n);
      }
    }
  });

  it('скільки в ряду: 1–4 — по два, 5–6 — по три, 7–8 — по чотири, 9 — квадрат 3×3, від 10 — по п’ять', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20].map(objectCols)).toEqual([1, 2, 2, 2, 3, 3, 4, 4, 3, 5, 5, 5]);
  });

  it('ряди: 3 → 2+1, 6 → 3+3, 8 → 4+4, 9 → 3×3, 10 → 5+5, 11–15 — три ряди, 16–20 — чотири', () => {
    const rowsOf = (n: number) => {
      const ys = [...new Set(objectGrid(n, 160).items.map((i) => i.y))];
      return ys.map((y) => objectGrid(n, 160).items.filter((i) => i.y === y).length);
    };
    expect(rowsOf(1)).toEqual([1]);
    expect(rowsOf(3)).toEqual([2, 1]);
    expect(rowsOf(6)).toEqual([3, 3]);
    expect(rowsOf(8)).toEqual([4, 4]);
    expect(rowsOf(9)).toEqual([3, 3, 3]);
    expect(rowsOf(10)).toEqual([5, 5]);
    expect(rowsOf(11)).toEqual([5, 5, 1]);
    expect(rowsOf(20)).toEqual([5, 5, 5, 5]);
  });

  it('неповний останній ряд стоїть по центру: 3 предмети — єдиний знизу посередині під парою', () => {
    const { size, items } = objectGrid(3, 160);
    const pairCenter = (items[0]!.x + items[1]!.x + size) / 2;
    expect(Math.abs(items[2]!.x + size / 2 - pairCenter)).toBeLessThanOrEqual(1);
  });

  it('єдиний предмет не заповнює всю картку (≤ 46 %), нуль — порожньо', () => {
    expect(objectGrid(1, 200).size).toBeLessThanOrEqual(92);
    expect(objectGrid(0, 200)).toEqual({ size: 0, items: [] });
  });

  it('більше предметів — менші: 10 дрібніші за 3; предмети достатньо великі (≥ 17 % сторони навіть для 20)', () => {
    expect(objectGrid(10, 160).size).toBeLessThan(objectGrid(3, 160).size);
    expect(objectGrid(20, 160).size).toBeGreaterThanOrEqual(Math.floor(160 * 0.17));
  });
});
