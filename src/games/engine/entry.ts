// Рядок історії відповідей (store/types AnswerEntry) зі стану завдання: з нього адаптивність (M12), повторення й панель батьків
// беруть число спроб, підказок і «разом». Чиста функція: час передає виклик.
import type { Level } from '../../curriculum/types';
import { dayKey } from '../../store/progress';
import type { AnswerEntry } from '../../store/types';
import type { TaskState } from './taskFlow';
import type { TaskBase } from './types';

export interface EntryInput {
  instance: TaskBase;
  level: Level;
  state: Pick<TaskState, 'mistakes' | 'hints' | 'together' | 'wrong'>;
  /** Правильна відповідь завдання (число); null — відповідь не число (з'єднання пар): answer і wrong не записуються. */
  answer: number | null;
  /** Скільки мс від початку завдання до відповіді. */
  ms: number;
  now: Date;
}

export function buildEntry({ instance, level, state, answer, ms, now }: EntryInput): AnswerEntry {
  return {
    t: now.getTime(),
    day: dayKey(now),
    skill: instance.skill,
    game: instance.game,
    level: level.id,
    firstTry: state.mistakes === 0,
    attempts: Math.min(3, state.mistakes + 1),
    hints: state.hints,
    together: state.together,
    ms: Math.max(0, Math.round(ms)),
    ...(answer === null ? {} : { answer }),
    ...(answer !== null && state.wrong.length > 0 ? { wrong: [...state.wrong] } : {}),
  };
}

/** Хвилини гри за завдання для лічильника «Minuty dziś»: час до відповіді, не більше 2 хв (дитина могла відійти). */
export function playMinutes(ms: number): number {
  return Math.round((Math.min(Math.max(ms, 0), 120_000) / 60_000) * 100) / 100;
}
