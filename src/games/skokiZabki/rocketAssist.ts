// Допомога для ракети (W7, PEDAGOGY §2 п.10): 1-ша підказка — ракета повертається на старт і летить зупинками (десятки по +10, потім одиниці; через десяток — спершу до десятка),
// Kubik називає кожну зупинку; останню зупинку лишено дитині: «I co dalej?». 2-га — маршрут показано порожніми кільцями на лінії, дитина торкається ракети для кожної зупинки.
// Показ «разом» — ракета летить усім маршрутом і «Trzydzieści cztery dodać dziesięć równa się czterdzieści cztery.». Сцена бачить `assist.step` (скільки зупинок пролетіло) і `assist.level`.
import { GAME_PROMPTS, addSentence, rocketFlight } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { landings } from '../bigAdd';
import type { AssistContext, HelpInfo } from '../engine/types';
import type { JumpInstance } from './generate';

const SETTLE_MS = 550;
const HOP_MS = 700;
const AFTER_SAY_MS = 120;

/** Скільки зупинок програє 1-ша підказка: усі, крім останньої (але щонайменше одна). */
export const hintStops = (stops: number): number => Math.max(1, stops - 1);

async function fly(ctx: AssistContext, mode: 'hint' | 'together', level: number, n: number, landing: number): Promise<void> {
  ctx.setAssist({ mode, step: n, level });
  await ctx.wait(HOP_MS);
  await ctx.say(numberWords(landing), { interrupt: true });
  await ctx.wait(AFTER_SAY_MS);
}

/** «Pomóż mi». nth = 1: політ зупинками (без останньої); nth ≥ 2: маршрут порожніми кільцями, дитина летить сама. */
export async function hintRocket(instance: JumpInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  const stops = landings(instance.start, instance.jumps);
  ctx.setAssist({ mode: 'hint', step: 0, level });
  await ctx.wait(SETTLE_MS);
  if (level >= 2) {
    await ctx.say(rocketFlight(instance.start, instance.jumps), { interrupt: true });
    return;
  }
  const shown = hintStops(stops.length);
  for (let n = 1; n <= shown; n++) await fly(ctx, 'hint', level, n, stops[n - 1]!);
  if (shown < stops.length) await ctx.say(GAME_PROMPTS.wagonNext, { interrupt: true });
}

/** Показ разом: ракета летить усіма зупинками, наприкінці — «Trzydzieści cztery dodać dziesięć równa się czterdzieści cztery.». */
export async function togetherRocket(instance: JumpInstance, ctx: AssistContext): Promise<void> {
  const stops = landings(instance.start, instance.jumps);
  ctx.setAssist({ mode: 'together', step: 0 });
  await ctx.wait(SETTLE_MS);
  for (let n = 1; n <= stops.length; n++) await fly(ctx, 'together', 1, n, stops[n - 1]!);
  await ctx.say(addSentence(instance.start, instance.jumps), { interrupt: true });
}
