// Українські числівники словами (0–100) й узгодження з іменником — для голосу та підписів, коли мова гри українська.
// Форму вибираємо лише через Intl.PluralRules('uk'): one — 1, 21, 31… (не 11); few — 2–4, 22–24… (не 12–14); many — 0, 5–20, 25–30…
// Рід важить лише для 1 і 2: один / одна / одне, два / дві — і в складених («двадцять одна груша», «двадцять дві груші»).
import type { Noun } from '../../nouns';
import type { Gender } from '../../numberWords';

export type CountForm = 'one' | 'few' | 'many';

const UNITS = ['нуль', 'один', 'два', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять"] as const;
const TEENS = [
  'десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять',
  "п'ятнадцять", 'шістнадцять', 'сімнадцять', 'вісімнадцять', "дев'ятнадцять",
] as const;
const TENS = ['', '', 'двадцять', 'тридцять', 'сорок', "п'ятдесят", 'шістдесят', 'сімдесят', 'вісімдесят', "дев'яносто"] as const;
const ONE: Readonly<Record<Gender, string>> = { m: 'один', f: 'одна', n: 'одне' };

// Родовий («від п'яти», «до десяти», «з трьох»): лише для фраз, яким він потрібен.
const GEN_UNITS = ['нуля', 'одного', 'двох', 'трьох', 'чотирьох', "п'яти", 'шести', 'семи', 'восьми', "дев'яти"] as const;
const GEN_TEENS = [
  'десяти', 'одинадцяти', 'дванадцяти', 'тринадцяти', 'чотирнадцяти',
  "п'ятнадцяти", 'шістнадцяти', 'сімнадцяти', 'вісімнадцяти', "дев'ятнадцяти",
] as const;
const GEN_TENS = ['', '', 'двадцяти', 'тридцяти', 'сорока', "п'ятдесяти", 'шістдесяти', 'сімдесяти', 'вісімдесяти', "дев'яноста"] as const;

function at<T>(list: readonly T[], i: number): T {
  const v = list[i];
  if (v === undefined) throw new RangeError(`uk numberWords: no entry for index ${i}`);
  return v;
}

function assertCount(n: number): void {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError(`uk numberWords: expected an integer from 0 to 100, got ${n}`);
}

function unitWord(u: number, gender: Gender): string {
  if (u === 1) return ONE[gender];
  if (u === 2 && gender === 'f') return 'дві';
  return at(UNITS, u);
}

/** Число словами: 0–100. Без іменника — чоловічий рід («один, два, три»). */
export function numberWords(n: number, gender: Gender = 'm'): string {
  assertCount(n);
  if (n === 100) return 'сто';
  if (n >= 20) {
    const tens = at(TENS, Math.floor(n / 10));
    const u = n % 10;
    return u === 0 ? tens : `${tens} ${unitWord(u, gender)}`;
  }
  if (n >= 10) return at(TEENS, n - 10);
  return unitWord(n, gender);
}

/** Число в родовому відмінку: «від п'яти», «до десяти», «до ста», «з двадцяти трьох». */
export function numberGenitive(n: number): string {
  assertCount(n);
  if (n === 100) return 'ста';
  if (n >= 20) {
    const tens = at(GEN_TENS, Math.floor(n / 10));
    const u = n % 10;
    return u === 0 ? tens : `${tens} ${at(GEN_UNITS, u)}`;
  }
  if (n >= 10) return at(GEN_TEENS, n - 10);
  return at(GEN_UNITS, n);
}

const PLURAL_RULES = new Intl.PluralRules('uk');

export function countForm(n: number): CountForm {
  const form = PLURAL_RULES.select(n);
  if (form === 'one' || form === 'few' || form === 'many') return form;
  throw new RangeError(`uk countForm: expected an integer, got ${n}`);
}

/** Іменник у формі, якої вимагає число: «груша» (1, 21), «груші» (2–4, 22–24), «груш» (0, 5–20, 25…). */
export function nounForm(n: number, noun: Noun): string {
  const form = countForm(n);
  return form === 'one' ? noun.one : form === 'few' ? noun.few : noun.many;
}

/** «дві груші», «п'ять яблук», «двадцять одна груша». Знахідний (`acc`, «Дай…») відрізняється лише для жіночого роду на 1:
 *  «одну грушу», «двадцять одну грушу» (неживі «яблуко», «велосипед», «груші», «груш» — як у називному). */
export function quantity(n: number, noun: Noun, acc = false): string {
  if (acc && countForm(n) === 'one' && noun.g === 'f') {
    const words = numberWords(n, 'f').replace(/одна$/, 'одну');
    return `${words} ${noun.acc ?? noun.one}`;
  }
  return `${numberWords(n, noun.g)} ${nounForm(n, noun)}`;
}

/** «один раз», «два рази», «п'ять разів», «двадцять один раз». */
export function times(n: number): string {
  const form = countForm(n);
  return `${numberWords(n)} ${form === 'one' ? 'раз' : form === 'few' ? 'рази' : 'разів'}`;
}

/** Перша літера велика: «П'ять яблук.» */
export const cap = (s: string): string => s.charAt(0).toLocaleUpperCase('uk') + s.slice(1);
