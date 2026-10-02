// Повторення (PEDAGOGY §3; BRIEF §7): інтервальні повторення опанованих навичок (1/3/7/14/30 днів), «Do powtórki» після невдалого
// повторення, черга завдань «разом» («схоже завдання повертається в наступному рівні»), розминка з черги на початку дня.
// Чиста логіка над мінімальним знімком прогресу (як progression.ts): store/types підходить структурно.
import { findLevel, LEVELS } from './levels';
import { SKILL_IDS } from './skills';
import type { Level, LevelId, SkillId, TaskSpec } from './types';

/** Інтервали повторення за ступенем 1…5, днів. */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;
export const MAX_STAGE = REVIEW_INTERVALS.length;
/** «Do powtórki» знімається після стількох відповідей з першого разу поспіль. */
export const REVIEW_CLEAR_STREAK = 3;
/** Скільки завдань «разом» чекають повтору (найстаріші випадають). */
export const MAX_RETRY = 6;

/** День YYYY-MM-DD плюс n днів (за місцевим календарем). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + n);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface ReviewState {
  /** 0 — навичка ще не в розкладі повторень; 1…5 — ступінь інтервалу. */
  stage: number;
  due: string | null;
  needsReview: boolean;
}

export interface ReviewAnswer {
  ok: boolean;
  day: string;
  /** Навичку опановано (з урахуванням цієї відповіді). */
  mastered: boolean;
  /** Поспіль з першого разу (разом із цією відповіддю). */
  streak: number;
}

export function isDue(state: ReviewState, today: string): boolean {
  return state.needsReview || (state.stage > 0 && state.due !== null && state.due <= today);
}

/** Розклад після відповіді: опанували → повторення завтра; перша відповідь у день повторення вирішує — далі (3, 7, 14, 30 днів)
 *  чи «Do powtórki»; «Do powtórki» знімається трьома відповідями з першого разу поспіль і знову ставить повторення на завтра. */
export function nextReview(prev: ReviewState, a: ReviewAnswer): ReviewState {
  if (prev.needsReview) {
    return a.streak >= REVIEW_CLEAR_STREAK ? { stage: 1, due: addDays(a.day, REVIEW_INTERVALS[0]), needsReview: false } : prev;
  }
  if (prev.stage === 0) return a.mastered ? { stage: 1, due: addDays(a.day, REVIEW_INTERVALS[0]), needsReview: false } : prev;
  if (prev.due === null || prev.due > a.day) return prev;
  if (!a.ok) return { stage: 1, due: null, needsReview: true };
  const stage = Math.min(MAX_STAGE, prev.stage + 1);
  return { stage, due: addDays(a.day, REVIEW_INTERVALS[stage - 1] ?? 30), needsReview: false };
}

// ——— Черга завдань ———

/** Завдання програми: рівень і номер у ньому. */
export interface TaskRef {
  level: LevelId;
  index: number;
}

/** Завдання, розв'язане «разом» із Kubikom: схоже повернеться в наступному рівні (BRIEF §7). */
export interface RetryItem extends TaskRef {
  day: string;
}

/** Слот рівня, у який замість власного повторення поставлено завдання з черги. */
export interface Swap extends TaskRef {
  /** Номер слота в рівні (0…5) — лише слоти-повторення. */
  at: number;
  kind: 'retry' | 'review';
}

export const sameRef = (a: TaskRef, b: TaskRef): boolean => a.level === b.level && a.index === b.index;

export function taskAt(ref: TaskRef): TaskSpec | undefined {
  return findLevel(ref.level)?.tasks[ref.index];
}

export function queueRetry(list: readonly RetryItem[], ref: TaskRef, day: string): RetryItem[] {
  return [...list.filter((r) => !sameRef(r, ref)), { level: ref.level, index: ref.index, day }].slice(-MAX_RETRY);
}

export function dropRetry(list: readonly RetryItem[], ref: TaskRef): RetryItem[] {
  return list.some((r) => sameRef(r, ref)) ? list.filter((r) => !sameRef(r, ref)) : [...list];
}

/** Мінімальний знімок прогресу для черги. */
export interface ReviewSnapshot {
  readonly levels: Readonly<Record<string, unknown>>;
  readonly skills: Readonly<Partial<Record<SkillId, ReviewState>>>;
  readonly retry: readonly RetryItem[];
  readonly history: readonly { readonly day: string }[];
}

/** Навички, які час повторити: спершу «Do powtórki», далі за датою, далі за програмою. */
export function dueSkills(skills: ReviewSnapshot['skills'], today: string): SkillId[] {
  const due = SKILL_IDS.filter((id) => {
    const s = skills[id];
    return s !== undefined && isDue(s, today);
  });
  const rank = (id: SkillId) => (skills[id]?.needsReview ? '0' : `1${skills[id]?.due ?? ''}`);
  return due.sort((a, b) => rank(a).localeCompare(rank(b)) || SKILL_IDS.indexOf(a) - SKILL_IDS.indexOf(b));
}

/** Звідки взяти завдання для повторення навички: останній пройдений рівень, де навичку тренують (не як повторення). */
export function reviewSource(skill: SkillId, levels: ReviewSnapshot['levels']): TaskRef | null {
  let fallback: TaskRef | null = null;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i] as Level;
    if (!Object.hasOwn(levels, level.id)) continue;
    const own = level.tasks.findIndex((t) => t.skill === skill && !t.review);
    if (own >= 0) return { level: level.id, index: own };
    const any = level.tasks.findIndex((t) => t.skill === skill);
    if (any >= 0 && !fallback) fallback = { level: level.id, index: any };
  }
  return fallback;
}

/** Вузли «Do powtórki» на стежках: для кожної навички з невдалим повторенням — рівень, де її тренують. */
export function reviewLevelIds(snapshot: Pick<ReviewSnapshot, 'levels' | 'skills'>): Set<LevelId> {
  const ids = new Set<LevelId>();
  for (const id of SKILL_IDS) {
    if (!snapshot.skills[id]?.needsReview) continue;
    const source = reviewSource(id, snapshot.levels);
    if (source) ids.add(source.level);
  }
  return ids;
}

export interface LevelQueue {
  swaps: Swap[];
  /** Перший рівень дня: завдання з черги йдуть першими — це розминка (PEDAGOGY §3 «Rozgrzewka»). */
  warmup: boolean;
}

/** Що з черги поставити в слоти-повторення нового забігу рівня: спершу завдання «разом» з інших рівнів, далі навички, яким час
 *  повторення (крім тих, що рівень і так тренує). Слотів-повторень у рівні ≈ 30 % (PEDAGOGY §1), їх кількість не змінюється. */
export function chooseSwaps(level: Level, snapshot: ReviewSnapshot, today: string, playable: (spec: TaskSpec) => boolean = () => true): LevelQueue {
  const slots = level.tasks.flatMap((t, i) => (t.review ? [i] : []));
  if (slots.length === 0) return { swaps: [], warmup: false };
  const own = new Set(level.tasks.filter((t) => !t.review).map((t) => t.skill));
  const picked: Omit<Swap, 'at'>[] = [];
  const usedSkills = new Set<SkillId>();

  for (const item of snapshot.retry) {
    const spec = taskAt(item);
    if (item.level === level.id || !spec || !playable(spec) || usedSkills.has(spec.skill)) continue;
    picked.push({ level: item.level, index: item.index, kind: 'retry' });
    usedSkills.add(spec.skill);
  }
  for (const skill of dueSkills(snapshot.skills, today)) {
    if (own.has(skill) || usedSkills.has(skill)) continue;
    const ref = reviewSource(skill, snapshot.levels);
    const spec = ref ? taskAt(ref) : undefined;
    if (!ref || !spec || !playable(spec)) continue;
    picked.push({ ...ref, kind: 'review' });
    usedSkills.add(skill);
  }
  const swaps = picked.slice(0, slots.length).map((p, i): Swap => ({ ...p, at: slots[i] as number }));
  const firstToday = !snapshot.history.some((e) => e.day === today);
  return { swaps, warmup: swaps.length > 0 && firstToday };
}

/** Завдання рівня в порядку гри з урахуванням черги. `ref` — звідки завдання (для повтору після «разом»). */
export interface QueuedSpec {
  spec: TaskSpec;
  ref: TaskRef;
  kind: 'own' | Swap['kind'];
}

export function levelSpecs(level: Level, queue: LevelQueue): QueuedSpec[] {
  const specs = level.tasks.map((spec, index): QueuedSpec => {
    const swap = queue.swaps.find((s) => s.at === index);
    const queued = swap ? taskAt(swap) : undefined;
    if (swap && queued) return { spec: { ...queued, review: true }, ref: { level: swap.level, index: swap.index }, kind: swap.kind };
    return { spec, ref: { level: level.id, index }, kind: 'own' };
  });
  if (!queue.warmup) return specs;
  return [...specs.filter((s) => s.kind !== 'own'), ...specs.filter((s) => s.kind === 'own')];
}
