import { describe, expect, it } from 'vitest';
import { ANIMAL_IDS, WORLD_OBJECT_IDS } from '../../nouns';
import { UK_NOUNS } from './nouns';
import { countForm, numberGenitive, numberWords, quantity, times } from './numbers';

const { OBJECTS, ANIMALS } = UK_NOUNS;

describe('українські числа словами', () => {
  it('0–20 і десятки', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => numberWords(n))).toEqual(['нуль', 'один', 'два', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять"]);
    expect([10, 11, 12, 13, 14, 15, 19].map((n) => numberWords(n))).toEqual(['десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', "п'ятнадцять", "дев'ятнадцять"]);
    expect([20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => numberWords(n))).toEqual(
      ['двадцять', 'тридцять', 'сорок', "п'ятдесят", 'шістдесят', 'сімдесят', 'вісімдесят', "дев'яносто", 'сто'],
    );
  });

  it('складені й рід: один / одна / одне, два / дві', () => {
    expect(numberWords(21)).toBe('двадцять один');
    expect(numberWords(21, 'f')).toBe('двадцять одна');
    expect(numberWords(31, 'n')).toBe('тридцять одне');
    expect(numberWords(42, 'f')).toBe('сорок дві');
    expect(numberWords(42, 'n')).toBe('сорок два');
    expect(numberWords(99)).toBe("дев'яносто дев'ять");
    expect(numberWords(1, 'f')).toBe('одна');
    expect(numberWords(2, 'f')).toBe('дві');
  });

  it('усі 0–100 — без цифр, без зайвих пробілів; поза межами — помилка', () => {
    for (let k = 0; k <= 100; k++) {
      for (const g of ['m', 'f', 'n'] as const) {
        const w = numberWords(k, g);
        expect(w).not.toMatch(/\d|\s{2}|^\s|\s$/);
        expect(w).toMatch(/^[а-яіїєґ' ]+$/);
      }
    }
    expect(() => numberWords(101)).toThrow(RangeError);
    expect(() => numberWords(-1)).toThrow(RangeError);
    expect(() => numberWords(2.5)).toThrow(RangeError);
  });

  it('родовий: «від п\'яти», «до десяти», «до ста»', () => {
    expect([1, 3, 5, 7, 8, 10, 11, 20, 23, 40, 45, 90, 100].map(numberGenitive)).toEqual(
      ['одного', 'трьох', "п'яти", 'семи', 'восьми', 'десяти', 'одинадцяти', 'двадцяти', 'двадцяти трьох', 'сорока', "сорока п'яти", "дев'яноста", 'ста'],
    );
  });
});

describe('узгодження з іменником (Intl.PluralRules uk)', () => {
  it('one / few / many', () => {
    expect([1, 21, 31, 101 - 50].map(countForm)).toEqual(['one', 'one', 'one', 'one']);
    expect([2, 3, 4, 22, 24, 34].map(countForm)).toEqual(['few', 'few', 'few', 'few', 'few', 'few']);
    expect([0, 5, 11, 12, 14, 20, 25, 100].map(countForm)).toEqual(['many', 'many', 'many', 'many', 'many', 'many', 'many', 'many']);
  });

  it('кількість у називному', () => {
    expect(quantity(1, OBJECTS.gruszka)).toBe('одна груша');
    expect(quantity(2, OBJECTS.gruszka)).toBe('дві груші');
    expect(quantity(5, OBJECTS.gruszka)).toBe("п'ять груш");
    expect(quantity(21, OBJECTS.gruszka)).toBe('двадцять одна груша');
    expect(quantity(22, OBJECTS.gruszka)).toBe('двадцять дві груші');
    expect(quantity(3, OBJECTS.jablko)).toBe('три яблука');
    expect(quantity(7, OBJECTS.jablko)).toBe('сім яблук');
    expect(quantity(1, OBJECTS.jablko)).toBe('одне яблуко');
    expect(quantity(4, OBJECTS.jajko)).toBe('чотири яйця');
    expect(quantity(5, OBJECTS.jajko)).toBe("п'ять яєць");
    expect(quantity(2, OBJECTS.motyl)).toBe('два метелики');
    expect(quantity(12, OBJECTS.motyl)).toBe('дванадцять метеликів');
    expect(quantity(3, OBJECTS.rozgwiazda)).toBe('три морські зірки');
    expect(quantity(0, OBJECTS.rybka)).toBe('нуль рибок');
  });

  it('знахідний для «Дай…»: інакше лише жіночий рід на 1', () => {
    expect(quantity(1, OBJECTS.gruszka, true)).toBe('одну грушу');
    expect(quantity(21, OBJECTS.marchewka, true)).toBe('двадцять одну морквинку');
    expect(quantity(1, OBJECTS.jablko, true)).toBe('одне яблуко');
    expect(quantity(2, OBJECTS.truskawka, true)).toBe('дві полуниці');
    expect(quantity(34, OBJECTS.jablko, true)).toBe('тридцять чотири яблука');
    expect(quantity(5, OBJECTS.marchewka, true)).toBe("п'ять морквинок");
  });

  it('разів: «один раз», «три рази», «п\'ять разів»', () => {
    expect([1, 3, 5, 21, 22].map(times)).toEqual(['один раз', 'три рази', "п'ять разів", 'двадцять один раз', 'двадцять два рази']);
  });
});

describe('українські іменники', () => {
  it('є всі предмети світів і всі тваринки; форми — кирилицею, без порожніх', () => {
    const ids = Object.values(WORLD_OBJECT_IDS).flat();
    for (const id of ids) {
      const noun = OBJECTS[id];
      for (const form of [noun.one, noun.acc, noun.acc1, noun.few, noun.many]) expect(form, id).toMatch(/^[а-яіїєґ' ]+$/);
    }
    for (const id of ANIMAL_IDS) {
      const a = ANIMALS[id];
      for (const form of [a.one, a.acc, a.acc1, a.few, a.many, a.dat]) expect(form, id).toMatch(/^[а-яіїєґ' ]+$/);
    }
  });

  it('давальні для «Дай …»', () => {
    expect(ANIMAL_IDS.map((id) => ANIMALS[id].dat)).toEqual(['ведмедикові', 'їжачкові', 'котикові', 'лисичці', 'зайчикові', 'жабці', 'сові', 'мишці']);
  });
});
