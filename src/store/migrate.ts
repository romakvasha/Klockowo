// Версія схеми даних і міграції. Нова версія: підняти SCHEMA_VERSION, додати у MIGRATIONS крок `N → N+1`
// (приймає старі дані як є — unknown — і повертає дані схеми N+1), дописати тест у migrate.test.ts.
import { isWorldComplete } from '../curriculum/progression';
import { WORLD_KEYS } from '../curriculum/worlds';
import { normalizeData } from './normalize';
import type { AppData } from './types';

export const SCHEMA_VERSION = 3;

/** Крок міграції: дані версії `N` → дані версії `N + 1` (ключ — N). */
export type Migration = (state: unknown) => unknown;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** v1 → v2 (M12, адаптивність): `step` навички був невикористаним лічильником 0…20, тепер це крок −2…2 — скидаємо до 0.
 *  Нові поля (sinceStep, streak, struggle, flagged; retry; swaps/warmup у забігах) додає нормалізація з типовими значеннями. */
export function migrateV1(state: unknown): unknown {
  if (!isRecord(state) || !isRecord(state.progress)) return state;
  const progress = Object.fromEntries(
    Object.entries(state.progress).map(([id, p]) => {
      if (!isRecord(p) || !isRecord(p.skills)) return [id, p];
      const skills = Object.fromEntries(Object.entries(p.skills).map(([k, r]) => [k, isRecord(r) ? { ...r, step: 0 } : r]));
      return [id, { ...p, skills }];
    }),
  );
  return { ...state, progress };
}

/** v2 → v3 (M20, нагороди): у прогресі з'являється `celebrated` (світи, чию «Świat ukończony» відсвяткували). Світи, що вже пройдені повністю, вважаємо відсвяткованими — інакше дитина,
 *  яка оновила застосунок, побачила б «готову» скриню в давно пройденому світі й повторне свято. Саме поле додає нормалізація. */
export function migrateV2(state: unknown): unknown {
  if (!isRecord(state) || !isRecord(state.progress)) return state;
  const progress = Object.fromEntries(
    Object.entries(state.progress).map(([id, p]) => {
      if (!isRecord(p) || !isRecord(p.levels)) return [id, p];
      const celebrated = WORLD_KEYS.filter((w) => isWorldComplete({ levels: p.levels as Record<string, unknown>, manualUnlocks: [] }, w));
      return [id, { ...p, celebrated }];
    }),
  );
  return { ...state, progress };
}

export const MIGRATIONS: Readonly<Record<number, Migration>> = { 1: migrateV1, 2: migrateV2 };

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
