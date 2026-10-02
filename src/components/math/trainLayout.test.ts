import { describe, expect, it } from 'vitest';
import type { Rect } from '../../games/engine/layoutObjects';
import { ENGINE_UNITS, MAX_WAGON, MIN_WAGON, WAGON_RATIO, freeBand, packRows, trainLayout } from './trainLayout';

const KUBIK: Rect = { x: 0, y: 305, w: 313, h: 127 };

describe('freeBand', () => {
  it('смуга біля нижнього краю — «bottom», біля верхнього — «top»', () => {
    expect(freeBand({ w: 1280, h: 432 }, [KUBIK])).toEqual({ top: 0, bottom: 127 });
    expect(freeBand({ w: 844, h: 300 }, [{ x: 0, y: 0, w: 844, h: 46 }])).toEqual({ top: 46, bottom: 0 });
    expect(freeBand({ w: 600, h: 600 }, [])).toEqual({ top: 0, bottom: 0 });
  });
});

describe('packRows', () => {
  it('жадібно переносить елементи, коли ряд повний', () => {
    expect(packRows([1.25, 1, 1, 1, 1], 100, 330)).toEqual([[0, 1, 2], [3, 4]]);
    expect(packRows([1, 1, 1], 100, 1000)).toEqual([[0, 1, 2]]);
  });

  it('один елемент завжди йде в ряд, навіть якщо ширший за область', () => {
    expect(packRows([1, 1], 100, 50)).toEqual([[0], [1]]);
  });
});

describe('trainLayout', () => {
  const inside = (a: { w: number; h: number }, l: ReturnType<typeof trainLayout>) =>
    l.items.every((it) => it.x >= 0 && it.y >= 0 && it.x + it.w <= a.w + 1 && it.y + it.h <= a.h + 1);

  it('ПК: 7 вагонів і паровозик — один ряд, вагон максимального розміру, нічого поза сценою', () => {
    const area = { w: 1280, h: 432 };
    const l = trainLayout(area, [KUBIK], 7);
    expect(l.rows).toBe(1);
    expect(l.wagon).toBe(MAX_WAGON);
    expect(l.items).toHaveLength(8);
    expect(l.items[0]).toMatchObject({ kind: 'engine', index: -1 });
    expect(l.items.slice(1).map((i) => i.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(inside(area, l)).toBe(true);
  });

  it('вагони йдуть упритул, без накладання, паровозик ширший', () => {
    const l = trainLayout({ w: 1280, h: 432 }, [KUBIK], 5);
    for (let i = 1; i < l.items.length; i++) {
      const prev = l.items[i - 1]!;
      expect(l.items[i]!.x).toBeGreaterThanOrEqual(prev.x + prev.w - 1);
      expect(l.items[i]!.y).toBe(prev.y);
    }
    expect(Math.abs(l.items[0]!.w - l.wagon * ENGINE_UNITS)).toBeLessThanOrEqual(1);
    expect(Math.abs(l.items[1]!.h - l.wagon * WAGON_RATIO)).toBeLessThanOrEqual(1);
  });

  it('телефон у портреті (342×342): ряд переноситься, усе вміщується, вагон не менший за мінімум', () => {
    const area = { w: 342, h: 342 };
    const l = trainLayout(area, [], 7);
    expect(l.rows).toBeGreaterThan(1);
    expect(l.wagon).toBeGreaterThanOrEqual(MIN_WAGON);
    expect(inside(area, l)).toBe(true);
    // номери вагонів ідуть підряд за рядками
    expect(l.items.filter((i) => i.kind === 'wagon').map((i) => i.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('телефон в альбомі (смуга кісточок угорі): потяг не заходить на смугу', () => {
    const area = { w: 600, h: 290 };
    const l = trainLayout(area, [{ x: 0, y: 0, w: 600, h: 46 }], 6);
    expect(Math.min(...l.items.map((i) => i.y))).toBeGreaterThanOrEqual(46);
    expect(inside(area, l)).toBe(true);
  });

  it('ряди не накладаються по вертикалі, кожному ряду — своя колія', () => {
    const l = trainLayout({ w: 342, h: 342 }, [], 7);
    const ys = [...new Set(l.items.map((i) => i.y))].sort((a, b) => a - b);
    expect(l.rails).toHaveLength(ys.length);
    ys.slice(1).forEach((y, k) => expect(y).toBeGreaterThanOrEqual(ys[k]! + Math.round(l.wagon * WAGON_RATIO)));
  });

  it('блок стоїть по центру вільної смуги: над ділянкою Kubika', () => {
    const area = { w: 1280, h: 432 };
    const l = trainLayout(area, [KUBIK], 5);
    const bottom = Math.max(...l.items.map((i) => i.y + i.h));
    expect(bottom).toBeLessThanOrEqual(area.h - KUBIK.h);
  });

  it('без паровозика всі елементи — вагони', () => {
    const l = trainLayout({ w: 800, h: 400 }, [], 4, false);
    expect(l.items.every((i) => i.kind === 'wagon')).toBe(true);
    expect(l.items.map((i) => i.index)).toEqual([0, 1, 2, 3]);
  });
});
