import type { Verdict } from '../engine/types';
import type { CountInstance } from './generate';

/** Правильно — коли вибрано рівно кількість предметів. Відповідь на 1 більша чи менша — «Prawie!» замість «Spróbujmy jeszcze raz!» (BRIEF §4). */
export function checkCount(instance: Pick<CountInstance, 'count'>, value: number): Verdict {
  if (value === instance.count) return { ok: true };
  return { ok: false, almost: Math.abs(value - instance.count) === 1 };
}
