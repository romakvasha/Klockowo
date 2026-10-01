// Розкладка «Ścieżka świata» (BRIEF §6.5, design etap2/14–16): вузли-платформи 96×104, дорога, скриня, ★-гілка.
// Альбом — сцена 1280×720 із координатами бордів (W1, W3, W4; W2/W5/W6 — за зразком W1, W7 — за зразком W4 з гілкою після 10-го вузла).
// Портрет і «смуга» (телефон в альбомі) генерує pathGenerate.ts. Усе — чисті дані: лівий верхній кут коробки вузла.
import type { LevelId, WorldKey } from '../../curriculum/types';
import { mainLevelIds, starLevelIds } from '../../curriculum/worlds';
import { generatePortrait, generateStrip } from './pathGenerate';
import {
  CHEST_H, CHEST_W, NODE_H, NODE_W, at, center, serpentineLinks,
  type DecorKind, type PathDecor, type PathKind, type PathLayout, type PathLink, type PathNode, type Point,
} from './pathTypes';

export * from './pathTypes';

export const DECOR_SIZE: Readonly<Record<DecorKind, readonly [number, number]>> = {
  meadow: [140, 130],
  tree: [100, 145],
  pine: [100, 145],
  rocks: [96, 72],
  palm: [112, 150],
  pool: [140, 90],
};

const decor = (kind: DecorKind, x: number, y: number): PathDecor => {
  const [w, h] = DECOR_SIZE[kind];
  return { kind, x, y, w, h };
};

function landscapeSerpentine(world: WorldKey, xs: readonly number[], ys: readonly number[], chest: Point, decorList: readonly PathDecor[]): PathLayout {
  const ids = mainLevelIds(world);
  const slots = ys.flatMap((y, row) => (row % 2 === 0 ? xs : [...xs].reverse()).map((x) => ({ x, y })));
  const nodes: PathNode[] = ids.map((id, i) => ({ id, ...at(slots, i), star: false }));
  const last = center(at(nodes, nodes.length - 1));
  const links: PathLink[] = [
    ...serpentineLinks(nodes, 640),
    { to: 'chest', d: `M${last.x} ${last.y} H${chest.x + CHEST_W / 2 - 6}`, star: false },
  ];
  return { kind: 'landscape', width: 1280, height: 720, nodes, links, chest, decor: decorList, scenery: world === 'w3' ? 'beach' : 'none', kubikH: 136 };
}

/** W4 і W7 (борд etap2/16): нижній ряд із 6 вузлів, дорога піднімається праворуч, верхній ряд із 6 вузлів (справа наліво), скриня ліворуч. */
function landscapeBridge(world: 'w4' | 'w7', decorList: readonly PathDecor[]): PathLayout {
  const ids = mainLevelIds(world);
  const slots = [
    ...[102, 252, 402, 552, 702, 852].map((x) => ({ x, y: 585 })),
    ...[992, 842, 692, 542, 392, 242].map((x) => ({ x, y: 175 })),
  ];
  const nodes: PathNode[] = ids.map((id, i) => ({ id, ...at(slots, i), star: false }));
  const chest: Point = { x: 80, y: 126 };

  const links: PathLink[] = nodes.map((node, i) => {
    const b = center(node);
    if (i === 0) return { to: node.id, d: `M-20 ${b.y} H${b.x}`, star: false };
    const a = center(at(nodes, i - 1));
    if (i === 6) return { to: node.id, d: `M${a.x} ${a.y} C${a.x + 90} ${a.y} 1040 ${a.y - 30} 1040 ${a.y - 90} V${b.y}`, star: false };
    return { to: node.id, d: `M${a.x} ${a.y} H${b.x}`, star: false };
  });
  const last = center(at(nodes, nodes.length - 1));
  links.push({ to: 'chest', d: `M${last.x} ${last.y} H${chest.x + CHEST_W / 2 - 6}`, star: false });

  // ★-гілка: W4 відходить від 6-го вузла вгору-вліво до ряду ★; W7 — від 10-го вузла вертикально вниз
  const starNodes: PathNode[] = starLevelIds(world).map((id, i) => ({
    id,
    x: (world === 'w4' ? [712, 562, 412, 262] : [542, 392, 242, 92])[i] ?? 0,
    y: 425,
    star: true,
  }));
  const attach = center(at(nodes, world === 'w4' ? 5 : 9));
  const first = center(at(starNodes, 0));
  const starLinks: PathLink[] = starNodes.map((node, i) => {
    const b = center(node);
    if (i > 0) return { to: node.id, d: `M${center(at(starNodes, i - 1)).x} ${b.y} H${b.x}`, star: true };
    const d = world === 'w4' ? `M${attach.x} ${attach.y} C${attach.x} ${attach.y - 80} 860 ${first.y} ${first.x} ${first.y}` : `M${attach.x} ${attach.y} V${first.y}`;
    return { to: node.id, d, star: true };
  });

  return {
    kind: 'landscape', width: 1280, height: 720, nodes: [...nodes, ...starNodes], links: [...links, ...starLinks], chest,
    decor: decorList, scenery: world === 'w4' ? 'river' : 'none', kubikH: 136,
  };
}

const W1_XS = [202, 432, 662, 892];
const ROW_YS = [565, 375, 185];

function buildLandscape(world: WorldKey): PathLayout {
  switch (world) {
    case 'w1':
      return landscapeSerpentine(world, W1_XS, ROW_YS, { x: 1090, y: 114 }, [decor('meadow', 16, 104), decor('tree', 1165, 390), decor('rocks', 1150, 620)]);
    case 'w2':
      return landscapeSerpentine(world, W1_XS, ROW_YS, { x: 1090, y: 114 }, [decor('tree', 16, 104), decor('meadow', 1130, 400), decor('rocks', 1150, 620)]);
    case 'w3':
      return landscapeSerpentine(world, [152, 352, 552, 752, 952], ROW_YS, { x: 1105, y: 114 }, [decor('palm', 8, 112), decor('palm', 1160, 420), decor('pool', 1128, 612)]);
    case 'w5':
      return landscapeSerpentine(world, W1_XS, ROW_YS, { x: 1090, y: 114 }, [decor('pine', 16, 104), decor('pine', 1165, 390), decor('rocks', 1150, 620)]);
    case 'w6':
      return landscapeSerpentine(world, W1_XS, ROW_YS, { x: 1090, y: 114 }, [decor('rocks', 24, 130), decor('tree', 1165, 390), decor('rocks', 1150, 620)]);
    case 'w4':
      return landscapeBridge('w4', [decor('tree', 20, 400), decor('pine', 1160, 520), decor('rocks', 1090, 640)]);
    case 'w7':
      return landscapeBridge('w7', [decor('rocks', 24, 500), decor('rocks', 1150, 620), decor('pine', 1165, 400)]);
  }
}

/** Нижче цього масштабу сцена 1280×720 робить вузли (96 px) меншими за 64 px — тоді показуємо смугу. */
const MIN_LANDSCAPE_SCALE = 0.67;

const CACHE = new Map<string, PathLayout>();

/** Розкладка стежки світу для виду екрана; обчислюється один раз. */
export function pathLayoutFor(world: WorldKey, kind: PathKind): PathLayout {
  const key = `${world}:${kind}`;
  const cached = CACHE.get(key);
  if (cached) return cached;
  const layout = kind === 'landscape' ? buildLandscape(world) : kind === 'portrait' ? generatePortrait(world) : generateStrip(world);
  CACHE.set(key, layout);
  return layout;
}

/** Вигляд стежки: портрет (висота більша за ширину) — вертикальна; альбом, де сцена 1280×720 стислася б до вузлів менших за 64 px
 *  (телефон, мале вікно), — горизонтальна «смуга» з вузлами справжнього розміру; решта — сцена 1280×720, що вміщається у вікно. */
export function pathKindFor(viewportW: number, viewportH: number): PathKind {
  if (viewportH > viewportW) return 'portrait';
  return Math.min(viewportW / 1280, viewportH / 720) < MIN_LANDSCAPE_SCALE ? 'strip' : 'landscape';
}

/** Масштаб сцени у вікні: альбом вміщається повністю (≤ 1); портрет — за шириною 390 (≤ 1,5); смуга — за висотою (0,85…1,25). */
export function pathScale(kind: PathKind, layout: PathLayout, viewportW: number, viewportH: number): number {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  let s: number;
  if (kind === 'landscape') s = Math.min(1, viewportW / layout.width, viewportH / layout.height);
  else if (kind === 'portrait') s = clamp(viewportW / layout.width, 0.85, 1.5);
  else s = clamp(viewportH / layout.height, 0.85, 1.25);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

// ---------- Місце Kubika ----------
export interface KubikSpot {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Куди показує: на вузол ліворуч/праворуч від себе, вниз (стоїть над вузлом, коли поруч немає місця) чи нікуди (стоїть під вузлом). */
  pointing: 'left' | 'right' | 'down' | 'up';
}

type Rect = { x: number; y: number; w: number; h: number };

const overlaps = (a: Rect, b: Rect, gap = 4): boolean =>
  a.x < b.x + b.w - gap && b.x < a.x + a.w - gap && a.y < b.y + b.h - gap && b.y < a.y + a.h - gap;

/** Де стоїть Kubik: праворуч від вузла (показує вліво на нього), інакше ліворуч, інакше під ним, інакше над вузлом. Не перекриває сусідні вузли й скриню.
 *  Для цілі `'chest'` (світ пройдено) — біля скрині. */
export function kubikSpot(layout: PathLayout, target: LevelId | 'chest'): KubikSpot {
  const h = layout.kubikH;
  const w = Math.round(h * 0.8);
  const obstacles: Rect[] = layout.nodes.filter((n) => n.id !== target).map((n) => ({ x: n.x, y: n.y, w: NODE_W, h: NODE_H }));
  const chestBox: Rect = { x: layout.chest.x, y: layout.chest.y, w: CHEST_W, h: CHEST_H };
  if (target !== 'chest') obstacles.push(chestBox);

  const free = (r: Rect) => r.x >= 0 && r.x + r.w <= layout.width && r.y >= 0 && !obstacles.some((o) => overlaps(r, o));

  if (target === 'chest') {
    const left: Rect = { x: chestBox.x - w - 8, y: chestBox.y + CHEST_H - 10 - h, w, h };
    const right: Rect = { x: chestBox.x + CHEST_W + 8, y: left.y, w, h };
    if (free(left)) return { ...left, pointing: 'right' };
    if (free(right)) return { ...right, pointing: 'left' };
    return { x: chestBox.x + (CHEST_W - w) / 2, y: chestBox.y + CHEST_H + 6, w, h, pointing: 'down' };
  }

  const node = layout.nodes.find((n) => n.id === target);
  if (!node) throw new Error(`Unknown node: ${target}`);
  const c = center(node);
  const right: Rect = { x: c.x + 50, y: c.y + 24 - h, w, h };
  const left: Rect = { x: c.x - 50 - w, y: right.y, w, h };
  if (free(right)) return { ...right, pointing: 'left' };
  if (free(left)) return { ...left, pointing: 'right' };
  const below: Rect = { x: c.x - w / 2, y: c.y + 40, w, h };
  if (free(below)) return { ...below, pointing: 'up' };
  return { x: c.x - w / 2, y: c.y - 24 - h, w, h, pointing: 'down' };
}
