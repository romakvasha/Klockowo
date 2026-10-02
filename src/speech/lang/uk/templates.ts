// Українські шаблони фраз — ті самі функції, що й польські в speech/lines.ts (LineTemplates). Числа — словами (./numbers), узгодження — Intl.PluralRules('uk').
// Будову речень обрано так, щоб не потребувати складних відмінків: «Скільки тут сонечок?» замість «Полічи сонечок/сонечка», «— це п'ять» замість «дорівнює п'яти».
import type { LineTemplates } from '../../lines';
import { UK_LINES } from './lines';
import { UK_NOUNS } from './nouns';
import { and, cap, numberGenitive, numberWords as nw, quantity, times } from './numbers';

const L = UK_LINES;

const pairSum = (a: number, b: number): string => `${and(cap(nw(a)), nw(b))} — це ${nw(a + b)}.`;
const byWord = (delta: number): string => (Math.abs(delta) === 10 ? 'десять' : 'один');

export const UK_TEMPLATES: LineTemplates = {
  pileLabel: (animal) => `${animal.one} — купка`,
  wagonLabel: (n) => `вагон ${nw(n)}`,
  changePlayerLabel: (name) => `${name ?? L.PROFILE_NO_NAME} — змінити гравця`,
  bonesLabel: (filled, total) => `${L.LABELS.bones}: ${filled} з ${total}`,
  profileMapLabel: (name) => `${name} — мапа`,
  thereIs: (n, noun) => (n === 0 ? `Тут немає ${noun.many}.` : `Тут ${quantity(n, noun)}!`),
  missionLine: (id, noun) => {
    if (id === 'kaczuszka') return L.MISSION_LINES.ducklings;
    if (id === 'rybka') return L.MISSION_LINES.fish;
    return `${cap(noun.few)} чекають на тебе! Допоможеш їх полічити?`;
  },
  stickerLabel: (animal) => `Наліпка — ${animal.one}`,
  flashReveal: (groups) => {
    const [a, b] = groups;
    if (a === undefined) return '';
    if (b === undefined) return `${cap(nw(a))}.`;
    return pairSum(a, b);
  },
  quantityLine: (n, noun) => `${cap(quantity(n, noun))}.`,
  praiseCorrect: (n, noun, praise) => `${praise ?? L.PRAISE[0]} ${cap(quantity(n, noun))}.`,
  countOnPraise: (from) => `Лічиш далі від ${numberGenitive(from)} — кмітливо!`,
  countTouch: (noun) => `Скільки тут ${noun.many}? Торкайся по черзі й лічи.`,
  countLabel: (noun) => `Скільки тут ${noun.many}`,
  feedAnimal: (animal, n, noun) => `Дай ${animal.dat} ${quantity(n, noun, true)}.`,
  whoHasMore: (noun) => `У кого більше ${noun.many}?`,
  whoHasLess: (noun) => `У кого менше ${noun.many}?`,
  animalHas: (animal, n) => `${cap(animal.one)} має ${nw(n)}.`,
  compareAnswer: (winner, more, noun) => (winner === null ? 'порівну' : `${winner.one} має ${more ? 'більше' : 'менше'} ${noun.many}`),
  pairSum,
  bridgeTen: (a, b) => {
    if (a >= 10 || a + b <= 10) throw new RangeError(`bridgeTen: expected a < 10 < a + b, got ${a} + ${b}`);
    const toTen = 10 - a;
    return `${pairSum(a, toTen)} І ще ${nw(b - toTen)} — ${nw(a + b)}.`;
  },
  houseQuestion: (whole, part) => `${cap(nw(whole))} — це ${and(nw(part), 'скільки')}?`,
  twoGroups: (a, b, noun) => `${and(cap(quantity(a, noun)), quantity(b, noun))}. Скільки разом?`,
  sumQuestion: (a, b) => `Скільки буде ${nw(a)} додати ${nw(b)}?`,
  startFrom: (n) => `Почни з ${and(numberGenitive(n), 'лічи далі')}.`,
  addSentence: (a, b) => `${cap(nw(a))} додати ${nw(b)} — це ${nw(a + b)}.`,
  padLabel: (n) => `листок ${nw(n)}`,
  jumpLabel: (n) => `стрибок ${nw(n)}`,
  rocketFlight: (start, k) => `Ракета на числі ${nw(start)}. Вона летить на ${nw(k)} далі. Де вона приземлиться?`,
  frogJump: (start, jumps) => `Жабка на числі ${nw(start)}. Вона стрибає ${times(jumps)}. Де вона опиниться?`,
  howManyMissing: (to) => `Скільки бракує до ${numberGenitive(to)}?`,
  packInstruction: (noun) => `Запакуй ${noun.few} по десять.`,
  howManyTogether: (noun) => `Скільки ${noun.many} разом?`,
  buildNumber: (n) => `Склади число ${nw(n)}.`,
  paintDigit: (digit) => `Розфарбуй числа, які закінчуються на ${nw(digit)}.`,
  allWithDigit: (digit) => `Усі числа, які закінчуються на ${nw(digit)}.`,
  neighborQuestion: (base, delta) => `Ось число ${nw(base)}. Яке число на ${byWord(delta)} ${delta > 0 ? 'більше' : 'менше'}?`,
  neighborAnswer: (base, delta) => `${cap(nw(base))}, на ${byWord(delta)} ${delta > 0 ? 'більше' : 'менше'} — це ${nw(base + delta)}.`,
  placeValue: (n) => `${and(cap(quantity(Math.floor(n / 10), UK_NOUNS.DZIESIATKA)), quantity(n % 10, UK_NOUNS.JEDNOSC))} — це ${nw(n)}.`,
  findNumber: (n) => `Знайди число ${nw(n)}.`,
  breakLine: (verb, n) => `${verb} ${times(n)}!`,
};
