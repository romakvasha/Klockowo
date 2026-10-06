import type { AppData, ProfileProgress, Settings, SkillRecord } from './types';

/** Громкості: «Mowa» 80 %, «Efekty» 60 % (борд etap1/10), «Muzyka» ≈ 30 % (PLAN M2b); темп 0,9 (POLISH_COPY §8). */
export function defaultSettings(): Settings {
  return {
    sessionMinutes: 15,
    voiceURI: null,
    speechRate: 0.9,
    volumes: { speech: 0.8, effects: 0.6, music: 0.3 },
    reduceMotion: false,
    extraTasks: true,
    panelLanguage: 'pl',
    language: 'pl',
  };
}

export function emptyProgress(): ProfileProgress {
  return { levels: {}, runs: {}, skills: {}, history: [], minutesByDay: {}, manualUnlocks: [], celebrated: [], retry: [], lastSession: null };
}

export function emptySkill(): SkillRecord {
  return { attempts: 0, firstTry: 0, recent: [], days: [], needsReview: false, step: 0, sinceStep: 0, streak: 0, struggle: 0, flagged: false, stage: 0, due: null };
}

export function emptyData(): AppData {
  return { profiles: [], activeProfileId: null, settings: defaultSettings(), progress: {} };
}
