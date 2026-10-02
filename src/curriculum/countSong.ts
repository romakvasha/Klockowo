// «Liczymy do stu» (Plac Zabaw, PEDAGOGY §1: «counting songs to 100»): послідовність чисел, які Kubik проголошує вголос, поки на таблиці світиться поточне число. Чиста логіка.
export type CountMode = 'ones' | 'tens';

/** Числа лічби: по одному 1…100 чи десятками 10, 20…100. `from` — з якого числа почати (для «ones» — від нього до 100; для «tens» — від найближчого десятка не менше `from`). */
export function countSequence(mode: CountMode, from = 1): number[] {
  const start = Math.max(1, Math.min(100, Math.floor(from)));
  if (mode === 'ones') return Array.from({ length: 100 - start + 1 }, (_, i) => start + i);
  const first = Math.ceil(start / 10) * 10;
  return Array.from({ length: Math.floor((100 - first) / 10) + 1 }, (_, i) => first + i * 10);
}

/** Пауза між числами, мс: по одному — швидше, десятками — повільніше. */
export const COUNT_GAP_MS: Readonly<Record<CountMode, number>> = { ones: 120, tens: 450 };
