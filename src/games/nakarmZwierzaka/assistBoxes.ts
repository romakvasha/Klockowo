// Допомога в «Nakarm zwierzaka» з коробками по 10 (PEDAGOGY §2 п.5, W5): 1-ша підказка — Kubik лічить те, що лежить на тарілці, десятками, далі одиниці
// («dziesięć, dwadzieścia, trzydzieści, trzydzieści jeden…»); 2-га — називає розряди («Trzy dziesiątki i cztery jedności to trzydzieści cztery») і підсвічує джерело
// (стос коробок чи купку їжі), з якого ще брати. Показ «разом» — Kubik кладе спершу коробки, далі предмети поштучно, лічачи вголос. Сцена бачить `assist.step` (див. `boxCounts`) і `assist.level`.
import { feedAnimal, placeValue, quantityLine } from '../../speech/lines';
import { ANIMALS, OBJECTS } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import type { FeedInstance } from './generate';

const BETWEEN_MS = 180;

/** Скільки коробок і предметів поштучно названо на кроці `step` лічби тарілки з `boxes` десятками й `ones` одиницями. */
export function boxCounts(step: number, boxes: number, ones: number): { boxes: number; ones: number } {
  const b = Math.min(step, boxes);
  return { boxes: b, ones: Math.max(0, Math.min(ones, step - boxes)) };
}

/** Число, яке звучить на кроці `step`: «dziesięć, dwadzieścia…», далі «від десятків» — «trzydzieści jeden…». */
export function boxStepWords(step: number, boxes: number): string {
  return numberWords(step <= boxes ? step * 10 : boxes * 10 + (step - boxes));
}

/** «Pomóż mi». nth = 1: лічба того, що лежить на тарілці (десятки, потім одиниці). nth ≥ 2: розряди числа тваринки, світиться джерело, з якого ще брати. */
export async function hintBoxes(instance: FeedInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  if (info.nth <= 1) {
    const onPlate = info.response ?? 0;
    const boxes = Math.floor(onPlate / 10);
    const steps = boxes + (onPlate % 10);
    for (let k = 1; k <= steps; k++) {
      ctx.setAssist({ mode: 'hint', step: k, level: 1 });
      await ctx.say(boxStepWords(k, boxes), { interrupt: true });
      await ctx.wait(BETWEEN_MS);
    }
    if (steps === 0) await ctx.say(feedAnimal(ANIMALS[instance.animal], instance.n, OBJECTS[instance.food]), { interrupt: true });
    return;
  }
  ctx.setAssist({ mode: 'hint', step: 0, level: 2 });
  await ctx.say(placeValue(instance.n), { interrupt: true });
}

/** Показ разом: коробки по одній («dziesięć, dwadzieścia…»), далі предмети поштучно, наприкінці — «Trzydzieści cztery jabłka.»; кількість лишено, дитина лише торкається «Gotowe». */
export async function togetherBoxes(instance: FeedInstance, ctx: AssistContext): Promise<void> {
  const tens = Math.floor(instance.n / 10);
  const steps = tens + (instance.n % 10);
  for (let k = 1; k <= steps; k++) {
    ctx.setAssist({ mode: 'together', step: k });
    await ctx.say(boxStepWords(k, tens), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  await ctx.say(quantityLine(instance.n, OBJECTS[instance.food]), { interrupt: true });
}
