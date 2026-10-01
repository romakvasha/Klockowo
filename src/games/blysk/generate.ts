// «Błysk!» (BRIEF §7 гра 2, PEDAGOGY §2 п.2): картка з крапками на мить, потім вибір із 3 плиток; правильна картка повертається з обведеними групами.
// Складність — тривалість показу 2 с → 0,8 с і візерунок: кубик → випадкові → рамка-десятка 6–10.
import { dotLayout, groupSizes, type DotPattern } from '../../components/math/dotPatterns';
import type { AnswerStyle, FlashTask, TaskSpec } from '../../curriculum/types';
import { worldById } from '../../curriculum/worlds';
import { createRng } from '../engine/rng';
import type { GenContext, TaskBase } from '../engine/types';
import { pickCount, pickOptions } from '../policzIDotknij/generate';

export interface FlashInstance extends TaskBase {
  game: 'blysk';
  count: number;
  pattern: DotPattern;
  /** Скільки мс картка видима. */
  exposureMs: number;
  answers: AnswerStyle;
  /** Три значення плиток за зростанням; серед них `count`. */
  options: readonly number[];
  /** Зерно випадкового візерунка. */
  seed: number;
  /** Розміри груп для репліки «{a} i {b} to {n}»: одна чи дві. */
  groups: readonly number[];
}

/** Розкладка крапок картки: однакова для одного завдання завжди (зерно). */
export function flashLayout(instance: Pick<FlashInstance, 'pattern' | 'count' | 'seed'>) {
  return dotLayout(instance.pattern, instance.count, createRng(instance.seed));
}

export function generateFlash(spec: FlashTask, ctx: GenContext): FlashInstance {
  const world = worldById(ctx.world);
  const count = pickCount(spec.count, ctx.previous, ctx.rng);
  const seed = ctx.rng.int(0, 2 ** 31 - 1);
  const base = { pattern: spec.pattern, count, seed };
  return {
    game: 'blysk',
    skill: spec.skill,
    review: spec.review === true,
    count,
    pattern: spec.pattern,
    exposureMs: spec.exposureMs,
    answers: spec.answers,
    options: pickOptions(count, Math.max(world.range[1], count), ctx.rng),
    seed,
    groups: groupSizes(flashLayout(base)),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): FlashInstance {
  if (spec.game !== 'blysk') throw new Error(`blysk cannot generate ${spec.game}`);
  return generateFlash(spec, ctx);
}
