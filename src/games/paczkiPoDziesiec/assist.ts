// Допомога в «Paczki po dziesięć» (PEDAGOGY §2 п.12): 1-ша підказка — десятки лічаться разом: коробки (чи стовпчики) по черзі підсвічуються, Kubik каже «dziesięć, dwadzieścia…»;
// 2-га — мат «dziesiątki | jedności» з цифрами розрядів і «Cztery dziesiątki i siedem jedności to czterdzieści siedem.». Показ «разом» — Kubik пакує все, лічить десятки,
// далі одиниці «від десятків» («czterdzieści jeden…») і читає розряди. У зворотному режимі (build) підказки показують на мат і розряди, «разом» — сам збирає.
// Сцена бачить `assist.step` (сенс залежить від фази, див. `phase`) і `assist.level`.
import { placeValue } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import { digitsOf, type PackInstance } from './generate';

const SHOW_MS = 600;
const BETWEEN_MS = 280;

/** Що називає лічба десятками: 10, 20, 30… до `tens * 10`. */
export const tensCount = (k: number): string => numberWords(k * 10);

async function countTens(tens: number, ctx: AssistContext, mode: 'hint' | 'together', level: number): Promise<void> {
  for (let k = 1; k <= tens; k++) {
    ctx.setAssist({ mode, step: k, level });
    await ctx.say(tensCount(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** «Pomóż mi». nth = 1: лічба десятками (коробки/стовпчики підсвічуються); nth ≥ 2: мат із розрядами й «Cztery dziesiątki і siedem jedności to czterdzieści siedem.». */
export async function hintPack(instance: PackInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  const { tens } = digitsOf(instance.total);
  ctx.setAssist({ mode: 'hint', step: 0, level });
  await ctx.wait(SHOW_MS);
  if (level >= 2) {
    await ctx.say(placeValue(instance.total), { interrupt: true });
    return;
  }
  await countTens(tens, ctx, 'hint', level);
}

/** Показ разом: десятки («dziesięć, dwadzieścia…»), далі одиниці від десятків («czterdzieści jeden…») і підсумок за розрядами. Сцена: step 1…tens — десятки, далі tens + 1…tens + ones — одиниці. */
export async function togetherPack(instance: PackInstance, ctx: AssistContext): Promise<void> {
  const { tens, ones } = digitsOf(instance.total);
  ctx.setAssist({ mode: 'together', step: 0 });
  await ctx.wait(SHOW_MS);
  await countTens(tens, ctx, 'together', 1);
  for (let j = 1; j <= ones; j++) {
    ctx.setAssist({ mode: 'together', step: tens + j, level: 1 });
    await ctx.say(numberWords(tens * 10 + j), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  await ctx.say(placeValue(instance.total), { interrupt: true });
}

/** Скільки коробок упаковано, коли допомога щойно змінилась: підказка й «разом» пакують усе, що можна. */
export const boxesFor = (total: number): number => digitsOf(total).tens;
