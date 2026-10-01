// Розблокування й стан вузлів стежки (BRIEF §5, §6.4–6.5). Чисті функції над мінімальним «знімком» прогресу, тому
// не залежать від store: ProfileProgress із store/types.ts підходить структурно.
import { findLevel } from './levels';
import type { LevelId, WorldId } from './types';
import { WORLD_KEYS, isWorldId, levelId, mainLevelIds, parseLevelId, starLevelIds, worldById } from './worlds';

/** Усе, що потрібно знати про прогрес для розблокування. */
export interface ProgressSnapshot {
  /** Пройдені рівні (ключ — id рівня). */
  readonly levels: Readonly<Record<string, unknown>>;
  /** Світи, відкриті дорослим вручну («Odblokuj świat ręcznie»). */
  readonly manualUnlocks: readonly string[];
}

/** locked — замок; next — світиться (єдиний наступний основний вузол); done — пройдено (можна переграти);
 *  star — відкритий ★-вузол; review — пройдений вузол «Do powtórki»; hidden — ★-вузол, прихований налаштуванням. */
export type NodeState = 'locked' | 'next' | 'done' | 'star' | 'review' | 'hidden';

export interface NodeContext {
  /** «Zadania dodatkowe ★»: показувати бічні гілки. */
  extraTasks: boolean;
  /** Рівні, що чекають повторення (черга M12). */
  reviewLevels?: ReadonlySet<LevelId>;
}

export function isLevelDone(progress: ProgressSnapshot, id: LevelId): boolean {
  return Object.hasOwn(progress.levels, id);
}

/** Усі основні рівні світу пройдено; ★-гілка не обов'язкова. Хаб «завершеним» не буває. */
export function isWorldComplete(progress: ProgressSnapshot, world: WorldId): boolean {
  if (world === 'hub') return false;
  return mainLevelIds(world).every((id) => isLevelDone(progress, id));
}

/** W1 відкритий завжди; хаб — після W1; кожен наступний світ — після попереднього. Дорослий може відкрити будь-який світ вручну. */
export function isWorldUnlocked(progress: ProgressSnapshot, world: WorldId): boolean {
  if (progress.manualUnlocks.includes(world)) return true;
  if (world === 'w1') return true;
  if (world === 'hub') return isWorldComplete(progress, 'w1');
  const previous = WORLD_KEYS[WORLD_KEYS.indexOf(world) - 1];
  return previous !== undefined && isWorldComplete(progress, previous);
}

/** Перший непройдений основний рівень відкритого світу — саме він «світиться» на стежці. */
export function nextLevelId(progress: ProgressSnapshot, world: WorldId): LevelId | null {
  if (world === 'hub' || !isWorldUnlocked(progress, world)) return null;
  return mainLevelIds(world).find((id) => !isLevelDone(progress, id)) ?? null;
}

/** Світ, біля якого стоїть Kubik: перший відкритий світ із непройденими основними рівнями; коли пройдено всі — W7. */
export function currentWorldId(progress: ProgressSnapshot): WorldId {
  return WORLD_KEYS.find((w) => isWorldUnlocked(progress, w) && !isWorldComplete(progress, w)) ?? 'w7';
}

export function nodeState(progress: ProgressSnapshot, id: LevelId, ctx: NodeContext): NodeState {
  const parsed = parseLevelId(id);
  if (!parsed || !findLevel(id)) throw new Error(`Unknown level: ${id}`);
  const done = isLevelDone(progress, id);

  if (parsed.kind === 'main') {
    if (!isWorldUnlocked(progress, parsed.world)) return 'locked';
    if (done) return ctx.reviewLevels?.has(id) ? 'review' : 'done';
    return nextLevelId(progress, parsed.world) === id ? 'next' : 'locked';
  }

  // ★-гілка: лише коли увімкнено, світ відкрито, пройдено вузол розгалуження й попередній ★-вузол
  if (!ctx.extraTasks) return 'hidden';
  if (done) return 'done';
  const world = worldById(parsed.world);
  if (!isWorldUnlocked(progress, parsed.world) || world.starBranchAfter === null) return 'locked';
  if (!isLevelDone(progress, levelId(parsed.world, world.starBranchAfter))) return 'locked';
  if (parsed.index > 1 && !isLevelDone(progress, levelId(parsed.world, parsed.index - 1, 'star'))) return 'locked';
  return 'star';
}

/** Дитина може натиснути вузол: той, що світиться, відкритий ★, пройдений (переграти) і «Do powtórki». Заблокований лише хитається. */
export function isNodePlayable(state: NodeState): boolean {
  return state === 'next' || state === 'done' || state === 'star' || state === 'review';
}

/** Дозволений рівень для адреси /play/:levelId чи /mission/:levelId; рядок із URL недовірений. */
export function canPlay(progress: ProgressSnapshot, rawId: string, ctx: NodeContext): boolean {
  if (!parseLevelId(rawId) || !findLevel(rawId)) return false;
  return isNodePlayable(nodeState(progress, rawId as LevelId, ctx));
}

/** Скільки основних рівнів світу пройдено (для лінійки прогресу світу). */
export function worldProgressCount(progress: ProgressSnapshot, world: WorldId): { done: number; total: number } {
  if (!isWorldId(world) || world === 'hub') return { done: 0, total: 0 };
  const ids = mainLevelIds(world);
  return { done: ids.filter((id) => isLevelDone(progress, id)).length, total: ids.length };
}

/** ★-рівні світу, пройдені дитиною (для підрахунку наліпок: ★ теж дає наліпку). */
export function starsDone(progress: ProgressSnapshot, world: Exclude<WorldId, 'hub'>): number {
  return starLevelIds(world).filter((id) => isLevelDone(progress, id)).length;
}
