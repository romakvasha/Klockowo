import { useCallback, useEffect, useRef } from 'react';
import { startScript, type ScriptApi } from './script';
import { tts } from './tts';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const env = { speak: (text: string, opts?: Parameters<typeof tts.speak>[1]) => tts.speak(text, opts), sleep };

/** Запускає сценарій при монтуванні й щоразу, коли змінюється `restart` (наприклад, «Posłuchaj» збільшує лічильник).
 *  Під час виходу з екрана чи перезапуску голос і сценарій обриваються, тож нічого не лунає на наступному екрані.
 *  `body` береться з останнього рендеру (ref): його не треба обгортати в useCallback. */
export function useScript(body: (api: ScriptApi) => Promise<void>, restart: unknown = 0): void {
  const latest = useRef(body);
  latest.current = body;
  useEffect(() => {
    const stop = startScript(env, (api) => latest.current(api));
    return () => {
      stop();
      tts.cancel();
    };
  }, [restart]);
}

export interface ScriptRunner {
  /** Запускає сценарій; попередній (якщо ще йде) обривається — одночасно живий лише один. */
  run(body: (api: ScriptApi) => Promise<void>): void;
  /** Обриває поточний сценарій (голос не чіпає: його гасить той, хто викликає). */
  stop(): void;
}

/** Сценарії, що стартують за подіями (дотик до «Gotowe», «Pomóż mi»…): один активний, новий обриває попередній; при виході з екрана
 *  сценарій і голос обриваються. Інструкцію завдання теж запускають через нього, щоб відгук не перетнувся з інструкцією. */
export function useScriptRunner(): ScriptRunner {
  const current = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      current.current?.();
      current.current = null;
      tts.cancel();
    },
    [],
  );
  const stop = useCallback(() => {
    current.current?.();
    current.current = null;
  }, []);
  const run = useCallback((body: (api: ScriptApi) => Promise<void>) => {
    current.current?.();
    current.current = startScript(env, body);
  }, []);
  return { run, stop };
}
