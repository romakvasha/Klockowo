// «Ile razem?» (BRIEF §7 гра 9, PEDAGOGY §2 п.9): два кошики над «3 + 2 = ?»; «Wsyp!» зсипає їх в один, далі вибір із 3 плиток.
// Складність: межі суми; кришка на першому кошику (лічба «від числа»); більший доданок першим чи другим; подвоєння; лише символи. Генератор детермінований.
import { missionObject } from '../../curriculum/flow';
import type { AnswerStyle, SumTask, TaskSpec } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

/** Сума: від 1 + 1 до 10 + 10 (W3 — до 10, W4 — до 20 без переходу через десяток). */
export const SUM_MIN = 2;
export const SUM_MAX = 20;

export interface SumInstance extends TaskBase {
  game: 'ileRazem';
  object: ObjectId;
  /** Перший і другий доданки (кошики зліва направо). */
  a: number;
  b: number;
  lid: boolean;
  symbols: boolean;
  answers: AnswerStyle;
  /** Три значення плиток за зростанням; серед них сума. */
  options: readonly number[];
}

export const sumAnswer = (instance: Pick<SumInstance, 'a' | 'b'>): number => instance.a + instance.b;

/** Плитки: сума, сусіднє число (типова помилка лічби — на 1 менше чи більше), «лише більший доданок» (дитина не додала другий) або ±2. Усе в [1, стеля], за зростанням. */
export function pickSumOptions(a: number, b: number, ceiling: number, rng: Rng): number[] {
  const answer = a + b;
  const ok = (n: number) => n >= 1 && n <= ceiling && n !== answer;
  const picked: number[] = [];
  const add = (n: number) => {
    if (picked.length < 2 && ok(n) && !picked.includes(n)) picked.push(n);
  };
  for (const n of rng.shuffle([answer - 1, answer + 1])) add(n);
  add(Math.max(a, b));
  for (const n of rng.shuffle([answer - 2, answer + 2, answer - 3, answer + 3])) add(n);
  for (let n = 1; n <= ceiling; n++) add(n);
  return [...picked, answer].sort((x, y) => x - y);
}

/** Розклад суми на доданки за правилами завдання: подвоєння — рівні; інакше `order` каже, який більший. */
export function splitSum(sum: number, order: SumTask['order'], doubles: boolean, rng: Rng): [number, number] {
  if (doubles) return [sum / 2, sum / 2];
  const big = Math.ceil(sum / 2);
  const small = Math.floor(sum / 2);
  const aMin = order === 'bigFirst' ? big : 1;
  const aMax = order === 'smallFirst' ? small : sum - 1;
  const a = rng.int(Math.max(1, aMin), Math.max(Math.max(1, aMin), aMax));
  return [a, sum - a];
}

/** Найменша сума без переходу: 11 + 1. */
export const NO_BRIDGE_MIN_SUM = 12;

/** «-надцять» плюс одиниці (13 + 4): перший доданок ≥ 11, другий — решта до суми (≥ 1); сума ≤ 20, тож десяток не переходиться. */
export function splitNoBridge(sum: number, rng: Rng): [number, number] {
  const a = rng.int(11, Math.max(11, sum - 1));
  return [a, sum - a];
}

export function generateSum(spec: SumTask, ctx: GenContext): SumInstance {
  const { rng } = ctx;
  const lo = Math.max(spec.noBridge ? NO_BRIDGE_MIN_SUM : SUM_MIN, spec.sum[0]);
  const hi = Math.max(lo, Math.min(SUM_MAX, spec.sum[1]));
  const last = ctx.previous[ctx.previous.length - 1];
  // подвоєння — парні суми (3 + 3); найменша — 2 = 1 + 1
  const pickSum = (): number => {
    const n = rng.int(lo, hi);
    return spec.doubles && n % 2 === 1 ? (n + 1 <= Math.max(hi, SUM_MIN) ? n + 1 : n - 1) : n;
  };
  let sum = Math.max(SUM_MIN, pickSum());
  for (let attempt = 0; attempt < 8 && sum === last; attempt++) sum = Math.max(SUM_MIN, pickSum());
  const [a, b] = spec.noBridge ? splitNoBridge(sum, rng) : splitSum(sum, spec.order, spec.doubles, rng);
  return {
    game: 'ileRazem',
    skill: spec.skill,
    review: spec.review === true,
    object: missionObject(ctx.level),
    a,
    b,
    lid: spec.lid,
    symbols: spec.symbols,
    answers: spec.answers,
    options: pickSumOptions(a, b, Math.max(hi, 3), rng),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): SumInstance {
  if (spec.game !== 'ileRazem') throw new Error(`ileRazem cannot generate ${spec.game}`);
  return generateSum(spec, ctx);
}

/** Правильно — коли вибрано суму; на 1 поряд — «Prawie!». */
export function checkSum(instance: Pick<SumInstance, 'a' | 'b'>, value: number): Verdict {
  const answer = sumAnswer(instance);
  if (value === answer) return { ok: true };
  return { ok: false, almost: Math.abs(value - answer) === 1 };
}
