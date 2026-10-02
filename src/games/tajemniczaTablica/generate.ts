// «Tajemnicza tablica» (BRIEF §7 гра 13, PEDAGOGY §2 п.13): таблиця 100 — мініатюра й лупа-рядок. Режими: find (знайти число), hidden (що під листочком), paint (розфарбувати числа
// з цифрою на кінці), neighbors (на 1 чи на 10 більше/менше). Складність: діапазон 1–30 → 100; листочки-перешкоди. Генератор детермінований.
import type { AnswerStyle, ChartMode, ChartTask, TaskSpec } from '../../curriculum/types';
import { columnOf, rowOf } from '../../components/math/chartLayout';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

export const CHART_MIN = 1;
export const CHART_MAX = 100;

export interface ChartInstance extends TaskBase {
  game: 'tajemniczaTablica';
  mode: ChartMode;
  /** Скільки рядків має таблиця (до верхньої межі діапазону). */
  rows: number;
  /** Найбільше число завдання (клітинки далі — приглушені). */
  max: number;
  /** find, hidden: шукане число. neighbors: число, від якого рахуємо. paint: не використовується (0). */
  target: number;
  /** neighbors: на скільки відрізняється шукане (±1, ±10); в інших режимах 0. */
  delta: number;
  /** paint: цифра на кінці (0–9) і всі числа таблиці з нею. */
  digit: number;
  paintSet: readonly number[];
  /** Клітинки, закриті листочками (у hidden — вони й шукане target; у find — перешкоди, без target). */
  leaves: readonly number[];
  answers: AnswerStyle;
  /** Плитки (hidden, neighbors): три значення за зростанням; для find і paint порожньо. */
  options: readonly number[];
}

/** Яке число є відповіддю: find, hidden — target; neighbors — target + delta; paint — 1 (набір розфарбовано правильно). */
export function chartAnswer(i: Pick<ChartInstance, 'mode' | 'target' | 'delta'>): number {
  if (i.mode === 'paint') return 1;
  return i.mode === 'neighbors' ? i.target + i.delta : i.target;
}

/** Числа таблиці з цифрою `digit` на кінці в межах 1…max: 5 → 5, 15, …; 0 → 10, 20, … */
export function numbersEndingWith(digit: number, max: number): number[] {
  const list: number[] = [];
  for (let n = CHART_MIN; n <= max; n++) if (n % 10 === digit) list.push(n);
  return list;
}

/** Рядків таблиці, щоб вмістити числа до `max`. */
export const rowsFor = (max: number): number => Math.max(1, Math.ceil(Math.min(max, CHART_MAX) / 10));

/** Три плитки для hidden: відповідь, сусід ±1 (збився в одиницях), сусід ±10 (збився в десятках); усе в 1…max, за зростанням. */
export function pickHiddenOptions(answer: number, max: number, rng: Rng): number[] {
  return pickOptions(answer, [1, 10], max, rng);
}

/** Плитки для neighbors: відповідь, число з «не тим кроком» (на 1 замість 10 чи навпаки), число з «не тим боком», решта сусіди. */
export function pickNeighborOptions(base: number, delta: number, max: number, rng: Rng): number[] {
  const answer = base + delta;
  const otherStep = Math.abs(delta) === 10 ? 1 : 10;
  const wrongStep = base + Math.sign(delta) * otherStep;
  const wrongSide = base - delta;
  const picked: number[] = [];
  const ok = (n: number) => n >= CHART_MIN && n <= max && n !== answer && !picked.includes(n);
  for (const n of [wrongStep, wrongSide]) if (picked.length < 2 && ok(n)) picked.push(n);
  for (const n of rng.shuffle([answer - 1, answer + 1, answer - 10, answer + 10])) if (picked.length < 2 && ok(n)) picked.push(n);
  for (let n = CHART_MIN; n <= max && picked.length < 2; n++) if (ok(n)) picked.push(n);
  return [...picked, answer].sort((a, b) => a - b);
}

function pickOptions(answer: number, steps: readonly number[], max: number, rng: Rng): number[] {
  const picked: number[] = [];
  const ok = (n: number) => n >= CHART_MIN && n <= max && n !== answer && !picked.includes(n);
  for (const step of steps) {
    for (const n of rng.shuffle([answer - step, answer + step])) {
      if (picked.length < 2 && ok(n) && picked.filter((p) => Math.abs(p - answer) === step).length === 0) picked.push(n);
    }
  }
  for (let d = 1; picked.length < 2 && d <= max; d++) for (const n of [answer - d, answer + d]) if (picked.length < 2 && ok(n)) picked.push(n);
  return [...picked, answer].sort((a, b) => a - b);
}

/** Випадкові листочки-перешкоди: `k` клітинок із 1…max, окрім `except`. */
export function pickLeaves(k: number, max: number, except: readonly number[], rng: Rng): number[] {
  const pool: number[] = [];
  for (let n = CHART_MIN; n <= max; n++) if (!except.includes(n)) pool.push(n);
  return rng.shuffle(pool).slice(0, Math.max(0, Math.min(k, pool.length))).sort((a, b) => a - b);
}

export function generateChart(spec: ChartTask, ctx: GenContext): ChartInstance {
  const { rng } = ctx;
  const max = Math.max(10, Math.min(CHART_MAX, spec.range[1]));
  const lo = Math.max(CHART_MIN, Math.min(spec.range[0], max));
  const last = ctx.previous[ctx.previous.length - 1];
  const rows = rowsFor(max);
  const base = { game: 'tajemniczaTablica' as const, skill: spec.skill, review: spec.review === true, mode: spec.mode, rows, max, answers: spec.answers };

  if (spec.mode === 'paint') {
    // цифра на кінці: 0–9; у малому діапазоні (1–30) беремо лише цифри, що мають хоча б три числа
    const candidates = Array.from({ length: 10 }, (_, d) => d).filter((d) => numbersEndingWith(d, max).length >= Math.min(3, Math.floor(max / 10)));
    const digit = rng.pick(candidates);
    return { ...base, target: 0, delta: 0, digit, paintSet: numbersEndingWith(digit, max), leaves: [], options: [] };
  }

  if (spec.mode === 'neighbors') {
    // step: на 1 чи на 10, direction: більше чи менше; і число, і шукане мають лежати на таблиці (1…max)
    const draw = (): { target: number; delta: number } => {
      const step = spec.step === 'mixed' ? (rng.next() < 0.5 ? 1 : 10) : spec.step === 'ten' ? 10 : 1;
      const sign = spec.direction === 'mixed' ? (rng.next() < 0.5 ? 1 : -1) : spec.direction === 'less' ? -1 : 1;
      const lowBase = Math.max(lo, sign < 0 ? step + 1 : CHART_MIN);
      const highBase = Math.min(max, sign > 0 ? max - step : max);
      if (lowBase > highBase) return { target: Math.max(lo, CHART_MIN + 1), delta: 1 }; // крок завеликий для діапазону — «на 1»
      return { target: rng.int(lowBase, highBase), delta: sign * step };
    };
    let pick = draw();
    for (let attempt = 0; attempt < 12 && pick.target + pick.delta === last; attempt++) pick = draw();
    return { ...base, target: pick.target, delta: pick.delta, digit: 0, paintSet: [], leaves: [], options: pickNeighborOptions(pick.target, pick.delta, max, rng) };
  }

  let target = rng.int(lo, max);
  for (let attempt = 0; attempt < 8 && target === last; attempt++) target = rng.int(lo, max);
  if (spec.mode === 'hidden') {
    const decoys = pickLeaves(spec.leaves, max, [target], rng);
    return { ...base, target, delta: 0, digit: 0, paintSet: [], leaves: [target, ...decoys].sort((a, b) => a - b), options: pickHiddenOptions(target, max, rng) };
  }
  // find
  return { ...base, target, delta: 0, digit: 0, paintSet: [], leaves: pickLeaves(spec.leaves, max, [target], rng), options: [] };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): ChartInstance {
  if (spec.game !== 'tajemniczaTablica') throw new Error(`tajemniczaTablica cannot generate ${spec.game}`);
  return generateChart(spec, ctx);
}

/** Правильно: find, hidden, neighbors — число збігається (на 1 поряд — «Prawie!»); paint — сцена передає 1, коли розфарбовано рівно потрібні числа. */
export function checkChart(instance: Pick<ChartInstance, 'mode' | 'target' | 'delta'>, value: number): Verdict {
  const answer = chartAnswer(instance);
  if (value === answer) return { ok: true };
  return { ok: false, almost: instance.mode !== 'paint' && Math.abs(value - answer) === 1 };
}

/** Рядок і стовпчик числа (для підказок). */
export const cellOf = (n: number): { row: number; col: number } => ({ row: rowOf(n), col: columnOf(n) });

/** Чи розфарбовано рівно потрібні числа. */
export function paintedCorrectly(painted: ReadonlySet<number>, paintSet: readonly number[]): boolean {
  return painted.size === paintSet.length && paintSet.every((n) => painted.has(n));
}

