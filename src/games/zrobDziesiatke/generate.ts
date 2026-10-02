// «Zrób dziesiątkę» (BRIEF §7 гра 11, PEDAGOGY §2 п.11): у рамці-десятці лежить `known` фішок; дитина докладає решту — «Ile brakuje do dziesięciu? Dołóż tyle, żeby było dziesięć.»
// Складність: відомі фішки видно (frame) або лише цифра на порожній рамці (digit). «Gotowe» перевіряє, скільки докладено.
// ★-режим «через десяток» (W4): 8 + 5 — дитина докладає 5 фішок: спершу добиває першу рамку до десяти, решта лягає в другу. Генератор детермінований.
import type { TaskSpec, TenTask } from '../../curriculum/types';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

export const TEN = 10;
export const TWENTY = 20;

export interface TenInstance extends TaskBase {
  game: 'zrobDziesiatke';
  /** Скільки фішок уже лежить (1–9). */
  known: number;
  show: 'frame' | 'digit';
  /** Скільки треба докласти — відповідь: 10 − known, а через десяток — друга частина суми (8 + 5 → 5). */
  add: number;
  /** Через десяток: дві рамки (20 комірок), відомі фішки видно завжди. */
  bridge: boolean;
}

/** Скільки треба докласти. */
export const missing = (instance: Pick<TenInstance, 'add'>): number => instance.add;

/** Скільки докласти, щоб першу рамку було повно: 10 − known. Через десяток це лише перша частина відповіді (8 + 5: спершу 2, потім ще 3). */
export const toTen = (instance: Pick<TenInstance, 'known'>): number => TEN - instance.known;

/** Усього комірок: одна рамка чи дві. */
export const frameCells = (instance: Pick<TenInstance, 'bridge'>): number => (instance.bridge ? TWENTY : TEN);

export function generateTen(spec: TenTask, ctx: GenContext): TenInstance {
  const { rng } = ctx;
  const lo = Math.max(1, Math.min(spec.known[0], TEN - 1));
  const hi = Math.max(lo, Math.min(spec.known[1], TEN - 1));
  const last = ctx.previous[ctx.previous.length - 1];
  if (spec.bridge) {
    // a + b = 11…20 і b > 10 − a: сума справді переходить через десяток
    const [bLo, bHi] = spec.add ?? [3, 9];
    const draw = (): { known: number; add: number } => {
      const known = rng.int(lo, hi);
      const from = Math.max(bLo, TEN - known + 1);
      const to = Math.max(from, Math.min(bHi, TWENTY - known));
      return { known, add: rng.int(from, to) };
    };
    let pick = draw();
    for (let attempt = 0; attempt < 8 && pick.add === last; attempt++) pick = draw();
    return { game: 'zrobDziesiatke', skill: spec.skill, review: spec.review === true, known: pick.known, show: 'frame', add: pick.add, bridge: true };
  }
  // не повторюємо ту саму відповідь («бракує») двічі поспіль, якщо є з чого вибрати
  let known = rng.int(lo, hi);
  for (let attempt = 0; attempt < 8 && TEN - known === last; attempt++) known = rng.int(lo, hi);
  return { game: 'zrobDziesiatke', skill: spec.skill, review: spec.review === true, known, show: spec.show, add: TEN - known, bridge: false };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): TenInstance {
  if (spec.game !== 'zrobDziesiatke') throw new Error(`zrobDziesiatke cannot generate ${spec.game}`);
  return generateTen(spec, ctx);
}

/** Правильно — докладено рівно стільки, скільки треба; на 1 менше чи більше — «Prawie!». */
export function checkTen(instance: Pick<TenInstance, 'add'>, value: number): Verdict {
  const answer = missing(instance);
  if (value === answer) return { ok: true };
  return { ok: false, almost: Math.abs(value - answer) === 1 };
}
