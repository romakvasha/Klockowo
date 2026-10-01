// Розкладка «Mapa przygody» (BRIEF §6.4, design etap1/17): 7 островів уздовж стежки, «Plac Zabaw» і «Baza Drużyny».
// Альбомна — сцена 1280×720 (координати з борда); портретна — вертикальна стежка, що гортається (BRIEF §12).
// Координати — лівий верхній кут коробки острова; усе інше (прапорець, сяйво, Kubik, підпис) рахується від неї.
import type { WorldId } from '../../curriculum/types';

export type MapNodeId = WorldId | 'base';
export type MapOrientation = 'landscape' | 'portrait';

export interface MapLayout {
  width: number;
  height: number;
  /** Розмір коробки острова (картинка island-*.svg має пропорцію 208 : 228). */
  island: { w: number; h: number };
  /** Множник відносно борда (190×208): розміри прапорця, сяйва, Kubika на картингу. */
  scale: number;
  nodes: Readonly<Record<MapNodeId, { x: number; y: number }>>;
  /** Позначки хвиль на воді (декор): лівий верхній кут «хвильки» 40×6. */
  waves: readonly (readonly [number, number])[];
  /** Відрізки стежки: від попереднього вузла до `to`. Піщаний, якщо `to` відкрито; сірий — якщо ні. */
  trail: readonly { from: MapNodeId; to: WorldId; d: string }[];
}

/** Точка кріплення стежки до острова: центр по X і 120 одиниць борда від верху (так стежка підходить до берега). */
export function anchor(layout: MapLayout, id: MapNodeId): { x: number; y: number } {
  const node = layout.nodes[id];
  return { x: node.x + layout.island.w / 2, y: node.y + 120 * layout.scale };
}

export const LANDSCAPE: MapLayout = {
  width: 1280,
  height: 720,
  island: { w: 190, h: 208 },
  scale: 1,
  nodes: {
    base: { x: 55, y: 450 },
    hub: { x: 95, y: 210 },
    w1: { x: 290, y: 470 },
    w2: { x: 515, y: 425 },
    w3: { x: 745, y: 470 },
    w4: { x: 970, y: 410 },
    w5: { x: 970, y: 180 },
    w6: { x: 720, y: 145 },
    w7: { x: 475, y: 120 },
  },
  waves: [[60, 100], [300, 150], [1180, 170], [420, 420], [930, 440], [1180, 660], [40, 300], [700, 120]],
  trail: [
    { from: 'base', to: 'hub', d: 'M150 570 Q170 450 190 330' },
    { from: 'base', to: 'w1', d: 'M150 570 Q270 680 385 590' },
    { from: 'w1', to: 'w2', d: 'M385 590 Q500 660 610 545' },
    { from: 'w2', to: 'w3', d: 'M610 545 Q720 665 840 590' },
    { from: 'w3', to: 'w4', d: 'M840 590 Q960 650 1065 530' },
    { from: 'w4', to: 'w5', d: 'M1065 530 Q1170 420 1065 300' },
    { from: 'w5', to: 'w6', d: 'M1065 300 Q950 360 815 265' },
    { from: 'w6', to: 'w7', d: 'M815 265 Q700 330 570 240' },
  ],
};

const P = 0.8; // портретна мапа: острови 152×166
const PORTRAIT_ISLAND = { w: 190 * P, h: 208 * P };
const LEFT = 24;
const RIGHT = 214;
const ROW = 170;
const TOP = 140; // зверху лишається місце під фіксовану панель (аватар, «Naklejki», шестерня)
const row = (n: number) => TOP + n * ROW; // n = 0 — W7, 7 — W1/хаб/база

type Anchor = { x: number; y: number };

/** Плавна S-крива між двома точками кріплення (вертикальні дотичні). */
export function scurve(a: Anchor, b: Anchor): string {
  const mid = Math.round((a.y + b.y) / 2);
  return `M${a.x} ${a.y} C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${b.y}`;
}

const portraitNodes: MapLayout['nodes'] = {
  w7: { x: RIGHT, y: row(0) },
  w6: { x: LEFT, y: row(1) },
  w5: { x: RIGHT, y: row(2) },
  w4: { x: LEFT, y: row(3) },
  w3: { x: RIGHT, y: row(4) },
  w2: { x: LEFT, y: row(5) },
  w1: { x: RIGHT, y: row(6) },
  base: { x: LEFT, y: row(7) },
  hub: { x: RIGHT, y: row(7) },
};

const portraitBase: Omit<MapLayout, 'trail'> = {
  width: 390,
  height: row(7) + PORTRAIT_ISLAND.h + 120,
  island: PORTRAIT_ISLAND,
  scale: P,
  nodes: portraitNodes,
  waves: [[40, 210], [320, 270], [60, 560], [330, 700], [40, 900], [320, 1010], [60, 1250], [300, 1430]],
};

const TRAIL_ORDER: readonly { from: MapNodeId; to: WorldId }[] = [
  { from: 'base', to: 'hub' },
  { from: 'base', to: 'w1' },
  { from: 'w1', to: 'w2' },
  { from: 'w2', to: 'w3' },
  { from: 'w3', to: 'w4' },
  { from: 'w4', to: 'w5' },
  { from: 'w5', to: 'w6' },
  { from: 'w6', to: 'w7' },
];

export const PORTRAIT: MapLayout = {
  ...portraitBase,
  trail: TRAIL_ORDER.map(({ from, to }) => ({
    from,
    to,
    d: scurve(anchor(portraitBase as MapLayout, from), anchor(portraitBase as MapLayout, to)),
  })),
};

export function layoutFor(orientation: MapOrientation): MapLayout {
  return orientation === 'landscape' ? LANDSCAPE : PORTRAIT;
}

/** Масштаб сцени 1280×720 у вікні: вміщається повністю, але не більше 1 (на широких екранах боки — тло світу). */
export function landscapeScale(viewportW: number, viewportH: number): number {
  const s = Math.min(1, viewportW / LANDSCAPE.width, viewportH / LANDSCAPE.height);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

/** Мапа гортається вертикально в портреті; в альбомі — одна сцена. */
export function mapOrientation(viewportW: number, viewportH: number): MapOrientation {
  return viewportW >= viewportH ? 'landscape' : 'portrait';
}
