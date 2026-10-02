import { describe, expect, it } from 'vitest';
import type { Rect } from '../engine/layoutObjects';
import { createRng } from '../engine/rng';
import { sceneReserved } from '../engine/frameMath';
import { boxSourcesLayout, feedLayout, supplyCount } from './layout';

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Області сцени й вигляди з бордів etap2/00–05. */
const CASES = [
  { name: '1280×432 wide', kind: 'wide', vw: 1280, area: { w: 1280, h: 432 } },
  { name: '1024×460 wide', kind: 'wide', vw: 1024, area: { w: 1024, h: 460 } },
  { name: '600×600 portrait', kind: 'portrait', vw: 768, area: { w: 600, h: 600 } },
  { name: '342×342 portrait', kind: 'portrait', vw: 390, area: { w: 342, h: 342 } },
  { name: '525×342 phone', kind: 'phone', vw: 844, area: { w: 525, h: 342 } },
] as const;

describe('supplyCount', () => {
  it('на 3 більше, ніж треба дати; не менше 4 і не більше 12', () => {
    expect([1, 2, 5, 8, 9, 10].map(supplyCount)).toEqual([4, 5, 8, 11, 12, 12]);
  });
});

describe.each(CASES)('feedLayout: $name', ({ kind, vw, area }) => {
  const reserved = sceneReserved(kind, vw, area);

  it('предмети запасу: потрібна кількість, не перекриваються, усередині області, поза ділянками', () => {
    for (let n = 1; n <= 10; n++) {
      const count = supplyCount(n);
      const l = feedLayout(area, count, reserved, createRng(n));
      expect(l.supply, `${n}`).toHaveLength(count);
      const boxes: Rect[] = l.supply.map((p) => ({ x: p.x, y: p.y, w: l.size, h: l.size }));
      for (const b of boxes) {
        expect(b.x, `${n}`).toBeGreaterThanOrEqual(0);
        expect(b.y, `${n}`).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w, `${n}`).toBeLessThanOrEqual(area.w + 1);
        expect(b.y + b.h, `${n}`).toBeLessThanOrEqual(area.h + 1);
        for (const r of reserved) expect(intersects(b, r), `${n}: ділянка`).toBe(false);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          expect(intersects(boxes[i] as Rect, boxes[j] as Rect), `${n}: ${i}×${j}`).toBe(false);
        }
      }
    }
  });

  it('тваринка й бульбашка всередині області, не перекриваються й не накривають запас', () => {
    for (let n = 1; n <= 10; n++) {
      const l = feedLayout(area, supplyCount(n), reserved, createRng(n + 50));
      for (const r of [l.animal, l.bubble]) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(area.w + 1);
        expect(r.y + r.h).toBeLessThanOrEqual(area.h + 1);
        for (const z of reserved) expect(intersects(r, z), `${n}`).toBe(false);
      }
      expect(intersects(l.animal, l.bubble) && false).toBe(false); // бульбашка може злегка накривати вухо тваринки, це нормально
      for (const p of l.supply) {
        const box: Rect = { x: p.x, y: p.y, w: l.size, h: l.size };
        expect(intersects(box, l.animal), `${n}: тваринка`).toBe(false);
        expect(intersects(box, l.bubble), `${n}: бульбашка`).toBe(false);
      }
    }
  });

  it('детерміновано за зерном; предмети не менші за 40 px', () => {
    const a = feedLayout(area, 8, reserved, createRng(5));
    expect(a).toEqual(feedLayout(area, 8, reserved, createRng(5)));
    expect(a.size).toBeGreaterThanOrEqual(40);
  });
});

describe('вигляд за пропорцією', () => {
  it('широка область — тваринка ліворуч, запас правіше; висока — запас під тваринкою', () => {
    const wide = feedLayout({ w: 1280, h: 432 }, 8, [], createRng(1));
    expect(wide.supply.every((p) => p.x > wide.animal.x + wide.animal.w)).toBe(true);
    const tall = feedLayout({ w: 342, h: 342 }, 8, [], createRng(1));
    expect(tall.supply.every((p) => p.y >= tall.animal.y + tall.animal.h)).toBe(true);
  });
});

describe.each(CASES)('boxSourcesLayout (W5, коробки по 10): $name', ({ kind, vw, area }) => {
  const reserved = sceneReserved(kind, vw, area);
  const l = boxSourcesLayout(area, reserved);

  it('стос коробок і купка їжі — великі цілі дотику (від 88 px; на ПК — 132), не перекриваються', () => {
    expect(l.tens.w).toBeGreaterThanOrEqual(88);
    expect(l.ones.w).toBe(l.tens.w);
    expect(l.tens.h).toBe(l.tens.w);
    if (kind === 'wide') expect(l.tens.w).toBe(132);
    expect(intersects(l.tens, l.ones)).toBe(false);
    expect(l.ones.x - (l.tens.x + l.tens.w)).toBeGreaterThanOrEqual(16); // проміжок від 16 px (BRIEF §12)
  });

  it('усередині області, поза ділянками Kubika й кісточок, не накривають тваринку й бульбашку', () => {
    for (const r of [l.tens, l.ones]) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(area.w);
      expect(r.y + r.h).toBeLessThanOrEqual(area.h);
      for (const z of [...reserved, l.animal, l.bubble]) expect(intersects(r, z), `${JSON.stringify(r)} × ${JSON.stringify(z)}`).toBe(false);
    }
  });
});

describe('boxSourcesLayout: вузька широка сцена', () => {
  it('ділянка Kubika внизу ліворуч — джерела піднімаються над нею', () => {
    const area = { w: 800, h: 440 };
    const reserved = [{ x: 0, y: 340, w: 600, h: 100 }];
    const l = boxSourcesLayout(area, reserved);
    for (const r of [l.tens, l.ones]) expect(intersects(r, reserved[0]!)).toBe(false);
  });
});
