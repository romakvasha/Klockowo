// Допомога в «Domek liczb» (PEDAGOGY §2 п.8): 1-ша підказка — під будиночком з'являються предмети цілого, відомі лягають у золоті кільця, Kubik лічить їх уголос
// й каже «Zacznij od trzech i licz dalej.»; 2-га — рамка-десятка, де відома частина — фішки, а місця, яких бракує, — тьмяні фішки. Показ «разом» — Kubik лічить
// тьмяні фішки й підсумовує «Trzy i pięć to osiem.», відповідь з'являється у віконці. Сцена бачить `assist.step` і `assist.level`.
import { houseQuestion, pairSum, startFrom } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import { houseAnswer, type HouseInstance } from './generate';

const BETWEEN_MS = 220;
const SHOW_MS = 600;

/** «Pomóż mi». nth = 1: предмети під будиночком, лічба відомої частини й «Zacznij od … i licz dalej.»; nth ≥ 2: рамка-десятка з тьмяними фішками. */
export async function hintHouse(instance: HouseInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  if (level <= 1) {
    ctx.setAssist({ mode: 'hint', step: 0, level });
    await ctx.wait(SHOW_MS); // предмети з'являються
    for (let k = 1; k <= instance.known; k++) {
      ctx.setAssist({ mode: 'hint', step: k, level });
      await ctx.say(numberWords(k), { interrupt: true });
      await ctx.wait(BETWEEN_MS);
    }
    await ctx.say(startFrom(instance.known), { interrupt: true });
    return;
  }
  ctx.setAssist({ mode: 'hint', step: 0, level });
  await ctx.say(houseQuestion(instance.whole, instance.known), { interrupt: true });
}

/** Показ разом: на рамці лічимо тьмяні фішки (скільки бракує) і підсумовуємо «Trzy i pięć to osiem.»; відповідь лишається у віконці. */
export async function togetherHouse(instance: HouseInstance, ctx: AssistContext): Promise<void> {
  const answer = houseAnswer(instance);
  ctx.setAssist({ mode: 'together', step: 0 });
  await ctx.wait(SHOW_MS);
  for (let k = 1; k <= answer; k++) {
    ctx.setAssist({ mode: 'together', step: k });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  await ctx.say(pairSum(instance.known, answer), { interrupt: true });
}

/** Номери на комірках рамки під час лічби разом: `step` перших тьмяних комірок (після відомої частини) отримують 1, 2, 3… */
export function frameMarks(known: number, answer: number, step: number, cells: number): (number | null)[] {
  const marks: (number | null)[] = Array.from({ length: cells }, () => null);
  for (let j = 1; j <= Math.min(step, answer); j++) marks[known + j - 1] = j;
  return marks;
}
