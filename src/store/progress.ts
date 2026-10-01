// Чисті функції прогресу: нічого не змінюють на місці, повертають новий об'єкт. Store лише викликає їх.
import { LEVELS } from '../curriculum/levels';
import type { LevelId, SkillId } from '../curriculum/types';
import { emptySkill } from './defaults';
import type { AnswerEntry, LevelRecord, LevelRun, ProfileProgress, RecentAnswer, SkillRecord } from './types';

export const MAX_HISTORY = 600;
/** Вікно опанування: останні 10 елементів (PEDAGOGY §3). */
export const RECENT_WINDOW = 10;
export const MAX_SKILL_DAYS = 30;

/** Місцевий день дитини, YYYY-MM-DD (не UTC: «сьогодні» — за годинником пристрою). */
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Опановано: ≥ 80 % з першого разу за останні 10 елементів і щонайменше 2 різні дні (PEDAGOGY §3).
 *  «Без візуальної опори» (крок складності) додає адаптивність M12. */
export function isMastered(recent: readonly RecentAnswer[]): boolean {
  if (recent.length < RECENT_WINDOW) return false;
  const ok = recent.filter((r) => r.ok).length;
  return ok / recent.length >= 0.8 && new Set(recent.map((r) => r.day)).size >= 2;
}

/** Стан навички на карті для батьків: Nowa / W trakcie nauki / Opanowana / Do powtórki. */
export type SkillState = 'new' | 'learning' | 'mastered' | 'review';

export function skillState(record: SkillRecord | undefined): SkillState {
  if (!record || record.attempts === 0) return 'new';
  if (record.needsReview) return 'review';
  return isMastered(record.recent) ? 'mastered' : 'learning';
}

/** Записує розв'язаний елемент: історія (обмежена) і лічильники навички. */
export function recordAnswer(progress: ProfileProgress, entry: AnswerEntry): ProfileProgress {
  const prev: SkillRecord = progress.skills[entry.skill] ?? emptySkill();
  const skill: SkillRecord = {
    ...prev,
    attempts: prev.attempts + 1,
    firstTry: prev.firstTry + (entry.firstTry ? 1 : 0),
    recent: [...prev.recent, { ok: entry.firstTry, day: entry.day }].slice(-RECENT_WINDOW),
    days: prev.days.includes(entry.day) ? prev.days : [...prev.days, entry.day].slice(-MAX_SKILL_DAYS),
  };
  return {
    ...progress,
    skills: { ...progress.skills, [entry.skill]: skill },
    history: [...progress.history, entry].slice(-MAX_HISTORY),
  };
}

export interface LevelSummary {
  /** Скільки завдань рівня було з першого разу. */
  firstTry: number;
  /** Хоч раз розв'язували разом із Kubikom. */
  togetherUsed: boolean;
}

function without<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
}

/** Рівень завершено: запис про проходження, розпочатий забіг знімається. Повторне проходження збільшує `plays`. */
export function completeLevel(progress: ProfileProgress, id: LevelId, summary: LevelSummary, now: Date): ProfileProgress {
  const prev: LevelRecord | undefined = progress.levels[id];
  const record: LevelRecord = {
    completedAt: prev?.completedAt ?? now.toISOString(),
    plays: (prev?.plays ?? 0) + 1,
    togetherUsed: (prev?.togetherUsed ?? false) || summary.togetherUsed,
    firstTry: summary.firstTry,
  };
  return { ...progress, levels: { ...progress.levels, [id]: record }, runs: without(progress.runs, id) };
}

export function saveRun(progress: ProfileProgress, id: LevelId, run: LevelRun): ProfileProgress {
  return { ...progress, runs: { ...progress.runs, [id]: run } };
}

export function clearRun(progress: ProfileProgress, id: LevelId): ProfileProgress {
  return progress.runs[id] === undefined ? progress : { ...progress, runs: without(progress.runs, id) };
}

/** Додає хвилини гри до дня; від'ємні й нескінченні значення ігноруються. */
export function addPlayTime(progress: ProfileProgress, day: string, minutes: number): ProfileProgress {
  if (!Number.isFinite(minutes) || minutes <= 0) return progress;
  const total = Math.round(((progress.minutesByDay[day] ?? 0) + minutes) * 100) / 100;
  return { ...progress, minutesByDay: { ...progress.minutesByDay, [day]: total } };
}

/** Наліпки: по одній за кожен пройдений рівень (★ теж), у порядку програми. */
export function stickersOf(progress: ProfileProgress): LevelId[] {
  return LEVELS.filter((l) => Object.hasOwn(progress.levels, l.id)).map((l) => l.id);
}

/** Значки «Nie poddajesz się!»: рівні, де хоч раз розв'язували разом із Kubikom. */
export function diligenceBadgesOf(progress: ProfileProgress): LevelId[] {
  return LEVELS.filter((l) => progress.levels[l.id]?.togetherUsed === true).map((l) => l.id);
}

export function totalMinutes(progress: ProfileProgress): number {
  return Math.round(Object.values(progress.minutesByDay).reduce((sum, m) => sum + m, 0) * 100) / 100;
}

/** Навички, які потребують повторення зараз (прапор «Do powtórki»). */
export function skillsToReview(progress: ProfileProgress): SkillId[] {
  return (Object.entries(progress.skills) as [SkillId, SkillRecord][]).filter(([, r]) => r.needsReview).map(([id]) => id);
}
