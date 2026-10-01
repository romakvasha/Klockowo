import { describe, expect, it } from 'vitest';
import { CONFETTI_COLORS, CONFETTI_MAX, CONFETTI_MAX_MS, confettiPieces } from './confettiPieces';

describe('confettiPieces', () => {
  it('не більше 40 шматочків (BRIEF §11); від’ємне й дробове кількість — безпечно', () => {
    expect(confettiPieces(40)).toHaveLength(40);
    expect(confettiPieces(500)).toHaveLength(CONFETTI_MAX);
    expect(confettiPieces(0)).toEqual([]);
    expect(confettiPieces(-3)).toEqual([]);
    expect(confettiPieces(7.9)).toHaveLength(7);
  });

  it('детерміновано за зерном; інше зерно — інший малюнок', () => {
    expect(confettiPieces(40, 5)).toEqual(confettiPieces(40, 5));
    expect(confettiPieces(40, 5)).not.toEqual(confettiPieces(40, 6));
  });

  it('усе падіння вкладається в 1,5 с: затримка + тривалість ≤ 1500 мс', () => {
    for (const p of confettiPieces(40, 3)) {
      expect(p.delay).toBeGreaterThanOrEqual(0);
      expect(p.delay + p.duration).toBeLessThanOrEqual(CONFETTI_MAX_MS);
    }
  });

  it('шматочки — маленькі кубики, у межах екрана, з кольорів блоків', () => {
    const pieces = confettiPieces(40, 9);
    for (const p of pieces) {
      expect(p.size).toBeGreaterThanOrEqual(10);
      expect(p.size).toBeLessThanOrEqual(18);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(Math.abs(p.drift)).toBeLessThanOrEqual(12);
      expect(Math.abs(p.spin)).toBeGreaterThanOrEqual(360);
      expect(CONFETTI_COLORS as readonly string[]).toContain(p.color);
    }
    expect(new Set(pieces.map((p) => p.color)).size).toBeGreaterThanOrEqual(5);
  });

  it('розподіл по ширині рівномірний: у кожній п’ятій частині екрана хоч один шматочок', () => {
    const pieces = confettiPieces(40, 11);
    for (let i = 0; i < 5; i++) {
      expect(pieces.some((p) => p.x >= i * 20 && p.x < (i + 1) * 20 + (i === 4 ? 1 : 0))).toBe(true);
    }
  });
});
