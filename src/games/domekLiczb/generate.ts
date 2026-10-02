// «Domek liczb» (BRIEF §7 гра 8, PEDAGOGY §2 п.8): на даху ціле, одне з двох віконець порожнє — «Osiem to trzy i ile?»; вибір із 3 плиток.
// Ціле 5 → 10 → 20; підказка в W3 — предмети під будиночком. Генератор детермінований: лише TaskSpec і потік rng завдання.
import { missionObject } from '../../curriculum/flow';
import type { AnswerStyle, HouseTask, TaskSpec } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

/** Найменше ціле, яке розкладається на дві непорожні частини з вибором із 3 плиток (3 = 1 + 2), і найбільше (двоповерхова рамка-десятка). */
export const WHOLE_MIN = 3;
export const WHOLE_MAX = 20;

export interface HouseInstance extends TaskBase {
  game: 'domekLiczb';
  whole: number;
  /** Відома частина (число у віконці). */
  known: number;
  /** Яке віконце порожнє. */
  missing: 'left' | 'right';
  show: 'pictures' | 'digits';
  answers: AnswerStyle;
  /** Предмет для підказки й «картинок». */
  object: ObjectId;
  /** Три значення плиток за зростанням; серед них відповідь. */
  options: readonly number[];
}

/** Відповідь: друга частина цілого. */
export const houseAnswer = (instance: Pick<HouseInstance, 'whole' | 'known'>): number => instance.whole - instance.known;

/** Плитки: правильна відповідь, «відома частина» (типова плутанина — назвати число, що вже є у віконці), сусіднє число; усе в [1, стеля], за зростанням. */
export function pickHouseOptions(answer: number, known: number, whole: number, rng: Rng): number[] {
  const ceiling = Math.max(3, whole - 1);
  const ok = (n: number) => n >= 1 && n <= ceiling && n !== answer;
  const picked: number[] = [];
  const add = (n: number) => {
    if (picked.length < 2 && ok(n) && !picked.includes(n)) picked.push(n);
  };
  add(known);
  for (const n of rng.shuffle([answer - 1, answer + 1])) add(n);
  for (const n of rng.shuffle([answer - 2, answer + 2, answer - 3, answer + 3])) add(n);
  for (let n = 1; n <= ceiling; n++) add(n);
  return [...picked, answer].sort((a, b) => a - b);
}

export function generateHouse(spec: HouseTask, ctx: GenContext): HouseInstance {
  const { rng } = ctx;
  const lo = Math.max(WHOLE_MIN, spec.whole[0]);
  const hi = Math.max(lo, Math.min(WHOLE_MAX, spec.whole[1]));
  const last = ctx.previous[ctx.previous.length - 1];
  // не повторюємо ту саму відповідь двічі поспіль, якщо є з чого вибрати
  let whole = rng.int(lo, hi);
  let known = rng.int(1, whole - 1);
  for (let attempt = 0; attempt < 8 && whole - known === last; attempt++) {
    whole = rng.int(lo, hi);
    known = rng.int(1, whole - 1);
  }
  const answer = whole - known;
  return {
    game: 'domekLiczb',
    skill: spec.skill,
    review: spec.review === true,
    whole,
    known,
    missing: spec.missing === 'any' ? (rng.next() < 0.5 ? 'left' : 'right') : spec.missing,
    show: spec.show,
    answers: spec.answers,
    object: missionObject(ctx.level),
    options: pickHouseOptions(answer, known, whole, rng),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): HouseInstance {
  if (spec.game !== 'domekLiczb') throw new Error(`domekLiczb cannot generate ${spec.game}`);
  return generateHouse(spec, ctx);
}

/** Правильно — коли вибрано другу частину; на 1 поряд — «Prawie!». */
export function checkHouse(instance: Pick<HouseInstance, 'whole' | 'known'>, value: number): Verdict {
  const answer = houseAnswer(instance);
  if (value === answer) return { ok: true };
  return { ok: false, almost: Math.abs(value - answer) === 1 };
}
