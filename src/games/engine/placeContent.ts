// Де на сцені стоїть композиція фіксованого розміру («Domek liczb», «Ile razem?»): найбільше, що влазить, не чіпаючи ділянок Kubika (reserved) і смуги кісточок
// угорі (телефон). Три варіанти: по центру всієї області; над ділянкою Kubika; праворуч від неї — береться той, де масштаб більший. Чиста геометрія.
import type { Rect } from './layoutObjects';

export interface Placed extends Rect {
  /** У скільки разів композицію зменшено (або збільшено) відносно її розміру в дизайні. */
  scale: number;
}

const MARGIN = 12;

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Смуга на всю ширину угорі сцени (кісточки на телефоні) — не «ділянка Kubika». */
const isTopStrip = (r: Rect, area: { w: number }): boolean => r.y === 0 && r.w >= area.w;

export function placeContent(
  area: { w: number; h: number },
  reserved: readonly Rect[],
  design: { w: number; h: number },
  options: { maxScale?: number; margin?: number } = {},
): Placed {
  const { maxScale = 1, margin = MARGIN } = options;
  const topStrip = reserved.filter((r) => isTopStrip(r, area)).reduce((m, r) => Math.max(m, r.h), 0);
  const blocks = reserved.filter((r) => !isTopStrip(r, area));
  const full: Rect = { x: margin, y: topStrip + margin, w: area.w - 2 * margin, h: area.h - topStrip - 2 * margin };

  const candidates: Rect[] = [full];
  if (blocks.length > 0) {
    const topLimit = Math.min(...blocks.map((b) => b.y));
    candidates.push({ ...full, h: topLimit - margin - full.y });
    const rightEdge = Math.max(...blocks.map((b) => b.x + b.w));
    candidates.push({ x: rightEdge + margin, y: full.y, w: area.w - 2 * margin - rightEdge, h: full.h });
  }

  let best: Placed | null = null;
  for (const c of candidates) {
    if (c.w <= 0 || c.h <= 0) continue;
    const scale = Math.min(c.w / design.w, c.h / design.h, maxScale);
    const w = design.w * scale;
    const h = design.h * scale;
    const box: Rect = { x: Math.round(c.x + (c.w - w) / 2), y: Math.round(c.y + (c.h - h) / 2), w: Math.round(w), h: Math.round(h) };
    if (blocks.some((b) => intersects(box, b))) continue;
    if (best === null || scale > best.scale + 1e-9) best = { ...box, scale };
  }
  if (best) return best;
  // нічого не влізло без перекриття (вкрай мала область): зменшуємо до мінімуму й ставимо вгорі
  const scale = Math.max(0.1, Math.min(full.w / design.w, full.h / design.h, maxScale) * 0.5);
  return { x: full.x, y: full.y, w: Math.round(design.w * scale), h: Math.round(design.h * scale), scale };
}
