import { describe, expect, it } from 'vitest';
import { digitArt, loadedDigits } from './digitArt';
import { ICON_NAMES, iconArt, loadedIconNames } from './icons';
import { parseSvg } from './svgArt';

const HARD_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/;

describe('parseSvg', () => {
  it('віддає viewBox і внутрішню розмітку без кореневих атрибутів', () => {
    const art = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor"><path d="M0 0"></path></svg>');
    expect(art).toEqual({ viewBox: '0 0 48 48', inner: '<path d="M0 0"></path>' });
  });

  it('відкидає не-SVG і SVG без viewBox', () => {
    expect(() => parseSvg('<div></div>')).toThrow('Unsupported SVG source');
    expect(() => parseSvg('<svg><path/></svg>')).toThrow('Unsupported SVG source');
  });
});

describe('іконки дизайну (src/assets/icons)', () => {
  it('список імен збігається з файлами: нічого зайвого, нічого не загубилось', () => {
    expect(ICON_NAMES).toHaveLength(25);
    expect([...loadedIconNames()].sort()).toEqual([...ICON_NAMES].sort());
  });

  it('усі іконки 48×48 і без жорстких кольорів — лише currentColor', () => {
    for (const name of ICON_NAMES) {
      const art = iconArt(name);
      expect(art.viewBox, name).toBe('0 0 48 48');
      expect(art.inner.length, name).toBeGreaterThan(20);
      expect(art.inner, name).not.toMatch(HARD_COLOR);
    }
  });
});

describe('SVG-цифри 0–9 (src/assets/digits)', () => {
  it('є всі десять цифр, viewBox 100×140, без жорстких кольорів', () => {
    expect(loadedDigits()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let d = 0; d <= 9; d++) {
      const art = digitArt(d);
      expect(art.viewBox, String(d)).toBe('0 0 100 140');
      expect(art.inner, String(d)).toContain('<path');
      expect(art.inner, String(d)).not.toMatch(HARD_COLOR);
    }
  });

  it('невідома цифра — помилка програміста', () => {
    expect(() => digitArt(10)).toThrow('Digit not found');
  });
});
