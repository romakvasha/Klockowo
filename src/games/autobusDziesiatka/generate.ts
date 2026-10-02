// «Autobus dziesiątka» (BRIEF §7 гра 7, PEDAGOGY §2 п.7): автобус 2×5 місць із тваринками; «Ile zwierzątek jedzie autobusem?» / «Ile miejsc jest wolnych?»;
// вибір із 3 плиток. Тваринки сідають спершу в перший ряд, потім у другий (звідси «п'ять у ряду» як опора). Генератор детермінований.
import type { AnswerStyle, BusTask, TaskSpec } from '../../curriculum/types';
import { ANIMAL_IDS, type AnimalId } from '../../speech/nouns';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

/** Місць в автобусі: 2 ряди по 5; двоповерховий (W4) — 20. */
export const BUS_CAPACITY = 10;
export const DOUBLE_DECKER_CAPACITY = 20;

/** Місць за кількістю поверхів. */
export const capacityOf = (floors: 1 | 2 | undefined): number => (floors === 2 ? DOUBLE_DECKER_CAPACITY : BUS_CAPACITY);

export interface BusInstance extends TaskBase {
  game: 'autobusDziesiatka';
  /** Скільки тваринок їде (0…10, у двоповерховому 0…20). */
  passengers: number;
  /** Скільки всього місць: 10 або 20. */
  capacity: number;
  /** Хто сидить на місцях 0…passengers−1 (за порядком місць). */
  riders: readonly AnimalId[];
  ask: 'full' | 'empty';
  /** 0 — автобус видно весь час; інакше вступний показ на стільки мс, потім місця закриваються. */
  exposureMs: number;
  answers: AnswerStyle;
  /** Тваринка для бульбашки Kubika. */
  mascot: AnimalId;
  /** Три значення плиток за зростанням; серед них відповідь. */
  options: readonly number[];
}

/** Відповідь за кількістю пасажирів і запитанням. */
export function busAnswer(passengers: number, ask: 'full' | 'empty', capacity: number = BUS_CAPACITY): number {
  return ask === 'full' ? passengers : capacity - passengers;
}

/** «Інша частина»: коли питають про вільні місця — скільки їде, і навпаки. Це типова плутанина, тож її теж ставимо серед плиток. */
export function busComplement(passengers: number, ask: 'full' | 'empty', capacity: number = BUS_CAPACITY): number {
  return capacity - busAnswer(passengers, ask, capacity);
}

/** Плитки: правильна відповідь, «друга частина» (якщо відрізняється) і сусіднє число; усе в [0, місць], за зростанням. */
export function pickBusOptions(answer: number, complement: number, rng: Rng, capacity: number = BUS_CAPACITY): number[] {
  const ok = (n: number) => n >= 0 && n <= capacity && n !== answer;
  const picked: number[] = [];
  const add = (n: number) => {
    if (picked.length < 2 && ok(n) && !picked.includes(n)) picked.push(n);
  };
  add(complement);
  for (const n of rng.shuffle([answer - 1, answer + 1])) add(n);
  for (const n of rng.shuffle([answer - 2, answer + 2, answer - 3, answer + 3])) add(n);
  return [...picked, answer].sort((a, b) => a - b);
}

export function generateBus(spec: BusTask, ctx: GenContext): BusInstance {
  const { rng } = ctx;
  const ask = spec.ask === 'mixed' ? (rng.next() < 0.5 ? 'full' : 'empty') : spec.ask;
  const capacity = capacityOf(spec.floors);
  const lo = Math.max(0, Math.min(spec.count[0], capacity));
  const hi = Math.max(lo, Math.min(capacity, spec.count[1]));
  // не повторюємо ту саму відповідь двічі поспіль, якщо є з чого вибрати
  const last = ctx.previous[ctx.previous.length - 1];
  let passengers = rng.int(lo, hi);
  for (let attempt = 0; attempt < 6 && hi > lo && busAnswer(passengers, ask, capacity) === last; attempt++) passengers = rng.int(lo, hi);
  const kinds = rng.shuffle(ANIMAL_IDS).slice(0, 2);
  const riders = Array.from({ length: passengers }, () => rng.pick(kinds));
  const answer = busAnswer(passengers, ask, capacity);
  return {
    game: 'autobusDziesiatka',
    skill: spec.skill,
    review: spec.review === true,
    passengers,
    capacity,
    riders,
    ask,
    exposureMs: spec.exposureMs,
    answers: spec.answers,
    mascot: kinds[0] ?? 'mis',
    options: pickBusOptions(answer, busComplement(passengers, ask, capacity), rng, capacity),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): BusInstance {
  if (spec.game !== 'autobusDziesiatka') throw new Error(`autobusDziesiatka cannot generate ${spec.game}`);
  return generateBus(spec, ctx);
}

/** Правильно — коли вибрано потрібне число; на 1 поряд — «Prawie!». */
export function checkBus(instance: Pick<BusInstance, 'passengers' | 'ask'> & { capacity?: number }, value: number): Verdict {
  const answer = busAnswer(instance.passengers, instance.ask, instance.capacity);
  if (value === answer) return { ok: true };
  return { ok: false, almost: Math.abs(value - answer) === 1 };
}

/** Місця 0…capacity−1: true — зайняте (перші `passengers`). */
export function seatsTaken(passengers: number, capacity: number = BUS_CAPACITY): boolean[] {
  return Array.from({ length: capacity }, (_, i) => i < passengers);
}
