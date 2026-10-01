// Ładowanie (BRIEF §6.1): Kubik складає вежу, смужка з 10 кубиків наповнюється. Застосунок локальний, тож «завантаження» —
// це дочекатися шрифтів і визначення польського голосу; але не менше ~1,6 с, щоб кубики встигли «вискочити» (не блимати екраном).

export const BOOT_SLOTS = 10;
export const BOOT_MIN_MS = 1600;

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Прогрес 0…1: не випереджає ні години, ні реально виконаних завдань. */
export function bootProgress(elapsedMs: number, tasksDone: number, tasksTotal: number, minMs: number = BOOT_MIN_MS): number {
  const time = minMs > 0 ? clamp01(elapsedMs / minMs) : 1;
  const real = tasksTotal > 0 ? clamp01(tasksDone / tasksTotal) : 1;
  return Math.min(time, real);
}

/** Скільки кубиків заповнено з BOOT_SLOTS. */
export function filledSlots(progress: number, slots: number = BOOT_SLOTS): number {
  return Math.min(slots, Math.floor(clamp01(progress) * slots + 1e-9));
}

/** Можна переходити далі: мінімальний час минув і всі завдання виконано. */
export function isBooted(elapsedMs: number, tasksDone: number, tasksTotal: number, minMs: number = BOOT_MIN_MS): boolean {
  return elapsedMs >= minMs && tasksDone >= tasksTotal;
}
