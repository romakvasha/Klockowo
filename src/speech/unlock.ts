// Звук, голос і музика вмикаються лише після першого дотику (CLAUDE.md): до нього екран беззвучний.
// Слухачі лишаються на весь сеанс: unlock() дешеві й ідемпотентні, а на iOS/Safari вони ще й «будять»
// AudioContext після згортання вкладки.
import { music } from './music';
import { sfx } from './sfx';
import { tts } from './tts';

// Лише події, що справді рахуються жестом користувача в усіх браузерах (на дотиковому екрані pointerdown — ні):
// click (після mousedown / touchend), touchend, keydown.
const GESTURES = ['click', 'touchend', 'keydown'] as const;

/** Викликається один раз при старті (main.tsx). Повертає функцію зняття слухачів (для тестів). */
export function installAudioUnlock(target: Window = window, doc: Document = document): () => void {
  const onGesture = (): void => {
    tts.unlock();
    sfx.unlock();
    music.unlock(); // після sfx: музика грає через його AudioContext
  };
  // Голос не має звучати у схованій вкладці, а музика — на паузі
  const onVisibility = (): void => {
    if (doc.hidden) tts.cancel();
    music.setHidden(doc.hidden);
  };
  for (const type of GESTURES) target.addEventListener(type, onGesture, { capture: true, passive: true });
  doc.addEventListener('visibilitychange', onVisibility);
  return () => {
    for (const type of GESTURES) target.removeEventListener(type, onGesture, { capture: true });
    doc.removeEventListener('visibilitychange', onVisibility);
  };
}
