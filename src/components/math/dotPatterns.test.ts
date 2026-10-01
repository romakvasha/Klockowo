import { describe, expect, it } from 'vitest';
import { createRng } from '../../games/engine/rng';
import { dotLayout, groupBoxes, groupSizes, type Box, type DotPattern } from './dotPatterns';

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('dice', () => {
  it('1–6: стільки крапок, скільки треба, усі в картці', () => {
    for (let n = 1; n <= 6; n++) {
      const l = dotLayout('dice', n, createRng(1));
      expect(l.dots, `${n}`).toHaveLength(n);
      for (const d of l.dots) {
        expect(d.x).toBeGreaterThan(0.1);
        expect(d.x).toBeLessThan(0.9);
        expect(d.y).toBeGreaterThan(0.1);
        expect(d.y).toBeLessThan(0.9);
      }
    }
  });

  it('розкладання: 5 = 3 + 2, 4 = 2 + 2, 6 = 3 + 3, 3 = 1 + 2, 2 = 1 + 1, 1 = ціле', () => {
    const sizes = (n: number) => groupSizes(dotLayout('dice', n, createRng(1)));
    expect(sizes(5)).toEqual([3, 2]);
    expect(sizes(4)).toEqual([2, 2]);
    expect(sizes(6)).toEqual([3, 3]);
    expect(sizes(3)).toEqual([1, 2]);
    expect(sizes(2)).toEqual([1, 1]);
    expect(sizes(1)).toEqual([1]);
  });

  it('групи розбивають усі крапки: кожна рівно в одній групі', () => {
    for (let n = 1; n <= 6; n++) {
      const l = dotLayout('dice', n, createRng(1));
      expect(l.groups.flat().sort()).toEqual(l.dots.map((_, i) => i));
    }
  });

  it('обведення груп не перекриваються', () => {
    for (let n = 2; n <= 6; n++) {
      const l = dotLayout('dice', n, createRng(1));
      const [a, b] = groupBoxes(l.dots, l.groups, 0.07, 0.04);
      expect(a && b && overlaps(a, b), `${n}`).toBe(false);
    }
  });

  it('понад 6 — випадкова розкладка', () => {
    const l = dotLayout('dice', 8, createRng(2));
    expect(l.dots).toHaveLength(8);
    expect(l.frame).toBe(false);
  });
});

describe('tenFrame', () => {
  it('перший ряд — п’ять зліва направо, решта — другий; рамка вмикається', () => {
    const l = dotLayout('tenFrame', 8, createRng(1));
    expect(l.frame).toBe(true);
    expect(l.dots).toHaveLength(8);
    expect(l.dots.slice(0, 5).every((d) => d.y === 0.4)).toBe(true);
    expect(l.dots.slice(5).every((d) => d.y === 0.6)).toBe(true);
    expect(groupSizes(l)).toEqual([5, 3]);
  });

  it('до п’яти — одна група; 10 — п’ять і п’ять', () => {
    expect(groupSizes(dotLayout('tenFrame', 4, createRng(1)))).toEqual([4]);
    expect(groupSizes(dotLayout('tenFrame', 10, createRng(1)))).toEqual([5, 5]);
  });
});

describe.each(['random', 'dice'] as DotPattern[])('random (через %s для чисел > 6)', (pattern) => {
  it('1–10 крапок, з рівними проміжками й усередині картки', () => {
    for (let n = pattern === 'dice' ? 7 : 1; n <= 10; n++) {
      for (let seed = 1; seed <= 12; seed++) {
        const l = dotLayout(pattern, n, createRng(seed * 13 + n));
        expect(l.dots, `${n}/${seed}`).toHaveLength(n);
        for (const d of l.dots) {
          expect(d.x).toBeGreaterThanOrEqual(0.1);
          expect(d.x).toBeLessThanOrEqual(0.9);
          expect(d.y).toBeGreaterThanOrEqual(0.1);
          expect(d.y).toBeLessThanOrEqual(0.9);
        }
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const a = l.dots[i]!;
            const b = l.dots[j]!;
            expect(Math.hypot(a.x - b.x, a.y - b.y), `${n}/${seed}: ${i}×${j}`).toBeGreaterThan(0.1);
          }
        }
      }
    }
  });

  it('дві групи — ліва й права половини (різниця ≤ 1), обведення не перекриваються', () => {
    for (let n = 2; n <= 10; n++) {
      const l = dotLayout('random', n, createRng(n * 7));
      const [a, b] = groupSizes(l);
      expect((a ?? 0) + (b ?? 0)).toBe(n);
      expect(Math.abs((a ?? 0) - (b ?? 0))).toBeLessThanOrEqual(1);
      const [boxA, boxB] = groupBoxes(l.dots, l.groups, 0.06, 0);
      expect(boxA && boxB && overlaps(boxA, boxB), `${n}`).toBe(false);
    }
  });

  it('детерміновано за зерном; одна крапка — одна група', () => {
    expect(dotLayout('random', 6, createRng(9))).toEqual(dotLayout('random', 6, createRng(9)));
    expect(groupSizes(dotLayout('random', 1, createRng(3)))).toEqual([1]);
  });
});

describe('groupBoxes', () => {
  it('охоплює крапки з запасом', () => {
    const dots = [{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }];
    const [box] = groupBoxes(dots, [[0, 1]], 0.07, 0.03);
    expect(box?.x).toBeCloseTo(0.2);
    expect(box?.y).toBeCloseTo(0.2);
    expect(box?.w).toBeCloseTo(0.6);
    expect(box?.h).toBeCloseTo(0.2);
  });
});
