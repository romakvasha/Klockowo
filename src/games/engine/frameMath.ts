// Геометрія ігрового екрана (BRIEF §7, §12; design etap2/00–05): який вигляд у вікна й які ділянки сцени займає Kubik. Чисті функції.
import type { Rect } from './layoutObjects';

/** wide — альбом ПК/планшет (Kubik стоїть внизу ліворуч, трохи заходячи на сцену); portrait — сцена-квадрат, лоток під нею, Kubik у нижньому ряду;
 *  phone — телефон в альбомі (бічна смуга, лоток-стовпець, Kubik прихований). Збігається з медіа-запитами в GameFrame.module.css. */
export type FrameKind = 'wide' | 'portrait' | 'phone';

export function frameKind(viewportW: number, viewportH: number): FrameKind {
  if (viewportH > viewportW) return 'portrait';
  return viewportH <= 500 ? 'phone' : 'wide';
}

/** Висота Kubika за в'юпортом (responsive.css): 184 → 150 (≤ 1100 px завширшки). Для portrait і phone Kubik не заходить на сцену. */
export function kubikHeight(viewportW: number): number {
  return viewportW <= 1100 ? 150 : 184;
}

/** `left` — відступ області сцени від лівого краю сторінки. Ділянки сцени, куди предмети не ставимо: у широкому вигляді Kubik і його бульбашка заходять на нижній лівий кут сцени
 *  (борд etap2/00: бульбашка 140–290 × 424–520 при сцені 104–536 → це нижні ≈ 112 px і ліві ≈ 300 px); на телефоні в альбомі — смуга кісточок угорі. */
export function sceneReserved(kind: FrameKind, viewportW: number, area: { w: number; h: number }, left = 0): Rect[] {
  if (area.w <= 0 || area.h <= 0) return [];
  // телефон в альбомі: ряд із 6 кісточок (28 px) лежить угорі сцени — предмети його не чіпають (борд etap2/05)
  if (kind === 'phone') return [{ x: 0, y: 0, w: area.w, h: 46 }];
  if (kind !== 'wide') return [];
  const k = kubikHeight(viewportW);
  const h = Math.round(k * 0.65 + 8);
  // `left` — відступ області від лівого краю сторінки (на 1440 px завширшки сцена 1280 стоїть по центру): ділянка Kubika від краю сторінки
  const w = Math.round(k * 1.7) - Math.round(left);
  return w > 0 ? [{ x: 0, y: Math.max(0, area.h - h), w, h }] : [];
}
