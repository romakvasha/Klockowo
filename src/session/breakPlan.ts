// «Czas na przerwę!» (пісенька — `breakSong.ts`): куди повертає екран після перерви. Чиста логіка.
/** Куди йти після перерви: `next` зі стану навігації, якщо він схожий на адресу застосунку; інакше на мапу. */
export function afterBreakPath(state: unknown): string {
  const next = (state as { next?: { to?: unknown } } | null)?.next?.to;
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/break') ? next : '/map';
}

/** Стан навігації, який треба віддати далі (напр. `{ from: 'w1-3' }`, щоб Kubik пробіг до нового вузла): лише простий об'єкт. */
export function afterBreakState(state: unknown): Record<string, unknown> | undefined {
  const next = (state as { next?: { state?: unknown } } | null)?.next?.state;
  return typeof next === 'object' && next !== null && !Array.isArray(next) ? (next as Record<string, unknown>) : undefined;
}
