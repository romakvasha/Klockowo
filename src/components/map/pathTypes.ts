// Типи й спільні хелпери розкладки «Ścieżka świata» (див. pathLayout.ts, pathGenerate.ts).
import type { LevelId } from '../../curriculum/types';

export type PathKind = 'landscape' | 'portrait' | 'strip';

export const NODE_W = 96;
export const NODE_H = 104;
/** Центр верхньої грані платформи відносно лівого верхнього кута вузла 96×104 (по ньому йде дорога). */
export const NODE_CX = 48;
export const NODE_CY = 56;
export const CHEST_W = 132;
export const CHEST_H = 155;

export interface Point {
  x: number;
  y: number;
}

export interface PathNode extends Point {
  id: LevelId;
  star: boolean;
}

/** Відрізок дороги від попереднього вузла до `to` (для першого вузла — від краю сцени, для скрині — від останнього вузла).
 *  Піщаний, якщо `to` відкрито; сірий — якщо ні. ★-відрізки — золоті. */
export interface PathLink {
  to: LevelId | 'chest';
  d: string;
  star: boolean;
}

export type DecorKind = 'meadow' | 'tree' | 'rocks' | 'palm' | 'pool' | 'pine';
export interface PathDecor extends Point {
  kind: DecorKind;
  w: number;
  h: number;
}

export type Scenery = 'none' | 'beach' | 'river';

export interface PathLayout {
  kind: PathKind;
  width: number;
  height: number;
  nodes: readonly PathNode[];
  links: readonly PathLink[];
  /** Лівий верхній кут скрині 132×155. */
  chest: Point;
  decor: readonly PathDecor[];
  scenery: Scenery;
  /** Висота Kubika біля вузла (px сцени). */
  kubikH: number;
}

export function at<T>(list: readonly T[], i: number): T {
  const value = list[i];
  if (value === undefined) throw new Error(`Index ${i} out of range (${list.length})`);
  return value;
}

/** Центр верхньої грані платформи (точка дороги). */
export function center(node: Point): Point {
  return { x: node.x + NODE_CX, y: node.y + NODE_CY };
}

const BULGE = 130; // на скільки дорога виходить за крайній вузол, розвертаючись між рядами

/** Відрізки основної дороги: від краю сцени до першого вузла, прямі всередині ряду, розворот-«скоба» між рядами. */
export function serpentineLinks(nodes: readonly PathNode[], midX: number, bulge = BULGE): PathLink[] {
  return nodes.map((node, i) => {
    const b = center(node);
    if (i === 0) return { to: node.id, d: `M-20 ${b.y} H${b.x}`, star: false };
    const a = center(at(nodes, i - 1));
    if (a.y === b.y) return { to: node.id, d: `M${a.x} ${a.y} H${b.x}`, star: false };
    const out = a.x > midX ? a.x + bulge : a.x - bulge;
    return { to: node.id, d: `M${a.x} ${a.y} C${out} ${a.y} ${out} ${b.y} ${b.x} ${b.y}`, star: false };
  });
}

