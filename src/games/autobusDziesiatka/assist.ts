// Допомога в «Autobus dziesiątka» (PEDAGOGY §2 п.7): 1-ша підказка — перший ряд пульсує як «5» («Pełny rząd to pięć. Policz resztę.»; коли тваринок менше
// за п'ять — Kubik лічить їх уголос); 2-га — лічимо разом те, про що питають, місце за місцем. Показ «разом» — така сама лічба й «Siedem i trzy to dziesięć.».
// Вступний показ (миготіння автобуса): місця відкриті на `exposureMs`, далі закриваються. Сцена бачить `assist.step` і `assist.level`.
import { GAME_PROMPTS, pairSum } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { Assist, AssistContext, HelpInfo } from '../engine/types';
import { BUS_CAPACITY, busAnswer, type BusInstance } from './generate';

const BETWEEN_MS = 260;
const ROW_HOLD_MS = 1400;
const ROW = 5;

/** Місця, які лічить допомога, у порядку лічби: питають «скільки їде» — зайняті, «скільки вільних» — вільні. */
export function countedSeats(instance: Pick<BusInstance, 'passengers' | 'ask'> & { capacity?: number }): number[] {
  const { passengers, ask } = instance;
  const capacity = instance.capacity ?? BUS_CAPACITY;
  return ask === 'full'
    ? Array.from({ length: passengers }, (_, i) => i)
    : Array.from({ length: capacity - passengers }, (_, i) => passengers + i);
}

/** Перша підказка пульсує першим рядом як «5», лише коли ряд повний (їде ≥ 5); інакше лічимо тваринок. */
export function usesRowHint(instance: Pick<BusInstance, 'passengers'>): boolean {
  return instance.passengers >= ROW;
}

/** Що лічить допомога зараз: перша підказка для малого автобуса — зайняті місця, інакше — `countedSeats`. */
export function helpCountSeats(instance: Pick<BusInstance, 'passengers' | 'ask'> & { capacity?: number }, assist: Pick<Assist, 'mode' | 'level'>): number[] {
  if (assist.mode === 'hint' && (assist.level ?? 1) <= 1) return usesRowHint(instance) ? [] : countedSeats({ passengers: instance.passengers, ask: 'full', capacity: instance.capacity });
  return countedSeats(instance);
}

/** Номери на місцях під час лічби: `step` перших місць із `seats` отримують 1, 2, 3…; решта — null. */
export function seatMarks(seats: readonly number[], step: number, total = BUS_CAPACITY): (number | null)[] {
  const marks: (number | null)[] = Array.from({ length: total }, () => null);
  seats.slice(0, Math.max(0, step)).forEach((seat, k) => {
    marks[seat] = k + 1;
  });
  return marks;
}

/** Вступний показ: автобус видно `exposureMs`, потім місця закриваються. Без `exposureMs` (0) нічого не робить. */
export async function introBus(instance: BusInstance, ctx: AssistContext): Promise<void> {
  if (instance.exposureMs <= 0) return;
  ctx.setAssist({ mode: 'intro', step: 1 });
  await ctx.wait(instance.exposureMs);
  ctx.setAssist({ mode: 'intro', step: 2 });
}

async function countAloud(seats: readonly number[], ctx: AssistContext, mode: 'hint' | 'together', level: number): Promise<void> {
  for (let k = 1; k <= seats.length; k++) {
    ctx.setAssist({ mode, step: k, level });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** «Pomóż mi». nth = 1: перший ряд пульсує як «5» («Pełny rząd to pięć. Policz resztę.»); для автобуса, де їде менше за п'ять, — Kubik лічить тваринок.
 *  nth ≥ 2: лічимо разом те, про що питають. */
export async function hintBus(instance: BusInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  if (level <= 1) {
    if (usesRowHint(instance)) {
      ctx.setAssist({ mode: 'hint', step: 1, level });
      await ctx.say(GAME_PROMPTS.busRow, { interrupt: true });
      await ctx.wait(ROW_HOLD_MS); // рамка лишається видимою й тоді, коли голосу нема (озвучення пропущено)
      return;
    }
    await ctx.say(GAME_PROMPTS.busCount, { interrupt: true });
    await countAloud(countedSeats({ passengers: instance.passengers, ask: 'full', capacity: instance.capacity }), ctx, 'hint', level);
    return;
  }
  await countAloud(countedSeats(instance), ctx, 'hint', level);
}

/** Показ разом: лічимо те, про що питають, і підсумовуємо: «Siedem i trzy to dziesięć.». */
export async function togetherBus(instance: BusInstance, ctx: AssistContext): Promise<void> {
  await countAloud(countedSeats(instance), ctx, 'together', 1);
  await ctx.say(pairSum(instance.passengers, instance.capacity - instance.passengers), { interrupt: true });
}

/** Відповідь завдання (для тестів і сцени). */
export const answerOf = (instance: Pick<BusInstance, 'passengers' | 'ask'> & { capacity?: number }): number => busAnswer(instance.passengers, instance.ask, instance.capacity);
