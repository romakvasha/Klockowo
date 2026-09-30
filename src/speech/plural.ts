// Узгодження числівника, іменника й дієслова. Форму вибираємо лише через Intl.PluralRules('pl')
// (one / few / many), правила — POLISH_COPY §8. Жодних власних «n % 10» по коду.
import type { Noun } from './nouns';
import { numberWords } from './numberWords';

export type CountForm = 'one' | 'few' | 'many';

const PLURAL_RULES = new Intl.PluralRules('pl');

/** one: 1 · few: 2–4, 22–24, 32–34… (не 12–14) · many: 0, 5–21, 25–31… Лише для цілих чисел. */
export function countForm(n: number): CountForm {
  const form = PLURAL_RULES.select(n);
  if (form === 'one' || form === 'few' || form === 'many') return form;
  throw new RangeError(`countForm: expected an integer, got ${n}`);
}

/** «Jest» для 1 і many («Jest pięć jabłek»), «Są» для few («Są dwa jabłka»). */
export function isAre(n: number): 'Jest' | 'Są' {
  return countForm(n) === 'few' ? 'Są' : 'Jest';
}

/** Іменник у формі, яку вимагає число (без числівника). */
export function nounForm(n: number, noun: Noun): string {
  const form = countForm(n);
  return form === 'one' ? noun.one : form === 'few' ? noun.few : noun.many;
}

/** «dwie gruszki», «dwadzieścia jeden jabłek». Для 1 із `acc` — знахідний: «jedną gruszkę», «jednego motyla»
 *  (для n ≥ 2 знахідний збігається з називним). */
export function quantity(n: number, noun: Noun, acc = false): string {
  if (n === 1) return acc ? noun.acc1 : `${numberWords(1, noun.g)} ${noun.one}`;
  return `${numberWords(n, noun.g)} ${nounForm(n, noun)}`;
}

/** «raz» (для 1 — без «jeden»), «dwa razy», «pięć razy». */
export function times(n: number): string {
  return n === 1 ? 'raz' : `${numberWords(n)} razy`;
}
