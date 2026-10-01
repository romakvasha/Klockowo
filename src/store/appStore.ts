// Єдиний стор застосунку: профілі, налаштування, прогрес. zustand + persist у localStorage; версія схеми й міграції — migrate.ts.
// Усю логіку змін винесено в чисті функції (progress.ts, normalize.ts, backup.ts); тут — лише склейка й збереження.
import { useStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { PUP_IDS, type PupId } from '../characters/pups';
import type { LevelId, WorldId } from '../curriculum/types';
import { createBackup, parseBackup, serializeBackup, type BackupError } from './backup';
import { emptyProgress } from './defaults';
import { SCHEMA_VERSION, migratePersisted } from './migrate';
import { normalizeData, normalizeProfile, normalizeSettings } from './normalize';
import { addPlayTime, clearRun, completeLevel, dayKey, recordAnswer, saveRun, type LevelSummary } from './progress';
import { MAX_PROFILES, type AnswerEntry, type AppData, type LevelRun, type Profile, type ProfileProgress, type Settings } from './types';

export const STORAGE_KEY = 'klockowo';

export interface ProfileInput {
  name?: string | null;
  pup: PupId;
}

export type ImportTarget = { type: 'new' } | { type: 'replace'; profileId: string };
export type ImportOutcome = { ok: true; profileId: string } | { ok: false; error: BackupError | 'too-many-profiles' | 'no-profile' };

export interface AppActions {
  /** Додає профіль (до 4). Повертає id або null, коли місця немає. Перший профіль стає активним. */
  addProfile(input: ProfileInput): string | null;
  updateProfile(id: string, patch: Partial<ProfileInput>): void;
  removeProfile(id: string): void;
  /** Обирає активного (того, хто зараз грає); null — нікого («Kto dziś gra?»). */
  selectProfile(id: string | null): void;
  updateSettings(patch: Partial<Omit<Settings, 'volumes'>> & { volumes?: Partial<Settings['volumes']> }): void;
  // Дії над прогресом активного профілю (без активного — нічого не роблять).
  recordAnswer(entry: AnswerEntry): void;
  completeLevel(id: LevelId, summary: LevelSummary): void;
  saveRun(id: LevelId, run: LevelRun): void;
  clearRun(id: LevelId): void;
  addPlayTime(minutes: number): void;
  setWorldUnlocked(world: WorldId, unlocked: boolean): void;
  /** «Wyczyść postępy»: прогрес профілю обнуляється, сам профіль лишається. */
  resetProgress(profileId: string): void;
  /** «Eksportuj postępy»: JSON-текст копії або null, якщо профілю немає. */
  exportProfile(profileId: string): string | null;
  /** «Importuj postępy»: у новий профіль або замість прогресу наявного. */
  importProfile(text: string, target: ImportTarget): ImportOutcome;
}

export type AppState = AppData & AppActions;
export type AppStore = StoreApi<AppState>;

/** Залежності від середовища: у тестах підміняються (час, id). */
export interface StoreEnv {
  now(): Date;
  newId(): string;
}

const realEnv: StoreEnv = {
  now: () => new Date(),
  newId: () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
};

/** Синхронне сховище: getItem повертає рядок одразу (не Promise), як і localStorage. */
export interface SyncStorage extends StateStorage {
  getItem(key: string): string | null;
}

/** Сховище в пам'яті: резерв, коли localStorage недоступний (приватний режим), і основа тестів. */
export function memoryStorage(initial: Record<string, string> = {}): SyncStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

/** localStorage із запобіжником: заблокований, переповнений чи відсутній — падаємо на пам'ять, не ламаючи застосунок. */
export function browserStorage(): StateStorage {
  try {
    const ls = globalThis.localStorage;
    const probe = `${STORAGE_KEY}-probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return {
      getItem: (key) => ls.getItem(key),
      setItem: (key, value) => {
        try {
          ls.setItem(key, value);
        } catch {
          /* квота вичерпана — стан лишається в пам'яті до перезавантаження */
        }
      },
      removeItem: (key) => ls.removeItem(key),
    };
  } catch {
    return memoryStorage();
  }
}

function withActive(state: AppState, change: (progress: ProfileProgress) => ProfileProgress): Partial<AppState> {
  const id = state.activeProfileId;
  if (!id) return {};
  return { progress: { ...state.progress, [id]: change(state.progress[id] ?? emptyProgress()) } };
}

export function createAppStore(storage: StateStorage = browserStorage(), env: StoreEnv = realEnv): AppStore {
  return createStore<AppState>()(
    persist(
      (set, get) => ({
        ...normalizeData(undefined),

        addProfile(input) {
          const { profiles } = get();
          if (profiles.length >= MAX_PROFILES) return null;
          let id = env.newId();
          while (profiles.some((p) => p.id === id)) id = env.newId();
          const profile = normalizeProfile({ id, name: input.name ?? null, pup: input.pup, createdAt: env.now().toISOString() });
          if (!profile) return null;
          set((s) => ({
            profiles: [...s.profiles, profile],
            progress: { ...s.progress, [id]: emptyProgress() },
            activeProfileId: s.activeProfileId ?? id,
          }));
          return id;
        },

        updateProfile(id, patch) {
          set((s) => ({
            profiles: s.profiles.map((p): Profile => {
              if (p.id !== id) return p;
              const pup = patch.pup !== undefined && (PUP_IDS as readonly string[]).includes(patch.pup) ? patch.pup : p.pup;
              const name = patch.name === undefined ? p.name : patch.name;
              return normalizeProfile({ ...p, name, pup }) ?? p;
            }),
          }));
        },

        removeProfile(id) {
          set((s) => {
            const { [id]: _removed, ...progress } = s.progress;
            return {
              profiles: s.profiles.filter((p) => p.id !== id),
              progress,
              activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
            };
          });
        },

        selectProfile(id) {
          set((s) => (id === null || s.profiles.some((p) => p.id === id) ? { activeProfileId: id } : {}));
        },

        updateSettings(patch) {
          // неприпустиме значення залишає поточне, а не скидає до типового
          set((s) => ({
            settings: normalizeSettings({ ...s.settings, ...patch, volumes: { ...s.settings.volumes, ...patch.volumes } }, s.settings),
          }));
        },

        recordAnswer: (entry) => set((s) => withActive(s, (p) => recordAnswer(p, entry))),
        completeLevel: (id, summary) => set((s) => withActive(s, (p) => completeLevel(p, id, summary, env.now()))),
        saveRun: (id, run) => set((s) => withActive(s, (p) => saveRun(p, id, run))),
        clearRun: (id) => set((s) => withActive(s, (p) => clearRun(p, id))),
        addPlayTime: (minutes) => set((s) => withActive(s, (p) => addPlayTime(p, dayKey(env.now()), minutes))),

        setWorldUnlocked(world, unlocked) {
          set((s) =>
            withActive(s, (p) => {
              const rest = p.manualUnlocks.filter((w) => w !== world);
              return { ...p, manualUnlocks: unlocked ? [...rest, world] : rest };
            }),
          );
        },

        resetProgress(profileId) {
          set((s) => (s.profiles.some((p) => p.id === profileId) ? { progress: { ...s.progress, [profileId]: emptyProgress() } } : {}));
        },

        exportProfile(profileId) {
          const { profiles, progress } = get();
          const profile = profiles.find((p) => p.id === profileId);
          return profile ? serializeBackup(createBackup(profile, progress[profileId] ?? emptyProgress(), env.now())) : null;
        },

        importProfile(text, target) {
          const parsed = parseBackup(text);
          if (!parsed.ok) return parsed;
          const { profiles } = get();
          if (target.type === 'replace') {
            if (!profiles.some((p) => p.id === target.profileId)) return { ok: false, error: 'no-profile' };
            set((s) => ({ progress: { ...s.progress, [target.profileId]: parsed.progress } }));
            return { ok: true, profileId: target.profileId };
          }
          if (profiles.length >= MAX_PROFILES) return { ok: false, error: 'too-many-profiles' };
          let id = env.newId();
          while (profiles.some((p) => p.id === id)) id = env.newId();
          const profile: Profile = { ...parsed.profile, id };
          set((s) => ({
            profiles: [...s.profiles, profile],
            progress: { ...s.progress, [id]: parsed.progress },
            activeProfileId: s.activeProfileId ?? id,
          }));
          return { ok: true, profileId: id };
        },
      }),
      {
        name: STORAGE_KEY,
        version: SCHEMA_VERSION,
        storage: createJSONStorage<AppData>(() => storage),
        partialize: (s): AppData => ({
          profiles: s.profiles, activeProfileId: s.activeProfileId, settings: s.settings, progress: s.progress,
        }),
        migrate: (persisted, version) => migratePersisted(persisted, version),
        // нормалізація завжди, навіть коли версія збігається й migrate не викликається: зіпсований запис не ламає застосунок
        merge: (persisted, current) => ({ ...current, ...normalizeData(persisted) }),
      },
    ),
  );
}

/** Стор застосунку (localStorage). */
export const appStore: AppStore = createAppStore();

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector);
}
