// Сценарій екрана: послідовність «голос → пауза → анімація → далі», яку можна обірвати (вихід з екрана, «Posłuchaj», дотик до «Graj!»).
// На цьому тримається правило «наступне — лише коли голос договорив» для Wprowadzenie, Koniec poziomu й показу разом.
// Чиста логіка без DOM: голос і таймер передає виклик (useScript підставляє справжні, тест — підроблені).
import type { SpeakOptions, SpeakResult } from './ttsTypes';

/** Сценарій обірвано: кидається з say()/wait() і мовчки завершує тіло сценарію. */
export class Cancelled extends Error {
  constructor() {
    super('script cancelled');
    this.name = 'Cancelled';
  }
}

export interface ScriptApi {
  /** Озвучує фразу й чекає, доки голос договорить. Немає голосу (`skipped`) — іде далі; скасовано — обриває сценарій. */
  say(text: string, opts?: SpeakOptions): Promise<void>;
  /** Пауза `ms` мілісекунд; обривається разом зі сценарієм. */
  wait(ms: number): Promise<void>;
}

export interface ScriptEnv {
  speak(text: string, opts?: SpeakOptions): Promise<SpeakResult>;
  sleep(ms: number): Promise<void>;
}

/** Запускає сценарій; повертає функцію обриву. Помилки тіла, окрім обриву, не ковтаються — вони спливають як unhandled rejection. */
export function startScript(env: ScriptEnv, body: (api: ScriptApi) => Promise<void>): () => void {
  let alive = true;
  const api: ScriptApi = {
    async say(text, opts) {
      if (!alive) throw new Cancelled();
      const result = await env.speak(text, opts);
      if (!alive || result === 'cancelled') throw new Cancelled();
    },
    async wait(ms) {
      if (!alive) throw new Cancelled();
      await env.sleep(ms);
      if (!alive) throw new Cancelled();
    },
  };
  body(api).catch((error: unknown) => {
    if (!(error instanceof Cancelled)) throw error;
  });
  return () => {
    alive = false;
  };
}
