// Допомога в «Skoki żabki» (PEDAGOGY §2 п.10): 1-ша підказка — жабка повертається на старт і стрибки програються по одному з голосом «jeden, dwa…» (останній стрибок
// лишається дитині: «I co dalej?»); 2-га — над листками з'являється весь маршрут (пунктирні дуги з номерами стрибків) і дитина торкається кожної дуги сама. Показ «разом» —
// жабка сама стрибає всі стрибки, Kubik лічить їх і підсумовує «Cztery i trzy to siedem.». Сцена бачить `assist.step` (скільки стрибків уже зроблено) і `assist.level`.
import { GAME_PROMPTS, frogJump, pairSum } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import type { JumpInstance } from './generate';

const SETTLE_MS = 550; // жабка повертається на старт
const HOP_MS = 650; // стрибок і приземлення
const AFTER_SAY_MS = 120;

/** Скільки стрибків програє 1-ша підказка: усі, крім останнього (але щонайменше один) — останній робить дитина. */
export const hintJumps = (jumps: number): number => Math.max(1, jumps - 1);

async function leap(ctx: AssistContext, mode: 'hint' | 'together', level: number, n: number): Promise<void> {
  ctx.setAssist({ mode, step: n, level });
  await ctx.wait(HOP_MS);
  await ctx.say(numberWords(n), { interrupt: true });
  await ctx.wait(AFTER_SAY_MS);
}

/** «Pomóż mi». nth = 1: програти стрибки з початку; nth ≥ 2: показати весь маршрут дугами, дитина торкається їх сама. */
export async function hintJump(instance: JumpInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  ctx.setAssist({ mode: 'hint', step: 0, level });
  await ctx.wait(SETTLE_MS);
  if (level >= 2) {
    await ctx.say(frogJump(instance.start, instance.jumps), { interrupt: true });
    return;
  }
  const shown = hintJumps(instance.jumps);
  for (let n = 1; n <= shown; n++) await leap(ctx, 'hint', level, n);
  if (shown < instance.jumps) await ctx.say(GAME_PROMPTS.wagonNext, { interrupt: true });
}

/** Показ разом: жабка стрибає всі стрибки, Kubik лічить; наприкінці — «Cztery i trzy to siedem.»; жабка лишається на листку приземлення. */
export async function togetherJump(instance: JumpInstance, ctx: AssistContext): Promise<void> {
  ctx.setAssist({ mode: 'together', step: 0 });
  await ctx.wait(SETTLE_MS);
  for (let n = 1; n <= instance.jumps; n++) await leap(ctx, 'together', 1, n);
  await ctx.say(pairSum(instance.start, instance.jumps), { interrupt: true });
}

/** Листок, де жабка після `jumped` стрибків: старт + кількість стрибків, не далі за приземлення. */
export function frogPad(instance: Pick<JumpInstance, 'start' | 'jumps'>, jumped: number): number {
  return instance.start + Math.max(0, Math.min(jumped, instance.jumps));
}

/** Скільки стрибків показує сцена, коли допомога щойно змінилась: підказка 1 і «разом» — `step`; підказка 2 — починає з нуля (дитина стрибає сама). */
export function assistJumped(assist: { mode: string; step: number; level?: number }): number | null {
  if (assist.mode === 'together') return assist.step;
  if (assist.mode === 'hint') return (assist.level ?? 1) >= 2 ? 0 : assist.step;
  return null;
}
