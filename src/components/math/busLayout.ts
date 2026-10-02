// Геометрія блокового автобуса «Autobus dziesiątka» (BRIEF §7 гра 7): місця сіткою 5 в ряду; 2 ряди — 10 місць (двоповерховий на 20 — W4, M16).
// Чиста функція без React: за шириною автобуса дає розміри місць, позиції й висоту.
export const SEAT_COLS = 5;
export const BUS_PAD = 10;
export const BUS_GAP = 6;
export const BUS_ROOF = 18;
export const BUS_WHEEL = 30;

export interface BusGeometry {
  width: number;
  height: number;
  /** Сторона місця. */
  cell: number;
  rows: number;
  /** Лівий верхній кут місця з номером i (за порядком: ряд за рядом, зліва направо). */
  seat(i: number): { x: number; y: number };
  /** Рамка ряду (для пульсації «п'ять у ряду»). */
  rowBox(row: number): { x: number; y: number; w: number; h: number };
  /** Висота кузова без коліс. */
  bodyH: number;
}

/** Скільки місць у автобусі з `rows` рядами. */
export const seatCount = (rows: number): number => rows * SEAT_COLS;

export function busGeometry(width: number, rows = 2): BusGeometry {
  const cell = Math.max(24, Math.floor((width - 2 * BUS_PAD - (SEAT_COLS - 1) * BUS_GAP) / SEAT_COLS));
  const rowsH = rows * cell + (rows - 1) * BUS_GAP;
  const bodyH = BUS_ROOF + BUS_PAD + rowsH + BUS_PAD;
  const innerW = SEAT_COLS * cell + (SEAT_COLS - 1) * BUS_GAP;
  const x0 = Math.round((width - innerW) / 2);
  const y0 = BUS_ROOF + BUS_PAD;
  return {
    width,
    height: bodyH + Math.round(BUS_WHEEL / 2),
    cell,
    rows,
    bodyH,
    seat: (i) => ({ x: x0 + (i % SEAT_COLS) * (cell + BUS_GAP), y: y0 + Math.floor(i / SEAT_COLS) * (cell + BUS_GAP) }),
    rowBox: (row) => ({ x: x0 - 4, y: y0 + row * (cell + BUS_GAP) - 4, w: innerW + 8, h: cell + 8 }),
  };
}

/** Найбільша ширина автобуса, що вміщається в область (висота ≈ 0,52 ширини для 2 рядів), не більше `max`. */
export function busWidthFor(area: { w: number; h: number }, rows = 2, max = 600): number {
  const unit = busGeometry(100, rows);
  const byHeight = Math.floor((area.h - 24) * (100 / unit.height));
  return Math.max(150, Math.min(max, Math.floor(area.w * 0.9), byHeight));
}
