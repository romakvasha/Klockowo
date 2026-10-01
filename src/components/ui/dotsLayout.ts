// Крапки під цифрою на плитках W1 («цифра разом із відповідною кількістю крапок», BRIEF §7): ряди по `perRow`,
// кожен ряд вирівняно ліворуч, одинарний ряд — за кількістю крапок (3 крапки по центру, 7 = 5 + 2). design etap1/07.

export const DOT_R = 6;
export const DOT_PITCH_X = 18;
export const DOT_PITCH_Y = 16;
const MARGIN = 2;

export interface Dot {
  cx: number;
  cy: number;
}

export interface DotsLayout {
  /** Довжини рядів: 7 при perRow 5 → [5, 2]. */
  rows: number[];
  width: number;
  height: number;
  dots: Dot[];
}

export function layoutDots(count: number, perRow = 5): DotsLayout {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new RangeError(`Dots: expected an integer 1–20, got ${count}`);
  }
  if (!Number.isInteger(perRow) || perRow < 1) throw new RangeError(`Dots: perRow must be a positive integer, got ${perRow}`);

  const rows: number[] = [];
  for (let left = count; left > 0; left -= perRow) rows.push(Math.min(perRow, left));

  const cols = Math.min(count, perRow);
  const first = DOT_R + MARGIN;
  const dots: Dot[] = [];
  rows.forEach((n, row) => {
    for (let col = 0; col < n; col++) dots.push({ cx: first + col * DOT_PITCH_X, cy: DOT_R + 1 + row * DOT_PITCH_Y });
  });
  return {
    rows,
    width: 2 * first + (cols - 1) * DOT_PITCH_X,
    height: 2 * (DOT_R + 1) + (rows.length - 1) * DOT_PITCH_Y,
    dots,
  };
}
