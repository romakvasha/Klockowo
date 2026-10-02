// Допомога в «Tajemnicza tablica» (PEDAGOGY §2 п.13): 1-ша підказка — підсвічується потрібний РЯД (десятки; лупа переходить на нього), Kubik називає десятки; 2-га — ще й СТОВПЧИК
// (одиниці) і «Cztery dziesiątki i siedem jedności to czterdzieści siedem.». У режимі «розфарбуй» 1-ша підсвічує стовпчик чисел із цією цифрою, 2-га — Kubik розфарбовує
// половину. Показ «разом»: знайдене число світиться (find, hidden), відповідь називається (neighbors), усі потрібні числа розфарбовуються по одному (paint).
// Сцена бачить `assist.step` і `assist.level`.
import { columnOf, rowOf } from '../../components/math/chartLayout';
import { findNumber, neighborAnswer, paintDigit, placeValue } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import { chartAnswer, type ChartInstance } from './generate';

const SHOW_MS = 500;
const BETWEEN_MS = 320;

/** Яку «відповідь-клітинку» показують підказки: find, hidden — шукане; neighbors — результат; paint — немає (0). */
export const hintTarget = (i: Pick<ChartInstance, 'mode' | 'target' | 'delta'>): number => (i.mode === 'paint' ? 0 : chartAnswer(i));

/** Репліка про десятки: «czterdzieści» для 47; для чисел до 10 — просто «Znajdź liczbę…». */
export function tensLine(n: number): string {
  return n >= 10 ? numberWords(Math.floor(n / 10) * 10) : findNumber(n);
}

/** Клітинки, які підсвічує підказка `level` (1, 2) у таблиці до `max`: рівень 1 — рядок шуканого числа, рівень 2 — рядок і стовпчик; paint — стовпчик чисел із цифрою. */
export function hintCells(i: Pick<ChartInstance, 'mode' | 'target' | 'delta' | 'paintSet' | 'max'>, level: number): ReadonlySet<number> {
  const cells = new Set<number>();
  if (i.mode === 'paint') {
    for (const n of i.paintSet) cells.add(n);
    return cells;
  }
  const n = hintTarget(i);
  const row = rowOf(n);
  for (let k = 1; k <= 10; k++) {
    const m = row * 10 + k;
    if (m <= i.max) cells.add(m);
  }
  if (level >= 2) {
    const col = columnOf(n);
    for (let r = 0; r * 10 + col + 1 <= i.max; r++) cells.add(r * 10 + col + 1);
  }
  return cells;
}

/** Скільки з потрібних чисел Kubik розфарбовує сам у підказці 2: половина, округлена вгору. */
export const paintedByHint = (count: number): number => Math.ceil(count / 2);

/** «Pomóż mi». nth = 1: підсвічено ряд (десятки) і Kubik називає їх; nth ≥ 2: ще й стовпчик, «Cztery dziesiątki i siedem jedności…». У paint: стовпчик → Kubik розфарбовує половину. */
export async function hintChart(instance: ChartInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  ctx.setAssist({ mode: 'hint', step: 0, level });
  await ctx.wait(SHOW_MS);
  if (instance.mode === 'paint') {
    await ctx.say(paintDigit(instance.digit), { interrupt: true });
    if (level >= 2) {
      const k = paintedByHint(instance.paintSet.length);
      for (let j = 1; j <= k; j++) {
        ctx.setAssist({ mode: 'hint', step: j, level });
        await ctx.say(numberWords(instance.paintSet[j - 1]!), { interrupt: true });
        await ctx.wait(BETWEEN_MS);
      }
    }
    return;
  }
  const n = hintTarget(instance);
  await ctx.say(level >= 2 ? placeValue(n) : tensLine(n), { interrupt: true });
}

/** Показ разом: знайдене число світиться й називається (find, hidden), сусіди — «Trzydzieści cztery, o dziesięć więcej to czterdzieści cztery.», paint — числа по одному. */
export async function togetherChart(instance: ChartInstance, ctx: AssistContext): Promise<void> {
  ctx.setAssist({ mode: 'together', step: 0 });
  await ctx.wait(SHOW_MS);
  if (instance.mode === 'paint') {
    for (let j = 1; j <= instance.paintSet.length; j++) {
      ctx.setAssist({ mode: 'together', step: j });
      await ctx.say(numberWords(instance.paintSet[j - 1]!), { interrupt: true });
      await ctx.wait(BETWEEN_MS);
    }
    return;
  }
  ctx.setAssist({ mode: 'together', step: 1 });
  if (instance.mode === 'neighbors') await ctx.say(neighborAnswer(instance.target, instance.delta), { interrupt: true });
  else await ctx.say(placeValue(instance.target), { interrupt: true });
}
