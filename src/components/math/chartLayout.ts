// Розкладки гри «Tajemnicza tablica» (BRIEF §12, виняток для таблиці 100): мініатюра всієї таблиці (дитина лише дивиться) і ЛУПА — один рядок таблиці, у якому
// клітинки від 64 px; рядок перемикають кнопки «вгору/вниз» (80 px). Три розкладки під три форми екрана; береться та, де масштаб більший. Усе в design-px.
import { placeContent, type Placed } from '../../games/engine/placeContent';
import type { Rect } from '../../games/engine/layoutObjects';

export const MAGNIFIER_CELL = 64;
export const NAV_BUTTON = 80;
/** Рамка таблиці — 3 px з кожного боку. */
export const GRID_BORDER = 6;

export type ChartLayoutId = 'row' | 'stack' | 'side';

export interface ChartLayout {
  id: ChartLayoutId;
  design: { w: number; h: number };
  /** Мініатюра: лівий верхній кут і висота (ширина — `miniSize`); клітинка мініатюри — `miniSize / 10`. */
  mini: { x: number; y: number; size: number; h: number };
  /** Лупа: лівий верхній кут, клітинок у ряду (10 — весь рядок, 5 — два шматки). */
  magnifier: { x: number; y: number; cols: number; w: number; h: number };
  up: { x: number; y: number };
  down: { x: number; y: number };
}

/** Мініатюра: розмір клітинки — ціле число px (щоб лінії не розмазувались). */
export const miniCell = (size: number): number => Math.max(6, Math.floor((size - GRID_BORDER) / 10));

/** Усі розкладки для таблиці з `rows` рядків (1–10): мініатюра стає нижчою, коли чисел менше. */
export function chartLayouts(rows: number): ChartLayout[] {
  const r = Math.max(1, Math.min(10, rows));
  const mk = (size: number) => ({ size, h: miniCell(size) * r + GRID_BORDER });
  const lineW = (cols: number) => cols * MAGNIFIER_CELL + GRID_BORDER;
  const lineH = (lines: number) => lines * MAGNIFIER_CELL + GRID_BORDER;

  // A «row»: ліворуч мініатюра, далі стовпчик кнопок, далі весь рядок в одну лінію (10 × 64)
  const a = mk(290);
  const aMagW = lineW(10);
  const aMagH = lineH(1);
  const aH = Math.max(a.h, 2 * NAV_BUTTON + 16);
  const aBtnX = a.size + 24;
  const A: ChartLayout = {
    id: 'row',
    design: { w: aBtnX + NAV_BUTTON + 16 + aMagW, h: aH },
    mini: { x: 0, y: (aH - a.h) / 2, size: a.size, h: a.h },
    magnifier: { x: aBtnX + NAV_BUTTON + 16, y: (aH - aMagH) / 2, cols: 10, w: aMagW, h: aMagH },
    up: { x: aBtnX, y: aH / 2 - NAV_BUTTON - 8 },
    down: { x: aBtnX, y: aH / 2 + 8 },
  };

  // B «stack»: зверху «вгору» · мініатюра · «вниз», знизу рядок у два шматки по 5
  const b = mk(150);
  const bW = Math.max(lineW(5), NAV_BUTTON * 2 + 12 * 2 + b.size);
  const bTop = Math.max(b.h, NAV_BUTTON);
  const bMagY = bTop + 16;
  const B: ChartLayout = {
    id: 'stack',
    design: { w: bW, h: bMagY + lineH(2) },
    mini: { x: (bW - b.size) / 2, y: (bTop - b.h) / 2, size: b.size, h: b.h },
    magnifier: { x: (bW - lineW(5)) / 2, y: bMagY, cols: 5, w: lineW(5), h: lineH(2) },
    up: { x: (bW - b.size) / 2 - 12 - NAV_BUTTON, y: (bTop - NAV_BUTTON) / 2 },
    down: { x: (bW + b.size) / 2 + 12, y: (bTop - NAV_BUTTON) / 2 },
  };

  // C «side» (телефон в альбомі): ліворуч стовпчик кнопок, далі мініатюра, далі рядок у два шматки
  const c = mk(100);
  const cH = Math.max(2 * NAV_BUTTON + 16, lineH(2));
  const cMagX = NAV_BUTTON + 12 + c.size + 12;
  const C: ChartLayout = {
    id: 'side',
    design: { w: cMagX + lineW(5), h: cH },
    mini: { x: NAV_BUTTON + 12, y: (cH - c.h) / 2, size: c.size, h: c.h },
    magnifier: { x: cMagX, y: (cH - lineH(2)) / 2, cols: 5, w: lineW(5), h: lineH(2) },
    up: { x: 0, y: (cH - 2 * NAV_BUTTON - 16) / 2 },
    down: { x: 0, y: (cH - 2 * NAV_BUTTON - 16) / 2 + NAV_BUTTON + 16 },
  };
  return [A, B, C];
}

/** Розкладка за порядком уподобання (широка → портретна → бічна): перша, де масштаб ≥ 1 (клітинка лупи не менша за 64 px, кнопки 80); інакше — з найбільшим масштабом.
 *  Масштаб не більший за 1,25: клітинка лупи 64 → до 80 px. */
export function pickChartLayout(area: { w: number; h: number }, reserved: readonly Rect[], rows: number): { layout: ChartLayout; place: Placed } {
  let best: { layout: ChartLayout; place: Placed } | null = null;
  for (const layout of chartLayouts(rows)) {
    const place = placeContent(area, reserved, layout.design, { maxScale: 1.25 });
    if (place.scale >= 1) return { layout, place };
    if (best === null || place.scale > best.place.scale + 1e-9) best = { layout, place };
  }
  return best!;
}

/** Номери рядка таблиці: рядок 0 → 1…10, рядок 3 → 31…40. */
export const rowNumbers = (row: number): number[] => Array.from({ length: 10 }, (_, i) => row * 10 + i + 1);

/** Рядок таблиці, у якому лежить число: 47 → 4 (41…50), 50 → 4, 100 → 9. */
export const rowOf = (n: number): number => Math.floor((n - 1) / 10);

/** Стовпчик числа (0–9): 47 → 6, 50 → 9, 41 → 0. */
export const columnOf = (n: number): number => (n - 1) % 10;
