// Звіти для Strefa rodzica (BRIEF §6 п.15, PEDAGOGY §3 «Parent panel»): підсумок, остання сесія, карта навичок, відсоток «з першого разу», хвилини за днями й «Trudności» (автовиявлення плутанини 13 ↔ 30,
// 26 ↔ 62, лічба всього замість лічби далі). Чиста логіка над профілем і прогресом; жодного UI.
import { LEVELS } from '../curriculum/levels';
import { isWorldComplete } from '../curriculum/progression';
import { SKILLS } from '../curriculum/skills';
import type { SkillId, WorldKey } from '../curriculum/types';
import { WORLD_KEYS } from '../curriculum/worlds';
import { addDays } from '../curriculum/review';
import { dayKey, diligenceBadgesOf, skillState, stickersOf, totalMinutes, type SkillState } from '../store/progress';
import type { AnswerEntry, ProfileProgress } from '../store/types';

export interface Overview {
  levelsDone: number;
  levelsTotal: number;
  worldsDone: number;
  worldsTotal: number;
  stickers: number;
  badges: number;
  minutes: number;
}

/** Підсумок: основних рівнів із 87 (★ не рахуються в загальній кількості, але наліпки за них є), світів, наліпок, значків, хвилин. */
export function overview(progress: ProfileProgress): Overview {
  const main = LEVELS.filter((l) => l.kind === 'main');
  return {
    levelsDone: main.filter((l) => Object.hasOwn(progress.levels, l.id)).length,
    levelsTotal: main.length,
    worldsDone: WORLD_KEYS.filter((w) => isWorldComplete(progress, w)).length,
    worldsTotal: WORLD_KEYS.length,
    stickers: stickersOf(progress).length,
    badges: diligenceBadgesOf(progress).length,
    minutes: Math.round(totalMinutes(progress)),
  };
}

export interface LastSessionInfo {
  day: string;
  minutes: number;
  levels: number;
}

/** Остання сесія: останній день, коли дитина грала (за хвилинами), скільки хвилин і скільки рівнів пройдено того дня; null — ще не грала. */
export function lastSession(progress: ProfileProgress): LastSessionInfo | null {
  const days = Object.entries(progress.minutesByDay).filter(([, m]) => m > 0).map(([d]) => d).sort();
  const day = days.at(-1) ?? progress.history.at(-1)?.day;
  if (!day) return null;
  const levels = Object.values(progress.levels).filter((l) => {
    const t = new Date(l.completedAt);
    return !Number.isNaN(t.getTime()) && dayKey(t) === day;
  }).length;
  return { day, minutes: Math.round((progress.minutesByDay[day] ?? 0) * 10) / 10, levels };
}

export interface SkillRow {
  id: SkillId;
  world: WorldKey;
  star: boolean;
  state: SkillState;
}

/** Карта навичок: 29 рядків у порядку програми зі станами Nowa / W trakcie nauki / Opanowana / Do powtórki. */
export function skillRows(progress: ProfileProgress): SkillRow[] {
  return SKILLS.map((s) => ({ id: s.id, world: s.world, star: s.star === true, state: skillState(progress.skills[s.id]) }));
}

export interface ProgressStats {
  /** % відповідей з першого разу (0…100); null — даних нема. */
  firstTryPct: number | null;
  answers: number;
  hints: number;
  /** Останні 7 днів (від давнього до сьогоднішнього): хвилини. */
  minutes: { day: string; minutes: number }[];
}

export function progressStats(progress: ProfileProgress, today: string): ProgressStats {
  const h = progress.history;
  const first = h.filter((e) => e.firstTry).length;
  return {
    firstTryPct: h.length === 0 ? null : Math.round((first / h.length) * 100),
    answers: h.length,
    hints: h.reduce((sum, e) => sum + e.hints, 0),
    minutes: Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i - 6);
      return { day, minutes: Math.round((progress.minutesByDay[day] ?? 0) * 10) / 10 };
    }),
  };
}

/** Типова плутанина: «13 ↔ 30» (n-надцять й n десятків) чи цифри навпаки («26 ↔ 62»). Повертає упорядковану пару [менше, більше] або null. */
export function confusablePair(a: number, b: number): [number, number] | null {
  if (a === b || a < 11 || b < 11 || a > 99 || b > 99) return null;
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const teen = lo >= 13 && lo <= 19 && hi === (lo - 10) * 10; // 13 ↔ 30 … 19 ↔ 90
  const swapped = lo % 10 !== 0 && hi % 10 !== 0 && Math.floor(lo / 10) === hi % 10 && lo % 10 === Math.floor(hi / 10); // 26 ↔ 62
  return teen || swapped ? [lo, hi] : null;
}

export type Difficulty =
  | { kind: 'confuse'; a: number; b: number; count: number }
  | { kind: 'countsAll'; count: number }
  | { kind: 'flagged'; skill: SkillId };

/** Скільки разів потрібно, щоб плутанину винесли в «Trudności»: одна випадкова помилка нічого не каже. */
export const MIN_CONFUSIONS = 2;
export const MIN_COUNTED_ALL = 2;
/** Навички «лічба далі від числа»: якщо дитина в них часто помиляється чи просить допомоги, найімовірніше вона рахує все спочатку. */
export const COUNT_ON_SKILLS: ReadonlySet<SkillId> = new Set<SkillId>(['count-on', 'count-from-any', 'count-on-100']);
export const COUNT_ON_WINDOW = 12;
export const COUNT_ON_MIN = 4;
export const COUNT_ON_SHARE = 0.5;

/** «Trudności»: пари, які дитина плутає (вибрала одну замість іншої не менше двох разів), «лічить усе спочатку» (прапорець у записах) і навички з прапорцем `flagged`. */
export function difficulties(progress: ProfileProgress): Difficulty[] {
  const pairs = new Map<string, { a: number; b: number; count: number }>();
  let countedAll = 0;
  for (const e of progress.history as readonly AnswerEntry[]) {
    if (e.countedAll) countedAll += 1;
    if (e.answer === undefined) continue;
    for (const w of e.wrong ?? []) {
      const pair = confusablePair(e.answer, w);
      if (!pair) continue;
      const key = pair.join('-');
      const item = pairs.get(key) ?? { a: pair[0], b: pair[1], count: 0 };
      item.count += 1;
      pairs.set(key, item);
    }
  }
  const out: Difficulty[] = [...pairs.values()]
    .filter((p) => p.count >= MIN_CONFUSIONS)
    .sort((x, y) => y.count - x.count || x.a - y.a)
    .map((p): Difficulty => ({ kind: 'confuse', ...p }));
  // «Liczy wszystko od początku»: прямий прапорець у записах, а коли його нема (ігри його поки не ставлять) — евристика: у навичках «лічба далі» половина останніх відповідей не з першого разу
  const countOn = (progress.history as readonly AnswerEntry[]).filter((e) => COUNT_ON_SKILLS.has(e.skill)).slice(-COUNT_ON_WINDOW);
  const weakCountOn = countOn.length >= COUNT_ON_MIN && countOn.filter((e) => !e.firstTry).length / countOn.length >= COUNT_ON_SHARE;
  if (countedAll >= MIN_COUNTED_ALL || weakCountOn) out.push({ kind: 'countsAll', count: Math.max(countedAll, countOn.filter((e) => !e.firstTry).length) });
  for (const [id, record] of Object.entries(progress.skills)) if (record?.flagged) out.push({ kind: 'flagged', skill: id as SkillId });
  return out;
}
