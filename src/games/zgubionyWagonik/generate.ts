// «Zgubiony wagonik» (BRIEF §7 гра 4, PEDAGOGY §2 п.4): потяг із пронумерованих вагонів, одного бракує; вибір із 3 плиток.
// Генератор детермінований: числа, місце прогалини й відповіді-плитки залежать лише від TaskSpec і потоку rng завдання.
import type { AnswerStyle, Range, TaskSpec, TrainGap, TrainTask } from '../../curriculum/types';
import type { Rng } from '../engine/rng';
import type { GenContext, TaskBase, Verdict } from '../engine/types';

export interface TrainInstance extends TaskBase {
  game: 'zgubionyWagonik';
  /** Номери вагонів зліва направо (за порядком потяга), разом із тим, якого бракує. */
  numbers: readonly number[];
  /** Індекс вагона, якого бракує. */
  gapIndex: number;
  /** Число, якого бракує (= numbers[gapIndex]). */
  missing: number;
  /** Крок між сусідніми вагонами (1 чи 10). */
  step: 1 | 10;
  /** Номери спадають: «Pociąg jedzie do tyłu». */
  backwards: boolean;
  answers: AnswerStyle;
  /** Три значення плиток за зростанням; серед них `missing`. */
  options: readonly number[];
}

/** Ряд із `length` чисел із кроком: зростає з `first` або спадає від `first` (для лічби назад). */
export function trainNumbers(first: number, length: number, step: number, backwards: boolean): number[] {
  return Array.from({ length }, (_, i) => first + (backwards ? -i : i) * step);
}

/** Де саме бракує вагона, коли в потязі `length` вагонів: end — останнього; start — першого; middle — не з країв (є вагон перед прогалиною
 *  і після неї); any — будь-якого. Потяг із двох вагонів не має «середини»: тоді прогалина в кінці. */
export function pickGapIndex(gap: TrainGap, length: number, rng: Rng): number {
  if (length < 3 && gap === 'middle') return length - 1;
  switch (gap) {
    case 'end':
      return length - 1;
    case 'start':
      return 0;
    case 'middle':
      return rng.int(1, length - 2);
    case 'any':
      return rng.int(0, length - 1);
  }
}

/** Межі першого вагона, щоб усі вагони лишилися в діапазоні: для спадного потяга «перший» — найбільший. */
export function firstRange(range: Range, length: number, step: number, backwards: boolean): [number, number] {
  const span = (length - 1) * step;
  return backwards ? [range[0] + span, range[1]] : [range[0], range[1] - span];
}

/** Плитки: правильне число й дві хибні, які теж виглядають можливими. Спершу беруться ті, що зовсім поза потягом, поряд із відповіддю
 *  (кроком ближче чи дальше, чи одразу перед першим і після останнього вагона): дитина має прочитати місце прогалини, а не вгадати «чого в потязі нема».
 *  Біля краю діапазону доберемо найближчі числа тієї самої «сітки» (для кроку 10 — лише круглі). Результат за зростанням. */
export function pickOptions(numbers: readonly number[], gapIndex: number, step: number, range: Range, rng: Rng): number[] {
  const missing = numbers[gapIndex]!;
  const inTrain = new Set(numbers);
  const lo = Math.max(0, range[0]);
  const hi = range[1];
  const dir = Math.sign(numbers[numbers.length - 1]! - numbers[0]!) * step;
  const picked: number[] = [];
  const take = (candidates: readonly number[], allowInTrain: boolean) => {
    for (const n of candidates) {
      if (picked.length >= 2) return;
      if (n >= lo && n <= hi && n !== missing && !picked.includes(n) && (allowInTrain || !inTrain.has(n))) picked.push(n);
    }
  };
  const near: number[] = [numbers[0]! - dir, numbers[numbers.length - 1]! + dir];
  for (let d = 1; d <= 3; d++) near.push(missing - d * step, missing + d * step);
  take(rng.shuffle(near), false);
  // біля краю діапазону — найближчі числа тієї самої сітки (спершу поза потягом, у крайньому разі й із потяга)
  const grid: number[] = [];
  for (let n = lo; n <= hi; n++) if (n % step === missing % step) grid.push(n);
  const byDistance = rng.shuffle(grid).sort((a, b) => Math.abs(a - missing) - Math.abs(b - missing));
  take(byDistance, false);
  take(byDistance, true);
  return [...picked, missing].sort((a, b) => a - b);
}

export function generateTrain(spec: TrainTask, ctx: GenContext): TrainInstance {
  const backwards = spec.backwards === true;
  const { length, step } = spec;
  const [lo, hi] = firstRange(spec.range, length, step, backwards);
  // крок 10: перший вагон — «круглий» і не нуль (10, 20…), щоб потяг читався як «dziesięć, dwadzieścia…»
  const from = Math.ceil(Math.max(lo, step === 10 ? 10 : 0) / step);
  const to = Math.floor(hi / step);
  if (to < from) throw new RangeError(`zgubionyWagonik: діапазон ${spec.range.join('–')} закороткий для ${length} вагонів із кроком ${step}`);
  const pickFirst = () => ctx.rng.int(from, to) * step;
  // не повторюємо те саме «число, якого бракує» двічі поспіль, якщо є з чого вибрати
  const last = ctx.previous[ctx.previous.length - 1];
  let first = pickFirst();
  let gapIndex = pickGapIndex(spec.gap, length, ctx.rng);
  for (let attempt = 0; attempt < 6 && first + (backwards ? -gapIndex : gapIndex) * step === last; attempt++) {
    first = pickFirst();
    gapIndex = pickGapIndex(spec.gap, length, ctx.rng);
  }
  const numbers = trainNumbers(first, length, step, backwards);
  return {
    game: 'zgubionyWagonik',
    skill: spec.skill,
    review: spec.review === true,
    numbers,
    gapIndex,
    missing: numbers[gapIndex]!,
    step,
    backwards,
    answers: spec.answers,
    options: pickOptions(numbers, gapIndex, step, spec.range, ctx.rng),
  };
}

/** Заготівля для реєстру: TaskSpec завжди TrainTask, коли гра — zgubionyWagonik. */
export function generateFromSpec(spec: TaskSpec, ctx: GenContext): TrainInstance {
  if (spec.game !== 'zgubionyWagonik') throw new Error(`zgubionyWagonik cannot generate ${spec.game}`);
  return generateTrain(spec, ctx);
}

/** Правильно — коли вибрано число, якого бракує. Відповідь на крок поряд (±1 чи ±10) — «Prawie!». */
export function checkTrain(instance: Pick<TrainInstance, 'missing' | 'step'>, value: number): Verdict {
  if (value === instance.missing) return { ok: true };
  return { ok: false, almost: Math.abs(value - instance.missing) === instance.step };
}
