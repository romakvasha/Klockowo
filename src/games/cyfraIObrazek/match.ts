// Логіка пар «Cyfra i obrazek»: зв'язки набір → плитка-цифра, їхнє кодування в одне число (для рушія), перевірка. Чисті функції без React.
// links[i] — індекс плитки в лотку (digits[j]) для набору i; null — набір ще без пари. Пара «один до одного»: плитка належить одному набору.
import type { Verdict } from '../engine/types';

export type Links = readonly (number | null)[];

export const MAX_PAIRS = 4;

/** Основа кодування: цифра розряду = індекс плитки + 1, 0 — «нема пари». */
const base = (pairs: number): number => pairs + 1;

/** Зв'язки → число: розряд i (за основою pairs + 1) — плитка набору i, 0 — нема пари. Нічого не зв'язано — 0. */
export function encodeLinks(links: Links): number {
  const b = base(links.length);
  return links.reduce<number>((sum, link, i) => sum + (link === null ? 0 : link + 1) * b ** i, 0);
}

/** Число → зв'язки (зворотна до encodeLinks); null (нічого не повідомлено) — усі набори без пари. */
export function decodeLinks(value: number | null, pairs: number): (number | null)[] {
  const b = base(pairs);
  return Array.from({ length: pairs }, (_, i) => {
    const digit = Math.floor((value ?? 0) / b ** i) % b;
    return digit === 0 ? null : digit - 1;
  });
}

/** Усі набори мають пару. */
export function isComplete(links: Links): boolean {
  return links.length > 0 && links.every((l) => l !== null);
}

/** Зв'яжи набір із плиткою. Плитка і набір «вільні» після цього лише одне від одного: стара пара кожного з них розривається. */
export function linkPair(links: Links, set: number, digit: number): (number | null)[] {
  return links.map((l, i) => (i === set ? digit : l === digit ? null : l));
}

/** Розірви пару набору. */
export function unlinkSet(links: Links, set: number): (number | null)[] {
  return links.map((l, i) => (i === set ? null : l));
}

/** Розірви пару плитки. */
export function unlinkDigit(links: Links, digit: number): (number | null)[] {
  return links.map((l) => (l === digit ? null : l));
}

/** Набір, до якого прив'язано плитку (або null). */
export function setOfDigit(links: Links, digit: number): number | null {
  const i = links.indexOf(digit);
  return i < 0 ? null : i;
}

/** Набори, чия пара неправильна (чи її ще нема). */
export function wrongSets(correct: readonly number[], links: Links): number[] {
  return correct.flatMap((c, i) => (links[i] === c ? [] : [i]));
}

/** Хибні пари — лише ті, що вже є: набір зв'язано, але не з тією цифрою. Їх прибирають після відгуку, правильні лишаються. */
export function mistakenSets(correct: readonly number[], links: Links): number[] {
  return correct.flatMap((c, i) => (links[i] === null || links[i] === c ? [] : [i]));
}

/** Лишає лише правильні пари. */
export function keepCorrect(correct: readonly number[], links: Links): (number | null)[] {
  return links.map((l, i) => (l === correct[i] ? l : null));
}

/** Правильно — коли всі пари збігаються. «Prawie!» тут немає: різниці «на 1» між парами не існує. */
export function checkMatch(correct: readonly number[], value: number): Verdict {
  return value === encodeLinks(correct) ? { ok: true } : { ok: false, almost: false };
}
