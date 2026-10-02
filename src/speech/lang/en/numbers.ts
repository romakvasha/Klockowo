// Англійські числа словами (0–100) й узгодження з іменником для голосу, коли мова гри англійська. Форма — лише через Intl.PluralRules('en'):
// one — 1 («one apple»), other — решта («zero apples», «two apples»). Рід не важить.
import type { Noun } from '../../nouns';
import type { Gender } from '../../numberWords';

const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'] as const;
const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'] as const;
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] as const;

function at<T>(list: readonly T[], i: number): T {
  const v = list[i];
  if (v === undefined) throw new RangeError(`en numberWords: no entry for index ${i}`);
  return v;
}

/** Число словами: 0–100 («twenty-one», «one hundred»). `gender` — лише для однакового підпису з іншими мовами. */
export function numberWords(n: number, _gender: Gender = 'm'): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError(`en numberWords: expected an integer from 0 to 100, got ${n}`);
  if (n === 100) return 'one hundred';
  if (n >= 20) {
    const tens = at(TENS, Math.floor(n / 10));
    const u = n % 10;
    return u === 0 ? tens : `${tens}-${at(UNITS, u)}`;
  }
  if (n >= 10) return at(TEENS, n - 10);
  return at(UNITS, n);
}

const PLURAL_RULES = new Intl.PluralRules('en');

export const isOne = (n: number): boolean => PLURAL_RULES.select(n) === 'one';

/** «one apple», «five apples», «two fish». */
export function quantity(n: number, noun: Noun): string {
  return `${numberWords(n)} ${isOne(n) ? noun.one : noun.many}`;
}

/** «once», «twice», «three times». */
export function times(n: number): string {
  if (n === 1) return 'once';
  if (n === 2) return 'twice';
  return `${numberWords(n)} times`;
}

export const cap = (s: string): string => s.charAt(0).toLocaleUpperCase('en') + s.slice(1);
