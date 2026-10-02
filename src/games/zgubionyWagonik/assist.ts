// Допомога Kubika в «Zgubiony wagonik» (PEDAGOGY §2 п.4). Після першої помилки одна плитка вже тьмяна, тож «лишаються 2 варіанти» виконано самою грою;
// 1-ша підказка — потяг читає два вагони перед прогалиною («…pięć, sześć… i co dalej?»), 2-га — читає все від початку; показ «разом» — читає весь потяг,
// а загублений вагончик заїжджає на місце. Сцена бачить `assist.step` (скільки вагонів уже прочитано) і сама підсвічує вагон за `readOrder`.
import { GAME_PROMPTS } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import type { TrainInstance } from './generate';

const BETWEEN_MS = 220;

/** Які вагони читає підказка й у якому порядку (індекси). nth = 1 — не більше двох перед прогалиною; nth ≥ 2 — усі від початку до прогалини.
 *  Коли бракує першого вагона, читати перед ним нічого: читаємо вагони після прогалини (два чи всі), а тоді питаємо «A co jest przed nimi?». */
export function readOrder(instance: Pick<TrainInstance, 'numbers' | 'gapIndex'>, nth: number): number[] {
  const { numbers, gapIndex } = instance;
  const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
  if (gapIndex === 0) return range(1, nth <= 1 ? Math.min(3, numbers.length) : numbers.length);
  return range(nth <= 1 ? Math.max(0, gapIndex - 2) : 0, gapIndex);
}

/** Репліка, якою підказка закінчується: питання про прогалину («I co dalej?») чи про вагон перед прочитаними. */
export function hintQuestion(instance: Pick<TrainInstance, 'gapIndex'>): string {
  return instance.gapIndex === 0 ? GAME_PROMPTS.wagonBefore : GAME_PROMPTS.wagonNext;
}

/** «Pomóż mi»: Kubik читає вагони вголос; на кожен номер сцена підсвічує вагон (step = скільки прочитано), наприкінці підсвічується прогалина
 *  (step = прочитано + 1) і звучить питання — відповідь дитина дає сама. */
export async function hintTrain(instance: TrainInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const order = readOrder(instance, info.nth);
  const level = Math.max(1, info.nth);
  for (let k = 1; k <= order.length; k++) {
    ctx.setAssist({ mode: 'hint', step: k, level });
    await ctx.say(numberWords(instance.numbers[order[k - 1]!]!), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
  ctx.setAssist({ mode: 'hint', step: order.length + 1, level });
  await ctx.say(hintQuestion(instance), { interrupt: true });
}

/** Після другої помилки: Kubik читає весь потяг по порядку, на місці прогалини вагончик заїжджає (сцена: step > gapIndex → вагон на місці);
 *  правильну плитку підсвічує рушій, дитина завершує сама. */
export async function togetherTrain(instance: TrainInstance, ctx: AssistContext): Promise<void> {
  for (let k = 1; k <= instance.numbers.length; k++) {
    ctx.setAssist({ mode: 'together', step: k });
    await ctx.say(numberWords(instance.numbers[k - 1]!), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}
