import { emptyProgress } from './defaults';
import type { AppData, Profile, ProfileProgress } from './types';
import type { ProgressSnapshot } from '../curriculum/progression';

/** Один незмінний «порожній» прогрес на всіх: селектор без активного профілю не створює новий об'єкт на кожен виклик. */
export const NO_PROGRESS: ProfileProgress = emptyProgress();

export function selectActiveProfile(state: Pick<AppData, 'profiles' | 'activeProfileId'>): Profile | null {
  return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
}

export function selectActiveProgress(state: Pick<AppData, 'progress' | 'activeProfileId'>): ProfileProgress {
  return (state.activeProfileId && state.progress[state.activeProfileId]) || NO_PROGRESS;
}

/** Прогрес як знімок для curriculum/progression (структурно сумісний). */
export function asSnapshot(progress: ProfileProgress): ProgressSnapshot {
  return progress;
}
