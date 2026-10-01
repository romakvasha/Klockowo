// Резервна копія прогресу профілю: «Eksportuj postępy» / «Importuj postępy» (BRIEF §6.15). Звичайний JSON-файл.
import { SCHEMA_VERSION, migratePersisted } from './migrate';
import type { Profile, ProfileProgress } from './types';

export const BACKUP_APP = 'klockowo';
export const BACKUP_KIND = 'profile-progress';

export interface BackupFile {
  app: typeof BACKUP_APP;
  kind: typeof BACKUP_KIND;
  schemaVersion: number;
  exportedAt: string;
  profile: Profile;
  progress: ProfileProgress;
}

export function createBackup(profile: Profile, progress: ProfileProgress, now: Date): BackupFile {
  return { app: BACKUP_APP, kind: BACKUP_KIND, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), profile, progress };
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2);
}

/** Чому файл не прийнято: не JSON; не наш файл; зроблено новішою версією; порожній чи зіпсований вміст. */
export type BackupError = 'not-json' | 'not-klockowo' | 'unsupported-version' | 'invalid';

export type ParsedBackup = { ok: true; profile: Profile; progress: ProfileProgress } | { ok: false; error: BackupError };

/** Читає й перевіряє файл копії; старі версії схеми проводить через ті самі міграції, що й localStorage. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not-json' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'not-klockowo' };
  const file = raw as Record<string, unknown>;
  if (file.app !== BACKUP_APP || file.kind !== BACKUP_KIND) return { ok: false, error: 'not-klockowo' };
  const version = file.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { ok: false, error: 'invalid' };
  if (version > SCHEMA_VERSION) return { ok: false, error: 'unsupported-version' };

  // міграції працюють із повною схемою даних: загортаємо профіль у AppData, мігруємо й дістаємо назад
  const profile = file.profile as { id?: unknown } | undefined;
  if (typeof profile !== 'object' || profile === null || typeof profile.id !== 'string') return { ok: false, error: 'invalid' };
  const data = migratePersisted(
    { profiles: [file.profile], activeProfileId: profile.id, settings: {}, progress: { [profile.id]: file.progress } },
    version,
  );
  const migrated = data.profiles[0];
  const progress = migrated ? data.progress[migrated.id] : undefined;
  return migrated && progress ? { ok: true, profile: migrated, progress } : { ok: false, error: 'invalid' };
}
