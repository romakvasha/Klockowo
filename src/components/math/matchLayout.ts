// Розкладка «Cyfra i obrazek»: набори-картинки лежать на сцені сіткою (ряд чи кілька рядів, останній по центру), цифри — плитками в лотку.
// Чиста геометрія: картка — найбільша з можливих (до MAX_SET), ділянки під Kubika (reserved) не чіпаємо.
import type { Rect } from '../../games/engine/layoutObjects';
import { freeBand, type Area } from './trainLayout';

export const MAX_SET = 200;
export const SET_GAP = 20;
export const SET_MARGIN = 16;

export interface SetsLayout {
  /** Сторона квадратної картки, px. */
  size: number;
  cols: number;
  rows: number;
  /** Позиції карток за порядком наборів (рядок за рядком). */
  rects: Rect[];
}

/** Яка сітка дає найбільшу картку для `k` наборів у смузі `availW × availH`: перебираємо кількість стовпців, при рівності — менше рядів. */
function bestGrid(availW: number, availH: number, k: number): { size: number; cols: number; rows: number } {
  let best = { size: 0, cols: 1, rows: k };
  for (let cols = 1; cols <= k; cols++) {
    const rows = Math.ceil(k / cols);
    const size = Math.min(MAX_SET, Math.floor((availW - (cols - 1) * SET_GAP) / cols), Math.floor((availH - (rows - 1) * SET_GAP) / rows));
    if (size > best.size || (size === best.size && rows < best.rows)) best = { size, cols, rows };
  }
  return best;
}

function place(area: Area, k: number, top: number, availH: number): SetsLayout {
  const { size, cols, rows } = bestGrid(area.w - 2 * SET_MARGIN, availH, k);
  const blockH = rows * size + (rows - 1) * SET_GAP;
  const y0 = top + Math.max(0, (availH - blockH) / 2);
  const rects: Rect[] = [];
  for (let i = 0; i < k; i++) {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, k - row * cols);
    const rowW = inRow * size + (inRow - 1) * SET_GAP;
    const x0 = (area.w - rowW) / 2;
    rects.push({ x: Math.round(x0 + (i - row * cols) * (size + SET_GAP)), y: Math.round(y0 + row * (size + SET_GAP)), w: size, h: size });
  }
  return { size, cols, rows, rects };
}

const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Розкладка `k` наборів (2–4). Спершу — на всю область (за вирахуванням смуги угорі); якщо картки зачіпають ділянку Kubika внизу, ту саму розкладку
 *  рахуємо лише над нею. */
export function setsLayout(area: Area, reserved: readonly Rect[], k: number): SetsLayout {
  const { top, bottom } = freeBand(area, reserved);
  const full = place(area, k, top + SET_MARGIN, Math.max(1, area.h - top - 2 * SET_MARGIN));
  if (reserved.some((r) => full.rects.some((c) => overlaps(c, r)))) {
    return place(area, k, top + SET_MARGIN, Math.max(1, area.h - top - bottom - 2 * SET_MARGIN));
  }
  return full;
}

/** Сторона плитки-цифри в лотку: стандартна `cssTile` (з responsive.css), але стільки, щоб k плиток уміщалися в лоток — рядком (wide, portrait) чи стовпцем
 *  (телефон в альбомі); не менше 64 px (BRIEF §12). `viewport` — розмір вікна: лоток займає майже всю ширину (висоту на телефоні). */
export function digitTileSize(kind: 'wide' | 'portrait' | 'phone', viewport: Area, k: number, cssTile: number): number {
  const gap = kind === 'phone' ? 12 : kind === 'portrait' ? 16 : 24;
  // у лотку з боків по 16 px (portrait) чи 24 px (wide); на планшеті в портреті лоток ще й не заходить на бульбашку Kubika (вона сягає ≈ 120 px від лівого краю): поля по 124 px
  const padding = kind === 'portrait' ? 32 : 48;
  const reserve = kind === 'portrait' && viewport.w >= 600 ? 248 : 0;
  const avail = kind === 'phone' ? viewport.h - 48 : viewport.w - padding - reserve;
  const fit = Math.floor((avail - (k - 1) * gap) / k);
  return Math.max(64, Math.min(cssTile, fit));
}
