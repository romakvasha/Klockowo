// «Policz i dotknij» (BRIEF §7 гра 1, PEDAGOGY §2 п.1): 3–20 предметів на сцені й вибір із 3 плиток-відповідей.
// Генератор детермінований: кількість, відповіді-плитки й варіації вигляду залежать лише від TaskSpec і потоку rng завдання.
import { missionObject } from '../../curriculum/flow';
import type { AnswerStyle, Arrangement, CountTask, TaskSpec } from '../../curriculum/types';
import { worldById } from '../../curriculum/worlds';
import type { ObjectId } from '../../speech/nouns';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase } from '../engine/types';

export interface CountInstance extends TaskBase {
  game: 'policzIDotknij';
  object: ObjectId;
  count: number;
  arrangement: Arrangement;
  look: 'distinct' | 'similar';
  answers: AnswerStyle;
  /** Три значення плиток за зростанням; серед них `count`. */
  options: readonly number[];
  /** Зерно розкладки й дрібних відмінностей предметів. */
  seed: number;
}

/** Число з діапазону завдання; не те саме, що в попереднього завдання рівня, якщо в діапазоні є вибір. */
export function pickCount(range: readonly [number, number], previous: readonly number[], rng: Rng): number {
  const [min, max] = range;
  const last = previous[previous.length - 1];
  if (min === max) return min;
  const pool: number[] = [];
  for (let n = min; n <= max; n++) if (n !== last) pool.push(n);
  return rng.pick(pool);
}

/** Дві хибні відповіді: одна поряд (±1 — типова помилка лічби), друга на два від правильної; у межах [1, ceiling].
 *  Результат разом із `count` — три різні числа за зростанням. */
export function pickOptions(count: number, ceiling: number, rng: Rng): number[] {
  const ok = (n: number) => n >= 1 && n <= ceiling && n !== count;
  const near = [count - 1, count + 1].filter(ok);
  const far = [count - 2, count + 2].filter(ok);
  const picked: number[] = [];
  const add = (n: number | undefined) => {
    if (n !== undefined && ok(n) && !picked.includes(n)) picked.push(n);
  };
  if (near.length) add(rng.pick(near));
  if (far.length) add(rng.pick(far));
  // біля краю діапазону поряд може не вистачити — добираємо найближчі решта
  for (let d = 1; picked.length < 2 && d <= ceiling; d++) {
    for (const n of rng.shuffle([count - d, count + d])) if (picked.length < 2) add(n);
  }
  return [...picked, count].sort((a, b) => a - b);
}

export function generateCount(spec: CountTask, ctx: GenContext): CountInstance {
  const world = worldById(ctx.world);
  const count = pickCount(spec.count, ctx.previous, ctx.rng);
  // плитки не виходять за верхню межу чисел світу (W1 — десять), навіть коли рівень вчить лише малі числа: 3 серед 2, 3, 5 тощо
  const ceiling = Math.max(world.range[1], count);
  return {
    game: 'policzIDotknij',
    skill: spec.skill,
    review: spec.review === true,
    object: missionObject(ctx.level),
    count,
    arrangement: spec.arrangement,
    look: spec.look,
    answers: spec.answers,
    options: pickOptions(count, ceiling, ctx.rng),
    seed: ctx.rng.int(0, 2 ** 31 - 1),
  };
}

/** Заготівля для реєстру: TaskSpec завжди CountTask, коли гра — policzIDotknij. */
export function generateFromSpec(spec: TaskSpec, ctx: GenContext): CountInstance {
  if (spec.game !== 'policzIDotknij') throw new Error(`policzIDotknij cannot generate ${spec.game}`);
  return generateCount(spec, ctx);
}
