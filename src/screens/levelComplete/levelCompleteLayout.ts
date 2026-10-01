// Композиція Koniec poziomu (BRIEF §6.8). У дизайні цього екрана немає, тож розкладка зібрана з BRIEF і блоків інших екранів:
// угорі ряд із 6 кісточок (як у HUD), з якого вони по одній летять у миску Kubika; Kubik святкує, врятована тваринка дякує,
// відкривається наліпка, а за потреби — значок «Nie poddajesz się!». Альбом — сцена 1280×720, портрет — 390×700.
import type { Box } from '../mission/missionLayout';

export type CompleteOrientation = 'landscape' | 'portrait';

export interface Rail {
  x: number;
  y: number;
  slotW: number;
  slotH: number;
  pitch: number;
}

export interface CompleteLayout {
  width: number;
  height: number;
  /** Верх смуги ґрунту. */
  ground: number;
  /** Ряд слотів-кісточок угорі (звідси кісточки летять). */
  rail: Rail;
  kubik: Box;
  /** Миска: лівий верхній кут і масштаб відносно 220×120. */
  bowl: { x: number; y: number; scale: number };
  animal: Box;
  sticker: Box;
  badge: Box;
}

export const BOWL_W = 220;
export const BOWL_H = 120;
/** Отвір миски (центр еліпса-обідка) у координатах 220×120; кісточка долітає трохи вище нього. */
export const BOWL_MOUTH = { x: 110, y: 30 };
export const BONE_FLIGHT_MS = 600;
export const BONE_STAGGER_MS = 150;

const LANDSCAPE: CompleteLayout = {
  width: 1280, height: 720, ground: 560,
  rail: { x: 456, y: 36, slotW: 56, slotH: 48, pitch: 64 },
  kubik: { x: 190, y: 330, w: 200, h: 250 },
  bowl: { x: 430, y: 470, scale: 1 },
  animal: { x: 920, y: 300, w: 240, h: 272 },
  sticker: { x: 520, y: 110, w: 220, h: 220 },
  badge: { x: 790, y: 130, w: 150, h: 150 },
};

const PORTRAIT: CompleteLayout = {
  width: 390, height: 700, ground: 500,
  rail: { x: 34, y: 116, slotW: 48, slotH: 42, pitch: 56 },
  kubik: { x: 12, y: 350, w: 136, h: 170 },
  bowl: { x: 98, y: 530, scale: 0.8 },
  animal: { x: 246, y: 380, w: 120, h: 136 },
  sticker: { x: 30, y: 176, w: 160, h: 160 },
  badge: { x: 222, y: 190, w: 124, h: 124 },
};

export function completeLayout(orientation: CompleteOrientation): CompleteLayout {
  return orientation === 'landscape' ? LANDSCAPE : PORTRAIT;
}

export function completeOrientation(viewportW: number, viewportH: number): CompleteOrientation {
  return viewportW >= viewportH ? 'landscape' : 'portrait';
}

/** Масштаб сцени у вікні: вміщається повністю; альбом ≤ 1, портрет ≤ 1,5. */
export function completeScale(orientation: CompleteOrientation, viewportW: number, viewportH: number): number {
  const base = completeLayout(orientation);
  const cap = orientation === 'landscape' ? 1 : 1.5;
  const s = Math.min(cap, viewportW / base.width, viewportH / base.height);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

/** Центр слота `i` у ряді кісточок (координати сцени). */
export function slotCenter(rail: Rail, i: number): { x: number; y: number } {
  return { x: rail.x + i * rail.pitch + rail.slotW / 2, y: rail.y + rail.slotH / 2 };
}

/** Куди долітає кісточка: над отвором миски (координати сцени). */
export function bowlTarget(layout: CompleteLayout): { x: number; y: number } {
  return { x: layout.bowl.x + BOWL_MOUTH.x * layout.bowl.scale, y: layout.bowl.y + BOWL_MOUTH.y * layout.bowl.scale };
}

/** Зсув польоту кісточки `i` зі слота в миску — це --dx/--dy анімації kl-bone-fly. */
export function boneFlight(layout: CompleteLayout, i: number): { dx: number; dy: number } {
  const from = slotCenter(layout.rail, i);
  const to = bowlTarget(layout);
  return { dx: Math.round(to.x - from.x), dy: Math.round(to.y - from.y) };
}

/** Скільки мс триває політ усіх кісточок поспіль: старт кожної через BONE_STAGGER_MS після приземлення попередньої. */
export function allBonesMs(count: number): number {
  return count <= 0 ? 0 : count * BONE_FLIGHT_MS + (count - 1) * BONE_STAGGER_MS;
}
