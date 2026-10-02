// Розкладка предметів лічби на сцені (BRIEF §10, PEDAGOGY §2 п.1: рядок → коло → розсип; design etap2/07 «Розкладання»).
// Чисті функції: за областю, кількістю й зерном дають позиції лівих верхніх кутів коробок size×size. Предмети не перекриваються,
// не виходять за область і не лізуть у ділянки, зайняті Kubikom (reserved). Той самий вхід → та сама розкладка.
import type { Arrangement } from '../../curriculum/types';
import type { Rng } from './rng';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface LayoutInput {
  arrangement: Arrangement;
  count: number;
  area: { w: number; h: number };
  /** Бажана сторона коробки предмета, px; якщо всі предмети не вміщаються — зменшується (≥ MIN_SIZE). */
  size: number;
  rng: Rng;
  /** Ділянки, куди предмети не ставимо (Kubik і його бульбашка в широкому альбомі). */
  reserved?: readonly Rect[];
  /** Відступ від країв області, px. */
  margin?: number;
  /** Найменша сторона предмета, до якої дозволено стискати (типово MIN_SIZE = 40): у вузьких картках «Kto ma więcej?» потрібні менші. */
  minSize?: number;
}

export interface Layout {
  /** Фактична сторона коробки (могла зменшитися). */
  size: number;
  items: Point[];
}

export const MIN_SIZE = 40;
const GAP = 8; // найменший просвіт між предметами

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Сторона предмета за областю (BRIEF §12: сцена 84–96, телефон 64): п'ята частина меншої сторони в межах 64…96. */
export function itemSize(area: { w: number; h: number }): number {
  return clamp(Math.round(Math.min(area.w, area.h) / 5), 64, 96);
}

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const boxOf = (p: Point, size: number): Rect => ({ x: p.x, y: p.y, w: size, h: size });

const freeOf = (items: readonly Point[], size: number, reserved: readonly Rect[]): boolean =>
  items.every((p) => reserved.every((r) => !intersects(boxOf(p, size), r)));

/** Усі коробки всередині області з відступом `margin`. */
const insideOf = (items: readonly Point[], size: number, area: { w: number; h: number }, margin: number): boolean =>
  items.every((p) => p.x >= margin - 0.5 && p.y >= margin - 0.5 && p.x + size <= area.w - margin + 0.5 && p.y + size <= area.h - margin + 0.5);

/** Зсуви центра блоку від найближчого до найдальшого: так шукаємо місце, не зачеплене reserved. */
function offsets(maxX: number, maxY: number, step = 12): Point[] {
  const list: Point[] = [];
  for (let dy = -maxY; dy <= maxY; dy += step) {
    for (let dx = -maxX; dx <= maxX; dx += step) list.push({ x: dx, y: dy });
  }
  return list.sort((a, b) => a.x * a.x + a.y * a.y - (b.x * b.x + b.y * b.y));
}

/** Рядки по `perRow` предметів, центровані в області; блок шукає вільне від reserved місце ближче до центру. */
function lineLayout(input: LayoutInput, size: number, margin: number): Point[] | null {
  const { count, area, reserved = [] } = input;
  const usableW = area.w - 2 * margin;
  const usableH = area.h - 2 * margin;
  const perRowMax = Math.floor((usableW + GAP) / (size + GAP));
  if (perRowMax < 1) return null;
  const rows = Math.ceil(count / perRowMax);
  const perRow = Math.ceil(count / rows);
  const gap = Math.max(GAP, Math.min(size * 0.45, (usableW - perRow * size) / Math.max(1, perRow - 1)));
  const blockH = rows * size + (rows - 1) * GAP * 2;
  if (blockH > usableH) return null;

  const build = (dy: number): Point[] => {
    const items: Point[] = [];
    let left = count;
    for (let r = 0; r < rows; r++) {
      const inRow = Math.min(perRow, left);
      left -= inRow;
      const w = inRow * size + (inRow - 1) * gap;
      const x0 = margin + (usableW - w) / 2;
      const y = margin + (usableH - blockH) / 2 + r * (size + GAP * 2) + dy;
      for (let i = 0; i < inRow; i++) items.push({ x: x0 + i * (size + gap), y });
    }
    return items;
  };
  const maxShift = Math.max(0, (usableH - blockH) / 2);
  for (const o of offsets(0, maxShift)) {
    const items = build(o.y);
    if (insideOf(items, size, area, margin) && freeOf(items, size, reserved)) return items;
  }
  return null;
}

/** Найменший просвіт між коробками двох предметів (за Чебишовим: коробки перекриваються, лише коли обидві різниці менші за size). */
const separation = (a: Point, b: Point, size: number): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) - size;

const apart = (items: readonly Point[], size: number, gap: number): boolean => {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (separation(items[i] as Point, items[j] as Point, size) < gap) return false;
    }
  }
  return true;
};

/** Коло: предмети рівномірно по еліпсу (у широкій області вісь витягнуто не більше ніж у 1,6 раза); центр шукає вільне від reserved місце. */
function circleLayout(input: LayoutInput, size: number, margin: number): Point[] | null {
  const { count, area, reserved = [] } = input;
  if (count === 1) {
    const centered = [{ x: (area.w - size) / 2, y: (area.h - size) / 2 }];
    if (freeOf(centered, size, reserved)) return centered;
  }
  const ry0 = (area.h - 2 * margin - size) / 2;
  const rx0 = (area.w - 2 * margin - size) / 2;
  if (ry0 < size * 0.4 && count > 1) return null;
  const ry = count === 2 ? Math.min(ry0, size * 1.1) : ry0;
  const rx = Math.min(rx0, ry * 1.6);
  const maxX = Math.max(0, rx0 - rx);
  const maxY = Math.max(0, ry0 - ry);
  for (const o of offsets(maxX, maxY)) {
    const cx = area.w / 2 + o.x;
    const cy = area.h / 2 + o.y;
    const items = Array.from({ length: count }, (_, i): Point => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / count;
      return { x: cx + (count === 1 ? 0 : rx * Math.cos(a)) - size / 2, y: cy + (count === 1 ? 0 : ry * Math.sin(a)) - size / 2 };
    });
    if (insideOf(items, size, area, margin) && freeOf(items, size, reserved) && apart(items, size, 2)) return items;
  }
  return null;
}

/** Розсип: сітка клітинок, предмети лежать у випадково вибраних клітинках з випадковим зсувом усередині — тому не перекриваються. */
function scatterLayout(input: LayoutInput, size: number, margin: number): Point[] | null {
  const { count, area, rng, reserved = [] } = input;
  const usableW = area.w - 2 * margin;
  const usableH = area.h - 2 * margin;
  const territory = size + GAP;
  const maxCols = Math.floor(usableW / territory);
  const maxRows = Math.floor(usableH / territory);
  if (maxCols * maxRows < count) return null;
  // клітинок трохи більше, ніж предметів (≈ ×1,6), щоб розсип не скидався на сітку; але не більше, ніж вміщається
  const target = Math.min(maxCols * maxRows, Math.ceil(count * 1.6));
  let cols = clamp(Math.round(Math.sqrt((target * usableW) / usableH)), 1, maxCols);
  let rows = clamp(Math.ceil(target / cols), 1, maxRows);
  while (cols * rows < count) {
    if (cols < maxCols) cols++;
    else rows++;
  }
  const cw = usableW / cols;
  const ch = usableH / rows;
  if (cw < territory || ch < territory) return null;

  const cells: { c: number; r: number; free: boolean }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rect: Rect = { x: margin + c * cw, y: margin + r * ch, w: cw, h: ch };
      cells.push({ c, r, free: reserved.every((z) => !intersects(rect, z)) });
    }
  }
  // вільні клітинки першими; з них добираємо «найдальші від уже взятих», щоб розсип рівномірно вкривав сцену, а не збивався в купку
  const good = rng.shuffle(cells.filter((cell) => cell.free));
  const bad = rng.shuffle(cells.filter((cell) => !cell.free));
  const pool = good.length >= count ? good : [...good, ...bad];
  const centre = (cell: { c: number; r: number }): Point => ({ x: margin + (cell.c + 0.5) * cw, y: margin + (cell.r + 0.5) * ch });
  const chosen: { c: number; r: number }[] = pool.slice(0, 1);
  const rest = pool.slice(1);
  while (chosen.length < count && rest.length > 0) {
    let bestIndex = 0;
    let bestDistance = -1;
    rest.forEach((cell, i) => {
      const p = centre(cell);
      const nearest = Math.min(...chosen.map((c) => Math.hypot(centre(c).x - p.x, centre(c).y - p.y)));
      if (nearest > bestDistance + 1e-6) {
        bestDistance = nearest;
        bestIndex = i;
      }
    });
    chosen.push(rest.splice(bestIndex, 1)[0] as { c: number; r: number });
  }

  const items = chosen.map(({ c, r }): Point => {
    const slackX = cw - territory;
    const slackY = ch - territory;
    return {
      x: margin + c * cw + GAP / 2 + rng.next() * slackX,
      y: margin + r * ch + GAP / 2 + rng.next() * slackY,
    };
  });
  // клітинки, зачеплені reserved, використано лише коли вільних не вистачило; такі предмети двигаємо в бік від ділянки
  return items.map((p) => {
    const box = boxOf(p, size);
    const hit = reserved.find((z) => intersects(box, z));
    if (!hit) return p;
    return { x: clamp(hit.x + hit.w + 1, margin, area.w - margin - size), y: p.y };
  });
}

const MAKERS: Record<Arrangement, (input: LayoutInput, size: number, margin: number) => Point[] | null> = {
  line: lineLayout,
  circle: circleLayout,
  scatter: scatterLayout,
};

/** Розкладка `count` предметів. Якщо при бажаному розмірі всі не вміщаються — розмір зменшується кроками по 8 % до MIN_SIZE,
 *  а коли й так не виходить, предмети кладуться рядками без урахування reserved (краще перекрити куточок, ніж загубити предмет). */
export function layoutObjects(input: LayoutInput): Layout {
  const { count, arrangement } = input;
  if (count <= 0) return { size: input.size, items: [] };
  const margin = input.margin ?? 8;
  const floor = Math.min(MIN_SIZE, input.minSize ?? MIN_SIZE);
  let size = input.size;
  for (let attempt = 0; attempt < 14; attempt++) {
    const items = MAKERS[arrangement](input, size, margin);
    if (items && items.length === count) return { size, items };
    size = Math.max(floor, Math.floor(size * 0.92));
    if (size === floor && attempt > 8) break;
  }
  const items = lineLayout({ ...input, reserved: [] }, floor, margin) ?? Array.from({ length: count }, (_, i): Point => ({ x: margin + (i % 10) * (floor + GAP), y: margin + Math.floor(i / 10) * (floor + GAP) }));
  return { size: floor, items };
}

/** У якому порядку Kubik лічить предмети в підказці: рядок — зліва направо (рядки зверху вниз), коло — за годинниковою стрілкою від верху,
 *  розсип — як читаємо: рядами зверху вниз, у ряду зліва направо. Повертає індекси предметів. */
export function countingOrder(arrangement: Arrangement, items: readonly Point[], size: number): number[] {
  const indices = items.map((_, i) => i);
  if (arrangement === 'circle' && items.length > 1) {
    const cx = items.reduce((s, p) => s + p.x + size / 2, 0) / items.length;
    const cy = items.reduce((s, p) => s + p.y + size / 2, 0) / items.length;
    const angle = (p: Point) => {
      const a = Math.atan2(p.y + size / 2 - cy, p.x + size / 2 - cx) + Math.PI / 2;
      return (a + 2 * Math.PI + 1e-9) % (2 * Math.PI);
    };
    return indices.sort((a, b) => angle(items[a] as Point) - angle(items[b] as Point));
  }
  const band = (p: Point) => Math.round(p.y / (size * (arrangement === 'line' ? 0.8 : 1.1)));
  return indices.sort((a, b) => {
    const pa = items[a] as Point;
    const pb = items[b] as Point;
    return band(pa) - band(pb) || pa.x - pb.x;
  });
}
