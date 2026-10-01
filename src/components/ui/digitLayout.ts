// Розкладка багатоцифрових чисел для SVG-цифр: усі цифри в одному <svg>, сусідні «коробки» накладаються на 10 од. viewBox
// (design etap1/07: проміжок між цифрами від'ємний). Кольорові розряди — лише для двоцифрових і лише на світлому тлі (BRIEF §8).

export const DIGIT_W = 100;
export const DIGIT_H = 140;
export const DIGIT_OVERLAP = 10;

/** tens/ones — розряди (кольорові цифри), plain — колір ink. */
export type Place = 'tens' | 'ones' | 'plain';

export interface Glyph {
  digit: number;
  /** Зсув цифри по X у системі координат viewBox. */
  x: number;
  place: Place;
}

export interface DigitsLayout {
  width: number;
  height: number;
  glyphs: Glyph[];
}

function placeOf(count: number, index: number): Place {
  if (count === 1) return 'ones';
  if (count === 2) return index === 0 ? 'tens' : 'ones';
  return 'plain'; // 100: розрядів сотень брифом не визначено — звичайна цифра
}

/** @param places кольорові розряди (десятки #1A4FA0, одиниці #A34700); без них усі цифри — plain. */
export function layoutDigits(value: number, opts: { places?: boolean } = {}): DigitsLayout {
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    throw new RangeError(`Digits: expected an integer 0–999, got ${value}`);
  }
  const digits = String(value).split('').map(Number);
  const step = DIGIT_W - DIGIT_OVERLAP;
  return {
    width: DIGIT_W + (digits.length - 1) * step,
    height: DIGIT_H,
    glyphs: digits.map((digit, i) => ({
      digit,
      x: i * step,
      place: opts.places ? placeOf(digits.length, i) : 'plain',
    })),
  };
}
