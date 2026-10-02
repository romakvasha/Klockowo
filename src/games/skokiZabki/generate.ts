// «Skoki żabki» (BRIEF §7 гра 10, PEDAGOGY §2 п.10): жабка на листку `start` стрибає `jumps` разів по числовій прямій; вибір із 3 плиток, де вона приземлиться.
// Складність: діапазон 0–10 → 0–20; цифри на всіх листках → лише на віхах; стрибки від дотику чи «в думці». Генератор детермінований.
import type { AnswerStyle, JumpTask, TaskSpec } from '../../curriculum/types';
import { pickBigPair } from '../bigAdd';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

export interface JumpInstance extends TaskBase {
  game: 'skokiZabki';
  /** frog — жабка на листках 0–10/0–20; rocket — ракета на прямій 0–100 (W7). */
  vehicle: 'frog' | 'rocket';
  max: 10 | 20 | 100;
  start: number;
  jumps: number;
  pads: 'numbered' | 'landmarks';
  tapJumps: boolean;
  /** Ракета: вид додавання (10 + 20, 34 + 10, 42 + 5, 38 + 5); для жабки null. */
  addend: 'tens' | 'ten' | 'ones' | 'bridge' | null;
  answers: AnswerStyle;
  /** Три значення плиток за зростанням; серед них місце приземлення. */
  options: readonly number[];
}

/** Де приземлиться жабка. */
export const landing = (instance: Pick<JumpInstance, 'start' | 'jumps'>): number => instance.start + instance.jumps;

/** Плитки: приземлення; на 1 менше (класична помилка — стартовий листок порахували першим стрибком); ще одне сусіднє число. Усе в [0, max], за зростанням. */
export function pickJumpOptions(start: number, jumps: number, max: number, rng: Rng): number[] {
  const answer = start + jumps;
  const ok = (n: number) => n >= 0 && n <= max && n !== answer;
  const picked: number[] = [];
  const add = (n: number) => {
    if (picked.length < 2 && ok(n) && !picked.includes(n)) picked.push(n);
  };
  add(answer - 1);
  for (const n of rng.shuffle([answer + 1, answer - 2])) add(n);
  for (const n of rng.shuffle([answer + 2, answer - 3, answer + 3])) add(n);
  for (let n = 0; n <= max; n++) add(n);
  return [...picked, answer].sort((a, b) => a - b);
}

/** Плитки ракети: відповідь, «не ті десятки» (±10) і «не ті одиниці» (±1); для 30 + 20 — ±10 і ±20. Усе в [0, 100], за зростанням. */
export function pickRocketOptions(answer: number, addend: 'tens' | 'ten' | 'ones' | 'bridge', rng: Rng): number[] {
  const steps = addend === 'tens' ? [10, 20] : addend === 'ten' ? [10, 1] : [1, 10];
  const picked: number[] = [];
  const ok = (n: number) => n >= 0 && n <= 100 && n !== answer && !picked.includes(n);
  for (const step of steps) {
    const pair = rng.shuffle([answer - step, answer + step]);
    const first = pair.find(ok);
    if (first !== undefined && picked.length < 2) picked.push(first);
  }
  for (let d = 1; picked.length < 2 && d <= 100; d++) for (const n of [answer - d, answer + d]) if (picked.length < 2 && ok(n)) picked.push(n);
  return [...picked, answer].sort((a, b) => a - b);
}

function generateRocket(spec: JumpTask, ctx: GenContext): JumpInstance {
  const { rng } = ctx;
  const last = ctx.previous[ctx.previous.length - 1];
  const addend = spec.addend ?? 'ones';
  let [start, jumps] = pickBigPair(addend, rng, spec.start);
  for (let attempt = 0; attempt < 8 && start + jumps === last; attempt++) [start, jumps] = pickBigPair(addend, rng, spec.start);
  return {
    game: 'skokiZabki',
    skill: spec.skill,
    review: spec.review === true,
    vehicle: 'rocket',
    max: 100,
    start,
    jumps,
    pads: 'numbered',
    tapJumps: spec.tapJumps,
    addend,
    answers: spec.answers,
    options: pickRocketOptions(start + jumps, addend, rng),
  };
}

export function generateJump(spec: JumpTask, ctx: GenContext): JumpInstance {
  if (spec.vehicle === 'rocket') return generateRocket(spec, ctx);
  const { rng } = ctx;
  const last = ctx.previous[ctx.previous.length - 1];
  const jLo = Math.max(1, spec.jumps[0]);
  const jHi = Math.max(jLo, Math.min(spec.jumps[1], spec.max));
  const draw = (): { start: number; jumps: number } => {
    const jumps = rng.int(jLo, jHi);
    // старт — у межах діапазону, але так, щоб жабка не вистрибнула за край (стрибків менше — стартів більше)
    const sLo = Math.max(0, Math.min(spec.start[0], spec.max - jumps));
    const sHi = Math.max(sLo, Math.min(spec.start[1], spec.max - jumps));
    return { start: rng.int(sLo, sHi), jumps };
  };
  let pick = draw();
  for (let attempt = 0; attempt < 8 && pick.start + pick.jumps === last; attempt++) pick = draw();
  return {
    game: 'skokiZabki',
    skill: spec.skill,
    review: spec.review === true,
    vehicle: 'frog',
    max: spec.max,
    start: pick.start,
    jumps: pick.jumps,
    pads: spec.pads,
    tapJumps: spec.tapJumps,
    addend: null,
    answers: spec.answers,
    options: pickJumpOptions(pick.start, pick.jumps, spec.max, rng),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): JumpInstance {
  if (spec.game !== 'skokiZabki') throw new Error(`skokiZabki cannot generate ${spec.game}`);
  return generateJump(spec, ctx);
}

/** Правильно — коли вибрано листок приземлення; на 1 поряд — «Prawie!». */
export function checkJump(instance: Pick<JumpInstance, 'start' | 'jumps'>, value: number): Verdict {
  const answer = landing(instance);
  if (value === answer) return { ok: true };
  return { ok: false, almost: Math.abs(value - answer) === 1 };
}
