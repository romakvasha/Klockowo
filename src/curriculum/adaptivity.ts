// Адаптивна складність (PEDAGOGY §3): крок складності навички вгору й униз, «інша гра» та прапорець для батьків, ознаки втоми.
// Чиста логіка без store: працює з мінімальним станом навички, тому store/progress.ts лише викликає її.

/** Крок складності навички: 0 — як описано в рівні; > 0 — більший діапазон чи менше опори; < 0 — менший діапазон і більше опори. */
export const STEP_MIN = -2;
export const STEP_MAX = 2;
/** «5 правильних з першого разу поспіль — крок угору». */
export const UP_STREAK = 5;
/** «2 помилки з останніх 3 — крок униз». */
export const DOWN_WINDOW = 3;
export const DOWN_ERRORS = 2;

/** Труднощі на найнижчому кроці: 0 — немає; 1 — грати ту саму навичку в іншій грі; 2 — і далі не виходить → прапорець для батьків. */
export type Struggle = 0 | 1 | 2;

export interface StepState {
  step: number;
  /** Скільки відповідей з останньої зміни кроку: нове рішення — лише на нових даних. */
  sinceStep: number;
  /** Поспіль з першого разу (будь-яка помилка обнуляє). */
  streak: number;
  struggle: Struggle;
}

export type StepChange = 'up' | 'down' | 'switch' | 'flag' | null;

export const clampStep = (step: number): number => Math.min(STEP_MAX, Math.max(STEP_MIN, Math.round(step)));

/** Новий стан кроку після відповіді. `recent` — останні відповіді навички (true — з першого разу), уже разом із цією.
 *  Крок угору: 5 поспіль з першого разу після останньої зміни. Крок униз: 2 помилки з останніх 3 після останньої зміни;
 *  на найнижчому кроці замість цього — інша гра для навички, а якщо й там не виходить — прапорець для батьків (PEDAGOGY §3). */
export function nextStep(prev: StepState, recent: readonly boolean[]): StepState & { change: StepChange } {
  const ok = recent[recent.length - 1] === true;
  const sinceStep = prev.sinceStep + 1;
  const streak = ok ? prev.streak + 1 : 0;
  // лише поля кроку: store передає сюди повний запис навички
  const base = { step: prev.step, sinceStep, streak, struggle: prev.struggle, change: null as StepChange };

  if (ok && streak >= UP_STREAK && sinceStep >= UP_STREAK && prev.step < STEP_MAX) {
    return { step: prev.step + 1, sinceStep: 0, streak, struggle: 0, change: 'up' };
  }
  const window = recent.slice(-Math.min(DOWN_WINDOW, sinceStep));
  const errors = window.filter((r) => !r).length;
  if (ok || errors < DOWN_ERRORS) return base;

  if (prev.step > STEP_MIN) return { step: prev.step - 1, sinceStep: 0, streak, struggle: prev.struggle, change: 'down' };
  if (prev.struggle === 0) return { ...base, sinceStep: 0, struggle: 1, change: 'switch' };
  return { ...base, sinceStep: 0, struggle: 2, change: prev.struggle === 2 ? null : 'flag' };
}

// ——— Ознаки втоми чи розчарування в межах рівня ———

/** Дотики, ближчі один до одного за цей інтервал, — «швидкі» (дитина б'є по екрану навмання). */
export const RAPID_TAP_MS = 250;
/** Стільки швидких дотиків за одне завдання — ознака випадкових дотиків. */
export const RAPID_TAPS = 8;
/** Довга бездіяльність посеред завдання (без жодного дотику). Таймера на екрані немає — це лише вимір. */
export const IDLE_MS = 60_000;
/** Помилок (не з першого разу) поспіль у рівні. */
export const ERRORS_IN_ROW = 3;

/** Статистика дотиків за одне завдання. */
export interface TapStats {
  /** Скільки дотиків прийшло швидше за RAPID_TAP_MS після попереднього. */
  rapid: number;
  /** Найдовша пауза між початком завдання / дотиками й відповіддю, мс. */
  maxGapMs: number;
}

export const NO_TAPS: TapStats = { rapid: 0, maxGapMs: 0 };

/** Підсумок часу дотиків (мс від початку завдання, за зростанням) і моменту відповіді. */
export function tapStats(times: readonly number[], endMs: number): TapStats {
  let rapid = 0;
  let maxGapMs = 0;
  let prev = 0;
  times.forEach((t, i) => {
    if (i > 0 && t - prev < RAPID_TAP_MS) rapid++;
    maxGapMs = Math.max(maxGapMs, t - prev);
    prev = t;
  });
  return { rapid, maxGapMs: Math.max(maxGapMs, endMs - prev) };
}

export type FatigueSignal = 'errors' | 'taps' | 'idle';

/** Ознака втоми після завдання (PEDAGOGY §3 «Frustration signals»): 3 помилки поспіль, випадкові швидкі дотики або довга бездіяльність.
 *  Відповідь гри — легше наступне завдання; перерву («Czas na przerwę!») пропонує сесія (M21). */
export function fatigueSignal(outcomes: readonly string[], taps: TapStats): FatigueSignal | null {
  const tail = outcomes.slice(-ERRORS_IN_ROW);
  if (tail.length === ERRORS_IN_ROW && tail.every((o) => o !== 'first')) return 'errors';
  if (taps.rapid >= RAPID_TAPS) return 'taps';
  if (taps.maxGapMs >= IDLE_MS) return 'idle';
  return null;
}

/** Полегшення для наступних завдань рівня: після ознаки втоми — на крок легше, після відповіді з першого разу — знову як було. */
export function nextEase(ease: number, outcome: string, signal: FatigueSignal | null): number {
  if (signal) return 1;
  return outcome === 'first' ? 0 : ease;
}
