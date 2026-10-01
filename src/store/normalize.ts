// Перевірка й «ремонт» даних з localStorage і з файла імпорту: що завгодно → коректні AppData / ProfileProgress.
// Недійсні записи тихо відкидаються, числа обмежуються, нічого не кидає виняток: зіпсований запис не повинен ламати застосунок.
import { PUP_IDS, type PupId } from '../characters/pups';
import { findLevel } from '../curriculum/levels';
import { isSkillId } from '../curriculum/skills';
import type { GameId, LevelId, WorldId } from '../curriculum/types';
import { isWorldId, parseLevelId } from '../curriculum/worlds';
import { GAME_TITLES } from '../speech/lines';
import { defaultSettings, emptyData, emptyProgress } from './defaults';
import { MAX_HISTORY, MAX_SKILL_DAYS, RECENT_WINDOW } from './progress';
import {
  MAX_NAME_LENGTH, MAX_PROFILES,
  type AnswerEntry, type AppData, type LastSession, type LevelRecord, type LevelRun, type Profile, type ProfileProgress,
  type RecentAnswer, type Settings, type SkillRecord, type TaskOutcome,
} from './types';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const GAME_IDS: ReadonlySet<string> = new Set(Object.keys(GAME_TITLES));
const OUTCOMES: readonly string[] = ['first', 'retry', 'together'];
const FALLBACK_PUP: PupId = 'pon';
const MAX_TASK_RESULTS = 24;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback);
const day = (v: unknown): string | null => (typeof v === 'string' && DAY.test(v) ? v : null);

function num(v: unknown, fallback: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, n));
}

const int = (v: unknown, fallback: number, min: number, max: number): number => Math.round(num(v, fallback, min, max));

function validLevelId(v: unknown): LevelId | null {
  return typeof v === 'string' && parseLevelId(v) !== null && findLevel(v) !== undefined ? (v as LevelId) : null;
}

/** `base` — що підставити замість неприпустимих значень (за замовчуванням — типові налаштування; при зміні одного поля — поточні). */
export function normalizeSettings(raw: unknown, base: Settings = defaultSettings()): Settings {
  const d = base;
  if (!isRecord(raw)) return d;
  const volumes = isRecord(raw.volumes) ? raw.volumes : {};
  const minutes = raw.sessionMinutes;
  return {
    sessionMinutes: minutes === 10 || minutes === 15 || minutes === 20 ? minutes : d.sessionMinutes,
    voiceURI: typeof raw.voiceURI === 'string' && raw.voiceURI !== '' ? raw.voiceURI : null,
    speechRate: num(raw.speechRate, d.speechRate, 0.7, 1.2),
    volumes: {
      speech: num(volumes.speech, d.volumes.speech, 0, 1),
      effects: num(volumes.effects, d.volumes.effects, 0, 1),
      music: num(volumes.music, d.volumes.music, 0, 1),
    },
    reduceMotion: bool(raw.reduceMotion, d.reduceMotion),
    extraTasks: bool(raw.extraTasks, d.extraTasks),
    panelLanguage: raw.panelLanguage === 'uk' ? 'uk' : 'pl',
  };
}

export function normalizeProfile(raw: unknown): Profile | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id === '') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, MAX_NAME_LENGTH) : '';
  const pup = (PUP_IDS as readonly string[]).includes(raw.pup as string) ? (raw.pup as PupId) : FALLBACK_PUP;
  return { id: raw.id, name: name === '' ? null : name, pup, createdAt: str(raw.createdAt, new Date(0).toISOString()) };
}

function normalizeLevelRecord(raw: unknown): LevelRecord | null {
  if (!isRecord(raw)) return null;
  return {
    completedAt: str(raw.completedAt, new Date(0).toISOString()),
    plays: int(raw.plays, 1, 1, 10_000),
    togetherUsed: bool(raw.togetherUsed, false),
    firstTry: int(raw.firstTry, 0, 0, MAX_TASK_RESULTS),
  };
}

function normalizeRun(raw: unknown): LevelRun | null {
  if (!isRecord(raw)) return null;
  const results = list(raw.results).filter((r): r is TaskOutcome => typeof r === 'string' && OUTCOMES.includes(r)).slice(0, MAX_TASK_RESULTS);
  return { seed: int(raw.seed, 0, 0, 0xffffffff), results, startedAt: str(raw.startedAt, new Date(0).toISOString()) };
}

function normalizeSkill(raw: unknown): SkillRecord | null {
  if (!isRecord(raw)) return null;
  const recent: RecentAnswer[] = [];
  for (const r of list(raw.recent)) {
    const d = isRecord(r) ? day(r.day) : null;
    if (isRecord(r) && d) recent.push({ ok: bool(r.ok, false), day: d });
  }
  const attempts = int(raw.attempts, 0, 0, 1_000_000);
  return {
    attempts,
    firstTry: Math.min(attempts, int(raw.firstTry, 0, 0, 1_000_000)),
    recent: recent.slice(-RECENT_WINDOW),
    days: list(raw.days).map(day).filter((d): d is string => d !== null).slice(-MAX_SKILL_DAYS),
    needsReview: bool(raw.needsReview, false),
    step: int(raw.step, 0, 0, 20),
    stage: int(raw.stage, 0, 0, 5),
    due: day(raw.due),
  };
}

function normalizeEntry(raw: unknown): AnswerEntry | null {
  if (!isRecord(raw)) return null;
  const d = day(raw.day);
  if (!d || !isSkillId(raw.skill) || typeof raw.game !== 'string' || !GAME_IDS.has(raw.game)) return null;
  const firstTry = bool(raw.firstTry, false);
  const entry: AnswerEntry = {
    t: num(raw.t, 0, 0),
    day: d,
    skill: raw.skill,
    game: raw.game as GameId,
    level: validLevelId(raw.level),
    firstTry,
    attempts: int(raw.attempts, firstTry ? 1 : 2, 1, 3),
    hints: int(raw.hints, 0, 0, 50),
    together: bool(raw.together, false),
    ms: int(raw.ms, 0, 0, 3_600_000),
  };
  if (typeof raw.answer === 'number' && Number.isFinite(raw.answer)) entry.answer = raw.answer;
  const wrong = list(raw.wrong).filter((n): n is number => typeof n === 'number' && Number.isFinite(n)).slice(0, 6);
  if (wrong.length > 0) entry.wrong = wrong;
  if (raw.countedAll === true) entry.countedAll = true;
  return entry;
}

function normalizeLastSession(raw: unknown): LastSession | null {
  if (!isRecord(raw)) return null;
  const d = day(raw.day);
  if (!d) return null;
  const levels = list(raw.levels).map(validLevelId).filter((l): l is LevelId => l !== null).slice(0, 40);
  return { day: d, minutes: num(raw.minutes, 0, 0, 1440), levels };
}

export function normalizeProgress(raw: unknown): ProfileProgress {
  const out = emptyProgress();
  if (!isRecord(raw)) return out;

  if (isRecord(raw.levels)) {
    for (const [id, value] of Object.entries(raw.levels)) {
      const level = validLevelId(id);
      const record = normalizeLevelRecord(value);
      if (level && record) out.levels[level] = record;
    }
  }
  if (isRecord(raw.runs)) {
    for (const [id, value] of Object.entries(raw.runs)) {
      const level = validLevelId(id);
      const run = normalizeRun(value);
      if (level && run) out.runs[level] = run;
    }
  }
  if (isRecord(raw.skills)) {
    for (const [id, value] of Object.entries(raw.skills)) {
      const record = normalizeSkill(value);
      if (isSkillId(id) && record) out.skills[id] = record;
    }
  }
  out.history = list(raw.history).map(normalizeEntry).filter((e): e is AnswerEntry => e !== null).slice(-MAX_HISTORY);
  if (isRecord(raw.minutesByDay)) {
    for (const [d, minutes] of Object.entries(raw.minutesByDay)) {
      if (DAY.test(d) && typeof minutes === 'number') out.minutesByDay[d] = num(minutes, 0, 0, 1440);
    }
  }
  const unlocked = new Set<WorldId>();
  for (const w of list(raw.manualUnlocks)) if (isWorldId(w)) unlocked.add(w);
  out.manualUnlocks = [...unlocked];
  out.lastSession = normalizeLastSession(raw.lastSession);
  return out;
}

export function normalizeData(raw: unknown): AppData {
  if (!isRecord(raw)) return emptyData();
  const profiles: Profile[] = [];
  const seen = new Set<string>();
  for (const candidate of list(raw.profiles)) {
    const profile = normalizeProfile(candidate);
    if (profile && !seen.has(profile.id) && profiles.length < MAX_PROFILES) {
      seen.add(profile.id);
      profiles.push(profile);
    }
  }
  const stored = isRecord(raw.progress) ? raw.progress : {};
  const progress: Record<string, ProfileProgress> = {};
  for (const p of profiles) progress[p.id] = normalizeProgress(stored[p.id]);
  return {
    profiles,
    activeProfileId: typeof raw.activeProfileId === 'string' && seen.has(raw.activeProfileId) ? raw.activeProfileId : null,
    settings: normalizeSettings(raw.settings),
    progress,
  };
}
