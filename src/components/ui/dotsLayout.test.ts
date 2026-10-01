import { describe, expect, it } from 'vitest';
import { layoutDots } from './dotsLayout';

describe('layoutDots', () => {
  it('3 крапки: один ряд, ширина за кількістю (design: 3 по центру)', () => {
    const l = layoutDots(3);
    expect(l.rows).toEqual([3]);
    expect(l.width).toBe(52);
    expect(l.height).toBe(14);
    expect(l.dots).toEqual([{ cx: 8, cy: 7 }, { cx: 26, cy: 7 }, { cx: 44, cy: 7 }]);
  });

  it('5 крапок: ряд 88×14 — як у борді дизайну', () => {
    const l = layoutDots(5);
    expect(l.rows).toEqual([5]);
    expect([l.width, l.height]).toEqual([88, 14]);
    expect(l.dots.map((d) => d.cx)).toEqual([8, 26, 44, 62, 80]);
  });

  it('7 = 5 + 2: другий ряд вирівняно ліворуч', () => {
    const l = layoutDots(7);
    expect(l.rows).toEqual([5, 2]);
    expect([l.width, l.height]).toEqual([88, 30]);
    expect(l.dots.slice(5)).toEqual([{ cx: 8, cy: 23 }, { cx: 26, cy: 23 }]);
  });

  it('6 крапок по 3 в ряд (кубик на DigitCard): 3 + 3', () => {
    const l = layoutDots(6, 3);
    expect(l.rows).toEqual([3, 3]);
    expect([l.width, l.height]).toEqual([52, 30]);
  });

  it('10 крапок: два повні ряди; кількість крапок завжди дорівнює числу', () => {
    expect(layoutDots(10).rows).toEqual([5, 5]);
    for (let n = 1; n <= 20; n++) expect(layoutDots(n).dots, String(n)).toHaveLength(n);
  });

  it('некоректні значення — RangeError', () => {
    expect(() => layoutDots(0)).toThrow(RangeError);
    expect(() => layoutDots(21)).toThrow(RangeError);
    expect(() => layoutDots(2.5)).toThrow(RangeError);
    expect(() => layoutDots(5, 0)).toThrow(RangeError);
  });
});
