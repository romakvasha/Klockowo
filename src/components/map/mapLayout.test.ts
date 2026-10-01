import { describe, expect, it } from 'vitest';
import { WORLD_IDS } from '../../curriculum/worlds';
import { LANDSCAPE, PORTRAIT, anchor, landscapeScale, layoutFor, mapOrientation, scurve, type MapLayout } from './mapLayout';

const layouts: ReadonlyArray<[string, MapLayout]> = [['альбом', LANDSCAPE], ['портрет', PORTRAIT]];
const boxes = (l: MapLayout) => Object.entries(l.nodes).map(([id, n]) => ({ id, x: n.x, y: n.y, w: l.island.w, h: l.island.h }));

describe.each(layouts)('розкладка мапи: %s', (_name, layout) => {
  it('є всі 8 світів (7 + хаб) і база', () => {
    expect(Object.keys(layout.nodes).sort()).toEqual([...WORLD_IDS, 'base'].sort());
  });

  it('усі острови всередині сцени', () => {
    for (const b of boxes(layout)) {
      expect(b.x, b.id).toBeGreaterThanOrEqual(0);
      expect(b.y, b.id).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w, b.id).toBeLessThanOrEqual(layout.width);
      expect(b.y + b.h, b.id).toBeLessThanOrEqual(layout.height);
    }
  });

  it('хвилі-декор всередині сцени', () => {
    expect(layout.waves.length).toBeGreaterThanOrEqual(6);
    for (const [x, y] of layout.waves) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + 40).toBeLessThanOrEqual(layout.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + 6).toBeLessThanOrEqual(layout.height);
    }
  });

  it('острови не перекриваються', () => {
    const all = boxes(layout);
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        if (!a || !b) continue;
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart, `${a.id} × ${b.id}`).toBe(true);
      }
    }
  });

  it('стежка: 7 відрізків до світів + хаб; кожен починається в точці попереднього вузла й закінчується в цільовому', () => {
    expect(layout.trail.map((t) => t.to).sort()).toEqual([...WORLD_IDS].sort());
    for (const seg of layout.trail) {
      const nums = (seg.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
      const from = anchor(layout, seg.from);
      const to = anchor(layout, seg.to);
      expect([nums[0], nums[1]], `${seg.from}→${seg.to} start`).toEqual([from.x, from.y]);
      expect([nums[nums.length - 2], nums[nums.length - 1]], `${seg.from}→${seg.to} end`).toEqual([to.x, to.y]);
    }
  });

  it('основний шлях іде по порядку світів: base → W1 → … → W7', () => {
    const main = layout.trail.filter((t) => t.to !== 'hub').map((t) => `${t.from}>${t.to}`);
    expect(main).toEqual(['base>w1', 'w1>w2', 'w2>w3', 'w3>w4', 'w4>w5', 'w5>w6', 'w6>w7']);
  });
});

describe('альбомна розкладка — числа з борда etap1/17', () => {
  it('позиції островів 190×208', () => {
    expect(LANDSCAPE.island).toEqual({ w: 190, h: 208 });
    expect(LANDSCAPE.nodes.w1).toEqual({ x: 290, y: 470 });
    expect(LANDSCAPE.nodes.w3).toEqual({ x: 745, y: 470 });
    expect(LANDSCAPE.nodes.hub).toEqual({ x: 95, y: 210 });
  });

  it('точки кріплення збігаються зі стежкою борда (W1: 385,590; W7: 570,240)', () => {
    expect(anchor(LANDSCAPE, 'w1')).toEqual({ x: 385, y: 590 });
    expect(anchor(LANDSCAPE, 'w7')).toEqual({ x: 570, y: 240 });
    expect(anchor(LANDSCAPE, 'base')).toEqual({ x: 150, y: 570 });
  });
});

describe('портретна розкладка', () => {
  it('зигзаг: непарні світи праворуч, парні ліворуч; нагорі W7, унизу база й хаб', () => {
    const { nodes } = PORTRAIT;
    expect(nodes.w1.x).toBeGreaterThan(nodes.w2.x);
    expect(nodes.w3.x).toBe(nodes.w1.x);
    expect(nodes.w2.x).toBe(nodes.w4.x);
    for (let w = 1; w < 7; w++) {
      expect(nodes[`w${w + 1}` as 'w1'].y, `w${w + 1} вище за w${w}`).toBeLessThan(nodes[`w${w}` as 'w1'].y);
    }
    expect(nodes.base.y).toBe(nodes.hub.y);
    expect(nodes.base.y).toBeGreaterThan(nodes.w1.y);
  });

  it('острів ≥ 80 px (ціль дотику), стежка плавна', () => {
    expect(PORTRAIT.island.w).toBeGreaterThanOrEqual(80);
    expect(PORTRAIT.island.h).toBeGreaterThanOrEqual(80);
    expect(scurve({ x: 100, y: 200 }, { x: 300, y: 100 })).toBe('M100 200 C100 150 300 150 300 100');
  });
});

describe('масштаб і орієнтація', () => {
  it('сцена вміщається, але не збільшується понад 1: 1440×900 → 1; 1024×768 → 0,8; 844×390 → 0,5417', () => {
    expect(landscapeScale(1440, 900)).toBe(1);
    expect(landscapeScale(1280, 720)).toBe(1);
    expect(landscapeScale(1024, 768)).toBeCloseTo(0.8, 10);
    expect(landscapeScale(844, 390)).toBeCloseTo(390 / 720, 10);
    expect(landscapeScale(0, 0)).toBe(1);
  });

  it('орієнтація за співвідношенням сторін', () => {
    expect(mapOrientation(1280, 720)).toBe('landscape');
    expect(mapOrientation(844, 390)).toBe('landscape');
    expect(mapOrientation(390, 844)).toBe('portrait');
    expect(mapOrientation(768, 1024)).toBe('portrait');
    expect(mapOrientation(800, 800)).toBe('landscape');
    expect(layoutFor('portrait')).toBe(PORTRAIT);
    expect(layoutFor('landscape')).toBe(LANDSCAPE);
  });
});
