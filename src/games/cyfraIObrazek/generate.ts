// «Cyfra i obrazek» (BRIEF §7 гра 3, PEDAGOGY §2 п.3): 2–4 набори-картинки й стільки ж цифр у лотку; дитина з'єднує кожен набір зі своєю цифрою.
// Генератор детермінований: числа, спосіб показу, предмети й порядок плиток залежать лише від TaskSpec і потоку rng завдання.
import { SET_KINDS, kindAllowed, type SetKind } from '../../components/math/setFaces';
import type { MatchTask, SetStyle, TaskSpec, WorldKey } from '../../curriculum/types';
import { WORLD_OBJECT_IDS, type ObjectId } from '../../speech/nouns';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase } from '../engine/types';
import { MAX_PAIRS } from './match';

export interface MatchSet {
  /** Скільки предметів / крапок / пальців на картці (0 — порожньо). */
  count: number;
  kind: SetKind;
  /** Предмет (для kind 'objects'; для решти лише визначає значок у бульбашці Kubika). */
  object: ObjectId;
  /** Зерно розкладки випадкових крапок. */
  seed: number;
}

export interface MatchInstance extends TaskBase {
  game: 'cyfraIObrazek';
  /** Набори в порядку на сцені. */
  sets: readonly MatchSet[];
  /** Числа на плитках лотка (перемішані): digits[j]. */
  digits: readonly number[];
  /** correct[i] — індекс плитки (у `digits`) для набору i. */
  correct: readonly number[];
}

/** k різних чисел із діапазону; для навички «zero» нуль обов'язково серед них (інакше рівень про нуль міг би його не показати). */
export function pickNumbers(range: readonly [number, number], k: number, mustHaveZero: boolean, rng: Rng): number[] {
  const pool: number[] = [];
  for (let n = range[0]; n <= range[1]; n++) pool.push(n);
  if (pool.length < k) throw new RangeError(`cyfraIObrazek: у діапазоні ${range.join('–')} немає ${k} різних чисел`);
  const shuffled = rng.shuffle(pool);
  if (!mustHaveZero || !pool.includes(0)) return shuffled.slice(0, k);
  return rng.shuffle([0, ...shuffled.filter((n) => n !== 0).slice(0, k - 1)]);
}

/** Спосіб показу кількості: заданий рівнем, а коли він не вміщає число (понад 10) — предмети; 'mixed' — різний на кожній картці, без повторів, поки є вибір. */
export function pickKind(style: SetStyle, count: number, used: readonly SetKind[], rng: Rng): SetKind {
  if (style !== 'mixed') return kindAllowed(style, count) ? style : 'objects';
  const allowed = SET_KINDS.filter((kind) => kindAllowed(kind, count));
  const fresh = allowed.filter((kind) => !used.includes(kind));
  return rng.pick(fresh.length > 0 ? fresh : allowed);
}

/** Перестановка 0…k−1, що не збігається з тотожною: щоб плитки не стояли в тому ж порядку, що й набори. */
export function shuffledOrder(k: number, rng: Rng): number[] {
  const identity = Array.from({ length: k }, (_, i) => i);
  for (let attempt = 0; attempt < 20; attempt++) {
    const order = rng.shuffle(identity);
    if (order.some((v, i) => v !== i)) return order;
  }
  return [...identity.slice(1), identity[0]!];
}

/** Предмети для карток: власні предмети W1–W3, для решти світів — фрукти й овочі W2 (предметів W4–W7 ще нема в дизайні). */
function objectPool(world: WorldKey): readonly ObjectId[] {
  return world === 'w1' || world === 'w2' || world === 'w3' ? WORLD_OBJECT_IDS[world] : WORLD_OBJECT_IDS.w2;
}

export function generateMatch(spec: MatchTask, ctx: GenContext): MatchInstance {
  const k = Math.min(MAX_PAIRS, Math.max(2, spec.pairs));
  const numbers = pickNumbers(spec.numbers, k, spec.skill === 'zero', ctx.rng);
  const objects = ctx.rng.shuffle(objectPool(ctx.world));
  const used: SetKind[] = [];
  const sets = numbers.map((count, i): MatchSet => {
    const kind = pickKind(spec.set, count, used, ctx.rng);
    used.push(kind);
    return { count, kind, object: objects[i % objects.length]!, seed: ctx.rng.int(0, 2 ** 31 - 1) };
  });
  const order = shuffledOrder(k, ctx.rng); // order[j] — який набір відповідає плитці j
  return {
    game: 'cyfraIObrazek',
    skill: spec.skill,
    review: spec.review === true,
    sets,
    digits: order.map((i) => numbers[i]!),
    correct: numbers.map((_, i) => order.indexOf(i)),
  };
}

/** Заготівля для реєстру: TaskSpec завжди MatchTask, коли гра — cyfraIObrazek. */
export function generateFromSpec(spec: TaskSpec, ctx: GenContext): MatchInstance {
  if (spec.game !== 'cyfraIObrazek') throw new Error(`cyfraIObrazek cannot generate ${spec.game}`);
  return generateMatch(spec, ctx);
}
