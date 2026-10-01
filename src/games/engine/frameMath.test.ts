import { describe, expect, it } from 'vitest';
import { frameKind, kubikHeight, sceneReserved } from './frameMath';

describe('frameKind', () => {
  it('BRIEF §12: 1280×720, 1440×900, 1024×768 — wide; 768×1024 і 390×844 — portrait; 844×390 — phone', () => {
    expect(frameKind(1280, 720)).toBe('wide');
    expect(frameKind(1440, 900)).toBe('wide');
    expect(frameKind(1024, 768)).toBe('wide');
    expect(frameKind(768, 1024)).toBe('portrait');
    expect(frameKind(390, 844)).toBe('portrait');
    expect(frameKind(844, 390)).toBe('phone');
    expect(frameKind(932, 430)).toBe('phone');
  });

  it('межа телефона в альбомі — висота 500 (як у responsive.css)', () => {
    expect(frameKind(900, 500)).toBe('phone');
    expect(frameKind(900, 501)).toBe('wide');
  });
});

describe('kubikHeight', () => {
  it('184 на ПК, 150 від 1100 px і вужче', () => {
    expect(kubikHeight(1280)).toBe(184);
    expect(kubikHeight(1100)).toBe(150);
    expect(kubikHeight(1024)).toBe(150);
  });
});

describe('sceneReserved', () => {
  it('wide: нижній лівий кут сцени під Kubika й бульбашку', () => {
    const [r] = sceneReserved('wide', 1280, { w: 1280, h: 432 });
    expect(r).toBeDefined();
    expect(r?.x).toBe(0);
    expect(r?.y).toBe(432 - 128);
    expect(r?.w).toBe(313);
    expect((r?.y ?? 0) + (r?.h ?? 0)).toBe(432);
  });

  it('борд etap2/00: бульбашка (сцена 320…416, x 140…290) лежить усередині ділянки', () => {
    const [r] = sceneReserved('wide', 1280, { w: 1280, h: 432 });
    expect(r && 140 >= r.x && 290 <= r.x + r.w && 320 >= r.y && 416 <= r.y + r.h).toBe(true);
  });

  it('wide на 1440 px: сцена 1280 стоїть по центру (відступ 80), ділянка Kubika вужча на цей відступ; далі за Kubikom — порожньо', () => {
    const [r] = sceneReserved('wide', 1440, { w: 1280, h: 540 }, 80);
    expect(r?.x).toBe(0);
    expect(r?.w).toBe(Math.round(184 * 1.7) - 80);
    expect(sceneReserved('wide', 1440, { w: 1280, h: 540 }, 400)).toEqual([]);
  });

  it('portrait: Kubik поза сценою — ділянок нема', () => {
    expect(sceneReserved('portrait', 390, { w: 342, h: 342 })).toEqual([]);
  });

  it('phone: угорі сцени смуга під ряд кісточок (28 px + відступи)', () => {
    expect(sceneReserved('phone', 844, { w: 525, h: 342 })).toEqual([{ x: 0, y: 0, w: 525, h: 46 }]);
  });

  it('нульова область — без ділянок', () => {
    expect(sceneReserved('wide', 1280, { w: 0, h: 0 })).toEqual([]);
  });
});
