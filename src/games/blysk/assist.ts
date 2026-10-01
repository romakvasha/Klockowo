// Допомога в «Błysk!» (PEDAGOGY §2 п.2): спалах — вступний показ після інструкції; 1-ша підказка — довший спалах; 2-га — картка лишається
// видимою з обведеними групами; показ «разом» — картка видима з групами, Kubik читає «trzy i dwa to pięć».
import { flashReveal } from '../../speech/lines';
import type { AssistContext, HelpInfo } from '../engine/types';
import type { FlashInstance } from './generate';

/** Скільки мс триває довший спалах підказки: удвічі довше за звичайний плюс запас, але не менше 2,5 с. */
export function longFlashMs(exposureMs: number): number {
  return Math.max(2500, Math.round(exposureMs * 2 + 600));
}

/** Вступний показ: картка з'являється на `exposureMs` і повертається зворотом. */
export async function introFlash(instance: FlashInstance, ctx: AssistContext): Promise<void> {
  ctx.setAssist({ mode: 'intro', step: 1 });
  await ctx.wait(instance.exposureMs);
  ctx.setAssist({ mode: 'intro', step: 2 });
}

/** «Pomóż mi»: 1-ша — довший спалах; 2-га й далі — картка залишається з обведеними групами (сцена пам'ятає це після кінця допомоги). */
export async function hintFlash(instance: FlashInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  if (info.nth <= 1) {
    ctx.setAssist({ mode: 'hint', step: 1, level: 1 });
    await ctx.wait(longFlashMs(instance.exposureMs));
    return;
  }
  ctx.setAssist({ mode: 'hint', step: 1, level: 2 });
  await ctx.wait(1400);
}

/** Показ разом: картка з групами й голос «Trzy i dwa to pięć.»; правильну плитку підсвічує рушій. */
export async function togetherFlash(instance: FlashInstance, ctx: AssistContext): Promise<void> {
  ctx.setAssist({ mode: 'together', step: 1 });
  await ctx.wait(500);
  await ctx.say(flashReveal(instance.groups), { interrupt: true });
}
