// Геометрія прямої 0–100 з позначками десятків («Skoki żabki» з ракетою, W7; BRIEF §10 «прямі 0–20 і 0–100 з позначками десятків»). Чиста: число → x у design-px.
export const SPACE_W = 1000;
export const SPACE_PAD = 36;
export const SPACE_LINE_Y = 150;
export const SPACE_H = 230;
/** Ракета: розмір у design-px (91×148 у дизайні × 0,6). */
export const ROCKET_W = 55;
export const ROCKET_H = 89;

/** Скільки px на одиницю прямої. */
export const UNIT = (SPACE_W - 2 * SPACE_PAD) / 100;

/** Де на прямій стоїть число n (0…100): x центра позначки. */
export function lineX(n: number): number {
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new RangeError(`lineX: 0–100 expected, got ${n}`);
  return SPACE_PAD + n * UNIT;
}

export interface Tick {
  n: number;
  /** Висота позначки: десяток 26, п'ятірка 16, одиниця 9. */
  h: number;
  /** Підписана цифрою (десятки). */
  labelled: boolean;
}

/** 101 позначка: підписані десятки 0, 10…100; довші п'ятірки; короткі одиниці. */
export function ticks(): Tick[] {
  return Array.from({ length: 101 }, (_, n): Tick => ({ n, h: n % 10 === 0 ? 26 : n % 5 === 0 ? 16 : 9, labelled: n % 10 === 0 }));
}

/** Куди стає ракета на числі n: центр низу — на самій лінії (x = lineX(n)), корпус угору. */
export function rocketAnchor(n: number): { x: number; y: number } {
  return { x: lineX(n), y: SPACE_LINE_Y - 6 };
}
