// Розкладка потяга «Zgubiony wagonik»: паровозик і вагони в ряд; на вузькій сцені (портрет, телефон) ряд переноситься, як рядок тексту.
// Чиста геометрія: розмір вагона підбирається найбільшим, що вміщує все в області; ділянки під Kubika (reserved) ряди не чіпають.

import type { Rect } from '../../games/engine/layoutObjects';

export interface Area {
  w: number;
  h: number;
}

/** Висота вагона до його ширини (viewBox 120×104). */
export const WAGON_RATIO = 104 / 120;
/** Паровозик ширший за вагон (viewBox 150×104). */
export const ENGINE_UNITS = 150 / 120;
export const MAX_WAGON = 150;
export const MIN_WAGON = 64;
/** Відступ ряду від країв області й проміжок між рядами (частка ширини вагона). */
export const EDGE_MARGIN = 16;
export const ROW_GAP_RATIO = 0.22;

export interface TrainItem {
  kind: 'engine' | 'wagon';
  /** Для вагона — його номер у потязі (0…n−1); для паровозика −1. */
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TrainLayout {
  /** Ширина вагона, px. */
  wagon: number;
  items: TrainItem[];
  /** Колії: по одній під кожним рядом (x, y, w). */
  rails: { x: number; y: number; w: number }[];
  rows: number;
}

/** Скільки місця під смугами reserved угорі й унизу області (смуга вважається «верхньою», якщо починається від самого верху). */
export function freeBand(area: Area, reserved: readonly Rect[]): { top: number; bottom: number } {
  let top = 0;
  let bottom = 0;
  for (const r of reserved) {
    if (r.y <= 1) top = Math.max(top, r.y + r.h);
    else if (r.y + r.h >= area.h - 1) bottom = Math.max(bottom, area.h - r.y);
  }
  return { top, bottom };
}

/** Рядки жадібною розкладкою: кожен елемент (в одиницях ширини вагона) іде в поточний ряд, поки вміщується в `availW`. */
export function packRows(units: readonly number[], wagon: number, availW: number): number[][] {
  const rows: number[][] = [[]];
  let used = 0;
  units.forEach((u, i) => {
    const w = u * wagon;
    const row = rows[rows.length - 1]!;
    if (row.length > 0 && used + w > availW + 0.5) {
      rows.push([i]);
      used = w;
    } else {
      row.push(i);
      used += w;
    }
  });
  return rows;
}

/** Розкладка потяга з `count` вагонів (і паровозика попереду, якщо `engine`) у `area`.
 *  Перебираємо розмір вагона від найбільшого до найменшого, поки всі ряди вміщуються за шириною й висотою; ряд — по центру, блок — по центру вільної смуги. */
export function trainLayout(area: Area, reserved: readonly Rect[], count: number, engine = true): TrainLayout {
  const units: number[] = [...(engine ? [ENGINE_UNITS] : []), ...Array.from({ length: count }, () => 1)];
  const { top, bottom } = freeBand(area, reserved);
  const availW = Math.max(1, area.w - 2 * EDGE_MARGIN);
  const availH = Math.max(1, area.h - top - bottom - 2 * EDGE_MARGIN);
  const heightOf = (rows: number, wagon: number) => rows * wagon * WAGON_RATIO + (rows - 1) * wagon * ROW_GAP_RATIO;

  let wagon = MAX_WAGON;
  let rows = packRows(units, wagon, availW);
  while (wagon > MIN_WAGON && heightOf(rows.length, wagon) > availH) {
    wagon -= 2;
    rows = packRows(units, wagon, availW);
  }
  // якщо навіть найменший вагон не вміщується, лишаємо найменший: ряди вже перенесено, а лишок піде за край області
  const rowWidth = (r: readonly number[]) => r.reduce((s, i) => s + units[i]! * wagon, 0);
  const widest = Math.max(...rows.map(rowWidth));
  const x0 = Math.round((area.w - widest) / 2);
  const block = heightOf(rows.length, wagon);
  const y0 = Math.round(top + EDGE_MARGIN + Math.max(0, (availH - block) / 2));
  const rowH = wagon * WAGON_RATIO;

  const items: TrainItem[] = [];
  const rails: TrainLayout['rails'] = [];
  rows.forEach((row, r) => {
    const y = Math.round(y0 + r * (rowH + wagon * ROW_GAP_RATIO));
    let x = x0;
    for (const i of row) {
      const w = units[i]! * wagon;
      const isEngine = engine && i === 0;
      items.push({ kind: isEngine ? 'engine' : 'wagon', index: isEngine ? -1 : i - (engine ? 1 : 0), x: Math.round(x), y, w: Math.round(w), h: Math.round(rowH) });
      x += w;
    }
    // колія — під колесами (колеса займають нижні ≈ 11 % висоти), трохи довша за ряд
    rails.push({ x: x0 - 8, y: Math.round(y + rowH - rowH * 0.06), w: Math.round(rowWidth(row) + 16) });
  });
  return { wagon, items, rails, rows: rows.length };
}
