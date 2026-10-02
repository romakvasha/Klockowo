// Допомога в «Zrób dziesiątkę» (PEDAGOGY §2 п.11): 1-ша підказка — відомі фішки видно (у режимі цифр рамка «відкривається»), порожні комірки пульсують, Kubik питає
// «Ile brakuje do pełnej dziesiątki?»; 2-га — Kubik лічить порожні комірки разом («jeden, dwa, trzy…»), на кожній з'являється номер. Показ «разом» — Kubik докладає
// фішки по одній, лічачи, і підсумовує «Siedem i trzy to dziesięć.»; дитина лише торкається «Gotowe». Сцена бачить `assist.step` і `assist.level`.
// Через десяток (8 + 5): допомога стосується першої рамки — спершу добити до десяти («Osiem i dwa to dziesięć.»); «разом» докладає всі фішки й каже «…I jeszcze trzy — trzynaście.».
import { GAME_PROMPTS, bridgeTen, pairSum } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import { TEN, missing, toTen, type TenInstance } from './generate';

const SHOW_MS = 600;
const BETWEEN_MS = 260;

/** Скільки комірок рахує підказка 2: до десяти (через десяток — лише перша рамка). */
export const hintCount = (instance: Pick<TenInstance, 'known' | 'add' | 'bridge'>): number => (instance.bridge ? toTen(instance) : missing(instance));

/** «Pomóż mi». nth = 1: порожні комірки пульсують + питання; nth ≥ 2: Kubik лічить порожні комірки (номер на кожній). */
export async function hintTen(instance: TenInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  ctx.setAssist({ mode: 'hint', step: 0, level });
  await ctx.wait(SHOW_MS);
  if (level <= 1) {
    await ctx.say(GAME_PROMPTS.untilTen, { interrupt: true });
    return;
  }
  for (let k = 1; k <= hintCount(instance); k++) {
    ctx.setAssist({ mode: 'hint', step: k, level });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  if (instance.bridge) await ctx.say(pairSum(instance.known, toTen(instance)), { interrupt: true });
}

/** Показ разом: фішки лягають по одній із лічбою «jeden, dwa…»; наприкінці — «Siedem i trzy to dziesięć.» (через десяток: «Osiem i dwa to dziesięć. I jeszcze trzy — trzynaście.»). */
export async function togetherTen(instance: TenInstance, ctx: AssistContext): Promise<void> {
  ctx.setAssist({ mode: 'together', step: 0 });
  await ctx.wait(SHOW_MS);
  for (let k = 1; k <= missing(instance); k++) {
    ctx.setAssist({ mode: 'together', step: k });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  await ctx.say(instance.bridge ? bridgeTen(instance.known, instance.add) : pairSum(instance.known, missing(instance)), { interrupt: true });
}

export interface FrameView {
  /** Стан кожної комірки (10 чи 20). */
  cells: ('solid' | 'empty')[];
  /** Номери на комірках (лічба разом / підказка 2); null — без номера. */
  marks: (number | null)[];
}

/** Що малює сцена: `added` фішок докладено; відомі видно (`knownShown`) — вони займають перші комірки, докладені — наступні; інакше докладені лягають із першої.
 *  `marks`: під час підказки 2 номери 1…hintStep на порожніх комірках (не далі, ніж `hintLimit` комірок — через десяток лише до кінця першої рамки),
 *  під час показу «разом» — на докладених. `cells` — 10 чи 20. */
export function frameView(
  known: number,
  added: number,
  opts: { knownShown: boolean; hintStep: number; togetherStep: number; cells?: number; hintLimit?: number },
): FrameView {
  const total = opts.cells ?? TEN;
  const cells: ('solid' | 'empty')[] = Array.from({ length: total }, () => 'empty');
  const marks: (number | null)[] = Array.from({ length: total }, () => null);
  const first = opts.knownShown ? known : 0;
  if (opts.knownShown) for (let i = 0; i < known; i++) cells[i] = 'solid';
  for (let j = 0; j < added && first + j < total; j++) {
    cells[first + j] = 'solid';
    if (opts.togetherStep > 0 && j < opts.togetherStep) marks[first + j] = j + 1;
  }
  const limit = opts.hintLimit ?? total;
  for (let j = 0; j < opts.hintStep && j < limit; j++) {
    const at = first + added + j;
    if (at < total && cells[at] === 'empty') marks[at] = j + 1;
  }
  return { cells, marks };
}
