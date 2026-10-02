// Допомога в «Ile razem?» (PEDAGOGY §2 п.9): 1-ша підказка — кошики зсипаються, перша група лічиться номерками й Kubik каже «Zacznij od trzech i licz dalej.»
// (з кришкою — лише це, кришка лишається закритою); 2-га — кришка відкривається і всю лічбу «від числа» проведено разом: «…trzy; cztery, pięć». Показ «разом» —
// те саме плюс «Trzy dodać dwa równa się pięć.». Сцена бачить `assist.step` (скільки номерків видно, 0…сума) і `assist.level`.
import { addSentence, startFrom } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { AssistContext, HelpInfo } from '../engine/types';
import { sumAnswer, type SumInstance } from './generate';
import type { BasketItem } from '../../components/math/Basket';

const BETWEEN_MS = 220;
const SHOW_MS = 700;

/** Предмети спільного кошика: перша група (або плашка з числом, коли вона під кришкою) і друга. */
export function mergedItems(a: number, b: number, lidded: boolean): BasketItem[] {
  const first: BasketItem[] = lidded ? [{ kind: 'chip', value: a }] : Array.from({ length: a }, () => ({ kind: 'object' }));
  return [...first, ...Array.from({ length: b }, (): BasketItem => ({ kind: 'object' }))];
}

/** Номерки на предметах спільного кошика: лічба 1, 2, 3… до `step`. Коли перша група під кришкою (плашка першою), її номерка нема: лічба
 *  продовжується від її числа — перший предмет другої групи отримує a + 1. */
export function basketMarks(a: number, b: number, lidded: boolean, step: number): (number | null)[] {
  const items = lidded ? 1 + b : a + b;
  return Array.from({ length: items }, (_, i) => {
    const n = lidded ? (i === 0 ? null : a + i) : i + 1;
    return n !== null && n <= step ? n : null;
  });
}

/** Лічба «від числа»: номерки першої групи видно одразу, далі Kubik називає a + 1, a + 2… */
async function countOn(instance: SumInstance, ctx: AssistContext, mode: 'hint' | 'together', level: number): Promise<void> {
  const { a } = instance;
  const sum = sumAnswer(instance);
  ctx.setAssist({ mode, step: a, level });
  await ctx.say(startFrom(a), { interrupt: true });
  for (let k = a + 1; k <= sum; k++) {
    ctx.setAssist({ mode, step: k, level });
    await ctx.say(numberWords(k), { interrupt: true });
    await ctx.wait(BETWEEN_MS);
  }
}

/** «Pomóż mi». nth = 1: зсип, лічба першої групи вголос і «Zacznij od … i licz dalej.»; nth ≥ 2: повна лічба «від числа» з відкритою кришкою. */
export async function hintSum(instance: SumInstance, ctx: AssistContext, info: HelpInfo): Promise<void> {
  const level = Math.max(1, info.nth);
  ctx.setAssist({ mode: 'hint', step: 0, level });
  await ctx.wait(SHOW_MS); // кошики зсипаються
  if (level >= 2) {
    await countOn(instance, ctx, 'hint', level);
    return;
  }
  if (!instance.lid) {
    for (let k = 1; k <= instance.a; k++) {
      ctx.setAssist({ mode: 'hint', step: k, level });
      await ctx.say(numberWords(k), { interrupt: true });
      await ctx.wait(BETWEEN_MS);
    }
  }
  await ctx.say(startFrom(instance.a), { interrupt: true });
}

/** Показ разом: повна лічба «від числа» і «Trzy dodać dwa równa się pięć.». */
export async function togetherSum(instance: SumInstance, ctx: AssistContext): Promise<void> {
  ctx.setAssist({ mode: 'together', step: 0 });
  await ctx.wait(SHOW_MS);
  await countOn(instance, ctx, 'together', 1);
  await ctx.say(addSentence(instance.a, instance.b), { interrupt: true });
}
