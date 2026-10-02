// Допомога в «Kto ma więcej?» (PEDAGOGY §2 п.6): 1-ша підказка — предмети стають парами; 2-га — зайві ще й світяться; показ «разом» — пари, сяйво зайвих
// і репліка з відповіддю. У режимі цифр купок спершу нема: 1-ша підказка лише називає числа, купки з'являються з 2-ї. Сцена бачить `assist.step`:
// 0 — купки, 1 — пари, 2 — пари й сяйво зайвих (`assist.level` — номер підказки).
import { animalHas, compareAnswer } from '../../speech/lines';
import { ANIMALS, OBJECTS } from '../../speech/nouns';
import type { AssistContext, HelpInfo } from '../engine/types';
import { winnerSide, type CompareInstance } from './generate';

const PAIR_MS = 900;

/** Репліка-відповідь («Miś ma więcej marchewek.», «Tyle samo.») для показу «разом» і похвали. */
export function resultText(instance: CompareInstance): string {
  const side = winnerSide(instance);
  const winner = side === null ? null : ANIMALS[instance.animals[side]];
  return compareAnswer(winner, instance.ask === 'more', OBJECTS[instance.item]);
}

export const sentence = (text: string): string => `${text.charAt(0).toLocaleUpperCase('pl')}${text.slice(1)}.`;

export async function hintCompare(instance: CompareInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  if (instance.show === 'digits' && level === 1) {
    // цифри: Kubik називає, скільки в кого
    for (const side of [0, 1] as const) {
      ctx.setAssist({ mode: 'hint', step: 0, level, focus: side });
      await ctx.say(animalHas(ANIMALS[instance.animals[side]], instance.counts[side]), { interrupt: true });
    }
    return;
  }
  ctx.setAssist({ mode: 'hint', step: 1, level });
  await ctx.wait(PAIR_MS);
  if (level >= 2) {
    ctx.setAssist({ mode: 'hint', step: 2, level });
    await ctx.wait(PAIR_MS * 1.6);
    return;
  }
  await ctx.wait(PAIR_MS);
}

/** Показ разом: предмети стають парами, зайві світяться, Kubik каже, хто має більше (чи що порівну); відповідь дитина завершує сама. */
export async function togetherCompare(instance: CompareInstance, ctx: AssistContext): Promise<void> {
  ctx.setAssist({ mode: 'together', step: 1 });
  await ctx.wait(PAIR_MS);
  ctx.setAssist({ mode: 'together', step: 2 });
  await ctx.wait(500);
  await ctx.say(sentence(resultText(instance)), { interrupt: true });
}
