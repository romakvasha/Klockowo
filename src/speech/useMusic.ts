import { useSyncExternalStore } from 'react';
import { music, type MusicState } from './music';

/** Стан музики для React (dev-сторінка, пізніше — налаштування). Знімок стабільний, доки стан не змінився. */
export function useMusic(): MusicState {
  return useSyncExternalStore(music.subscribe, music.getState);
}
