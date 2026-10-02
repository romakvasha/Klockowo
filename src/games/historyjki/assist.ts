// Допомога в «Historyjki» (PEDAGOGY §2 п.14): 1-ша підказка — історія «програється» з лічильниками: Kubik лічить предмети першого кадру, а потім другого, продовжуючи
// («jeden, dwa… trzy, cztery, pięć»), і на кожному з'являється номерок; 2-га — у третьому кадрі з'являється рамка-десятка: «Zacznij od dwóch i licz dalej.» — і лічба
// далі, фішка за фішкою. Показ «разом» — те саме, що 2-га, плюс «Dwa dodać trzy równa się pięć.»; потім у третьому кадрі з'являється картка з прикладом.
// Сцена бачить `assist.step` (скільки вже названо) і `assist.level`.
import { addSentence, startFrom } from '../../speech/lines';
import { landings } from '../bigAdd';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import { isBigStory, storyAnswer, type StoryInstance } from './generate';

const BETWEEN_MS = 240;
const SHOW_MS = 500;

/** Лічба «від числа» в рамці: перша група вже лежить, Kubik називає a + 1, a + 2… */
async function countOn(instance: StoryInstance, ctx: AssistContext, mode: 'hint' | 'together', level: number): Promise<void> {
  const sum = storyAnswer(instance);
  ctx.setAssist({ mode, step: instance.a, level });
  await ctx.wait(SHOW_MS);
  await ctx.say(startFrom(instance.a), { interrupt: true });
  for (let k = instance.a + 1; k <= sum; k++) {
    ctx.setAssist({ mode, step: k, level });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** Двоцифрова історія (W7): Kubik називає зупинки на шляху до суми — десятки по +10, потім одиниці (34 + 10 → «czterdzieści cztery»; 38 + 5 → «czterdzieści, czterdzieści jeden…»). Сцена
 *  показує у третьому кадрі стовпчики й кубики поточного числа (з кроку 2 підказки — ще й мат з цифрами розрядів). */
async function bigLegs(instance: StoryInstance, ctx: AssistContext, mode: 'hint' | 'together', level: number): Promise<void> {
  const stops = landings(instance.a, instance.b);
  ctx.setAssist({ mode, step: 0, level });
  await ctx.wait(SHOW_MS);
  await ctx.say(startFrom(instance.a), { interrupt: true });
  for (let n = 1; n <= stops.length; n++) {
    ctx.setAssist({ mode, step: n, level });
    await ctx.say(numberWords(stops[n - 1]!), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** «Pomóż mi». nth = 1: лічба всіх предметів історії з номерками; nth ≥ 2: рамка-десятка й лічба «від числа». Двоцифрова історія — зупинки зі стовпчиками й кубиками. */
export async function hintStory(instance: StoryInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  if (isBigStory(instance)) {
    await bigLegs(instance, ctx, 'hint', level);
    return;
  }
  if (level >= 2) {
    await countOn(instance, ctx, 'hint', level);
    return;
  }
  const sum = storyAnswer(instance);
  for (let k = 1; k <= sum; k++) {
    ctx.setAssist({ mode: 'hint', step: k, level });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** Показ разом: лічба «від числа» на рамці й «Dwa dodać trzy równa się pięć.». */
export async function togetherStory(instance: StoryInstance, ctx: AssistContext): Promise<void> {
  if (isBigStory(instance)) {
    await bigLegs(instance, ctx, 'together', 2);
    await ctx.say(addSentence(instance.a, instance.b), { interrupt: true });
    return;
  }
  await countOn(instance, ctx, 'together', 2);
  await ctx.say(addSentence(instance.a, instance.b), { interrupt: true });
}

/** Номерки на предметах двох кадрів під час підказки 1: лічба 1…step йде через перший кадр і продовжується у другому. */
export function storyMarks(a: number, b: number, step: number): { first: (number | null)[]; second: (number | null)[] } {
  const label = (n: number): number | null => (n <= step ? n : null);
  return {
    first: Array.from({ length: a }, (_, i) => label(i + 1)),
    second: Array.from({ length: b }, (_, i) => label(a + i + 1)),
  };
}

/** Клітинки рамки в третьому кадрі: перші `a` — суцільні (перша група), далі `step − a` названих, решта цілої суми — тьмяні (що ще лічити). */
export function storyFrame(a: number, sum: number, step: number): ('solid' | 'dim' | 'empty')[] {
  const cells = sum > 10 ? 20 : 10;
  return Array.from({ length: cells }, (_, i) => (i < Math.max(a, step) ? 'solid' : i < sum ? 'dim' : 'empty'));
}
