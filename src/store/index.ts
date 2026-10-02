// Дані застосунку (M5): профілі, налаштування, прогрес. Імпорт: `import { useAppStore, selectActiveProgress } from '../store'`.
export { BACKUP_APP, BACKUP_KIND, createBackup, parseBackup, serializeBackup, type BackupError, type BackupFile, type ParsedBackup } from './backup';
export { appStore, browserStorage, createAppStore, memoryStorage, useAppStore, type AppActions, type AppState, type AppStore, type ImportOutcome, type ImportTarget, type ProfileInput, type StoreEnv, STORAGE_KEY } from './appStore';
export { defaultSettings, emptyData, emptyProgress, emptySkill } from './defaults';
export { MIGRATIONS, SCHEMA_VERSION, migratePersisted, type Migration } from './migrate';
export { normalizeData, normalizeProfile, normalizeProgress, normalizeSettings } from './normalize';
export {
  MAX_HISTORY, RECENT_WINDOW, addPlayTime, addRetry, celebrateWorld, clearRun, completeLevel, dayKey, diligenceBadgesOf, isMastered, recordAnswer, removeRetry, saveRun,
  skillState, skillsToReview, stickersOf, totalMinutes, updateSkill, type LevelSummary, type SkillState,
} from './progress';
export { NO_PROGRESS, asSnapshot, selectActiveProfile, selectActiveProgress } from './selectors';
export * from './types';
