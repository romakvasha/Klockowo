import { useSyncExternalStore } from 'react';
import { tts, type SpeakOptions, type SpeakResult } from '../../speech/tts';

// Журнал останніх озвучень для dev-сторінки: видно, чи справді прозвучало (spoken), чи тихо пропущено (skipped).
export interface LogEntry {
  id: number;
  text: string;
  result: SpeakResult;
  ms: number;
}

const MAX_ENTRIES = 6;
let entries: readonly LogEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSpeechLog(): readonly LogEntry[] {
  return useSyncExternalStore(subscribe, () => entries);
}

/** Озвучує фразу (перериваючи попередню) і записує результат у журнал. */
export async function say(text: string, opts: SpeakOptions = {}): Promise<SpeakResult> {
  const t0 = performance.now();
  const result = await tts.speak(text, { interrupt: true, ...opts });
  entries = [{ id: nextId++, text, result, ms: Math.round(performance.now() - t0) }, ...entries].slice(0, MAX_ENTRIES);
  for (const l of [...listeners]) l();
  return result;
}

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
