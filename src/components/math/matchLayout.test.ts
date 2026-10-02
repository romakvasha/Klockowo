import { describe, expect, it } from 'vitest';
import type { Rect } from '../../games/engine/layoutObjects';
import { MAX_SET, digitTileSize, setsLayout } from './matchLayout';

const KUBIK: Rect = { x: 0, y: 305, w: 313, h: 127 };
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('setsLayout', () => {
  const cases: [string, { w: number; h: number }, Rect[]][] = [
    ['ПК 1280×432', { w: 1280, h: 432 }, [KUBIK]],
    ['планшет у портреті 600×600', { w: 600, h: 600 }, []],
    ['телефон у портреті 342×342', { w: 342, h: 342 }, []],
    ['телефон в альбомі 600×290', { w: 600, h: 290 }, [{ x: 0, y: 0, w: 600, h: 46 }]],
    ['1024×768: сцена ≈ 1024×400', { w: 1024, h: 400 }, [{ x: 0, y: 297, w: 255, h: 103 }]],
  ];

  it('усі картки всередині області, не накладаються, не заходять на ділянки Kubika', () => {
    for (const [, area, reserved] of cases) {
      for (let k = 2; k <= 4; k++) {
        const l = setsLayout(area, reserved, k);
        expect(l.rects).toHaveLength(k);
        for (const r of l.rects) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(area.w);
          expect(r.y + r.h).toBeLessThanOrEqual(area.h);
          for (const z of reserved) expect(overlaps(r, z)).toBe(false);
        }
        l.rects.forEach((a, i) => l.rects.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)));
        expect(l.size).toBeLessThanOrEqual(MAX_SET);
      }
    }
  });

  it('ПК: чотири набори — один ряд карток максимального розміру', () => {
    const l = setsLayout({ w: 1280, h: 432 }, [KUBIK], 4);
    expect(l.rows).toBe(1);
    expect(l.size).toBe(MAX_SET);
  });

  it('телефон у портреті: чотири набори — сітка 2×2, картки більші, ніж у ряду з чотирьох', () => {
    const l = setsLayout({ w: 342, h: 342 }, [], 4);
    expect(l.cols).toBe(2);
    expect(l.rows).toBe(2);
    expect(l.size).toBeGreaterThan(Math.floor((342 - 32 - 3 * 20) / 4));
  });

  it('три набори на вузькій сцені — два ряди, останній ряд по центру', () => {
    const l = setsLayout({ w: 342, h: 342 }, [], 3);
    expect(l.rows).toBe(2);
    const last = l.rects[2]!;
    expect(Math.abs(last.x + last.w / 2 - 171)).toBeLessThanOrEqual(1);
  });

  it('порядок карток — рядок за рядком (зліва направо, зверху вниз)', () => {
    const l = setsLayout({ w: 342, h: 342 }, [], 4);
    expect(l.rects[0]!.y).toBe(l.rects[1]!.y);
    expect(l.rects[2]!.y).toBeGreaterThan(l.rects[0]!.y);
    expect(l.rects[0]!.x).toBeLessThan(l.rects[1]!.x);
  });
});

describe('digitTileSize', () => {
  it('стандартна плитка, коли всі вміщуються (ПК, планшет)', () => {
    expect(digitTileSize('wide', { w: 1280, h: 720 }, 4, 120)).toBe(120);
    expect(digitTileSize('portrait', { w: 768, h: 1024 }, 3, 128)).toBe(128);
  });

  it('планшет у портреті: чотири плитки лишають поля під бульбашку Kubika (≥ 120 px з кожного боку)', () => {
    const s = digitTileSize('portrait', { w: 768, h: 1024 }, 4, 128);
    expect(s).toBeLessThan(128);
    expect((768 - (4 * s + 3 * 16 + 32)) / 2).toBeGreaterThanOrEqual(120);
  });

  it('телефон у портреті: чотири плитки звужуються, щоб вміститись у ряд, але ≥ 64 px', () => {
    const s = digitTileSize('portrait', { w: 390, h: 844 }, 4, 88);
    expect(s).toBeLessThan(88);
    expect(s).toBeGreaterThanOrEqual(64);
    expect(4 * s + 3 * 16).toBeLessThanOrEqual(390 - 32);
    expect(digitTileSize('portrait', { w: 390, h: 844 }, 2, 88)).toBe(88);
  });

  it('телефон в альбомі: плитки в стовпці вміщуються за висотою', () => {
    const s = digitTileSize('phone', { w: 844, h: 390 }, 4, 88);
    expect(s).toBeGreaterThanOrEqual(64);
    expect(4 * s + 3 * 12).toBeLessThanOrEqual(390 - 48);
    expect(digitTileSize('phone', { w: 844, h: 390 }, 3, 88)).toBe(88);
  });

  it('ніколи менше 64 px, навіть у крихітному вікні', () => {
    expect(digitTileSize('portrait', { w: 320, h: 568 }, 4, 88)).toBe(64);
  });
});
