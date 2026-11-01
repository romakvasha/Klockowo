import { describe, expect, it } from 'vitest';
import { frameKind, sceneReserved } from './frameMath';

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

describe('sceneReserved', () => {
  it('wide і portrait: Kubik має власну зону поза сценою — ділянок нема (D3)', () => {
    expect(sceneReserved('wide', { w: 940, h: 420 })).toEqual([]);
    expect(sceneReserved('portrait', { w: 342, h: 342 })).toEqual([]);
  });

  it('phone: угорі сцени смуга під ряд кісточок (28 px + відступи)', () => {
    expect(sceneReserved('phone', { w: 400, h: 342 })).toEqual([{ x: 0, y: 0, w: 400, h: 46 }]);
  });

  it('нульова область — без ділянок', () => {
    expect(sceneReserved('phone', { w: 0, h: 0 })).toEqual([]);
  });
});
