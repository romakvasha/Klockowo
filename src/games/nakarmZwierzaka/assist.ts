// Допомога в «Nakarm zwierzaka» (PEDAGOGY §2 п.5): 1-ша підказка — Kubik лічить уголос те, що вже лежить на тарілці; 2-га — на тарілці з'являються
// слоти рамки-десятки (лишаються до кінця завдання). Показ «разом» — Kubik кладе їжу по одній на порожню тарілку, лічачи вголос.
import { feedAnimal, quantityLine } from '../../speech/lines';
import { ANIMALS, OBJECTS } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import { hintBoxes, togetherBoxes } from './assistBoxes';
import type { FeedInstance } from './generate';

const BETWEEN_MS = 180;

/** «Pomóż mi». nth = 1: лічить те, що лежить на тарілці («jeden, dwa, trzy…»). nth ≥ 2: показує слоти й нагадує завдання. */
export async function hintFeed(instance: FeedInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  if (instance.boxes) return hintBoxes(instance, ctx, info);
  if (info.nth <= 1) {
    const onPlate = info.response ?? 0;
    for (let k = 1; k <= onPlate; k++) {
      ctx.setAssist({ mode: 'hint', step: k, level: 1 });
      await ctx.say(numberWords(k), { interrupt: true });
      await ctx.wait(BETWEEN_MS);
    }
    if (onPlate === 0) await ctx.say(feedAnimal(ANIMALS[instance.animal], instance.n, OBJECTS[instance.food]), { interrupt: true });
    return;
  }
  ctx.setAssist({ mode: 'hint', step: 0, level: 2 });
  await ctx.say(feedAnimal(ANIMALS[instance.animal], instance.n, OBJECTS[instance.food]), { interrupt: true });
}

/** Показ разом: на тарілку лягає по одному предмету з голосом «jeden, dwa…», наприкінці — «Pięć jabłek.»; правильну кількість лишено, дитина лише торкається «Gotowe». */
export async function togetherFeed(instance: FeedInstance, ctx: AssistContext): Promise<void> {
  if (instance.boxes) return togetherBoxes(instance, ctx);
  for (let k = 1; k <= instance.n; k++) {
    ctx.setAssist({ mode: 'together', step: k });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  await ctx.say(quantityLine(instance.n, OBJECTS[instance.food]), { interrupt: true });
}
