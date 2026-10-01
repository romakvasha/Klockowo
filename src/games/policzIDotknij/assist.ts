// Допомога Kubika в «Policz i dotknij» (PEDAGOGY §2 п.1, BRIEF §7): підказка — лише перші 2–3 предмети, показ «разом» — усі.
// Сцена бачить `assist.step` і сама додає предмети до зарахованих у порядку лічби; тут — лише голос і темп.
import { OBJECTS } from '../../speech/nouns';
import { thereIs } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext } from '../engine/types';
import type { CountInstance } from './generate';

const BETWEEN_MS = 180;

/** Скільки предметів Kubik лічить у підказці: до трьох, але ніколи не всі — відповідь дитина дає сама. */
export function hintSteps(count: number): number {
  if (count <= 1) return 1;
  return count <= 3 ? count - 1 : 3;
}

/** «Pomóż mi»: Kubik лічить уголос перші предмети (спершу голос сказав «Patrz, pokażę ci.»); решту дитина продовжує сама. */
export async function hintCount(instance: CountInstance, ctx: AssistContext): Promise<void> {
  const steps = hintSteps(instance.count);
  for (let k = 1; k <= steps; k++) {
    ctx.setAssist({ mode: 'hint', step: k });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** Після другої помилки: Kubik лічить усі предмети, а тоді називає підсумок; правильну плитку підсвічує рушій (step = count + 1). */
export async function togetherCount(instance: CountInstance, ctx: AssistContext): Promise<void> {
  for (let k = 1; k <= instance.count; k++) {
    ctx.setAssist({ mode: 'together', step: k });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  ctx.setAssist({ mode: 'together', step: instance.count + 1 });
  await ctx.say(thereIs(instance.count, OBJECTS[instance.object]), { interrupt: true });
}
