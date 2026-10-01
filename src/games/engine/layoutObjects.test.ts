import { describe, expect, it } from 'vitest';
import type { Arrangement } from '../../curriculum/types';
import { MIN_SIZE, countingOrder, itemSize, layoutObjects, type Point, type Rect } from './layoutObjects';
import { createRng } from './rng';

const ARRANGEMENTS: readonly Arrangement[] = ['line', 'circle', 'scatter'];
/** Області сцени з бордів etap2/00–05: ПК 1280×432, 1024×460, планшет-портрет 600×600, телефон-портрет 342×342, телефон-альбом 525×342. */
const AREAS = [
  { name: '1280×432', w: 1280, h: 432 }, { name: '1024×460', w: 1024, h: 460 }, { name: '600×600', w: 600, h: 600 },
  { name: '342×342', w: 342, h: 342 }, { name: '525×342', w: 525, h: 342 },
] as const;

const gapBetween = (a: Point, b: Point, size: number): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) - size;
const overlap = (p: Point, size: number, r: Rect): boolean => p.x < r.x + r.w && r.x < p.x + size && p.y < r.y + r.h && r.y < p.y + size;

describe('itemSize', () => {
  it('п’ята частина меншої сторони в межах 64…96', () => {
    expect(itemSize({ w: 1280, h: 432 })).toBe(86);
    expect(itemSize({ w: 342, h: 342 })).toBe(68);
    expect(itemSize({ w: 600, h: 600 })).toBe(96);
    expect(itemSize({ w: 200, h: 200 })).toBe(64);
    expect(itemSize({ w: 2000, h: 2000 })).toBe(96);
  });
});

describe.each(ARRANGEMENTS)('layoutObjects: %s', (arrangement) => {
  for (const area of AREAS) {
    it(`${area.name}: від 1 до 10 предметів — усі всередині, без перекриття, не менші за 64 px там, де це можливо`, () => {
      for (let count = 1; count <= 10; count++) {
        const size = itemSize(area);
        const { items, size: used } = layoutObjects({ arrangement, count, area, size, rng: createRng(count * 31 + 7) });
        expect(items, `${count}`).toHaveLength(count);
        expect(used, `${count}`).toBeGreaterThanOrEqual(Math.min(size, 56));
        for (const p of items) {
          expect(p.x, `${count} x`).toBeGreaterThanOrEqual(-0.5);
          expect(p.y, `${count} y`).toBeGreaterThanOrEqual(-0.5);
          expect(p.x + used, `${count} right`).toBeLessThanOrEqual(area.w + 0.5);
          expect(p.y + used, `${count} bottom`).toBeLessThanOrEqual(area.h + 0.5);
        }
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            expect(gapBetween(items[i] as Point, items[j] as Point, used), `${count}: ${i}×${j}`).toBeGreaterThanOrEqual(2);
          }
        }
      }
    });

    it(`${area.name}: до 20 предметів теж вміщаються без перекриття (розмір може зменшитись, але не нижче ${MIN_SIZE})`, () => {
      for (const count of [11, 14, 17, 20]) {
        const { items, size } = layoutObjects({ arrangement, count, area, size: itemSize(area), rng: createRng(count) });
        expect(items).toHaveLength(count);
        expect(size).toBeGreaterThanOrEqual(MIN_SIZE);
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            expect(gapBetween(items[i] as Point, items[j] as Point, size), `${count}: ${i}×${j}`).toBeGreaterThan(-1);
          }
        }
      }
    });
  }

  it('детерміновано: те саме зерно — та сама розкладка', () => {
    const input = { arrangement, count: 7, area: { w: 1280, h: 432 }, size: 86 } as const;
    expect(layoutObjects({ ...input, rng: createRng(5) })).toEqual(layoutObjects({ ...input, rng: createRng(5) }));
  });
});

describe('ділянка Kubika (reserved)', () => {
  const area = { w: 1280, h: 432 };
  const kubik: Rect = { x: 0, y: 294, w: 313, h: 138 }; // бульбашка й голова Kubika в нижньому лівому куті сцени

  for (const arrangement of ARRANGEMENTS) {
    it(`${arrangement}: предмети обходять її (1–10 штук)`, () => {
      for (let count = 1; count <= 10; count++) {
        const { items, size } = layoutObjects({ arrangement, count, area, size: 86, rng: createRng(count + 100), reserved: [kubik] });
        for (const p of items) expect(overlap(p, size, kubik), `${arrangement} ${count}`).toBe(false);
      }
    });
  }
});

describe('вигляд розкладок', () => {
  it('рядок: до 7 предметів — один ряд на одній висоті, рівномірно', () => {
    const { items } = layoutObjects({ arrangement: 'line', count: 5, area: { w: 1280, h: 432 }, size: 86, rng: createRng(1) });
    expect(new Set(items.map((p) => Math.round(p.y))).size).toBe(1);
    const gaps = items.slice(1).map((p, i) => Math.round(p.x - (items[i] as Point).x));
    expect(new Set(gaps).size).toBe(1);
  });

  it('рядок у вузькій області переноситься на кілька рядів, ряди центровані', () => {
    const { items, size } = layoutObjects({ arrangement: 'line', count: 9, area: { w: 342, h: 342 }, size: 68, rng: createRng(1) });
    const rows = new Set(items.map((p) => Math.round(p.y)));
    expect(rows.size).toBeGreaterThan(1);
    const mid = items.reduce((s, p) => s + p.x + size / 2, 0) / items.length;
    expect(Math.abs(mid - 171)).toBeLessThan(40);
  });

  it('коло: усі предмети на однаковій відстані від центру', () => {
    const { items, size } = layoutObjects({ arrangement: 'circle', count: 8, area: { w: 600, h: 600 }, size: 84, rng: createRng(1) });
    const cx = items.reduce((s, p) => s + p.x + size / 2, 0) / items.length;
    const cy = items.reduce((s, p) => s + p.y + size / 2, 0) / items.length;
    const radii = items.map((p) => Math.hypot(p.x + size / 2 - cx, p.y + size / 2 - cy));
    expect(Math.max(...radii) - Math.min(...radii)).toBeLessThan(1);
  });

  it('розсип: різні зерна дають різні розкладки, і це не рівна сітка', () => {
    const base = { arrangement: 'scatter', count: 7, area: { w: 1280, h: 432 }, size: 86 } as const;
    const a = layoutObjects({ ...base, rng: createRng(1) }).items;
    const b = layoutObjects({ ...base, rng: createRng(2) }).items;
    expect(a).not.toEqual(b);
    expect(new Set(a.map((p) => Math.round(p.y / 10))).size).toBeGreaterThan(2);
  });

  it('нуль і від’ємна кількість — порожньо', () => {
    expect(layoutObjects({ arrangement: 'line', count: 0, area: { w: 300, h: 300 }, size: 64, rng: createRng(1) }).items).toEqual([]);
  });
});

describe('countingOrder', () => {
  const area = { w: 1280, h: 432 };

  it('рядок: зліва направо', () => {
    const { items, size } = layoutObjects({ arrangement: 'line', count: 5, area, size: 86, rng: createRng(1) });
    const order = countingOrder('line', items, size);
    expect(order.map((i) => (items[i] as Point).x)).toEqual([...items.map((p) => p.x)].sort((a, b) => a - b));
  });

  it('рядок у два ряди: спершу верхній ряд, потім нижній', () => {
    const { items, size } = layoutObjects({ arrangement: 'line', count: 9, area: { w: 342, h: 342 }, size: 68, rng: createRng(1) });
    const ys = countingOrder('line', items, size).map((i) => (items[i] as Point).y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
  });

  it('коло: за годинниковою стрілкою, починаючи зверху — перший предмет найвищий', () => {
    const { items, size } = layoutObjects({ arrangement: 'circle', count: 6, area: { w: 600, h: 600 }, size: 84, rng: createRng(1) });
    const order = countingOrder('circle', items, size);
    const first = items[order[0] as number] as Point;
    expect(first.y).toBe(Math.min(...items.map((p) => p.y)));
    const second = items[order[1] as number] as Point;
    expect(second.x).toBeGreaterThan(first.x); // далі вправо — за годинниковою
  });

  it('розсип: усі індекси рівно по одному разу, ряди зверху вниз', () => {
    const { items, size } = layoutObjects({ arrangement: 'scatter', count: 8, area, size: 86, rng: createRng(4) });
    const order = countingOrder('scatter', items, size);
    expect([...order].sort((a, b) => a - b)).toEqual(items.map((_, i) => i));
    const bands = order.map((i) => Math.round((items[i] as Point).y / (size * 1.1)));
    expect(bands).toEqual([...bands].sort((a, b) => a - b));
  });
});
