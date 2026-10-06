// Налаштування зі store → мова гри, голос, ефекти, музика, «Mniej animacji». Чиста функція: цілі підставляються (у тестах — підроблені).
import type { Lang } from '../speech/langCode';
import type { Settings } from '../store/types';

export interface SettingsTargets {
  tts: { setRate(rate: number): void; setVolume(volume: number): void; setVoiceURI(uri: string | null): void };
  sfx: { setVolume(volume: number): void };
  music: { setVolume(volume: number): void };
  setReduceMotion(on: boolean): void;
  /** Мова гри (speech/language.ts): спершу вона — далі голос уже цієї мови. */
  setLanguage(lang: Lang): void;
}

/** Повзунки «Mowa» → голос, «Efekty» → звукові ефекти, «Muzyka» → фонова музика; «Tempo mowy» і вибір голосу → tts. */
export function applySettings(settings: Settings, targets: SettingsTargets): void {
  targets.setLanguage(settings.language);
  targets.tts.setRate(settings.speechRate);
  targets.tts.setVolume(settings.volumes.speech);
  targets.tts.setVoiceURI(settings.voiceURI);
  targets.sfx.setVolume(settings.volumes.effects);
  targets.music.setVolume(settings.volumes.music);
  targets.setReduceMotion(settings.reduceMotion);
}

/** <html data-reduce-motion="true"> вмикає у CSS (global.css, motion.css) режим «Mniej animacji». */
export function setReduceMotionAttribute(root: { dataset: Record<string, string | undefined> }, on: boolean): void {
  if (on) root.dataset.reduceMotion = 'true';
  else delete root.dataset.reduceMotion;
}
