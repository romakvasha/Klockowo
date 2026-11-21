// Один <audio> на всю гру для записаного голосу. iOS дозволяє грати звук без дотику лише елементу, який уже раз зіграв від дотику:
// prime() у першому дотику («Graj!») грає на ньому коротку тишу, а далі кожне речення — той самий елемент із новим src.
import { cacheClip } from './clipCache';
import type { AudioLike } from './ttsTypes';

/** 0,05 с тиші (WAV, 8 кГц, 8 біт) — без файлів і мережі. */
function silenceUrl(): string {
  const n = 400;
  const bytes = new Uint8Array(44 + n).fill(128, 44); // тиша у 8-бітному WAV — 128
  const v = new DataView(bytes.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  text(8, 'WAVEfmt ');
  v.setUint32(16, 16, true); // розмір fmt
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // моно
  v.setUint32(24, 8000, true); // частота
  v.setUint32(28, 8000, true); // байтів за секунду
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true); // біт на відлік
  text(36, 'data');
  v.setUint32(40, n, true);
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
}

export function sharedClipAudio(): { make(url: string): AudioLike; prime(): void } {
  let el: HTMLAudioElement | undefined;
  /** Елемент уже справді зіграв (тишу чи запис) — iOS більше не вимагає дотику. */
  let allowed = false;
  let silence: string | undefined;
  const audio = (): HTMLAudioElement => {
    if (!el) {
      el = new Audio();
      el.addEventListener('playing', () => {
        allowed = true;
      });
    }
    return el;
  };
  return {
    make: (url) => {
      const a = audio();
      a.src = url;
      cacheClip(url);
      return a as unknown as AudioLike;
    },
    // Кожен дотик (unlock.ts): доки елемент не зіграв, пробуємо ще раз — перша спроба могла не вдатися (дотик не «рахувався»,
    // тиша не встигла, iOS перервав). Коли елемент грає запис — не чіпаємо.
    prime: () => {
      const a = audio();
      if (allowed || !a.paused) return;
      a.src = silence ??= silenceUrl();
      a.play().catch(() => {
        /* не вийшло — спробуємо в наступному дотику; речення тим часом скаже браузерний голос */
      });
    },
  };
}
