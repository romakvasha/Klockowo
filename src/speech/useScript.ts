import { useEffect, useRef } from 'react';
import { startScript, type ScriptApi } from './script';
import { tts } from './tts';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Запускає сценарій при монтуванні й щоразу, коли змінюється `restart` (наприклад, «Posłuchaj» збільшує лічильник).
 *  Під час виходу з екрана чи перезапуску голос і сценарій обриваються, тож нічого не лунає на наступному екрані.
 *  `body` береться з останнього рендеру (ref): його не треба обгортати в useCallback. */
export function useScript(body: (api: ScriptApi) => Promise<void>, restart: unknown = 0): void {
  const latest = useRef(body);
  latest.current = body;
  useEffect(() => {
    const stop = startScript({ speak: (text, opts) => tts.speak(text, opts), sleep }, (api) => latest.current(api));
    return () => {
      stop();
      tts.cancel();
    };
  }, [restart]);
}
