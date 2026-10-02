// «Nakarm zwierzaka» (BRIEF §7 гра 5, PEDAGOGY §2 п.5): тваринка показує число N; дитина кладе стільки їжі на тарілку й торкається «Gotowe».
// Їжа — предмети W2 (jabłko, gruszka, truskawka, marchewka) у будь-якому світі; тваринка — одна з восьми.
import type { FeedTask, TaskSpec } from '../../curriculum/types';
import { ANIMAL_IDS, WORLD_OBJECT_IDS, type AnimalId, type ObjectId } from '../../speech/nouns';
import type { GenContext, TaskBase, Verdict } from '../engine/types';
import { pickCount } from '../policzIDotknij/generate';
import { supplyCount } from './layout';

/** Їжа для тваринок: фрукти й овочі W2 (намальовані в дизайні). */
export const FOOD_IDS: readonly ObjectId[] = WORLD_OBJECT_IDS.w2;

export interface FeedInstance extends TaskBase {
  game: 'nakarmZwierzaka';
  animal: AnimalId;
  food: ObjectId;
  /** Скільки їжі треба дати. */
  n: number;
  /** Слоти рамки-десятки на тарілці видно одразу (інакше — лише як 2-га підказка). */
  slots: boolean;
  /** Скільки предметів у запасі (у режимі boxes запас необмежений — 0). */
  supply: number;
  /** W5: замість розсипаного запасу — стос коробок по 10 і купка їжі (дотик = +10 чи +1), див. layout.boxSourcesLayout. */
  boxes: boolean;
  seed: number;
}

export function generateFeed(spec: FeedTask, ctx: GenContext): FeedInstance {
  const n = pickCount(spec.count, ctx.previous, ctx.rng);
  const boxes = spec.boxes === true;
  return {
    game: 'nakarmZwierzaka',
    skill: spec.skill,
    review: spec.review === true,
    animal: ctx.rng.pick(ANIMAL_IDS),
    food: ctx.rng.pick(FOOD_IDS),
    n,
    slots: boxes ? false : spec.slots,
    supply: boxes ? 0 : supplyCount(n),
    boxes,
    seed: ctx.rng.int(0, 2 ** 31 - 1),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): FeedInstance {
  if (spec.game !== 'nakarmZwierzaka') throw new Error(`nakarmZwierzaka cannot generate ${spec.game}`);
  return generateFeed(spec, ctx);
}

/** Правильно — на тарілці рівно N. Різниця в 1 — «Prawie!» (як і в лічбі). */
export function checkFeed(instance: Pick<FeedInstance, 'n'>, value: number): Verdict {
  if (value === instance.n) return { ok: true };
  return { ok: false, almost: Math.abs(value - instance.n) === 1 };
}
