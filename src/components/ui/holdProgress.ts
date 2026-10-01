/** Шестерня батьків (BRIEF §6.14): утримувати 3 с, кільце заповнюється лінійно. Відпустив раніше — кільце згасає за 150 мс. */
export const HOLD_MS = 3000;

/** Радіус і довжина кільця прогресу навколо шестерні 48 px у зоні 64 px (design etap1/06: r = 29, stroke 5). */
export const RING_R = 29;
export const RING_LENGTH = 2 * Math.PI * RING_R;

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Частка 0…1 утримання; нечисловий чи нульовий час → 1 (миттєве підтвердження не має зависати). */
export function holdProgress(elapsedMs: number, durationMs: number = HOLD_MS): number {
  if (!(durationMs > 0)) return 1;
  return clamp01(elapsedMs / durationMs);
}

/** stroke-dashoffset кільця для частки прогресу: 0 → повне коло приховано, 1 → повне. */
export function ringOffset(progress: number): number {
  return RING_LENGTH * (1 - clamp01(progress));
}
