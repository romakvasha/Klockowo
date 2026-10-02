// Що саме «завантажуємо» на екрані Ładowanie (BRIEF §6.1): шрифти й визначення польського голосу. Застосунок локальний,
// тож це секунда-дві; обидва кроки мають власні стелі, щоб ніколи не зависнути.
import { getLanguage } from '../../speech/language';
import { tts } from '../../speech/tts';

const FONTS = ['700 1em Fredoka', '600 1em Fredoka', '700 1em Nunito', '600 1em Nunito', '700 1em Andika'];
const SAMPLE = 'Łąka Ćma Źrebię Żaba 0123456789';
/** Українська: кирилиця йде з Nunito (у Fredoka її нема) — підвантажуємо й її, щоб перший екран не блимнув іншим шрифтом. */
const SAMPLE_UK = 'Їжак Ґудзик Єнот Щука 0123456789';

export const BOOT_TASKS = 2;

export function whenFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const sample = getLanguage() === 'uk' ? `${SAMPLE} ${SAMPLE_UK}` : SAMPLE;
  return Promise.all(FONTS.map((font) => document.fonts.load(font, sample)))
    .then(() => undefined)
    .catch(() => undefined);
}

/** Голоси браузера вантажаться асинхронно: чекаємо, доки статус вийде зі «loading» (або стеля), щоб екран NoVoice не «блимнув». */
export function whenVoiceSettled(timeoutMs = 2500): Promise<void> {
  return new Promise((resolve) => {
    if (tts.getState().status !== 'loading') {
      resolve();
      return;
    }
    let unsubscribe: () => void = () => undefined;
    const timer = window.setTimeout(finish, timeoutMs);
    function finish(): void {
      window.clearTimeout(timer);
      unsubscribe();
      resolve();
    }
    unsubscribe = tts.subscribe(() => {
      if (tts.getState().status !== 'loading') finish();
    });
  });
}
