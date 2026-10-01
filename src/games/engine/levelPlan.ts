// План рівня (BRIEF §6, §7): із рівня й зерна забігу детерміновано виходять 6 завдань. Після «Mapa» зберігаються лише зерно й результати
// (LevelRun), а завдання відновлюються тут же — рівень продовжується з того самого місця. Чиста логіка, без React і сховища.
import type { GameId, Level, LevelId } from '../../curriculum/types';
import type { LevelSummary } from '../../store/progress';
import type { LevelRun, TaskOutcome } from '../../store/types';
import { createRng, hashSeed, type Rng } from './rng';
import type { GameDef, TaskBase } from './types';

/** Слотів-кісточок у рівні (BRIEF §7). */
export const TASKS_PER_LEVEL = 6;

/** Завдання, чию гру ще не реалізовано (до M9–M19): рушій показує заглушку й зараховує його одним дотиком. */
export interface PlaceholderTask extends TaskBase {
  placeholder: true;
}

export interface PlannedTask {
  /** Номер завдання в рівні, 0…5. */
  index: number;
  instance: TaskBase;
  /** Гра-модуль; null — гру ще не реалізовано. */
  def: GameDef | null;
}

export type GameResolver = (game: GameId) => GameDef | undefined;

/** Потік випадковості завдання: залежить лише від рівня, зерна й номера — не від того, що відбувалося раніше. */
export function taskRng(levelId: LevelId, seed: number, index: number): Rng {
  return createRng(hashSeed(levelId, seed, index));
}

/** Завдання рівня. Правильні відповіді попередніх завдань передаються генератору, щоб одне й те саме число не йшло підряд. */
export function planLevel(level: Level, seed: number, resolve: GameResolver): PlannedTask[] {
  const planned: PlannedTask[] = [];
  const previous: number[] = [];
  level.tasks.slice(0, TASKS_PER_LEVEL).forEach((spec, index) => {
    const def = resolve(spec.game) ?? null;
    if (!def) {
      const instance: PlaceholderTask = { game: spec.game, skill: spec.skill, review: spec.review === true, placeholder: true };
      planned.push({ index, instance, def: null });
      return;
    }
    const instance = def.generate(spec, { level, world: level.world, index, rng: taskRng(level.id, seed, index), previous: [...previous] });
    previous.push(def.answer(instance));
    planned.push({ index, instance, def });
  });
  return planned;
}

/** Підсумок рівня для прогресу: скільки завдань з першого разу й чи була допомога Kubika (значок «Nie poddajesz się!»). */
export function summarize(results: readonly TaskOutcome[]): LevelSummary {
  return { firstTry: results.filter((r) => r === 'first').length, togetherUsed: results.includes('together') };
}

/** З якого завдання продовжувати: перше, що ще не має результату. */
export function resumeIndex(run: Pick<LevelRun, 'results'> | undefined): number {
  return Math.min(run?.results.length ?? 0, TASKS_PER_LEVEL);
}

/** Рівень закінчено: усі 6 завдань мають результат. */
export function isLevelFinished(results: readonly TaskOutcome[], total: number = TASKS_PER_LEVEL): boolean {
  return results.length >= total;
}
