import { useSyncExternalStore } from 'react';
import { tts, type TtsState } from './tts';

/** Стан голосу для React (екран NoVoice, налаштування, dev-сторінка). Знімок стабільний, доки стан не змінився. */
export function useTts(): TtsState {
  return useSyncExternalStore(tts.subscribe, tts.getState);
}
