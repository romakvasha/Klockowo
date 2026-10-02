// «Historyjki» (BRIEF §7 гра 14, PEDAGOGY §2 п.14): історія на 3 кадри — було `a`, прийшло ще `b` (join) або два набори на картинці (combine); «Ile …?» → 3 плитки.
// Складність: сума 2–10 → 11–20; тип задачі. Генератор детермінований: лише TaskSpec і потік rng завдання.
import type { AnswerStyle, StoryKind, StoryTask, TaskSpec } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import { STORY_OBJECTS } from '../../speech/stories';
import type { GenContext, TaskBase, Verdict } from '../engine/types';
import { pickSumOptions } from '../ileRazem/generate';

export const STORY_SUM_MIN = 2;
export const STORY_SUM_MAX = 20;

export interface StoryInstance extends TaskBase {
  game: 'historyjki';
  /** join чи combine (mixed розв'язано генератором). */
  kind: Exclude<StoryKind, 'mixed'>;
  /** Предмет історії; у combine — перший набір. */
  object: ObjectId;
  /** combine: предмет другого набору (відрізняється від першого); у join збігається з `object`. */
  other: ObjectId;
  a: number;
  b: number;
  answers: AnswerStyle;
  /** Три значення плиток за зростанням; серед них сума. */
  options: readonly number[];
}

export const storyAnswer = (instance: Pick<StoryInstance, 'a' | 'b'>): number => instance.a + instance.b;

export function generateStory(spec: StoryTask, ctx: GenContext): StoryInstance {
  const { rng } = ctx;
  const lo = Math.max(STORY_SUM_MIN, spec.sum[0]);
  const hi = Math.max(lo, Math.min(STORY_SUM_MAX, spec.sum[1]));
  const last = ctx.previous[ctx.previous.length - 1];
  let sum = rng.int(lo, hi);
  for (let attempt = 0; attempt < 8 && sum === last; attempt++) sum = rng.int(lo, hi);
  const a = rng.int(1, sum - 1);
  const kind = spec.kind === 'mixed' ? (rng.next() < 0.5 ? 'join' : 'combine') : spec.kind;
  const object = rng.pick(STORY_OBJECTS);
  const other = kind === 'combine' ? rng.pick(STORY_OBJECTS.filter((o) => o !== object)) : object;
  return {
    game: 'historyjki',
    skill: spec.skill,
    review: spec.review === true,
    kind,
    object,
    other,
    a,
    b: sum - a,
    answers: spec.answers,
    options: pickSumOptions(a, sum - a, Math.max(hi, 3), rng),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): StoryInstance {
  if (spec.game !== 'historyjki') throw new Error(`historyjki cannot generate ${spec.game}`);
  return generateStory(spec, ctx);
}

/** Правильно — коли вибрано суму; на 1 поряд — «Prawie!». */
export function checkStory(instance: Pick<StoryInstance, 'a' | 'b'>, value: number): Verdict {
  const answer = storyAnswer(instance);
  if (value === answer) return { ok: true };
  return { ok: false, almost: Math.abs(value - answer) === 1 };
}
