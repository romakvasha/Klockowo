// «Czas na przerwę!» (BRIEF §6 п.11): три рухові вправи з лічбою — «Podskocz dziesięć razy!», «Klaśnij pięć razy!», «Tupnij osiem razy!». Kubik показує їх позами «стрибок», «плескання», «тупання»
// (між вправами — encouraging) і лічить повтори вголос. Чиста логіка: порядок вправ, поза на кожному повторі, куди повертає екран.
import type { KubikPose } from '../characters/poses';
import { BREAK_EXERCISES, breakLine } from '../speech/lines';
import { numberWords } from '../speech/numberWords';

export interface BreakStep {
  verb: string;
  n: number;
  /** Поза вправи: стрибок / плескання / тупання. */
  pose: KubikPose;
  /** Репліка-інструкція: «Podskocz dziesięć razy!». */
  line: string;
  /** Що каже Kubik на повторі k (1…n): число словами. */
  count: (k: number) => string;
}

const POSES: Readonly<Record<string, KubikPose>> = { Podskocz: 'break-jump', Klaśnij: 'break-clap', Tupnij: 'break-stomp' };

/** Три вправи за порядком BRIEF. */
export function breakSteps(): BreakStep[] {
  return BREAK_EXERCISES.map(({ verb, n }) => ({ verb, n, pose: POSES[verb] ?? 'break-jump', line: breakLine(verb, n), count: (k: number) => numberWords(k) }));
}

/** Поза Kubika на повторі k: непарні — поза вправи (стрибок угору, руки зімкнуті, лапа вниз), парні — «спокій» між повторами. */
export const repPose = (step: Pick<BreakStep, 'pose'>, k: number): KubikPose => (k % 2 === 1 ? step.pose : 'idle');

/** Куди йти після перерви: `next` зі стану навігації, якщо він схожий на адресу застосунку; інакше на мапу. */
export function afterBreakPath(state: unknown): string {
  const next = (state as { next?: { to?: unknown } } | null)?.next?.to;
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/break') ? next : '/map';
}

/** Стан навігації, який треба віддати далі (напр. `{ from: 'w1-3' }`, щоб Kubik пробіг до нового вузла): лише простий об'єкт. */
export function afterBreakState(state: unknown): Record<string, unknown> | undefined {
  const next = (state as { next?: { state?: unknown } } | null)?.next?.state;
  return typeof next === 'object' && next !== null && !Array.isArray(next) ? (next as Record<string, unknown>) : undefined;
}
