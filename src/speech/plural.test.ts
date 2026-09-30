import { describe, expect, it } from 'vitest';
import { ANIMALS, OBJECTS } from './nouns';
import { countForm, isAre, nounForm, quantity, times } from './plural';

/** Незалежна «ручна» реалізація правила польської множини — звіряємо з Intl.PluralRules на 0–100. */
function manualForm(n: number): 'one' | 'few' | 'many' {
  if (n === 1) return 'one';
  const last = n % 10;
  const last2 = n % 100;
  return last >= 2 && last <= 4 && !(last2 >= 12 && last2 <= 14) ? 'few' : 'many';
}

describe('countForm (Intl.PluralRules pl)', () => {
  it('збігається з правилом one/few/many для кожного числа 0–100', () => {
    for (let n = 0; n <= 100; n++) expect(countForm(n), String(n)).toBe(manualForm(n));
  });

  it('ключові випадки', () => {
    expect(countForm(0)).toBe('many');
    expect(countForm(1)).toBe('one');
    expect([2, 3, 4, 22, 23, 24, 32, 94]).toSatisfy((list: number[]) => list.every((n) => countForm(n) === 'few'));
    expect([5, 12, 13, 14, 21, 25, 31, 100]).toSatisfy((list: number[]) => list.every((n) => countForm(n) === 'many'));
  });

  it('кидає RangeError для дробів', () => {
    expect(() => countForm(1.5)).toThrow(RangeError);
  });
});

describe('isAre', () => {
  it('«Jest» для 1 і many, «Są» для few', () => {
    expect(isAre(1)).toBe('Jest');
    expect(isAre(2)).toBe('Są');
    expect(isAre(4)).toBe('Są');
    expect(isAre(5)).toBe('Jest');
    expect(isAre(12)).toBe('Jest');
    expect(isAre(22)).toBe('Są');
    expect(isAre(100)).toBe('Jest');
    expect(isAre(0)).toBe('Jest');
  });
});

describe('quantity: число + іменник у всіх трьох родах', () => {
  // [n, jabłko (n), gruszka (f), kwiatek (m)]
  const TABLE: readonly (readonly [number, string, string, string])[] = [
    [0, 'zero jabłek', 'zero gruszek', 'zero kwiatków'],
    [1, 'jedno jabłko', 'jedna gruszka', 'jeden kwiatek'],
    [2, 'dwa jabłka', 'dwie gruszki', 'dwa kwiatki'],
    [3, 'trzy jabłka', 'trzy gruszki', 'trzy kwiatki'],
    [5, 'pięć jabłek', 'pięć gruszek', 'pięć kwiatków'],
    [12, 'dwanaście jabłek', 'dwanaście gruszek', 'dwanaście kwiatków'],
    [14, 'czternaście jabłek', 'czternaście gruszek', 'czternaście kwiatków'],
    [21, 'dwadzieścia jeden jabłek', 'dwadzieścia jeden gruszek', 'dwadzieścia jeden kwiatków'],
    [22, 'dwadzieścia dwa jabłka', 'dwadzieścia dwie gruszki', 'dwadzieścia dwa kwiatki'],
    [25, 'dwadzieścia pięć jabłek', 'dwadzieścia pięć gruszek', 'dwadzieścia pięć kwiatków'],
    [100, 'sto jabłek', 'sto gruszek', 'sto kwiatków'],
  ];

  it.each(TABLE)('n = %i', (n, apple, pear, flower) => {
    expect(quantity(n, OBJECTS.jablko)).toBe(apple);
    expect(quantity(n, OBJECTS.gruszka)).toBe(pear);
    expect(quantity(n, OBJECTS.kwiatek)).toBe(flower);
  });

  it('приклади з BRIEF §4', () => {
    expect(quantity(1, OBJECTS.jablko)).toBe('jedno jabłko');
    expect(quantity(2, OBJECTS.jablko)).toBe('dwa jabłka');
    expect(quantity(2, OBJECTS.gruszka)).toBe('dwie gruszki');
    expect(quantity(22, OBJECTS.jablko)).toBe('dwadzieścia dwa jabłka');
    expect(quantity(22, OBJECTS.gruszka)).toBe('dwadzieścia dwie gruszki');
    expect(quantity(5, OBJECTS.jablko)).toBe('pięć jabłek');
    expect(quantity(12, OBJECTS.jablko)).toBe('dwanaście jabłek');
    expect(quantity(21, OBJECTS.jablko)).toBe('dwadzieścia jeden jabłek');
    expect(quantity(100, OBJECTS.jablko)).toBe('sto jabłek');
    expect(quantity(0, OBJECTS.jablko)).toBe('zero jabłek');
  });

  it('знахідний: для 1 — acc1 (jedną gruszkę, jednego motyla), для n ≥ 2 — як називний', () => {
    expect(quantity(1, OBJECTS.gruszka, true)).toBe('jedną gruszkę');
    expect(quantity(1, OBJECTS.motyl, true)).toBe('jednego motyla');
    expect(quantity(1, OBJECTS.jablko, true)).toBe('jedno jabłko');
    expect(quantity(1, OBJECTS.kwiatek, true)).toBe('jeden kwiatek');
    expect(quantity(2, OBJECTS.gruszka, true)).toBe('dwie gruszki');
    expect(quantity(7, OBJECTS.motyl, true)).toBe('siedem motyli');
  });

  it('мотиль: 2–4 і 5+', () => {
    expect(quantity(2, OBJECTS.motyl)).toBe('dwa motyle');
    expect(quantity(5, OBJECTS.motyl)).toBe('pięć motyli');
  });

  it('тваринки теж рахуються: dwie żabki, pięć misiów', () => {
    expect(quantity(2, ANIMALS.zabka)).toBe('dwie żabki');
    expect(quantity(5, ANIMALS.mis)).toBe('pięć misiów');
    expect(quantity(1, ANIMALS.mis, true)).toBe('jednego misia');
  });

  it('усі 0–100 × усі предмети: без цифр, без «undefined», число і форма узгоджені', () => {
    for (const noun of [...Object.values(OBJECTS), ...Object.values(ANIMALS)]) {
      for (let n = 0; n <= 100; n++) {
        const text = quantity(n, noun);
        expect(text).not.toMatch(/\d|undefined/);
        const form = countForm(n);
        expect(text.endsWith(form === 'one' ? noun.one : form === 'few' ? noun.few : noun.many)).toBe(true);
      }
    }
  });
});

describe('nounForm', () => {
  it('повертає форму за числом', () => {
    expect(nounForm(1, OBJECTS.gruszka)).toBe('gruszka');
    expect(nounForm(3, OBJECTS.gruszka)).toBe('gruszki');
    expect(nounForm(8, OBJECTS.gruszka)).toBe('gruszek');
  });
});

describe('times', () => {
  it('raz (без «jeden») / dwa razy / pięć razy', () => {
    expect(times(1)).toBe('raz');
    expect(times(2)).toBe('dwa razy');
    expect(times(3)).toBe('trzy razy');
    expect(times(5)).toBe('pięć razy');
    expect(times(10)).toBe('dziesięć razy');
  });
});
