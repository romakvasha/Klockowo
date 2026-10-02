// Допомога Kubika в «Cyfra i obrazek» (PEDAGOGY §2 п.3): 1-ша підказка — Kubik лічить уголос один набір (той, де пари ще нема чи вона хибна);
// 2-га — «лічимо разом»: усі набори, що ще без правильної пари; показ «разом» — лічить кожен набір і сам з'єднує його з цифрою.
// Сцена бачить assist.focus (який набір) і assist.step (скільки вже пораховано; step = кількість + 1 — «пару з'єднано»).
import { GAME_PROMPTS } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { Assist, AssistContext, HelpInfo } from '../engine/types';
import type { MatchInstance } from './generate';
import { decodeLinks, wrongSets } from './match';

const BETWEEN_MS = 180;

/** Який набір лічить 1-ша підказка: перший без правильної пари; якщо всі вже правильні — перший. */
export function hintTarget(correct: readonly number[], links: readonly (number | null)[]): number {
  return wrongSets(correct, links)[0] ?? 0;
}

/** Набори, які лічить 2-га підказка: усі без правильної пари (коли таких нема — усі). */
export function hintTargets(correct: readonly number[], links: readonly (number | null)[]): number[] {
  const bad = wrongSets(correct, links);
  return bad.length > 0 ? bad : correct.map((_, i) => i);
}

/** Kubik лічить набір `i` («jeden, dwa, trzy»); порожній набір — «Tu nic nie ma.» Сцена на кожен крок показує лічильник на картці. */
async function countSet(instance: MatchInstance, i: number, ctx: AssistContext, mode: 'hint' | 'together', level?: number): Promise<void> {
  const n = instance.sets[i]!.count;
  const at = (step: number): Assist => ({ mode, step, focus: i, ...(level === undefined ? {} : { level }) });
  if (n === 0) {
    ctx.setAssist(at(0));
    await ctx.say(GAME_PROMPTS.matchEmpty, { interrupt: true });
    return;
  }
  for (let t = 1; t <= n; t++) {
    ctx.setAssist(at(t));
    await ctx.say(numberWords(t), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** «Pomóż mi». nth = 1: лічить один набір. nth ≥ 2: лічить усі набори без правильної пари. Цифру дитина вибирає сама. */
export async function hintMatch(instance: MatchInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const links = decodeLinks(info.response, instance.sets.length);
  if (info.nth <= 1) {
    await countSet(instance, hintTarget(instance.correct, links), ctx, 'hint', 1);
    return;
  }
  for (const i of hintTargets(instance.correct, links)) {
    await countSet(instance, i, ctx, 'hint', 2);
    await ctx.wait(300);
  }
}

/** Після другої помилки: Kubik лічить кожен набір і одразу з'єднує його з цифрою (step = кількість + 1). Хибні пари дитини сцена прибирає. */
export async function togetherMatch(instance: MatchInstance, ctx: AssistContext): Promise<void> {
  for (let i = 0; i < instance.sets.length; i++) {
    await countSet(instance, i, ctx, 'together');
    ctx.setAssist({ mode: 'together', focus: i, step: instance.sets[i]!.count + 1 });
    await ctx.wait(450);
  }
}
