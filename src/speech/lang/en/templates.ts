// Англійські шаблони фраз — ті самі функції, що й польські в speech/lines.ts (LineTemplates). Числа — словами (./numbers), однина лише для 1.
import type { LineTemplates } from '../../lines';
import { EN_LINES } from './lines';
import { EN_NOUNS } from './nouns';
import { cap, isOne, numberWords as nw, quantity, times } from './numbers';

const L = EN_LINES;

const pairSum = (a: number, b: number): string => `${cap(nw(a))} and ${nw(b)} make ${nw(a + b)}.`;
const byWord = (delta: number): string => (Math.abs(delta) === 10 ? 'ten' : 'one');

export const EN_TEMPLATES: LineTemplates = {
  pileLabel: (animal) => `${animal.one} — pile`,
  wagonLabel: (n) => `carriage ${nw(n)}`,
  changePlayerLabel: (name) => `${name ?? L.PROFILE_NO_NAME} — change player`,
  bonesLabel: (filled, total) => `${L.LABELS.bones}: ${filled} of ${total}`,
  profileMapLabel: (name) => `${name} — map`,
  thereIs: (n, noun) => {
    if (n === 0) return `There are no ${noun.many}.`;
    return `There ${isOne(n) ? 'is' : 'are'} ${quantity(n, noun)}!`;
  },
  missionLine: (id, noun) => {
    if (id === 'kaczuszka') return L.MISSION_LINES.ducklings;
    if (id === 'rybka') return L.MISSION_LINES.fish;
    return `The ${noun.many} are waiting for you! Will you help count them?`;
  },
  stickerLabel: (animal) => `Sticker — ${animal.one}`,
  flashReveal: (groups) => {
    const [a, b] = groups;
    if (a === undefined) return '';
    if (b === undefined) return `${cap(nw(a))}.`;
    return pairSum(a, b);
  },
  quantityLine: (n, noun) => `${cap(quantity(n, noun))}.`,
  praiseCorrect: (n, noun, praise) => `${praise ?? L.PRAISE[0]} ${cap(quantity(n, noun))}.`,
  countOnPraise: (from) => `You count on from ${nw(from)} — clever!`,
  countTouch: (noun) => `Count the ${noun.many}. Touch them one by one. How many ${noun.many} are there?`,
  countLabel: (noun) => `Count the ${noun.many}`,
  feedAnimal: (animal, n, noun) => `Give ${animal.dat} ${quantity(n, noun)}.`,
  whoHasMore: (noun) => `Who has more ${noun.many}?`,
  whoHasLess: (noun) => `Who has fewer ${noun.many}?`,
  animalHas: (animal, n) => `${cap(animal.dat)} has ${nw(n)}.`,
  compareAnswer: (winner, more, noun) => (winner === null ? 'the same' : `${winner.dat} has ${more ? 'more' : 'fewer'} ${noun.many}`),
  pairSum,
  bridgeTen: (a, b) => {
    if (a >= 10 || a + b <= 10) throw new RangeError(`bridgeTen: expected a < 10 < a + b, got ${a} + ${b}`);
    const toTen = 10 - a;
    return `${pairSum(a, toTen)} And ${nw(b - toTen)} more — ${nw(a + b)}.`;
  },
  houseQuestion: (whole, part) => `${cap(nw(whole))} is ${nw(part)} and how many more?`,
  twoGroups: (a, b, noun) => `${cap(quantity(a, noun))} and ${quantity(b, noun)}. How many altogether?`,
  sumQuestion: (a, b) => `What is ${nw(a)} plus ${nw(b)}?`,
  startFrom: (n) => `Start from ${nw(n)} and count on.`,
  addSentence: (a, b) => `${cap(nw(a))} plus ${nw(b)} equals ${nw(a + b)}.`,
  padLabel: (n) => `lily pad ${nw(n)}`,
  jumpLabel: (n) => `jump ${nw(n)}`,
  rocketFlight: (start, k) => `The rocket is on number ${nw(start)}. It flies ${nw(k)} further. Where will it land?`,
  frogJump: (start, jumps) => `The frog is on number ${nw(start)}. It jumps ${times(jumps)}. Where will it land?`,
  howManyMissing: (to) => `How many more to make ${nw(to)}?`,
  packInstruction: (noun) => `Pack the ${noun.many} in tens.`,
  howManyTogether: (noun) => `How many ${noun.many} are there altogether?`,
  buildNumber: (n) => `Build the number ${nw(n)}.`,
  paintDigit: (digit) => `Colour the numbers that end in ${nw(digit)}.`,
  allWithDigit: (digit) => `All the numbers that end in ${nw(digit)}.`,
  neighborQuestion: (base, delta) => `Here is ${nw(base)}. Which number is ${byWord(delta)} ${delta > 0 ? 'more' : 'less'}?`,
  neighborAnswer: (base, delta) => `${cap(nw(base))}, ${byWord(delta)} ${delta > 0 ? 'more' : 'less'} is ${nw(base + delta)}.`,
  placeValue: (n) => `${cap(quantity(Math.floor(n / 10), EN_NOUNS.DZIESIATKA))} and ${quantity(n % 10, EN_NOUNS.JEDNOSC)} make ${nw(n)}.`,
  findNumber: (n) => `Find the number ${nw(n)}.`,
  breakLine: (verb, n) => `${verb} ${times(n)}!`,
};
