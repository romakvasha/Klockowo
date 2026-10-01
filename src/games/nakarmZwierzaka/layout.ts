// Розкладка сцени «Nakarm zwierzaka» (BRIEF §7 гра 5): тваринка з бульбашкою, що показує число, і запас їжі, з якого дитина кладе на тарілку.
// Широка область (≥ 1,35 : 1) — тваринка зліва, запас праворуч; висока — тваринка згори ліворуч, запас під нею. Тарілка стоїть у лотку (портал), не тут.
// Чиста геометрія: жоден елемент не перекриває інший, не виходить за область і не чіпає ділянки Kubika.
import type { Rect } from '../engine/layoutObjects';
import { itemSize, layoutObjects } from '../engine/layoutObjects';
import type { Rng } from '../engine/rng';

export interface FeedLayout {
  animal: Rect;
  /** Бульбашка тваринки з числом. */
  bubble: Rect;
  /** Лівий верхній кут кожного предмета запасу (за порядком id). */
  supply: { x: number; y: number }[];
  /** Сторона предмета запасу. */
  size: number;
}

export const BUBBLE_W = 150;
export const BUBBLE_H = 104;
const MARGIN = 12;

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Скільки предметів у запасі: на 3 більше, ніж треба дати, але не більше 12 (і не менше 4) — щоб правильна відповідь не була «усе». */
export function supplyCount(n: number): number {
  return Math.max(4, Math.min(12, n + 3));
}

export function feedLayout(area: { w: number; h: number }, count: number, reserved: readonly Rect[], rng: Rng): FeedLayout {
  const wide = area.w / area.h >= 1.35 && area.w >= 700; // вузька область (телефон в альбомі) — тваринка згори, запас знизу
  const topStrip = reserved.filter((r) => r.y === 0).reduce((m, r) => Math.max(m, r.h), 0); // ряд кісточок угорі сцени (телефон)

  let animal: Rect;
  let bubble: Rect;
  let region: Rect;
  if (wide) {
    const colW = Math.min(Math.round(area.w * 0.36), 360);
    const ah = Math.round(Math.min(area.h * 0.58, 220));
    const aw = Math.round((ah * 120) / 136);
    const kubik = reserved.find((r) => r.y > 0 && r.x === 0);
    const bottomLimit = kubik ? kubik.y - 8 : area.h - MARGIN;
    const ay = Math.max(topStrip + MARGIN + BUBBLE_H * 0.35, Math.min(bottomLimit - ah, Math.round((area.h - ah) / 2)));
    animal = { x: Math.max(MARGIN, Math.round((colW - aw) / 2 - 20)), y: Math.round(ay), w: aw, h: ah };
    bubble = { x: animal.x + Math.round(aw * 0.78), y: Math.max(topStrip + MARGIN, animal.y - Math.round(BUBBLE_H * 0.45)), w: BUBBLE_W, h: BUBBLE_H };
    region = { x: colW + MARGIN, y: topStrip + MARGIN, w: area.w - colW - 2 * MARGIN, h: area.h - topStrip - 2 * MARGIN };
  } else {
    const bandH = Math.round(Math.min(area.h * 0.42, 180));
    const ah = bandH - 12;
    const aw = Math.round((ah * 120) / 136);
    animal = { x: MARGIN, y: topStrip + 8, w: aw, h: ah };
    const bw = Math.min(BUBBLE_W, area.w - aw - 3 * MARGIN);
    bubble = { x: animal.x + aw + 10, y: topStrip + 14, w: bw, h: Math.min(BUBBLE_H, ah) };
    region = { x: MARGIN, y: topStrip + bandH + 8, w: area.w - 2 * MARGIN, h: area.h - topStrip - bandH - 8 - MARGIN };
  }

  const size = itemSize({ w: region.w, h: region.h });
  const local = reserved
    .map((r) => ({ x: r.x - region.x, y: r.y - region.y, w: r.w, h: r.h }))
    .filter((r) => intersects(r, { x: 0, y: 0, w: region.w, h: region.h }));
  const placed = layoutObjects({ arrangement: 'scatter', count, area: { w: region.w, h: region.h }, size, rng, reserved: local, margin: 4 });
  return {
    animal,
    bubble,
    supply: placed.items.map((p) => ({ x: Math.round(p.x + region.x), y: Math.round(p.y + region.y) })),
    size: placed.size,
  };
}
