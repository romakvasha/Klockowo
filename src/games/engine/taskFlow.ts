// Стан одного завдання (BRIEF §7 «Спільні правила»): вибір → «Gotowe» → правильно / 1-ша помилка / 2-га помилка («разом»).
// Чистий редуктор: екран лише передає події, а голос і анімації веде сценарій (script.ts). Помилки не карають: жодних життів чи таймерів.
import type { TaskOutcome } from '../../store/types';
import type { TaskPhase, Verdict } from './types';

export type LastEvent = 'none' | 'correct' | 'wrong1' | 'wrong2' | 'hint';

export interface TaskState {
  phase: TaskPhase;
  /** Вибрана, але ще не перевірена відповідь. */
  selected: number | null;
  /** Відповіді, що вже виявилися хибними: їхні плитки тьмяніють і неактивні, але лишаються на місці. */
  wrong: readonly number[];
  mistakes: number;
  hints: number;
  /** Після другої помилки Kubik показав розв'язок: завдання зараховано як «разом», кісточку дитина теж отримує. */
  together: boolean;
  /** Що відбулося останнім — сценарій відгуку читає це, щоб вибрати репліку. */
  last: LastEvent;
}

export type TaskEvent =
  | { type: 'select'; value: number }
  | { type: 'check'; verdict: Verdict }
  | { type: 'hint' }
  | { type: 'feedbackDone' };

export const INITIAL_TASK: TaskState = { phase: 'play', selected: null, wrong: [], mistakes: 0, hints: 0, together: false, last: 'none' };

export function taskReducer(state: TaskState, event: TaskEvent): TaskState {
  switch (event.type) {
    case 'select':
      if (state.phase !== 'play' || state.wrong.includes(event.value)) return state;
      return { ...state, selected: event.value };

    case 'check': {
      if (state.phase !== 'play' || state.selected === null) return state;
      if (event.verdict.ok) return { ...state, phase: 'feedback', last: 'correct' };
      const mistakes = state.mistakes + 1;
      return {
        ...state,
        phase: 'feedback',
        selected: null,
        wrong: [...state.wrong, state.selected],
        mistakes,
        together: state.together || mistakes >= 2,
        last: mistakes >= 2 ? 'wrong2' : 'wrong1',
      };
    }

    case 'hint':
      if (state.phase !== 'play' || state.mistakes < 1) return state;
      return { ...state, phase: 'feedback', hints: state.hints + 1, last: 'hint' };

    case 'feedbackDone':
      if (state.phase !== 'feedback') return state;
      return { ...state, phase: state.last === 'correct' ? 'done' : 'play', last: state.last === 'correct' ? 'correct' : 'none' };
  }
}

/** Як розв'язано: з першого разу, після однієї помилки чи разом із Kubikom (пишеться в прогрес). */
export function taskOutcome(state: TaskState): TaskOutcome {
  if (state.together) return 'together';
  return state.mistakes > 0 ? 'retry' : 'first';
}

/** «Gotowe» активна лише тоді, коли дитина щось вибрала й нічого не звучить. */
export function canCheck(state: TaskState): boolean {
  return state.phase === 'play' && state.selected !== null;
}

/** Лампочка «Pomóż mi» з'являється після першої помилки (BRIEF §7) і лишається до кінця завдання. */
export function hintAvailable(state: TaskState): boolean {
  return state.mistakes >= 1 && state.phase !== 'done';
}

export type TileView = 'default' | 'selected' | 'correct' | 'retry' | 'highlighted';

/** Вигляд плитки відповіді `value`: хибна — retry (40 %, неактивна); вибрана — selected; після правильної — correct;
 *  під час показу «разом» правильна підсвічується. */
export function tileView(state: TaskState, value: number, answer: number): TileView {
  if (state.wrong.includes(value)) return 'retry';
  if (state.last === 'correct' && state.phase !== 'play' && value === answer) return 'correct';
  if (state.selected === value) return 'selected';
  if (state.together && value === answer) return 'highlighted';
  return 'default';
}
