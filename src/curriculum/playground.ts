// «Plac Zabaw» — мішане повторення (BRIEF §6 п.13, PEDAGOGY §1): 6 завдань з рівнів, які дитина вже пройшла, із пріоритетом для навичок, що чекають повторення («Do powtórki»,
// настав день інтервалу), потім — усі опановані. Чиста логіка: рівні й прогрес приходять параметрами; жодного побічного ефекту.
import { createRng } from '../games/engine/rng';
import { LEVELS } from './levels';
import { isDue, type ReviewState } from './review';
import type { LevelId, SkillId, TaskSpec } from './types';

/** Мінімум знань про прогрес. */
export interface PlaygroundProgress {
  readonly levels: Readonly<Record<string, unknown>>;
  readonly skills: Readonly<Partial<Record<SkillId, Pick<ReviewState, 'stage' | 'due' | 'needsReview'>>>>;
}

export interface PlaygroundTask {
  level: LevelId;
  /** Номер завдання в рівні, звідки його взято. */
  index: number;
  spec: TaskSpec;
}

export const PLAYGROUND_COUNT = 6;
/** Скільки завдань на одну навичку — щоб повторення було різним. */
export const PER_SKILL = 2;

/** Пріоритет навички: 0 — «Do powtórki», 1 — час повторення, 2 — вже в розкладі повторень, 3 — решта пройдених. */
export function skillRank(state: Pick<ReviewState, 'stage' | 'due' | 'needsReview'> | undefined, today: string): number {
  if (!state) return 3;
  if (state.needsReview) return 0;
  if (isDue({ stage: state.stage, due: state.due, needsReview: false }, today)) return 1;
  return state.stage > 0 ? 2 : 3;
}

/** Усі завдання пройдених рівнів (без повторень), які ігровий рушій уміє грати. */
export function candidateTasks(progress: PlaygroundProgress, playable: (game: TaskSpec['game']) => boolean): PlaygroundTask[] {
  const list: PlaygroundTask[] = [];
  for (const level of LEVELS) {
    if (level.draft || !Object.hasOwn(progress.levels, level.id)) continue;
    level.tasks.forEach((spec, index) => {
      if (!spec.review && playable(spec.game)) list.push({ level: level.id, index, spec });
    });
  }
  return list;
}

/** Завдання повторення на сьогодні: перемішані за `seed`, відсортовані за пріоритетом навички, не більше `PER_SKILL` на навичку (якщо не вистачає — обмеження знімається), далі перемішані. */
export function playgroundTasks(
  progress: PlaygroundProgress,
  today: string,
  seed: number,
  playable: (game: TaskSpec['game']) => boolean = () => true,
  count: number = PLAYGROUND_COUNT,
): PlaygroundTask[] {
  const rng = createRng(seed);
  const rank = (t: PlaygroundTask) => skillRank(progress.skills[t.spec.skill], today);
  const sorted = rng.shuffle(candidateTasks(progress, playable)).sort((a, b) => rank(a) - rank(b));
  const picked: PlaygroundTask[] = [];
  const perSkill = new Map<SkillId, number>();
  for (const t of sorted) {
    if (picked.length >= count) break;
    const n = perSkill.get(t.spec.skill) ?? 0;
    if (n >= PER_SKILL) continue;
    picked.push(t);
    perSkill.set(t.spec.skill, n + 1);
  }
  for (const t of sorted) {
    if (picked.length >= count) break;
    if (!picked.includes(t)) picked.push(t);
  }
  return rng.shuffle(picked);
}
