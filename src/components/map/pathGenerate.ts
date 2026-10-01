// Генератор розкладок «Ścieżka świata» для вузьких екранів (BRIEF §12), яких немає на бордах дизайну:
//  • портрет — 3 колонки, змійка знизу вгору в сцені завширшки 390, гортається вертикально; ★-гілка — «петля» з 4 вузлів між рядами;
//  • смуга — телефон в альбомі (нижче 600 px заввишки): один ряд зі зміщенням вгору-вниз, гортається горизонтально; ★-вузли — другий ряд під основним.
// Вузли тут завжди справжнього розміру 96×104 (дотик ≥ 80 px), тому на малому екрані сцену не стискають, а гортають.
import type { LevelId, WorldKey } from '../../curriculum/types';
import { mainLevelIds, starLevelIds, worldById } from '../../curriculum/worlds';
import {
  CHEST_H, CHEST_W, NODE_CX, NODE_CY, NODE_W, at, center, serpentineLinks,
  type PathLayout, type PathLink, type PathNode, type Point,
} from './pathTypes';

const PORTRAIT_W = 390;
/** Центри трьох колонок: коробки вузлів 28…124, 147…243, 266…362 — від країв ≥ 28 px. */
const COLS = [76, 195, 314] as const;
const ROW_PITCH = 150;
const LOOP_A = 140; // перший ряд ★-петлі над рядом гілкування
const LOOP_B = 280; // другий
const FIRST_ROW_FROM_BOTTOM = 90; // від центру першого ряду до низу сцени: місце для дороги з мапи
const TOP_PAD = 112; // під фіксованою панеллю («Mapa», назва світу)
const CHEST_GAP = 24;

const chunk = <T,>(list: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

const scurveV = (a: Point, b: Point): string => {
  const mid = Math.round((a.y + b.y) / 2);
  return `M${a.x} ${a.y} C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${b.y}`;
};

const scurveH = (a: Point, b: Point, k = 70): string => `M${a.x} ${a.y} C${a.x + k} ${a.y} ${b.x - k} ${b.y} ${b.x} ${b.y}`;

/** Вертикальна змійка: ряди по 3 вузли, парні — зліва направо, непарні — справа наліво. */
export function generatePortrait(world: WorldKey): PathLayout {
  const rows = chunk(mainLevelIds(world), 3);
  const starIds = starLevelIds(world);
  const after = worldById(world).starBranchAfter;
  const loopRow = starIds.length > 0 && after !== null ? Math.floor((after - 1) / 3) : -1;

  // відстань центрів рядів від низу сцени
  const fromBottom: number[] = [];
  let cursor = FIRST_ROW_FROM_BOTTOM;
  rows.forEach((_, r) => {
    fromBottom.push(cursor);
    cursor += r === loopRow ? LOOP_B + ROW_PITCH : ROW_PITCH;
  });
  const lastRowF = at(fromBottom, rows.length - 1);
  const topF = loopRow === rows.length - 1 ? lastRowF + LOOP_B : lastRowF;
  const height = TOP_PAD + CHEST_H + CHEST_GAP + NODE_CY + topF;
  const yOf = (f: number) => height - f - NODE_CY; // верх коробки вузла за відстанню центру від низу

  const nodes: PathNode[] = [];
  rows.forEach((ids, r) => {
    const cols = r % 2 === 0 ? [0, 1, 2] : [2, 1, 0];
    ids.forEach((id, i) => nodes.push({ id, x: at(COLS, at(cols, i)) - NODE_CX, y: yOf(at(fromBottom, r)), star: false }));
  });

  // дорога: вертикальний відрізок між рядами — «скоба» назовні; там, де гілкується ★-петля, — пряма
  const links: PathLink[] = serpentineLinks(nodes, PORTRAIT_W / 2, 56).map((link, i) => {
    const prev = nodes[i - 1];
    if (i === 0 || !prev || (i - 1) % 3 !== 2 || Math.floor((i - 1) / 3) !== loopRow) return link;
    const a = center(prev);
    const b = center(at(nodes, i));
    return { ...link, d: `M${a.x} ${a.y} V${b.y}` };
  });

  const starNodes: PathNode[] = [];
  const starLinks: PathLink[] = [];
  if (loopRow >= 0) {
    const trunk = loopRow % 2 === 0 ? 2 : 0;
    const far = trunk === 2 ? 0 : 2;
    const baseF = at(fromBottom, loopRow);
    const slots = [
      { col: 1, f: baseF + LOOP_A }, { col: far, f: baseF + LOOP_A },
      { col: far, f: baseF + LOOP_B }, { col: 1, f: baseF + LOOP_B },
    ];
    slots.forEach((s, i) => starNodes.push({ id: at(starIds, i), x: at(COLS, s.col) - NODE_CX, y: yOf(s.f), star: true }));
    const trunkX = at(COLS, trunk);
    const [s1, s2, s3, s4] = starNodes.map(center);
    if (s1 && s2 && s3 && s4) {
      starLinks.push(
        { to: at(starIds, 0), d: `M${trunkX} ${s1.y} H${s1.x}`, star: true },
        { to: at(starIds, 1), d: `M${s1.x} ${s1.y} H${s2.x}`, star: true },
        { to: at(starIds, 2), d: `M${s2.x} ${s2.y} V${s3.y}`, star: true },
        { to: at(starIds, 3), d: `M${s3.x} ${s3.y} H${s4.x}`, star: true },
      );
    }
  }

  // скриня над останнім рядом, по центру його колонки (не ближче 24 px до краю); дорога — вертикаль до її основи
  const last = center(at(nodes, nodes.length - 1));
  const chestX = Math.min(PORTRAIT_W - 24 - CHEST_W, Math.max(24, last.x - CHEST_W / 2));
  const chest: Point = { x: chestX, y: TOP_PAD };
  links.push({ to: 'chest', d: `M${last.x} ${last.y} V${chest.y + CHEST_H - 14}`, star: false });

  return {
    kind: 'portrait', width: PORTRAIT_W, height, nodes: [...nodes, ...starNodes], links: [...links, ...starLinks], chest, decor: [],
    scenery: 'none', kubikH: 120,
  };
}

const STRIP_H = 390;
const STRIP_X0 = 100; // центр першого вузла
const STRIP_PITCH = 150;
const STRIP_LANE_Y = 180;
const STRIP_WAVE = 16;
const STRIP_STAR_Y = 312;

/** Горизонтальна «смуга»: вузли йдуть рядком із легким зигзагом; ★-вузли — другим рядом під основним, від місця гілкування. */
export function generateStrip(world: WorldKey): PathLayout {
  const ids = mainLevelIds(world);
  const nodes: PathNode[] = ids.map((id, i) => ({
    id, x: STRIP_X0 + i * STRIP_PITCH - NODE_CX, y: STRIP_LANE_Y + (i % 2 === 0 ? STRIP_WAVE : -STRIP_WAVE) - NODE_CY, star: false,
  }));

  const links: PathLink[] = nodes.map((node, i) => {
    const b = center(node);
    if (i === 0) return { to: node.id, d: `M-20 ${b.y} H${b.x}`, star: false };
    return { to: node.id, d: scurveH(center(at(nodes, i - 1)), b), star: false };
  });

  const lastC = center(at(nodes, nodes.length - 1));
  const chest: Point = { x: lastC.x + 110, y: STRIP_LANE_Y + 30 - CHEST_H };
  const chestBase: Point = { x: chest.x + 20, y: chest.y + CHEST_H - 18 };
  links.push({ to: 'chest', d: scurveH(lastC, chestBase, 60), star: false });

  const starIds: readonly LevelId[] = starLevelIds(world);
  const after = worldById(world).starBranchAfter;
  const starNodes: PathNode[] = [];
  const starLinks: PathLink[] = [];
  if (starIds.length > 0 && after !== null) {
    const attach = center(at(nodes, after - 1));
    starIds.forEach((id, i) => {
      starNodes.push({ id, x: attach.x + 75 + i * STRIP_PITCH - NODE_CX, y: STRIP_STAR_Y - NODE_CY, star: true });
    });
    starNodes.forEach((node, i) => {
      const b = center(node);
      const d = i === 0 ? scurveV(attach, b) : `M${center(at(starNodes, i - 1)).x} ${b.y} H${b.x}`;
      starLinks.push({ to: node.id, d, star: true });
    });
  }

  return {
    kind: 'strip', width: Math.max(chest.x + CHEST_W, ...starNodes.map((n) => n.x + NODE_W)) + 48, height: STRIP_H, nodes: [...nodes, ...starNodes], links: [...links, ...starLinks], chest,
    decor: [], scenery: 'none', kubikH: 110,
  };
}
