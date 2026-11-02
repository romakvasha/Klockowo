// Композиція Wprowadzenie (BRIEF §6.6, design etap2/17–18): альбомна сцена 1280×720 із координатами бордів і портретна 390×700.
// Дві фази: «card» — велика MissionCard і гість показує на неї; «idea» — картка стискається в куток, у центрі з'являється панель
// демонстрації нової ідеї. Чисті дані: екран лише підставляє їх у CSS-змінні й переходи.

export type MissionOrientation = 'landscape' | 'portrait';
export type MissionPhase = 'card' | 'idea';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MissionLayout {
  width: number;
  height: number;
  /** Картка 640×360: лівий верхній кут і масштаб (compact 380×214 = 0,594). */
  card: { x: number; y: number; scale: number };
  /** Панель демонстрації 700×300 (лише у фазі «idea»). */
  panel: { x: number; y: number; scale: number } | null;
  guest: Box;
  kubik: Box;
  /** Верх смуги ґрунту (від верху сцени). */
  ground: number;
}

export const CARD_W = 640;
export const CARD_H = 360;
export const PANEL_W = 700;
export const PANEL_H = 300;

const LANDSCAPE: Record<MissionPhase, MissionLayout> = {
  card: {
    width: 1280, height: 720,
    card: { x: 320, y: 150, scale: 1 }, panel: null,
    guest: { x: 976, y: 380, w: 144, h: 180 }, kubik: { x: 22, y: 512, w: 147, h: 184 }, ground: 540,
  },
  idea: {
    width: 1280, height: 720,
    card: { x: 120, y: 24, scale: 380 / CARD_W }, panel: { x: 290, y: 256, scale: 1 },
    guest: { x: 1010, y: 424, w: 112, h: 140 }, kubik: { x: 24, y: 500, w: 160, h: 200 }, ground: 560,
  },
};

const PORTRAIT: Record<MissionPhase, MissionLayout> = {
  card: {
    width: 390, height: 700,
    card: { x: 24, y: 112, scale: 342 / CARD_W }, panel: null,
    guest: { x: 238, y: 410, w: 112, h: 140 }, kubik: { x: 20, y: 392, w: 128, h: 160 }, ground: 530,
  },
  idea: {
    width: 390, height: 700,
    card: { x: 24, y: 100, scale: 256 / CARD_W }, panel: { x: 24, y: 262, scale: 342 / PANEL_W },
    guest: { x: 238, y: 440, w: 112, h: 140 }, kubik: { x: 20, y: 440, w: 112, h: 140 }, ground: 580,
  },
};

export function missionLayout(orientation: MissionOrientation, phase: MissionPhase): MissionLayout {
  return (orientation === 'landscape' ? LANDSCAPE : PORTRAIT)[phase];
}

export function missionOrientation(viewportW: number, viewportH: number): MissionOrientation {
  return viewportW >= viewportH ? 'landscape' : 'portrait';
}

/** Масштаб сцени у вікні: вміщається повністю; альбом не збільшуємо понад 1, портрет — до 1,5 (планшет). */
export function missionScale(orientation: MissionOrientation, viewportW: number, viewportH: number): number {
  const base = missionLayout(orientation, 'card');
  const cap = orientation === 'landscape' ? 1 : 1.5;
  const s = Math.min(cap, viewportW / base.width, viewportH / base.height);
  return Number.isFinite(s) && s > 0 ? s : 1;
}
