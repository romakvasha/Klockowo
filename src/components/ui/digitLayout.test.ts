import { describe, expect, it } from 'vitest';
import { DIGIT_H, layoutDigits } from './digitLayout';

describe('layoutDigits', () => {
  it('одна цифра: ширина 100, без зсуву', () => {
    expect(layoutDigits(7)).toEqual({ width: 100, height: DIGIT_H, glyphs: [{ digit: 7, x: 0, place: 'plain' }] });
    expect(layoutDigits(0).glyphs).toEqual([{ digit: 0, x: 0, place: 'plain' }]);
  });

  it('двоцифрове: цифри накладаються на 10 одиниць (крок 90)', () => {
    const l = layoutDigits(47);
    expect(l.width).toBe(190);
    expect(l.glyphs.map((g) => [g.digit, g.x])).toEqual([[4, 0], [7, 90]]);
  });

  it('кольорові розряди лише на вимогу: десятки + одиниці', () => {
    expect(layoutDigits(47).glyphs.map((g) => g.place)).toEqual(['plain', 'plain']);
    expect(layoutDigits(47, { places: true }).glyphs.map((g) => g.place)).toEqual(['tens', 'ones']);
    expect(layoutDigits(30, { places: true }).glyphs.map((g) => [g.digit, g.place])).toEqual([[3, 'tens'], [0, 'ones']]);
    expect(layoutDigits(10, { places: true }).glyphs.map((g) => g.place)).toEqual(['tens', 'ones']);
  });

  it('одна цифра в режимі розрядів — це одиниці', () => {
    expect(layoutDigits(7, { places: true }).glyphs[0]?.place).toBe('ones');
  });

  it('100: три цифри, розряди не фарбуються', () => {
    const l = layoutDigits(100, { places: true });
    expect(l.width).toBe(280);
    expect(l.glyphs.map((g) => [g.digit, g.x, g.place])).toEqual([[1, 0, 'plain'], [0, 90, 'plain'], [0, 180, 'plain']]);
  });

  it('усі числа 0–100 розкладаються без помилок, цифри збігаються із записом числа', () => {
    for (let n = 0; n <= 100; n++) {
      const l = layoutDigits(n, { places: true });
      expect(l.glyphs.map((g) => g.digit).join(''), String(n)).toBe(String(n));
    }
  });

  it('некоректні значення — RangeError', () => {
    for (const bad of [-1, 1.5, 1000, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => layoutDigits(bad), String(bad)).toThrow(RangeError);
    }
  });
});
