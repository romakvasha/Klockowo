// Версія схеми даних і міграції. Нова версія: підняти SCHEMA_VERSION, додати у MIGRATIONS крок `N → N+1`
// (приймає старі дані як є — unknown — і повертає дані схеми N+1), дописати тест у migrate.test.ts.
import { normalizeData } from './normalize';
import type { AppData } from './types';

export const SCHEMA_VERSION = 1;

/** Крок міграції: дані версії `N` → дані версії `N + 1` (ключ — N). Поки що першу схему не потрібно ні з чого переводити. */
export type Migration = (state: unknown) => unknown;
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

/** Проводить дані зі збереженої версії до поточної і нормалізує. Дані новішої версії (застосунок відкотили) читає як є,
 *  відкидаючи невідоме; зникнення кроку міграції — помилка програміста, а не дані користувача. */
export function migratePersisted(
  raw: unknown,
  fromVersion: number,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): AppData {
  let state = raw;
  for (let v = fromVersion; v < target; v++) {
    const step = migrations[v];
    if (!step) throw new Error(`Missing data migration ${v} → ${v + 1}`);
    state = step(state);
  }
  return normalizeData(state);
}
