import { describe, expect, it } from 'vitest';
import {
  BONE_FLIGHT_MS, BOWL_H, BOWL_W, allBonesMs, boneFlight, bowlTarget, completeLayout, completeOrientation, completeScale, slotCenter,
  type CompleteOrientation,
} from './levelCompleteLayout';
import type { Box } from '../mission/missionLayout';

const ORIENTATIONS: readonly CompleteOrientation[] = ['landscape', 'portrait'];
const apart = (a: Box, b: Box) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
const inside = (b: Box, l: { width: number; height: number }) => b.x >= 0 && b.y >= 0 && b.x + b.w <= l.width && b.y + b.h <= l.height;

describe.each(ORIENTATIONS)('композиція Koniec poziomu: %s', (orientation) => {
  const l = completeLayout(orientation);
  const bowl: Box = { x: l.bowl.x, y: l.bowl.y, w: BOWL_W * l.bowl.scale, h: BOWL_H * l.bowl.scale };
  const railBox: Box = { x: l.rail.x, y: l.rail.y, w: 5 * l.rail.pitch + l.rail.slotW, h: l.rail.slotH };
  const items: [string, Box][] = [
    ['Kubik', l.kubik], ['тваринка', l.animal], ['наліпка', l.sticker], ['значок', l.badge], ['миска', bowl], ['ряд кісточок', railBox],
  ];

  it('усе всередині сцени', () => {
    for (const [name, box] of items) expect(inside(box, l), name).toBe(true);
  });

  it('жоден елемент не перекриває інший', () => {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (a && b) expect(apart(a[1], b[1]), `${a[0]} × ${b[0]}`).toBe(true);
      }
    }
  });

  it('Kubik і тваринка стоять на ґрунті: низ фігури трохи нижче верху смуги', () => {
    for (const box of [l.kubik, l.animal]) {
      expect(box.y + box.h).toBeGreaterThanOrEqual(l.ground);
      expect(box.y + box.h).toBeLessThanOrEqual(l.ground + 60);
    }
  });

  it('ряд кісточок: 6 слотів з однаковим кроком, кінець ряду не виходить за сцену', () => {
    expect(l.rail.x + 5 * l.rail.pitch + l.rail.slotW).toBeLessThanOrEqual(l.width - 24);
    expect(l.rail.pitch).toBeGreaterThanOrEqual(l.rail.slotW);
  });
});

describe('політ кісточок', () => {
  it('слот 0 і слот 5 — на відстані 5 кроків; центр слота — всередині слота', () => {
    const l = completeLayout('landscape');
    expect(slotCenter(l.rail, 5).x - slotCenter(l.rail, 0).x).toBe(5 * l.rail.pitch);
    expect(slotCenter(l.rail, 0)).toEqual({ x: l.rail.x + l.rail.slotW / 2, y: l.rail.y + l.rail.slotH / 2 });
  });

  it('усі шість кісточок летять вниз і до миски: dy > 0, а dx веде до отвору', () => {
    for (const o of ORIENTATIONS) {
      const l = completeLayout(o);
      const target = bowlTarget(l);
      for (let i = 0; i < 6; i++) {
        const { dx, dy } = boneFlight(l, i);
        expect(dy, `${o} #${i}`).toBeGreaterThan(0);
        expect(slotCenter(l.rail, i).x + dx).toBeCloseTo(target.x, 0);
        expect(slotCenter(l.rail, i).y + dy).toBeCloseTo(target.y, 0);
      }
    }
  });

  it('отвір миски — над самою мискою й усередині сцени', () => {
    for (const o of ORIENTATIONS) {
      const l = completeLayout(o);
      const t = bowlTarget(l);
      expect(t.x).toBeGreaterThan(l.bowl.x);
      expect(t.x).toBeLessThan(l.bowl.x + BOWL_W * l.bowl.scale);
      expect(t.y).toBeGreaterThan(l.bowl.y);
      expect(t.y).toBeLessThan(l.bowl.y + BOWL_H * l.bowl.scale);
    }
  });

  it('шість кісточок поспіль займають менше 5 с — решту часу забирає голос і наліпка', () => {
    expect(allBonesMs(6)).toBe(6 * BONE_FLIGHT_MS + 5 * 150);
    expect(allBonesMs(6)).toBeLessThan(5000);
    expect(allBonesMs(0)).toBe(0);
  });
});

describe('орієнтація й масштаб', () => {
  it('портрет лише коли висота більша за ширину', () => {
    expect(completeOrientation(1280, 720)).toBe('landscape');
    expect(completeOrientation(390, 844)).toBe('portrait');
  });

  it('масштаб вміщає сцену у вікно: альбом ≤ 1, портрет ≤ 1,5', () => {
    expect(completeScale('landscape', 1280, 720)).toBe(1);
    expect(completeScale('landscape', 844, 390)).toBeCloseTo(390 / 720);
    expect(completeScale('portrait', 390, 844)).toBe(1);
    expect(completeScale('portrait', 768, 1024)).toBeCloseTo(1024 / 700);
  });
});
