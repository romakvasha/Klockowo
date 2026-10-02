// Допомога в «Zrób dziesiątkę» (PEDAGOGY §2 п.11): 1-ша підказка — відомі фішки видно (у режимі цифр рамка «відкривається»), порожні комірки пульсують, Kubik питає
// «Ile brakuje do pełnej dziesiątki?»; 2-га — Kubik лічить порожні комірки разом («jeden, dwa, trzy…»), на кожній з'являється номер. Показ «разом» — Kubik докладає
// фішки по одній, лічачи, і підсумовує «Siedem i trzy to dziesięć.»; дитина лише торкається «Gotowe». Сцена бачить `assist.step` і `assist.level`.
import { GAME_PROMPTS, pairSum } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import { TEN, missing, type TenInstance } from './generate';

const SHOW_MS = 600;
const BETWEEN_MS = 260;

/** «Pomóż mi». nth = 1: порожні комірки пульсують + питання; nth ≥ 2: Kubik лічить порожні комірки (номер на кожній). */
export async function hintTen(instance: TenInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  ctx.setAssist({ mode: 'hint', step: 0, level });
  await ctx.wait(SHOW_MS);
  if (level <= 1) {
    await ctx.say(GAME_PROMPTS.untilTen, { interrupt: true });
    return;
  }
  for (let k = 1; k <= missing(instance); k++) {
    ctx.setAssist({ mode: 'hint', step: k, level });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** Показ разом: фішки лягають по одній із лічбою «jeden, dwa…»; наприкінці — «Siedem i trzy to dziesięć.». */
export async function togetherTen(instance: TenInstance, ctx: AssistContext): Promise<void> {
  ctx.setAssist({ mode: 'together', step: 0 });
  await ctx.wait(SHOW_MS);
  for (let k = 1; k <= missing(instance); k++) {
    ctx.setAssist({ mode: 'together', step: k });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  await ctx.say(pairSum(instance.known, missing(instance)), { interrupt: true });
}

export interface FrameView {
  /** Стан кожної з 10 комірок. */
  cells: ('solid' | 'empty')[];
  /** Номери на комірках (лічба разом / підказка 2); null — без номера. */
  marks: (number | null)[];
}

/** Що малює сцена: `added` фішок докладено; відомі видно (`knownShown`) — вони займають перші комірки, докладені — наступні; інакше докладені лягають із першої.
 *  `marks`: під час підказки 2 номери 1…step на порожніх комірках, під час показу «разом» — на докладених. */
export function frameView(
  known: number,
  added: number,
  opts: { knownShown: boolean; hintStep: number; togetherStep: number },
): FrameView {
  const cells: ('solid' | 'empty')[] = Array.from({ length: TEN }, () => 'empty');
  const marks: (number | null)[] = Array.from({ length: TEN }, () => null);
  const first = opts.knownShown ? known : 0;
  if (opts.knownShown) for (let i = 0; i < known; i++) cells[i] = 'solid';
  for (let j = 0; j < added && first + j < TEN; j++) {
    cells[first + j] = 'solid';
    if (opts.togetherStep > 0 && j < opts.togetherStep) marks[first + j] = j + 1;
  }
  for (let j = 0; j < opts.hintStep; j++) {
    const at = first + added + j;
    if (at < TEN && cells[at] === 'empty') marks[at] = j + 1;
  }
  return { cells, marks };
}
