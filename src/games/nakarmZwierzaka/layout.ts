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
  /** Коробки по 10 (режим boxes): лівий верхній кут кожної; порожньо, коли коробок нема. */
  boxes: { x: number; y: number }[];
  /** Сторона коробки (0, коли коробок нема). */
  boxSize: number;
}

export const BUBBLE_W = 150;
export const BUBBLE_H = 104;
const MARGIN = 12;

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Скільки предметів у запасі: на 3 більше, ніж треба дати, але не більше 12 (і не менше 4) — щоб правильна відповідь не була «усе». */
export function supplyCount(n: number): number {
  return Math.max(4, Math.min(12, n + 3));
}

/** Коробки на десять у запасі (режим boxes): стільки, скільки десятків треба, і ще одна; не більше 6. Предметів поштучно — як для одиниць (`supplyCount` від одиниць). */
export function boxSupply(n: number): { boxes: number; singles: number } {
  return { boxes: Math.min(6, Math.floor(n / 10) + 1), singles: supplyCount(n % 10) };
}

const BOX_MAX = 84;
const BOX_GAP = 8;

/** Коробки в один ряд (чи два, якщо ряд вузький) у верхній частині області запасу; сторона не менша за 64, коли вміщається. */
export function boxGrid(region: { w: number; h: number }, boxes: number): { size: number; cols: number; rows: number } {
  let best = { size: 0, cols: boxes, rows: 1 };
  for (const rows of [1, 2]) {
    const cols = Math.ceil(boxes / rows);
    const size = Math.max(0, Math.min(BOX_MAX, Math.floor((region.w + BOX_GAP) / cols) - BOX_GAP, Math.floor((region.h * 0.5 + BOX_GAP) / rows) - BOX_GAP));
    best = { size, cols, rows };
    if (size >= 64) break;
  }
  return best;
}

export function feedLayout(area: { w: number; h: number }, count: number, reserved: readonly Rect[], rng: Rng, boxCount = 0): FeedLayout {
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
    // із коробками по 10 тваринці лишається вужча смуга: місце потрібне коробкам і предметам поштучно
    const bandH = Math.round(boxCount > 0 ? Math.min(area.h * 0.27, 96) : Math.min(area.h * 0.42, 180));
    const ah = bandH - 12;
    const aw = Math.round((ah * 120) / 136);
    animal = { x: MARGIN, y: topStrip + 8, w: aw, h: ah };
    const bw = Math.min(BUBBLE_W, area.w - aw - 3 * MARGIN);
    bubble = { x: animal.x + aw + 10, y: topStrip + 14, w: bw, h: Math.min(BUBBLE_H, ah) };
    region = { x: MARGIN, y: topStrip + bandH + 8, w: area.w - 2 * MARGIN, h: area.h - topStrip - bandH - 8 - MARGIN };
  }

  // коробки по 10 займають верх області, предмети поштучно — решту під ними
  const grid = boxCount > 0 ? boxGrid(region, boxCount) : { size: 0, cols: 0, rows: 0 };
  const boxes = Array.from({ length: boxCount }, (_, i) => ({
    x: region.x + (i % grid.cols) * (grid.size + BOX_GAP),
    y: region.y + Math.floor(i / grid.cols) * (grid.size + BOX_GAP),
  }));
  const band = boxCount > 0 ? grid.rows * (grid.size + BOX_GAP) + 4 : 0;
  region = { x: region.x, y: region.y + band, w: region.w, h: region.h - band };

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
    boxes,
    boxSize: grid.size,
  };
}
