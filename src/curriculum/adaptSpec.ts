// Як крок складності змінює завдання (PEDAGOGY §2 — «варіанти складності» кожної гри; §3 — крок угору: більший діапазон або менше опори,
// крок униз: менший діапазон і більше опори). Чисті функції над TaskSpec: генератори ігор лишаються незмінними.
import { STEP_MIN, clampStep, type Struggle } from './adaptivity';
import type {
  AnswerStyle, BusTask, CompareTask, CountTask, FeedTask, FlashTask, HouseTask, JumpTask, MatchTask, Range, StoryTask, SumTask, TaskSpec, TenTask, TrainTask, WorldKey,
} from './types';
import { worldById } from './worlds';

const DICE_MAX = 6;
const EXPOSURE_MIN = 700;
const EXPOSURE_MAX = 3000;
const PAIRS_MIN = 2;
const PAIRS_MAX = 4;
const TRAIN_MIN = 5;

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** Верхня межа діапазону зсувається на `delta`: не вище межі світу й не вужче за 3 числа (якщо діапазон не був вужчим), щоб числа не повторювались. */
function shiftMax([min, max]: Range, delta: number, hi: number): Range {
  return [min, clamp(max + delta, Math.min(max, min + 2), Math.max(max, hi))];
}

function adaptCount(spec: CountTask, step: number, hi: number): CountTask {
  if (step < 0) {
    const k = -step;
    const arrangement = k >= 2 && spec.arrangement === 'scatter' ? 'line' : spec.arrangement;
    return { ...spec, count: shiftMax(spec.count, -2 * k, hi), look: 'distinct', arrangement };
  }
  return { ...spec, count: shiftMax(spec.count, 2 * step, hi), look: step >= 2 ? 'similar' : spec.look };
}

function adaptFlash(spec: FlashTask, step: number, hi: number): FlashTask {
  if (step < 0) {
    const k = -step;
    const pattern = spec.pattern === 'random' ? 'dice' : spec.pattern;
    const cap = pattern === 'dice' ? DICE_MAX : hi;
    const [min, max] = shiftMax(spec.count, -k, cap);
    return { ...spec, pattern, count: [Math.min(min, cap), Math.min(max, cap)], exposureMs: clamp(spec.exposureMs + 500 * k, EXPOSURE_MIN, EXPOSURE_MAX) };
  }
  const pattern = step >= 2 && spec.pattern === 'dice' ? 'random' : spec.pattern;
  const cap = pattern === 'dice' ? DICE_MAX : Math.min(10, hi);
  return { ...spec, pattern, count: shiftMax(spec.count, step, cap), exposureMs: clamp(spec.exposureMs - 300 * step, EXPOSURE_MIN, EXPOSURE_MAX) };
}

function adaptFeed(spec: FeedTask, step: number, hi: number): FeedTask {
  if (step < 0) return { ...spec, count: shiftMax(spec.count, 2 * step, hi), slots: true };
  return { ...spec, count: shiftMax(spec.count, 2 * step, hi), slots: step > 0 ? false : spec.slots };
}

function adaptMatch(spec: MatchTask, step: number): MatchTask {
  const span = spec.numbers[1] - spec.numbers[0] + 1;
  if (step < 0) return { ...spec, pairs: clamp(spec.pairs + step, PAIRS_MIN, PAIRS_MAX), set: spec.set === 'mixed' ? 'objects' : spec.set };
  return { ...spec, pairs: clamp(spec.pairs + step, Math.min(spec.pairs, PAIRS_MIN), Math.max(spec.pairs, Math.min(PAIRS_MAX, span))) };
}

function adaptTrain(spec: TrainTask, step: number): TrainTask {
  if (step < 0) return { ...spec, gap: 'end', length: Math.max(TRAIN_MIN, Math.min(spec.length, spec.length + step)) };
  if (spec.gap !== 'end' || step === 0) return spec;
  return { ...spec, gap: step >= 2 ? 'any' : 'middle' };
}

function adaptCompare(spec: CompareTask, step: number): CompareTask {
  const [d0, d1] = spec.diff;
  if (step < 0) return { ...spec, diff: [d0 - step, d1 - step], show: 'objects' };
  return { ...spec, diff: [Math.max(1, d0 - step), Math.max(1, d1 - step)] };
}

function adaptBus(spec: BusTask, step: number): BusTask {
  if (step < 0) return { ...spec, exposureMs: 0, ask: step <= -2 ? 'full' : spec.ask };
  return step >= 2 && spec.ask === 'full' ? { ...spec, ask: 'mixed' } : spec;
}

/** «Domek liczb»: крок униз — менше ціле, предмети під будиночком одразу, порожнє віконце завжди праворуч; вгору — більше ціле, лише цифри, віконце навмання. */
function adaptHouse(spec: HouseTask, step: number, hi: number): HouseTask {
  if (step < 0) return { ...spec, whole: shiftMax(spec.whole, 2 * step, hi), show: 'pictures', missing: 'right' };
  return { ...spec, whole: shiftMax(spec.whole, 2 * step, hi), show: step >= 2 ? 'digits' : spec.show, missing: step >= 2 ? 'any' : spec.missing };
}

/** «Ile razem?»: крок униз — менша сума, без кришки й лише символів, більший доданок першим; вгору — більша сума, а з кроку 2 — кришка на першому кошику. */
function adaptSum(spec: SumTask, step: number, hi: number): SumTask {
  if (step < 0) return { ...spec, sum: shiftMax(spec.sum, step, hi), lid: false, symbols: false, order: spec.doubles ? spec.order : 'bigFirst' };
  return { ...spec, sum: shiftMax(spec.sum, step, hi), lid: step >= 2 ? true : spec.lid };
}

/** «Skoki żabki»: крок униз — менше стрибків, цифри на всіх листках, жабка стрибає від дотику; вгору — більше стрибків, а з кроку 1 дитина передбачає «в думці»
 *  (стрибки лише як підказка), з кроку 2 — цифри лише на віхах. */
function adaptJump(spec: JumpTask, step: number): JumpTask {
  const cap = spec.max === 20 ? 8 : 6;
  const [j0, j1] = spec.jumps;
  if (step < 0) return { ...spec, jumps: [j0, Math.max(j0, j1 + step)], pads: 'numbered', tapJumps: true };
  return { ...spec, jumps: [j0, clamp(j1 + step, j1, Math.max(j1, cap))], tapJumps: false, pads: step >= 2 ? 'landmarks' : spec.pads };
}

/** «Zrób dziesiątkę»: крок униз — рамка з відомими фішками, докласти треба менше; вгору — докласти треба більше, а з кроку 2 рамка порожня (лише цифра). */
function adaptTen(spec: TenTask, step: number): TenTask {
  const [k0, k1] = spec.known;
  const shift = (n: number) => clamp(n, 1, 9);
  if (step < 0) return { ...spec, known: [shift(k0 - step), shift(k1 - step)], show: 'frame' };
  return { ...spec, known: [shift(k0 - step), shift(k1 - step)], show: step >= 2 ? 'digit' : spec.show };
}

/** «Historyjki»: крок униз — менша сума й лише «прийшло ще» (join); вгору — більша сума, з кроку 1 ще й задачі «разом» на двох наборах. */
function adaptStory(spec: StoryTask, step: number, hi: number): StoryTask {
  if (step < 0) return { ...spec, sum: shiftMax(spec.sum, step, hi), kind: 'join' };
  return { ...spec, sum: shiftMax(spec.sum, step, hi), kind: spec.kind === 'join' && step >= 1 ? 'mixed' : spec.kind };
}

/** Завдання з урахуванням кроку складності навички. `range` — діапазон чисел світу (верхня межа не перевищується). */
export function adaptSpec(spec: TaskSpec, step: number, range: Range): TaskSpec {
  const s = clampStep(step);
  if (s === 0) return spec;
  const hi = range[1];
  switch (spec.game) {
    case 'policzIDotknij': return adaptCount(spec, s, hi);
    case 'blysk': return adaptFlash(spec, s, hi);
    case 'nakarmZwierzaka': return adaptFeed(spec, s, hi);
    case 'cyfraIObrazek': return adaptMatch(spec, s);
    case 'zgubionyWagonik': return adaptTrain(spec, s);
    case 'ktoMaWiecej': return adaptCompare(spec, s);
    case 'autobusDziesiatka': return adaptBus(spec, s);
    case 'domekLiczb': return adaptHouse(spec, s, hi);
    case 'ileRazem': return adaptSum(spec, s, hi);
    case 'skokiZabki': return adaptJump(spec, s);
    case 'zrobDziesiatke': return adaptTen(spec, s);
    case 'historyjki': return adaptStory(spec, s, hi);
    default: return spec;
  }
}

/** Та сама навичка в іншій грі — коли на найнижчому кроці все одно не виходить (PEDAGOGY §3). null — заміни немає (гра єдина для навички). */
export function altSpec(spec: TaskSpec, world: WorldKey): TaskSpec | null {
  const answers: AnswerStyle = world === 'w1' ? 'digitDots' : 'digit';
  const base = { skill: spec.skill, ...(spec.review ? { review: true } : {}) };
  const line = (count: Range): CountTask => ({ ...base, game: 'policzIDotknij', count, arrangement: 'line', look: 'distinct', answers });
  switch (spec.game) {
    // лічба → «дати стільки» з рамкою-десяткою на тарілці
    case 'policzIDotknij': return { ...base, game: 'nakarmZwierzaka', count: [Math.max(1, spec.count[0]), Math.max(1, spec.count[1])], slots: true };
    // «дати N», «побачити одразу», «цифра ↔ кількість» → лічба в рядку
    case 'nakarmZwierzaka':
    case 'blysk': return line([Math.max(1, spec.count[0]), Math.max(1, spec.count[1])]);
    case 'cyfraIObrazek': return line([Math.max(1, spec.numbers[0]), Math.max(1, spec.numbers[1])]);
    default: return null;
  }
}

/** Мінімальний стан навички для адаптації. */
export interface SkillLevel {
  step: number;
  struggle: Struggle;
}

/** Завдання рівня для гри: крок навички мінус полегшення після ознак утоми (`ease`); на найнижчому кроці з труднощами — інша гра. */
export function adaptTask(spec: TaskSpec, skill: SkillLevel | undefined, ease: number, world: WorldKey): TaskSpec {
  const step = clampStep((skill?.step ?? 0) - ease);
  const switched = (skill?.struggle ?? 0) >= 1 && step === STEP_MIN ? altSpec(spec, world) : null;
  return adaptSpec(switched ?? spec, step, worldById(world).range);
}
