// «Zrób dziesiątkę» (BRIEF §7 гра 11, PEDAGOGY §2 п.11): у рамці-десятці лежить `known` фішок; дитина докладає решту — «Ile brakuje do dziesięciu? Dołóż tyle, żeby było dziesięć.»
// Складність: відомі фішки видно (frame) або лише цифра на порожній рамці (digit). «Gotowe» перевіряє, скільки докладено. Генератор детермінований.
import type { TaskSpec, TenTask } from '../../curriculum/types';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

export const TEN = 10;

export interface TenInstance extends TaskBase {
  game: 'zrobDziesiatke';
  /** Скільки фішок уже лежить (1–9). */
  known: number;
  show: 'frame' | 'digit';
}

/** Скільки бракує до десяти — і скільки треба докласти. */
export const missing = (instance: Pick<TenInstance, 'known'>): number => TEN - instance.known;

export function generateTen(spec: TenTask, ctx: GenContext): TenInstance {
  const { rng } = ctx;
  const lo = Math.max(1, Math.min(spec.known[0], TEN - 1));
  const hi = Math.max(lo, Math.min(spec.known[1], TEN - 1));
  const last = ctx.previous[ctx.previous.length - 1];
  // не повторюємо ту саму відповідь («бракує») двічі поспіль, якщо є з чого вибрати
  let known = rng.int(lo, hi);
  for (let attempt = 0; attempt < 8 && TEN - known === last; attempt++) known = rng.int(lo, hi);
  return { game: 'zrobDziesiatke', skill: spec.skill, review: spec.review === true, known, show: spec.show };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): TenInstance {
  if (spec.game !== 'zrobDziesiatke') throw new Error(`zrobDziesiatke cannot generate ${spec.game}`);
  return generateTen(spec, ctx);
}

/** Правильно — докладено рівно стільки, скільки бракувало; на 1 менше чи більше — «Prawie!». */
export function checkTen(instance: Pick<TenInstance, 'known'>, value: number): Verdict {
  const answer = missing(instance);
  if (value === answer) return { ok: true };
  return { ok: false, almost: Math.abs(value - answer) === 1 };
}
