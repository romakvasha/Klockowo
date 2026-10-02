// Числівники словами (0–100) для голосу. У TTS ніколи не передаємо цифри (POLISH_COPY §8):
// «2 gruszki» прозвучало б «dwa gruszki». Рід має значення лише для 1 і 2.

export type Gender = 'm' | 'f' | 'n';

const UNITS = ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'] as const;
const TEENS = [
  'dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście',
  'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście',
] as const;
const TENS = [
  '', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści',
  'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt',
] as const;
const ONE: Record<Gender, string> = { m: 'jeden', f: 'jedna', n: 'jedno' };

// Dopełniacz («od pięciu», «do dziesięciu»): лише для фраз, яким він потрібен.
const GEN_UNITS = ['zera', 'jednego', 'dwóch', 'trzech', 'czterech', 'pięciu', 'sześciu', 'siedmiu', 'ośmiu', 'dziewięciu'] as const;
const GEN_TEENS = [
  'dziesięciu', 'jedenastu', 'dwunastu', 'trzynastu', 'czternastu',
  'piętnastu', 'szesnastu', 'siedemnastu', 'osiemnastu', 'dziewiętnastu',
] as const;
const GEN_TENS = [
  '', '', 'dwudziestu', 'trzydziestu', 'czterdziestu',
  'pięćdziesięciu', 'sześćdziesięciu', 'siedemdziesięciu', 'osiemdziesięciu', 'dziewięćdziesięciu',
] as const;

/** Назви цифр у орудному відмінку — для «z … na końcu» (POLISH_COPY §8). */
export const DIGIT_INSTRUMENTAL = [
  'zerem', 'jedynką', 'dwójką', 'trójką', 'czwórką', 'piątką', 'szóstką', 'siódemką', 'ósemką', 'dziewiątką',
] as const;

function at<T>(list: readonly T[], i: number): T {
  const v = list[i];
  if (v === undefined) throw new RangeError(`numberWords: no entry for index ${i}`);
  return v;
}

function assertCount(n: number): void {
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    throw new RangeError(`numberWords: expected an integer from 0 to 100, got ${n}`);
  }
}

/** Одиниця 0–9. Рід: 1 → jeden/jedna/jedno лише окремо (у складених — завжди «jeden»: «dwadzieścia jeden jabłek»),
 *  2 → dwa/dwie (dwie і у складених: «dwadzieścia dwie gruszki»). */
function unitWord(u: number, gender: Gender, inCompound: boolean): string {
  if (u === 1) return inCompound ? 'jeden' : ONE[gender];
  if (u === 2 && gender === 'f') return 'dwie';
  return at(UNITS, u);
}

/** Числа іншої мови (speech/language.ts); null — польські. */
let localized: ((n: number, gender: Gender) => string) | null = null;

/** Викликає лише speech/language.ts. */
export function setNumberWords(next: ((n: number, gender: Gender) => string) | null): void {
  localized = next;
}

/** Число словами: 0–100. Без іменника рід не потрібен (за замовчуванням чоловічий — «jeden, dwa, trzy»). Мовою гри: інша мова підставляє свої слова. */
export function numberWords(n: number, gender: Gender = 'm'): string {
  if (localized) return localized(n, gender);
  assertCount(n);
  if (n === 100) return 'sto';
  if (n >= 20) {
    const tens = at(TENS, Math.floor(n / 10));
    const u = n % 10;
    return u === 0 ? tens : `${tens} ${unitWord(u, gender, true)}`;
  }
  if (n >= 10) return at(TEENS, n - 10);
  return unitWord(n, gender, false);
}

/** Число в родовому відмінку: «od pięciu», «do dziesięciu», «do stu». Складені — за правильною схемою
 *  («dwudziestu czterech»); у складених на 1 — «jeden» («dwudziestu jeden»). */
export function numberGenitive(n: number): string {
  assertCount(n);
  if (n === 100) return 'stu';
  if (n >= 20) {
    const tens = at(GEN_TENS, Math.floor(n / 10));
    const u = n % 10;
    if (u === 0) return tens;
    return `${tens} ${u === 1 ? 'jeden' : at(GEN_UNITS, u)}`;
  }
  if (n >= 10) return at(GEN_TEENS, n - 10);
  return at(GEN_UNITS, n);
}
