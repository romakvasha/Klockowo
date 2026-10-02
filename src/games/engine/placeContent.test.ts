import { describe, expect, it } from 'vitest';
import type { Rect } from './layoutObjects';
import { placeContent } from './placeContent';

const hit = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const AREAS = [
  { area: { w: 1152, h: 430 }, reserved: [{ x: 0, y: 302, w: 313, h: 128 }] },
  { area: { w: 1000, h: 380 }, reserved: [{ x: 0, y: 270, w: 255, h: 110 }] },
  { area: { w: 640, h: 640 }, reserved: [] },
  { area: { w: 520, h: 280 }, reserved: [{ x: 0, y: 0, w: 520, h: 46 }] },
  { area: { w: 700, h: 320 }, reserved: [{ x: 0, y: 220, w: 300, h: 100 }] },
] as const;
const DESIGNS = [{ w: 440, h: 420 }, { w: 600, h: 340 }];

describe('placeContent', () => {
  it('композиція в межах області, не перекриває Kubika й смугу кісточок, масштаб додатний', () => {
    for (const { area, reserved } of AREAS) {
      for (const design of DESIGNS) {
        const p = placeContent(area, reserved, design);
        expect(p.scale).toBeGreaterThan(0);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x + p.w).toBeLessThanOrEqual(area.w);
        expect(p.y + p.h).toBeLessThanOrEqual(area.h);
        for (const r of reserved) expect(hit(p, r), JSON.stringify({ area, design })).toBe(false);
      }
    }
  });

  it('не збільшує понад maxScale; без перешкод центрує', () => {
    const p = placeContent({ w: 2000, h: 2000 }, [], { w: 400, h: 300 }, { maxScale: 1.2 });
    expect(p.scale).toBeCloseTo(1.2);
    expect(p.x + p.w / 2).toBeCloseTo(1000, 0);
  });

  it('Kubik збоку — композиція не перекриває його і не надто мала', () => {
    const area = { w: 900, h: 300 };
    const reserved = [{ x: 0, y: 100, w: 200, h: 200 }];
    const p = placeContent(area, reserved, { w: 300, h: 280 });
    expect(hit(p, reserved[0]!)).toBe(false);
    expect(p.scale).toBeGreaterThan(0.8);
  });
});
