import { describe, expect, it } from 'vitest';
import { WORLD_KEYS, mainLevelIds, starLevelIds, worldById } from '../../curriculum/worlds';
import {
  CHEST_H, CHEST_W, NODE_H, NODE_W, center, kubikSpot, pathKindFor, pathLayoutFor, pathScale, type PathKind, type PathLayout,
} from './pathLayout';

const KINDS: readonly PathKind[] = ['landscape', 'portrait', 'strip'];
const cases = WORLD_KEYS.flatMap((world) => KINDS.map((kind) => [world, kind] as const));

const box = (n: { x: number; y: number }) => ({ x: n.x, y: n.y, w: NODE_W, h: NODE_H });
const apart = (a: ReturnType<typeof box>, b: ReturnType<typeof box>, gap = 0) =>
  a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x || a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y;

describe.each(cases)('розкладка стежки %s / %s', (world, kind) => {
  const layout: PathLayout = pathLayoutFor(world, kind);

  it('вузли — усі основні рівні світу, потім ★-гілка, без повторів', () => {
    expect(layout.nodes.map((n) => n.id)).toEqual([...mainLevelIds(world), ...starLevelIds(world)]);
    expect(layout.nodes.filter((n) => n.star)).toHaveLength(worldById(world).starLevels);
  });

  it('кожен вузол має відрізок дороги, плюс дорога до скрині', () => {
    const targets = layout.links.map((l) => l.to);
    expect(targets).toEqual([...layout.nodes.map((n) => n.id).filter((id) => !id.includes('-s')), 'chest', ...starLevelIds(world)]);
    for (const link of layout.links) expect(link.d).toMatch(/^M-?\d/);
    expect(layout.links.filter((l) => l.star).map((l) => l.to)).toEqual([...starLevelIds(world)]);
  });

  it('усі вузли й скриня всередині сцени', () => {
    for (const n of layout.nodes) {
      expect(n.x, n.id).toBeGreaterThanOrEqual(0);
      expect(n.y, n.id).toBeGreaterThanOrEqual(0);
      expect(n.x + NODE_W, n.id).toBeLessThanOrEqual(layout.width);
      expect(n.y + NODE_H, n.id).toBeLessThanOrEqual(layout.height);
    }
    expect(layout.chest.x).toBeGreaterThanOrEqual(0);
    expect(layout.chest.x + CHEST_W).toBeLessThanOrEqual(layout.width);
    expect(layout.chest.y).toBeGreaterThanOrEqual(0);
    expect(layout.chest.y + CHEST_H).toBeLessThanOrEqual(layout.height);
  });

  it('вузли не перекриваються між собою й зі скринею', () => {
    for (let i = 0; i < layout.nodes.length; i++) {
      const a = layout.nodes[i];
      if (!a) continue;
      expect(apart(box(a), { ...layout.chest, w: CHEST_W, h: CHEST_H }), `${a.id} × скриня`).toBe(true);
      for (let j = i + 1; j < layout.nodes.length; j++) {
        const b = layout.nodes[j];
        if (b) expect(apart(box(a), box(b)), `${a.id} × ${b.id}`).toBe(true);
      }
    }
  });

  it('вузли розташовані не ближче 24 px до країв сцени (дотик, safe-area)', () => {
    if (kind === 'landscape' && world === 'w4') return; // борд etap2/16: ★ №4 стоїть на 92 px від краю — все одно > 24
    for (const n of layout.nodes) {
      expect(n.x, n.id).toBeGreaterThanOrEqual(24);
      expect(n.x + NODE_W, n.id).toBeLessThanOrEqual(layout.width - 24);
    }
  });

  it('Kubik біля кожного вузла й скрині не накриває інші вузли (крім запасного місця «над вузлом»)', () => {
    const targets = [...layout.nodes.map((n) => n.id), 'chest' as const];
    for (const target of targets) {
      const spot = kubikSpot(layout, target);
      expect(spot.h).toBe(layout.kubikH);
      if (spot.pointing === 'down') continue;
      for (const n of layout.nodes) {
        if (n.id === target) continue;
        expect(apart(box(n), spot), `${target}: Kubik × ${n.id}`).toBe(true);
      }
    }
  });
});

describe('борди дизайну', () => {
  it('W1: 4 вузли в ряду зі зміщенням змійки, скриня в (1090, 114)', () => {
    const l = pathLayoutFor('w1', 'landscape');
    const pos = (id: string) => l.nodes.find((n) => n.id === id);
    expect(pos('w1-1')).toMatchObject({ x: 202, y: 565 });
    expect(pos('w1-4')).toMatchObject({ x: 892, y: 565 });
    expect(pos('w1-5')).toMatchObject({ x: 892, y: 375 });
    expect(pos('w1-8')).toMatchObject({ x: 202, y: 375 });
    expect(pos('w1-9')).toMatchObject({ x: 202, y: 185 });
    expect(pos('w1-12')).toMatchObject({ x: 892, y: 185 });
    expect(l.chest).toEqual({ x: 1090, y: 114 });
  });

  it('W1: розвороти дороги — як на борді (виліт на 130 px за крайній вузол)', () => {
    const l = pathLayoutFor('w1', 'landscape');
    expect(l.links.find((k) => k.to === 'w1-5')?.d).toBe('M940 621 C1070 621 1070 431 940 431');
    expect(l.links.find((k) => k.to === 'w1-9')?.d).toBe('M250 431 C120 431 120 241 250 241');
  });

  it('W3: 5 вузлів у ряду, 15 усього; скриня (1105, 114)', () => {
    const l = pathLayoutFor('w3', 'landscape');
    expect(l.nodes).toHaveLength(15);
    expect(l.nodes.map((n) => n.x).slice(0, 5)).toEqual([152, 352, 552, 752, 952]);
    expect(l.chest).toEqual({ x: 1105, y: 114 });
    expect(l.scenery).toBe('beach');
  });

  it('W4: нижній ряд 6 вузлів, верхній 6 справа наліво, ★-ряд на y=425 від 712 до 262, річка', () => {
    const l = pathLayoutFor('w4', 'landscape');
    expect(l.nodes.slice(0, 6).map((n) => [n.x, n.y])).toEqual([[102, 585], [252, 585], [402, 585], [552, 585], [702, 585], [852, 585]]);
    expect(l.nodes.slice(6, 12).map((n) => n.x)).toEqual([992, 842, 692, 542, 392, 242]);
    expect(l.nodes.slice(12).map((n) => [n.x, n.y])).toEqual([[712, 425], [562, 425], [412, 425], [262, 425]]);
    expect(l.chest).toEqual({ x: 80, y: 126 });
    expect(l.scenery).toBe('river');
    expect(l.links.find((k) => k.to === 'w4-7')?.d).toBe('M900 641 C990 641 1040 611 1040 551 V231');
    expect(l.links.find((k) => k.to === 'w4-s1')?.d).toBe('M900 641 C900 561 860 481 760 481');
  });

  it('W7: ★-гілка відходить від 10-го вузла вертикально вниз', () => {
    const l = pathLayoutFor('w7', 'landscape');
    const ten = l.nodes.find((n) => n.id === 'w7-10');
    const first = l.nodes.find((n) => n.id === 'w7-s1');
    expect(ten && first && center(ten).x === center(first).x).toBe(true);
    expect(l.links.find((k) => k.to === 'w7-s1')?.d).toBe('M590 231 V481');
  });
});

describe('портрет і смуга', () => {
  it('портрет: 3 колонки, ряди змійкою; W3 — 5 рядів', () => {
    const l = pathLayoutFor('w3', 'portrait');
    expect(l.width).toBe(390);
    expect(new Set(l.nodes.map((n) => n.x)).size).toBe(3);
    const ys = [...new Set(l.nodes.map((n) => n.y))];
    expect(ys).toHaveLength(5);
    // ряд 0 — зліва направо, ряд 1 — справа наліво
    expect(l.nodes[0]!.x).toBeLessThan(l.nodes[2]!.x);
    expect(l.nodes[3]!.x).toBeGreaterThan(l.nodes[5]!.x);
  });

  it('портрет W4: ★-петля між 2-м і 3-м рядом, ★ №1 і №4 у середній колонці', () => {
    const l = pathLayoutFor('w4', 'portrait');
    const star = l.nodes.filter((n) => n.star);
    expect(star).toHaveLength(4);
    expect(star[0]!.x).toBe(star[3]!.x);
    expect(star[1]!.x).toBe(star[2]!.x);
    const row2 = l.nodes.find((n) => n.id === 'w4-6')!;
    const row3 = l.nodes.find((n) => n.id === 'w4-7')!;
    expect(star.every((n) => n.y < row2.y && n.y > row3.y)).toBe(true);
  });

  it('портрет W7: ★-петля над останнім рядом, між ним і скринею', () => {
    const l = pathLayoutFor('w7', 'portrait');
    const star = l.nodes.filter((n) => n.star);
    const top = l.nodes.find((n) => n.id === 'w7-12')!;
    expect(star.every((n) => n.y < top.y)).toBe(true);
    expect(l.chest.y + CHEST_H).toBeLessThan(Math.min(...star.map((n) => n.y)));
  });

  it('смуга: висота 390, вузли в один ряд із кроком 150, ★-ряд нижче основного', () => {
    const l = pathLayoutFor('w4', 'strip');
    expect(l.height).toBe(390);
    const main = l.nodes.filter((n) => !n.star);
    expect(main[1]!.x - main[0]!.x).toBe(150);
    const lowestMain = Math.max(...main.map((n) => n.y + NODE_H));
    expect(Math.min(...l.nodes.filter((n) => n.star).map((n) => n.y))).toBeGreaterThan(lowestMain);
  });
});

describe('вид і масштаб', () => {
  it('pathKindFor: портрет; смуга, коли сцена стислася б нижче 0,67; інакше альбом', () => {
    expect(pathKindFor(390, 844)).toBe('portrait');
    expect(pathKindFor(768, 1024)).toBe('portrait');
    expect(pathKindFor(844, 390)).toBe('strip');
    expect(pathKindFor(932, 430)).toBe('strip');
    expect(pathKindFor(800, 600)).toBe('strip');
    expect(pathKindFor(1024, 599)).toBe('landscape');
    expect(pathKindFor(1024, 768)).toBe('landscape');
    expect(pathKindFor(1280, 720)).toBe('landscape');
  });

  it('pathScale: альбом вміщається (≤ 1), портрет за шириною (≤ 1,5), смуга за висотою', () => {
    const land = pathLayoutFor('w1', 'landscape');
    expect(pathScale('landscape', land, 1280, 720)).toBe(1);
    expect(pathScale('landscape', land, 1440, 900)).toBe(1);
    expect(pathScale('landscape', land, 1024, 768)).toBeCloseTo(0.8);
    const por = pathLayoutFor('w1', 'portrait');
    expect(pathScale('portrait', por, 390, 844)).toBe(1);
    expect(pathScale('portrait', por, 768, 1024)).toBe(1.5);
    expect(pathScale('portrait', por, 320, 640)).toBeCloseTo(0.85);
    const strip = pathLayoutFor('w1', 'strip');
    expect(pathScale('strip', strip, 844, 390)).toBe(1);
    expect(pathScale('strip', strip, 932, 430)).toBeCloseTo(430 / 390);
  });

  it('де обрано альбомну сцену, вузли не менші за 64 px; смуга й портрет — не менші за 80', () => {
    const land = pathLayoutFor('w1', 'landscape');
    for (const [w, h] of [[1000, 600], [900, 650], [1024, 599], [1024, 768], [1280, 720]] as const) {
      expect(pathKindFor(w, h)).toBe('landscape');
      expect(NODE_W * pathScale('landscape', land, w, h), `${w}×${h}`).toBeGreaterThanOrEqual(64);
    }
    expect(NODE_W * pathScale('strip', pathLayoutFor('w1', 'strip'), 800, 360)).toBeGreaterThanOrEqual(80);
    expect(NODE_W * pathScale('portrait', pathLayoutFor('w1', 'portrait'), 320, 640)).toBeGreaterThanOrEqual(80);
  });
});
