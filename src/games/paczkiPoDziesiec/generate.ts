// «Paczki po dziesięć» (BRIEF §7 гра 12, PEDAGOGY §2 п.12): розсипані предмети пакуються по 10, лічба «dziesięć, dwadzieścia…», далі поштучно; «Ile jest razem?» → 3 плитки.
// Режими: loose (дитина пакує), packed (уже в коробках), build (зворотний: «Zbuduj liczbę…» кнопками +10 / +1). Складність: діапазон 11–99, контрастні пари 26 ↔ 62.
// Генератор детермінований: лише TaskSpec і потік rng завдання.
import { missionObject } from '../../curriculum/flow';
import type { AnswerStyle, PackMode, PackTask, TaskSpec } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

export const PACK_MIN = 11;
export const PACK_MAX = 99;
/** Розсипані предмети мусять уміститись на сцені й дотягнутись пальцем: понад 59 — лише в коробках. */
export const LOOSE_MAX = 59;

export interface PackInstance extends TaskBase {
  game: 'paczkiPoDziesiec';
  object: ObjectId;
  total: number;
  mode: PackMode;
  answers: AnswerStyle;
  /** Три значення плиток за зростанням (loose, packed); у build порожньо. */
  options: readonly number[];
}

/** Десятки й одиниці числа: 47 → { tens: 4, ones: 7 }. */
export function digitsOf(n: number): { tens: number; ones: number } {
  return { tens: Math.floor(n / 10), ones: n % 10 };
}

/** Число з переставленими цифрами (26 → 62); null, якщо вона така сама (33), починається з нуля (30 → 03) або виходить за 99. */
export function swapDigits(n: number): number | null {
  const { tens, ones } = digitsOf(n);
  if (ones === 0 || tens === ones) return null;
  const swapped = ones * 10 + tens;
  return swapped >= PACK_MIN && swapped <= PACK_MAX ? swapped : null;
}

/** Плитки: правильна відповідь; при `contrast` — число з переставленими цифрами (26 ↔ 62); «на десяток більше/менше» (збився з десятками) і «на одиницю» (збився з одиницями).
 *  Усе в [11, 99], за зростанням. */
export function pickPackOptions(n: number, contrast: boolean, rng: Rng): number[] {
  const ok = (m: number) => m >= PACK_MIN && m <= PACK_MAX && m !== n;
  const picked: number[] = [];
  const add = (m: number | null) => {
    if (m !== null && picked.length < 2 && ok(m) && !picked.includes(m)) picked.push(m);
  };
  if (contrast) add(swapDigits(n));
  for (const m of rng.shuffle([n - 10, n + 10])) add(m);
  for (const m of rng.shuffle([n - 1, n + 1])) add(m);
  for (const m of rng.shuffle([n - 20, n + 20, n - 2, n + 2])) add(m);
  for (let m = PACK_MIN; m <= PACK_MAX; m++) add(m);
  return [...picked, n].sort((a, b) => a - b);
}

export function generatePack(spec: PackTask, ctx: GenContext): PackInstance {
  const { rng } = ctx;
  const cap = spec.mode === 'loose' ? LOOSE_MAX : PACK_MAX;
  const lo = Math.max(PACK_MIN, Math.min(spec.total[0], cap));
  const hi = Math.max(lo, Math.min(spec.total[1], cap));
  const last = ctx.previous[ctx.previous.length - 1];
  let total = rng.int(lo, hi);
  for (let attempt = 0; attempt < 8 && total === last; attempt++) total = rng.int(lo, hi);
  // контраст 26 ↔ 62 потребує числа, що має пару; якщо випало 30 чи 33 — пробуємо ще
  if (spec.contrast && spec.mode !== 'build') {
    for (let attempt = 0; attempt < 12 && swapDigits(total) === null; attempt++) total = rng.int(lo, hi);
  }
  return {
    game: 'paczkiPoDziesiec',
    skill: spec.skill,
    review: spec.review === true,
    object: missionObject(ctx.level),
    total,
    mode: spec.mode,
    answers: spec.answers,
    options: spec.mode === 'build' ? [] : pickPackOptions(total, spec.contrast, rng),
  };
}

export function generateFromSpec(spec: TaskSpec, ctx: GenContext): PackInstance {
  if (spec.game !== 'paczkiPoDziesiec') throw new Error(`paczkiPoDziesiec cannot generate ${spec.game}`);
  return generatePack(spec, ctx);
}

/** Відповідь — загальна кількість (або число, яке треба зібрати); різниця в 1 — «Prawie!» (у десятках — ні: на 10 — це інша помилка). */
export function checkPack(instance: Pick<PackInstance, 'total'>, value: number): Verdict {
  if (value === instance.total) return { ok: true };
  return { ok: false, almost: Math.abs(value - instance.total) === 1 };
}

/** Відповідь режиму: у build — що дитина збирає. */
export const packAnswer = (instance: Pick<PackInstance, 'total'>): number => instance.total;
