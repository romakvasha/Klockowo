// «Kto ma więcej?» (BRIEF §7 гра 6, PEDAGOGY §2 п.6): дві тваринки з купками; дитина торкається більшої (чи меншої) купки або «Tyle samo».
// Генератор детермінований: тваринки, числа, сторона й предмет залежать лише від TaskSpec і потоку rng завдання.
import type { CompareShow, CompareTask, Range, TaskSpec } from '../../curriculum/types';
import { ANIMAL_IDS, WORLD_OBJECT_IDS, type AnimalId, type ObjectId } from '../../speech/nouns';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

/** Предмети купок — фрукти й овочі W2 (намальовані в дизайні), як їжа в «Nakarm zwierzaka». */
export const PILE_OBJECTS: readonly ObjectId[] = WORLD_OBJECT_IDS.w2;

/** Відповіді (значення, що їх сцена передає рушію): ліва купка, права купка, «Tyle samo». */
export const LEFT = 1;
export const RIGHT = 2;
export const SAME = 3;
export type CompareChoice = typeof LEFT | typeof RIGHT | typeof SAME;

export interface CompareInstance extends TaskBase {
  game: 'ktoMaWiecej';
  /** Тваринки ліворуч і праворуч (різні). */
  animals: readonly [AnimalId, AnimalId];
  item: ObjectId;
  /** Скільки предметів у лівій і правій купці. */
  counts: readonly [number, number];
  /** more — «Kto ma więcej…?»; less — «Kto ma mniej…?». */
  ask: 'more' | 'less';
  show: CompareShow;
  /** «Tyle samo» можливе в цьому завданні: кнопка в лотку й «A może tyle samo?» в інструкції. */
  equalPossible: boolean;
  /** Підступ (sizeTrick): з якого боку предмети більші; null — усі однакові. */
  bigSide: 0 | 1 | null;
  /** Правильна відповідь: LEFT, RIGHT чи SAME. */
  correct: CompareChoice;
  /** Зерно розкладки предметів у купках. */
  seed: number;
}

/** Правильна відповідь за кількостями: рівні → SAME; «więcej» → більша, «mniej» → менша купка. */
export function correctChoice(counts: readonly [number, number], ask: 'more' | 'less'): CompareChoice {
  const [a, b] = counts;
  if (a === b) return SAME;
  const leftIsMore = a > b;
  return (ask === 'more') === leftIsMore ? LEFT : RIGHT;
}

/** Дві купки: різниця `d` (≥ 1) у межах `diff`, або однакові. Беремо рівномірно з усіх допустимих пар, а не спершу різницю: інакше при вузькому
 *  діапазоні («1–6, різниця 3–5») майже щоразу випадала б найбільша пара «1 і 6». Різниця, більша за діапазон, стискається. Повертає [ліва, права]. */
export function pickCounts(count: Range, diff: Range, equal: number, rng: Rng): [number, number] {
  const [lo, hi] = count;
  if (rng.next() < equal) {
    // порожні купки (0 = 0) нічого не показують — рівні купки беремо з предметів, коли це можливо
    const n = rng.int(Math.min(Math.max(lo, 1), hi), hi);
    return [n, n];
  }
  const maxDiff = Math.max(1, hi - lo);
  const d0 = Math.min(maxDiff, Math.max(1, diff[0]));
  const d1 = Math.min(maxDiff, Math.max(d0, diff[1]));
  const pairs: [number, number][] = [];
  for (let big = lo; big <= hi; big++) {
    for (let small = lo; small < big; small++) {
      if (big - small >= d0 && big - small <= d1) pairs.push([big, small]);
    }
  }
  const [big, small] = rng.pick(pairs.length > 0 ? pairs : [[lo + 1, lo] as [number, number]]);
  return rng.next() < 0.5 ? [big, small] : [small, big];
}

export function generateCompare(spec: CompareTask, ctx: GenContext): CompareInstance {
  const { rng } = ctx;
  const [a, b] = rng.shuffle(ANIMAL_IDS);
  const equal = spec.equal ?? 0;
  const counts = pickCounts(spec.count, spec.diff, equal, rng);
  const ask = spec.ask === 'mixed' ? (rng.next() < 0.5 ? 'more' : 'less') : spec.ask;
  // підступ: більші предмети на МЕНШІЙ купці (рівні купки — випадковий бік)
  let bigSide: 0 | 1 | null = null;
  if (spec.show === 'sizeTrick') bigSide = counts[0] === counts[1] ? (rng.next() < 0.5 ? 0 : 1) : counts[0] < counts[1] ? 0 : 1;
  return {
    game: 'ktoMaWiecej',
    skill: spec.skill,
    review: spec.review === true,
    animals: [a as AnimalId, b as AnimalId],
    item: rng.pick(PILE_OBJECTS),
    counts,
    ask,
    show: spec.show,
    equalPossible: equal > 0,
    bigSide,
    correct: correctChoice(counts, ask),
    seed: rng.int(0, 2 ** 31 - 1),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): CompareInstance {
  if (spec.game !== 'ktoMaWiecej') throw new Error(`ktoMaWiecej cannot generate ${spec.game}`);
  return generateCompare(spec, ctx);
}

/** Правильно — вибрано потрібний бік (чи «Tyle samo»). «Prawie!» тут нема: різниці «на 1» між відповідями не існує. */
export function checkCompare(instance: Pick<CompareInstance, 'correct'>, value: number): Verdict {
  return value === instance.correct ? { ok: true } : { ok: false, almost: false };
}

/** Тваринка-переможниця за запитанням (більша чи менша купка): 0 — ліва, 1 — права; null — купки рівні. */
export function winnerSide(instance: Pick<CompareInstance, 'correct'>): 0 | 1 | null {
  return instance.correct === LEFT ? 0 : instance.correct === RIGHT ? 1 : null;
}

/** Скільки пар утворюється й скільки зайвих лишається на більшій купці (`richer`: яка купка більша; null — рівні). */
export function pairing(counts: readonly [number, number]): { pairs: number; extra: number; richer: 0 | 1 | null } {
  const [a, b] = counts;
  return { pairs: Math.min(a, b), extra: Math.abs(a - b), richer: a === b ? null : a > b ? 0 : 1 };
}
