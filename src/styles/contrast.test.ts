import { describe, expect, it } from 'vitest';
import tokensCss from './tokens.css?raw';

/** Контраст WCAG 2.1 між кольорами токенів (BRIEF §13): основний текст ≥ 4,5 : 1, великий текст (≥ 24 px чи ≥ 19 px жирний) і графіка ≥ 3 : 1. Сигнал ніколи не лише кольором — це лише перевірка читабельності. */
const token = (name: string): string => {
  const m = new RegExp(`--kl-${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(tokensCss);
  if (!m) throw new Error(`token --kl-${name} not found`);
  return m[1]!;
};

function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('контраст токенів', () => {
  it('формула: чорне на білому — 21 : 1; однакові кольори — 1 : 1', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrast('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  it('основний текст (ink і ink-soft) читається на фоні, білому й тлах світів — ≥ 4,5 : 1', () => {
    for (const bg of ['bg', 'surface', 'surface-2', 'hub-50', ...[1, 2, 3, 4, 5, 6, 7].flatMap((n) => [`w${n}-50`, `w${n}-100`])]) {
      expect(contrast(token('ink'), token(bg)), `ink на ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const bg of ['bg', 'surface']) expect(contrast(token('ink-soft'), token(bg)), `ink-soft на ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it('цифри розрядів на білому й світлому — ≥ 4,5 : 1 (десятки #1A4FA0, одиниці #A34700)', () => {
    for (const bg of ['surface', 'bg']) {
      expect(contrast(token('tens-digit'), token(bg))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token('ones-digit'), token(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('ink на заливках світів (500) і хабу — великий текст/цифри ≥ 3 : 1 (на «?» листочка, у розфарбованих клітинках, на плитках кольору світу)', () => {
    for (const bg of [1, 2, 3, 4, 5, 6, 7].map((n) => `w${n}-500`).concat(['hub-500', 'reward', 'primary', 'secondary', 'success', 'retry'])) {
      expect(contrast(token('ink'), token(bg)), `ink на ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('контури й рамки (ink) на тлах — графіка ≥ 3 : 1; краї світів (700) відрізняються від заливок (500) ≥ 1,5 : 1', () => {
    for (const bg of ['bg', 'surface']) expect(contrast(token('ink'), token(bg))).toBeGreaterThanOrEqual(3);
    for (const n of [1, 2, 3, 4, 5, 6, 7]) expect(contrast(token(`w${n}-700`), token(`w${n}-500`)), `w${n}`).toBeGreaterThanOrEqual(1.5);
  });

  it('сигнали стану: рамка «спробуй ще» (retry-edge) і виділення (secondary-edge) помітні на білому — ≥ 3 : 1', () => {
    expect(contrast(token('retry-edge'), token('surface'))).toBeGreaterThanOrEqual(3);
    expect(contrast(token('secondary-edge'), token('surface'))).toBeGreaterThanOrEqual(3);
  });
});

/** Глянцеві цеглинки v2 (D2b, styles/brick.css). Полотно D1 ставить білі значки й цифри на кольорові цеглинки; бриф §8 вимагає
 *  цифри й текст від 4,5 : 1 — тому білий значок обведено контуром out (темніший край), а на світлих цеглинках значок темний. */
describe('контраст цеглинок v2', () => {
  const WHITE_GLYPH = ['red', 'blue', 'green', 'orange', 'purple', 'grey'];
  const SHADES = ['', '-hi', '-lo'];

  it('білий значок і цифри межують із контуром out — ≥ 4,5 : 1 на всіх кольорових цеглинках', () => {
    for (const c of WHITE_GLYPH) expect(contrast('#FFFFFF', token(`brick-${c}-out`)), c).toBeGreaterThanOrEqual(4.5);
  });

  it('темний значок на жовтій, білій і блідій цеглинках — ≥ 4,5 : 1 по всій висоті градієнта', () => {
    for (const shade of SHADES) {
      expect(contrast(token('brick-yellow-glyph'), token(`brick-yellow${shade}`)), `yellow${shade}`).toBeGreaterThanOrEqual(4.5);
      for (const c of ['white', 'pale']) expect(contrast(token('ink'), token(`brick-${c}${shade}`)), `${c}${shade}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('цифри розрядів на білій цеглинці (W4–W7) — ≥ 4,5 : 1', () => {
    for (const shade of SHADES) {
      expect(contrast(token('tens-digit'), token(`brick-white${shade}`))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token('ones-digit'), token(`brick-white${shade}`))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('сигнали стану — ≥ 3 : 1: обідок вибраної плитки, білі знаки на значках ok / chosen / retry, контури кісточок і неактивної «Gotowe»', () => {
    for (const bg of ['bg', 'surface']) expect(contrast(token('brick-blue-edge'), token(bg)), bg).toBeGreaterThanOrEqual(3);
    for (const fill of ['brick-green-edge', 'brick-blue-edge', 'retry-edge']) expect(contrast('#FFFFFF', token(fill)), fill).toBeGreaterThanOrEqual(3);
    expect(contrast(token('brick-yellow-out'), token('surface'))).toBeGreaterThanOrEqual(3);
    expect(contrast(token('brick-grey-edge'), token('surface'))).toBeGreaterThanOrEqual(3);
    expect(contrast(token('brick-grey-edge'), token('brick-pale'))).toBeGreaterThanOrEqual(3);
  });
});
