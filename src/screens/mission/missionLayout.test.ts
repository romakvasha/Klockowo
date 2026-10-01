import { describe, expect, it } from 'vitest';
import { WORLD_KEYS } from '../../curriculum/worlds';
import {
  CARD_H, CARD_W, PANEL_H, PANEL_W, groundColors, missionDecor, missionLayout, missionOrientation, missionScale,
  type Box, type MissionOrientation, type MissionPhase,
} from './missionLayout';

const ORIENTATIONS: readonly MissionOrientation[] = ['landscape', 'portrait'];
const PHASES: readonly MissionPhase[] = ['card', 'idea'];
const cases = ORIENTATIONS.flatMap((o) => PHASES.map((p) => [o, p] as const));

const cardBox = (l: ReturnType<typeof missionLayout>): Box => ({ x: l.card.x, y: l.card.y, w: CARD_W * l.card.scale, h: CARD_H * l.card.scale });
const apart = (a: Box, b: Box) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
const inside = (b: Box, l: { width: number; height: number }) => b.x >= 0 && b.y >= 0 && b.x + b.w <= l.width && b.y + b.h <= l.height;

describe.each(cases)('композиція Wprowadzenie: %s / %s', (orientation, phase) => {
  const l = missionLayout(orientation, phase);

  it('усе всередині сцени', () => {
    expect(inside(cardBox(l), l)).toBe(true);
    expect(inside(l.guest, l)).toBe(true);
    expect(inside(l.kubik, l)).toBe(true);
    if (l.panel) expect(inside({ x: l.panel.x, y: l.panel.y, w: PANEL_W * l.panel.scale, h: PANEL_H * l.panel.scale }, l)).toBe(true);
  });

  it('картка, гість і Kubik не перекриваються', () => {
    expect(apart(cardBox(l), l.guest)).toBe(true);
    expect(apart(cardBox(l), l.kubik)).toBe(true);
    expect(apart(l.guest, l.kubik)).toBe(true);
    if (l.panel) {
      const panel = { x: l.panel.x, y: l.panel.y, w: PANEL_W * l.panel.scale, h: PANEL_H * l.panel.scale };
      expect(apart(cardBox(l), panel)).toBe(true);
      expect(apart(l.guest, panel)).toBe(true);
      expect(apart(l.kubik, panel)).toBe(true);
    }
  });

  it('панель є лише у фазі «idea»', () => {
    expect(l.panel === null).toBe(phase === 'card');
  });
});

describe('борди дизайну', () => {
  it('альбом, фаза card (etap2/17): картка (320,150) 640×360, гість (976,380) 144×180, Kubik (22,512) 147×184', () => {
    const l = missionLayout('landscape', 'card');
    expect(l.card).toEqual({ x: 320, y: 150, scale: 1 });
    expect(l.guest).toEqual({ x: 976, y: 380, w: 144, h: 180 });
    expect(l.kubik).toEqual({ x: 22, y: 512, w: 147, h: 184 });
    expect(l.ground).toBe(540);
  });

  it('альбом, фаза idea (etap2/18): compact-картка 380×214 в (120,24), панель (290,256), Kubik (24,500) 160×200', () => {
    const l = missionLayout('landscape', 'idea');
    expect(l.card.x).toBe(120);
    expect(l.card.y).toBe(24);
    expect(CARD_W * l.card.scale).toBe(380);
    expect(Math.round(CARD_H * l.card.scale)).toBe(214);
    expect(l.panel).toEqual({ x: 290, y: 256, scale: 1 });
    expect(l.guest).toEqual({ x: 1010, y: 424, w: 112, h: 140 });
    expect(l.kubik).toEqual({ x: 24, y: 500, w: 160, h: 200 });
  });
});

describe('орієнтація, масштаб, ґрунт, декор', () => {
  it('missionOrientation: портрет лише коли висота більша за ширину', () => {
    expect(missionOrientation(1280, 720)).toBe('landscape');
    expect(missionOrientation(844, 390)).toBe('landscape');
    expect(missionOrientation(390, 844)).toBe('portrait');
    expect(missionOrientation(768, 1024)).toBe('portrait');
  });

  it('missionScale: альбом ≤ 1, портрет ≤ 1,5, сцена вміщається у вікно', () => {
    expect(missionScale('landscape', 1280, 720)).toBe(1);
    expect(missionScale('landscape', 1440, 900)).toBe(1);
    expect(missionScale('landscape', 844, 390)).toBeCloseTo(390 / 720);
    expect(missionScale('portrait', 390, 844)).toBe(1);
    expect(missionScale('portrait', 768, 1024)).toBeCloseTo(1024 / 700);
    expect(missionScale('portrait', 1000, 2000)).toBe(1.5);
  });

  it('ґрунт: W1 — трава, W3 — пісок, решта — відтінок світу', () => {
    expect(groundColors('w1').fill).toBe('var(--kl-w1-100)');
    expect(groundColors('w3').fill).toBe('#f3d9a0');
    expect(groundColors('w5').fill).toBe('var(--kl-w5-100)');
  });

  it('декор: в альбомі кожен світ має його, у портреті — жодного', () => {
    for (const world of WORLD_KEYS) {
      expect(missionDecor(world, 'landscape').length, world).toBeGreaterThan(0);
      expect(missionDecor(world, 'portrait'), world).toEqual([]);
    }
  });

  it('декор не перекриває картку у фазі card і гостя', () => {
    const l = missionLayout('landscape', 'card');
    for (const world of WORLD_KEYS) {
      for (const d of missionDecor(world, 'landscape')) {
        expect(apart(d, cardBox(l)), `${world}/${d.kind}: картка`).toBe(true);
        expect(apart(d, l.guest), `${world}/${d.kind}: гість`).toBe(true);
        expect(apart(d, l.kubik), `${world}/${d.kind}: Kubik`).toBe(true);
      }
    }
  });
});
