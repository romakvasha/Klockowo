// Геометрія ігрового екрана (BRIEF §7, §12; design etap2/00–05): який вигляд у вікна й які ділянки сцени займає Kubik. Чисті функції.
import type { Rect } from './layoutObjects';

/** wide — альбом ПК/планшет (провідник колонкою ліворуч від дошки); portrait — провідник рядом над дошкою, лоток під нею;
 *  phone — телефон в альбомі (бічна смуга, лоток-стовпець, провідник колонкою біля «Gotowe»). Збігається з медіа-запитами в GameFrame.module.css. */
export type FrameKind = 'wide' | 'portrait' | 'phone';

export function frameKind(viewportW: number, viewportH: number): FrameKind {
  if (viewportH > viewportW) return 'portrait';
  return viewportH <= 500 ? 'phone' : 'wide';
}

/** Ділянки сцени, куди предмети не ставимо. Kubik і бульбашка мають власну зону (D3) і на сцену не заходять;
 *  лишається лише телефон в альбомі — ряд кісточок угорі сцени (HUD-смуга ліворуч, кісточки виступають на сцену). */
export function sceneReserved(kind: FrameKind, area: { w: number; h: number }): Rect[] {
  if (area.w <= 0 || area.h <= 0) return [];
  if (kind === 'phone') return [{ x: 0, y: 0, w: area.w, h: 46 }];
  return [];
}
