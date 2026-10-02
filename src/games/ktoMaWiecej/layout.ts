// Розкладка сцени «Kto ma więcej?» (BRIEF §7 гра 6): дві картки поруч (тваринка зверху, купка предметів знизу); коли предмети «стають парами»
// (підказка, правильна відповідь), вони перелітають у центральний блок: пари поряд, зайві — окремо. Чиста геометрія без React:
// жоден предмет не виходить за сцену й не чіпає ділянки Kubika (reserved) у купках.
import { layoutObjects, type Point, type Rect } from '../engine/layoutObjects';
import type { Rng } from '../engine/rng';

export interface CompareLayout {
  /** Картки-кнопки ліворуч і праворуч. */
  cards: readonly [Rect, Rect];
  /** Тваринки на картках. */
  animals: readonly [Rect, Rect];
  /** Купкова частина картки (там стоять предмети чи, у режимі digits, цифра). */
  regions: readonly [Rect, Rect];
  /** Де саме лежить купка: центрована, не ширша за ≈ 1,7 висоти, щоб предмети не розбігалися по широкій картці. */
  pileAreas: readonly [Rect, Rect];
  /** Лівий верхній кут кожного предмета в купці (координати сцени). */
  piles: readonly [Point[], Point[]];
  /** Сторона предмета в кожній купці. */
  sizes: readonly [number, number];
  /** Положення тих самих предметів, коли вони стоять парами (координати сцени). */
  paired: readonly [Point[], Point[]];
  pairSize: number;
}

const MARGIN = 12;
const CARD_GAP = 24;
const PAD = 8;
const PAIR_GAP = 6;
const COL_GAP = 24;

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Блок пар: одиниця = [предмет A][предмет B]; одиниць стільки, скільки предметів у більшій купці (зайві стоять у своїй половині одиниці без пари);
 *  до п'яти одиниць — один стовпець, далі два (по ⌈n/2⌉ у стовпці). Блок по центру області `region`. */
export function pairBlock(region: Rect, counts: readonly [number, number], maxSize: number): { size: number; a: Point[]; b: Point[] } {
  const units = Math.max(counts[0], counts[1]);
  if (units === 0) return { size: maxSize, a: [], b: [] };
  const cols = units > 5 ? 2 : 1;
  const rows = Math.ceil(units / cols);
  const widthFit = (region.w - (cols - 1) * COL_GAP) / (cols * 2) - PAIR_GAP;
  const heightFit = (region.h - (rows - 1) * PAIR_GAP) / rows;
  const size = Math.max(24, Math.floor(Math.min(maxSize, widthFit, heightFit)));
  const unitW = 2 * size + PAIR_GAP;
  const blockW = cols * unitW + (cols - 1) * COL_GAP;
  const blockH = rows * size + (rows - 1) * PAIR_GAP;
  const x0 = region.x + (region.w - blockW) / 2;
  const y0 = region.y + (region.h - blockH) / 2;
  const at = (u: number, side: 0 | 1): Point => ({
    x: Math.round(x0 + Math.floor(u / rows) * (unitW + COL_GAP) + (side === 1 ? size + PAIR_GAP : 0)),
    y: Math.round(y0 + (u % rows) * (size + PAIR_GAP)),
  });
  return {
    size,
    a: Array.from({ length: counts[0] }, (_, u) => at(u, 0)),
    b: Array.from({ length: counts[1] }, (_, u) => at(u, 1)),
  };
}

/** Розкладка сцени. `sizeFactor` — підступ: множник розміру предметів кожної купки (більші предмети на меншій купці). */
export function compareLayout(
  area: { w: number; h: number },
  reserved: readonly Rect[],
  counts: readonly [number, number],
  sizeFactor: readonly [number, number],
  rng: Rng,
): CompareLayout {
  const isStrip = (r: Rect) => r.y === 0 && r.w >= area.w;
  const topStrip = reserved.filter(isStrip).reduce((m, r) => Math.max(m, r.h), 0);
  // вузька сцена (портрет телефона): картки одна під одною, тваринка ліворуч, купка праворуч; інакше — поруч, тваринка зверху
  const stacked = area.w < 520 && area.h > area.w * 0.7;
  const cardY = topStrip + MARGIN;
  const totalH = Math.max(120, area.h - cardY - MARGIN);
  let cards: [Rect, Rect];
  let animals: [Rect, Rect];
  let regions: [Rect, Rect];
  if (stacked) {
    const cardH = Math.floor((totalH - CARD_GAP / 2) / 2);
    const cardW = area.w - 2 * MARGIN;
    cards = [
      { x: MARGIN, y: cardY, w: cardW, h: cardH },
      { x: MARGIN, y: cardY + cardH + CARD_GAP / 2, w: cardW, h: cardH },
    ];
    const animalH = Math.min(cardH - 2 * PAD, 104);
    const animalW = Math.round((animalH * 120) / 136);
    animals = cards.map((c): Rect => ({ x: c.x + PAD, y: Math.round(c.y + (c.h - animalH) / 2), w: animalW, h: animalH })) as [Rect, Rect];
    regions = cards.map((c, i): Rect => {
      const left = animals[i]!.x + animalW + PAD;
      return { x: left, y: c.y + PAD, w: c.x + c.w - PAD - left, h: c.h - 2 * PAD };
    }) as [Rect, Rect];
  } else {
    const cardW = Math.floor((area.w - 2 * MARGIN - CARD_GAP) / 2);
    cards = [
      { x: MARGIN, y: cardY, w: cardW, h: totalH },
      { x: MARGIN + cardW + CARD_GAP, y: cardY, w: cardW, h: totalH },
    ];
    const animalH = Math.round(Math.min(totalH * 0.36, 128));
    const animalW = Math.round((animalH * 120) / 136);
    animals = cards.map((c): Rect => ({ x: Math.round(c.x + (c.w - animalW) / 2), y: c.y + PAD, w: animalW, h: animalH })) as [Rect, Rect];
    regions = cards.map((c): Rect => {
      const top = c.y + PAD + animalH + PAD;
      return { x: c.x + PAD, y: top, w: c.w - 2 * PAD, h: Math.max(40, c.y + c.h - PAD - top) };
    }) as [Rect, Rect];
  }

  const pileAreas = regions.map((r): Rect => {
    const w = Math.min(r.w, Math.max(220, Math.round(r.h * 1.7)));
    return { x: Math.round(r.x + (r.w - w) / 2), y: r.y, w, h: r.h };
  }) as [Rect, Rect];

  // предмет: бажана сторона від меншого розміру купкової області; купка більших предметів (підступ) визначає розмір, менші — від нього
  const base = Math.max(40, Math.min(76, Math.round(Math.min(pileAreas[0].w, pileAreas[0].h) / 3.6)));
  /** Купка заданого розміру; layoutObjects у тісному кутку біля Kubika може віддати предмети, що перекриваються, — тоді зменшуємо розмір, поки все не стане на місце. */
  const place = (side: 0 | 1, wanted: number) => {
    const region = pileAreas[side];
    const local = reserved
      .filter((r) => !isStrip(r))
      .map((r) => ({ x: r.x - region.x, y: r.y - region.y, w: r.w, h: r.h }))
      .filter((r) => intersects(r, { x: 0, y: 0, w: region.w, h: region.h }));
    let size = wanted;
    for (let attempt = 0; ; attempt++) {
      const laid = layoutObjects({ arrangement: 'scatter', count: counts[side], area: { w: region.w, h: region.h }, size, rng: rng.fork(`pile${side}-${attempt}`), reserved: local, margin: 4, minSize: 24 });
      const boxes = laid.items.map((p): Rect => ({ x: p.x, y: p.y, w: laid.size, h: laid.size }));
      const clean = boxes.every((b, i) => local.every((z) => !intersects(b, z)) && boxes.every((o, j) => j <= i || !intersects(b, o)));
      if (clean || attempt >= 8) return { size: laid.size, items: laid.items.map((p): Point => ({ x: Math.round(p.x + region.x), y: Math.round(p.y + region.y) })) };
      size = Math.max(24, Math.floor(laid.size * 0.88));
    }
  };

  let sizes: [number, number];
  let items: [Point[], Point[]];
  if (sizeFactor[0] !== sizeFactor[1]) {
    const bigSide: 0 | 1 = sizeFactor[0] > sizeFactor[1] ? 0 : 1;
    const smallSide: 0 | 1 = bigSide === 0 ? 1 : 0;
    const big = place(bigSide, Math.round(base * Math.max(...sizeFactor)));
    const smallSize = Math.max(24, Math.round((big.size * Math.min(...sizeFactor)) / Math.max(...sizeFactor)));
    const small = place(smallSide, smallSize);
    items = bigSide === 0 ? [big.items, small.items] : [small.items, big.items];
    sizes = bigSide === 0 ? [big.size, small.size] : [small.size, big.size];
  } else {
    const l = place(0, base);
    const r = place(1, base);
    // обидві купки однакового розміру (менший із двох), інакше розмір сам був би підказкою
    const s = Math.min(l.size, r.size);
    items = [l.size === s ? l.items : place(0, s).items, r.size === s ? r.items : place(1, s).items];
    sizes = [s, s];
  }

  // область блоку пар: поруч — від низу тваринок до низу сцени по центру (до 70 % ширини); у портреті — праворуч від тваринок на всю висоту
  const blockRegion: Rect = stacked
    ? { x: animals[0].x + animals[0].w + PAD, y: cardY, w: area.w - MARGIN - (animals[0].x + animals[0].w + PAD), h: totalH }
    : { x: Math.round(area.w * 0.15), y: regions[0].y, w: Math.round(area.w * 0.7), h: Math.max(40, cardY + totalH - PAD - regions[0].y) };
  const pb = pairBlock(blockRegion, counts, Math.max(...sizes));

  return { cards, animals, regions, pileAreas, piles: items, sizes, paired: [pb.a, pb.b], pairSize: pb.size };
}
