import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../curriculum/worlds';
import { LOCKED_PALETTE, NODE_PATTERN, NODE_PATTERN_ID, STAR_PALETTE, mix, nodeMarkup, worldPalette, type NodeArtState } from './nodeArt';

const STATES: readonly NodeArtState[] = ['locked', 'next', 'done', 'star', 'review'];

describe('mix', () => {
  it('змішує канали з округленням', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mix('#7BCB5A', '#FFFFFF', 0)).toBe('#7BCB5A');
    expect(mix('#7BCB5A', '#FFFFFF', 1)).toBe('#FFFFFF');
  });
});

describe('палітра вузла', () => {
  it('W1 збігається з node-w1-*.svg дизайну (верх / ліво / право)', () => {
    expect(worldPalette('#7BCB5A')).toEqual({ top: '#8BD16E', left: '#70B458', right: '#659E56' });
  });

  it('кожен світ має три різні відтінки блока: верх світліший за боки, правий найтемніший', () => {
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    for (const world of WORLDS.filter((w) => w.id !== 'hub')) {
      const p = worldPalette(world.color);
      expect(lum(p.top), world.id).toBeGreaterThan(lum(p.left));
      expect(lum(p.left), world.id).toBeGreaterThan(lum(p.right));
    }
  });
});

describe('розмітка вузла', () => {
  const color = '#7BCB5A';

  it('усі стани — валідні фрагменти без NaN, з трьома гранями й піксельним візерунком', () => {
    for (const state of STATES) {
      const svg = nodeMarkup(state, color);
      expect(svg, state).not.toContain('NaN');
      expect(svg.match(/<path d="M-48 0 L0 24/g), state).toHaveLength(2); // ліва грань + візерунок
      expect(svg, state).toContain(`url(#${NODE_PATTERN_ID})`);
    }
    expect(NODE_PATTERN).toContain(`id="${NODE_PATTERN_ID}"`);
  });

  it('locked — сіра палітра й замок; next — біла грань; done — галочка й наліпка; review — лавандова стрілка; star — золото', () => {
    const locked = nodeMarkup('locked', color);
    expect(locked).toContain(LOCKED_PALETTE.top);
    expect(locked).toContain('translate(-20 -52)');
    expect(locked).not.toContain('data-glow');

    const next = nodeMarkup('next', color);
    expect(next).not.toContain('ellipse'); // сяйво — окремий елемент LevelNode
    expect(next).toContain('fill="#FFFFFF" stroke="#2D2A4A" stroke-width="2.5"');

    const done = nodeMarkup('done', color);
    expect(done).toContain('#25964F');
    expect(done).toContain('translate(-12 -12)');

    expect(nodeMarkup('review', color)).toContain('#7F6CE0');

    const star = nodeMarkup('star', color, { star: true });
    expect(star).toContain(STAR_PALETTE.top);
    expect(star).toContain('translate(-17 -40)');
  });

  it('закритий ★-вузол — сірий із зірочкою-чипом; закритий звичайний — без чипа', () => {
    expect(nodeMarkup('locked', color, { star: true })).toContain('scale(1.083)');
    expect(nodeMarkup('locked', color)).not.toContain('scale(1.083)');
  });

  it('пройдений ★-вузол — золотий, а не кольору світу', () => {
    const done = nodeMarkup('done', color, { star: true });
    expect(done).toContain(STAR_PALETTE.left);
    expect(done).not.toContain(worldPalette(color).left);
  });

  it('кольори світу потрапляють у розмітку', () => {
    const p = worldPalette('#3FA9F5');
    const svg = nodeMarkup('done', '#3FA9F5');
    expect(svg).toContain(p.top);
    expect(svg).toContain(p.left);
    expect(svg).toContain(p.right);
  });
});
