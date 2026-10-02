// «Brak polskiego głosu» показуємо дорослому один раз за сесію вкладки (BRIEF §6 п.16): після Ładowanie, якщо польського голосу немає. Чиста логіка вибору + запам'ятовування в sessionStorage.
import type { TtsStatus } from '../speech/ttsTypes';

const KEY = 'klockowo.noVoiceSeen';

/** Чи треба показати екран про відсутність голосу: статус «no-voice» чи «unsupported» і ще не показували. */
export function shouldShowNoVoice(status: TtsStatus, seen: boolean): boolean {
  return !seen && (status === 'no-voice' || status === 'unsupported');
}

export function noVoiceSeen(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markNoVoiceSeen(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // без sessionStorage екран показується при кожному запуску — це прийнятно
  }
}

/** Куди йти з Ładowanie: на екран про голос або на Start. */
export function afterLoadingPath(status: TtsStatus, seen: boolean): '/no-voice' | '/start' {
  return shouldShowNoVoice(status, seen) ? '/no-voice' : '/start';
}
