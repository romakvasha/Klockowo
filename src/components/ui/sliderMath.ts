/** Частка 0–1, на яку заповнено повзунок: для заливки треку (--p). */
export function sliderFraction(value: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** Скільки поділок малювати під треком: темп 0,7…1,2 із кроком 0,1 → 6 (design etap1/10). */
export function sliderTickCount(min: number, max: number, step: number): number {
  if (!(max > min) || !(step > 0)) return 0;
  return Math.round((max - min) / step) + 1;
}
