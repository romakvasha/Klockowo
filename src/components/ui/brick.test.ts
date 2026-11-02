import { describe, expect, it } from 'vitest';
import brickCss from '../../styles/brick.css?raw';
import tokensCss from '../../styles/tokens.css?raw';
import { ACTION_COLOR, BRICK_COLORS, actionColor } from './brick';
import { ICON_NAMES } from './icons';

describe('глянцеві цеглинки v2 (styles/brick.css)', () => {
  it('кожен колір має токени заливки, бліку, низу, пупирця й краю та пресет data-brick (синій — за замовчуванням)', () => {
    for (const c of BRICK_COLORS) {
      for (const part of ['', '-hi', '-lo', '-stud', '-edge']) {
        expect(tokensCss, `--kl-brick-${c}${part}`).toMatch(new RegExp(`--kl-brick-${c}${part}:\\s*#[0-9A-F]{6};`));
      }
      if (c !== 'blue') expect(brickCss, c).toContain(`.kl-brick[data-brick='${c}']`);
    }
    expect(brickCss).toContain('--c: var(--kl-brick-blue);');
  });

  it('колір дії — лише з палітри й лише для наявних іконок; дія без кольору — синя', () => {
    for (const [icon, color] of Object.entries(ACTION_COLOR)) {
      expect(ICON_NAMES as readonly string[], icon).toContain(icon);
      expect(BRICK_COLORS as readonly string[], icon).toContain(color);
    }
    expect(actionColor('home')).toBe('orange');
    expect(actionColor('speaker')).toBe('blue');
    expect(actionColor('badge')).toBe('yellow');
    expect(actionColor('w1')).toBe('blue');
  });
});
