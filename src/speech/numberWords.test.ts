import { describe, expect, it } from 'vitest';
import { DIGIT_INSTRUMENTAL, numberGenitive, numberWords } from './numberWords';

// Очікувані значення — літерально, по десятках (не збираються з частин, як у коді).
const EXPECTED: readonly (readonly string[])[] = [
  ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'],
  ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'],
  ['dwadzieścia', 'dwadzieścia jeden', 'dwadzieścia dwa', 'dwadzieścia trzy', 'dwadzieścia cztery', 'dwadzieścia pięć', 'dwadzieścia sześć', 'dwadzieścia siedem', 'dwadzieścia osiem', 'dwadzieścia dziewięć'],
  ['trzydzieści', 'trzydzieści jeden', 'trzydzieści dwa', 'trzydzieści trzy', 'trzydzieści cztery', 'trzydzieści pięć', 'trzydzieści sześć', 'trzydzieści siedem', 'trzydzieści osiem', 'trzydzieści dziewięć'],
  ['czterdzieści', 'czterdzieści jeden', 'czterdzieści dwa', 'czterdzieści trzy', 'czterdzieści cztery', 'czterdzieści pięć', 'czterdzieści sześć', 'czterdzieści siedem', 'czterdzieści osiem', 'czterdzieści dziewięć'],
  ['pięćdziesiąt', 'pięćdziesiąt jeden', 'pięćdziesiąt dwa', 'pięćdziesiąt trzy', 'pięćdziesiąt cztery', 'pięćdziesiąt pięć', 'pięćdziesiąt sześć', 'pięćdziesiąt siedem', 'pięćdziesiąt osiem', 'pięćdziesiąt dziewięć'],
  ['sześćdziesiąt', 'sześćdziesiąt jeden', 'sześćdziesiąt dwa', 'sześćdziesiąt trzy', 'sześćdziesiąt cztery', 'sześćdziesiąt pięć', 'sześćdziesiąt sześć', 'sześćdziesiąt siedem', 'sześćdziesiąt osiem', 'sześćdziesiąt dziewięć'],
  ['siedemdziesiąt', 'siedemdziesiąt jeden', 'siedemdziesiąt dwa', 'siedemdziesiąt trzy', 'siedemdziesiąt cztery', 'siedemdziesiąt pięć', 'siedemdziesiąt sześć', 'siedemdziesiąt siedem', 'siedemdziesiąt osiem', 'siedemdziesiąt dziewięć'],
  ['osiemdziesiąt', 'osiemdziesiąt jeden', 'osiemdziesiąt dwa', 'osiemdziesiąt trzy', 'osiemdziesiąt cztery', 'osiemdziesiąt pięć', 'osiemdziesiąt sześć', 'osiemdziesiąt siedem', 'osiemdziesiąt osiem', 'osiemdziesiąt dziewięć'],
  ['dziewięćdziesiąt', 'dziewięćdziesiąt jeden', 'dziewięćdziesiąt dwa', 'dziewięćdziesiąt trzy', 'dziewięćdziesiąt cztery', 'dziewięćdziesiąt pięć', 'dziewięćdziesiąt sześć', 'dziewięćdziesiąt siedem', 'dziewięćdziesiąt osiem', 'dziewięćdziesiąt dziewięć'],
  ['sto'],
];
const ALL = EXPECTED.flat();

describe('numberWords: 0–100 словами', () => {
  it('має рівно 101 очікуване значення', () => {
    expect(ALL).toHaveLength(101);
  });

  it.each(ALL.map((word, n) => [n, word] as const))('%i → «%s»', (n, word) => {
    expect(numberWords(n)).toBe(word);
  });

  it('не містить цифр і подвійних пробілів', () => {
    for (let n = 0; n <= 100; n++) {
      expect(numberWords(n), String(n)).toMatch(/^[a-ząćęłńóśźż]+( [a-ząćęłńóśźż]+)?$/);
    }
  });
});

describe('numberWords: рід', () => {
  it('1 окремо: jeden / jedna / jedno', () => {
    expect(numberWords(1, 'm')).toBe('jeden');
    expect(numberWords(1, 'f')).toBe('jedna');
    expect(numberWords(1, 'n')).toBe('jedno');
  });

  it('2 і 22…92: dwa (m, n) / dwie (f), також у складених', () => {
    expect(numberWords(2, 'f')).toBe('dwie');
    expect(numberWords(2, 'n')).toBe('dwa');
    expect(numberWords(22, 'f')).toBe('dwadzieścia dwie');
    expect(numberWords(22, 'n')).toBe('dwadzieścia dwa');
    expect(numberWords(92, 'f')).toBe('dziewięćdziesiąt dwie');
  });

  it('12 ніколи не стає «dwie»', () => {
    expect(numberWords(12, 'f')).toBe('dwanaście');
  });

  it('складені на 1 (21, 31…) лишаються «jeden» для всіх родів', () => {
    for (const g of ['m', 'f', 'n'] as const) {
      expect(numberWords(21, g)).toBe('dwadzieścia jeden');
      expect(numberWords(91, g)).toBe('dziewięćdziesiąt jeden');
    }
  });

  it('усі інші числа не залежать від роду', () => {
    for (let n = 0; n <= 100; n++) {
      if (n === 1 || (n % 10 === 2 && n !== 12)) continue;
      expect(numberWords(n, 'f'), String(n)).toBe(numberWords(n, 'm'));
      expect(numberWords(n, 'n'), String(n)).toBe(numberWords(n, 'm'));
    }
  });
});

describe('numberWords: недопустимі значення', () => {
  it.each([-1, 101, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('кидає RangeError для %s', (n) => {
    expect(() => numberWords(n)).toThrow(RangeError);
    expect(() => numberGenitive(n)).toThrow(RangeError);
  });
});

describe('numberGenitive', () => {
  it('1–10, як у BRIEF («od trzech», «od siedmiu») і POLISH_COPY («od jednego», «do dziesięciu»)', () => {
    const expected = ['jednego', 'dwóch', 'trzech', 'czterech', 'pięciu', 'sześciu', 'siedmiu', 'ośmiu', 'dziewięciu', 'dziesięciu'];
    expected.forEach((word, i) => expect(numberGenitive(i + 1)).toBe(word));
  });

  it('20 і 100 — «do dwudziestu», «do stu»', () => {
    expect(numberGenitive(20)).toBe('dwudziestu');
    expect(numberGenitive(100)).toBe('stu');
  });

  it('11–19 і кругі десятки', () => {
    expect(numberGenitive(13)).toBe('trzynastu');
    expect(numberGenitive(19)).toBe('dziewiętnastu');
    expect(numberGenitive(30)).toBe('trzydziestu');
    expect(numberGenitive(50)).toBe('pięćdziesięciu');
    expect(numberGenitive(90)).toBe('dziewięćdziesięciu');
  });

  it('складені', () => {
    expect(numberGenitive(34)).toBe('trzydziestu czterech');
    expect(numberGenitive(21)).toBe('dwudziestu jeden');
    expect(numberGenitive(47)).toBe('czterdziestu siedmiu');
  });

  it('0 → «zera»', () => {
    expect(numberGenitive(0)).toBe('zera');
  });
});

describe('DIGIT_INSTRUMENTAL', () => {
  it('10 цифр, як у POLISH_COPY §8', () => {
    expect(DIGIT_INSTRUMENTAL).toHaveLength(10);
    expect(DIGIT_INSTRUMENTAL[7]).toBe('siódemką');
    expect(DIGIT_INSTRUMENTAL[0]).toBe('zerem');
  });
});
