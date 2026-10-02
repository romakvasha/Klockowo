// «Historyjki» (BRIEF §7 гра 14, PEDAGOGY §2 п.14): історія на 3 кадри — було `a`, прийшло ще `b` (join) або два набори на картинці (combine); «Ile …?» → 3 плитки.
// Складність: сума 2–10 → 11–20; тип задачі. Генератор детермінований: лише TaskSpec і потік rng завдання.
import type { AnswerStyle, StoryKind, StoryTask, TaskSpec } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import { STORY_OBJECTS } from '../../speech/stories';
import type { GenContext, TaskBase, Verdict } from '../engine/types';
import { pickBigPair } from '../bigAdd';
import { NO_BRIDGE_MIN_SUM, pickSumOptions, splitNoBridge } from '../ileRazem/generate';
import { pickRocketOptions } from '../skokiZabki/generate';

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

/** Двоцифрова історія (сума понад 20, W7): кадри показують стовпчики й кубики, лічба — «від числа» зупинками. */
export const isBigStory = (instance: Pick<StoryInstance, 'a' | 'b'>): boolean => instance.a + instance.b > 20;

/** Двоцифрова історія: пара за видом додавання (30 + 20, 34 + 10, 42 + 5, 38 + 5), сума в межах `sum`; плитки — «не ті десятки» і «не ті одиниці». */
function generateBig(spec: StoryTask & { addend: NonNullable<StoryTask['addend']> }, ctx: GenContext): StoryInstance {
  const { rng } = ctx;
  const last = ctx.previous[ctx.previous.length - 1];
  const inRange = (a: number, b: number) => a + b >= spec.sum[0] && a + b <= spec.sum[1] && a + b !== last;
  let [a, b] = pickBigPair(spec.addend, rng);
  for (let attempt = 0; attempt < 40 && !inRange(a, b); attempt++) [a, b] = pickBigPair(spec.addend, rng);
  const kind = spec.kind === 'mixed' ? (rng.next() < 0.5 ? 'join' : 'combine') : spec.kind;
  const object = rng.pick(STORY_OBJECTS);
  const other = kind === 'combine' ? rng.pick(STORY_OBJECTS.filter((o) => o !== object)) : object;
  return {
    game: 'historyjki', skill: spec.skill, review: spec.review === true, kind, object, other, a, b, answers: spec.answers,
    options: pickRocketOptions(a + b, spec.addend, rng),
  };
}

export function generateStory(spec: StoryTask, ctx: GenContext): StoryInstance {
  if (spec.addend) return generateBig({ ...spec, addend: spec.addend }, ctx);
  const { rng } = ctx;
  const lo = Math.max(spec.noBridge ? NO_BRIDGE_MIN_SUM : STORY_SUM_MIN, spec.sum[0]);
  const hi = Math.max(lo, Math.min(STORY_SUM_MAX, spec.sum[1]));
  const last = ctx.previous[ctx.previous.length - 1];
  let sum = rng.int(lo, hi);
  for (let attempt = 0; attempt < 8 && sum === last; attempt++) sum = rng.int(lo, hi);
  const [a] = spec.noBridge ? splitNoBridge(sum, rng) : [rng.int(1, sum - 1)];
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
