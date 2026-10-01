import { describe, expect, it } from 'vitest';
import { HOLD_MS, RING_LENGTH, RING_R, holdProgress, ringOffset } from './holdProgress';

describe('holdProgress', () => {
  it('3 секунди: лінійно від 0 до 1 і не далі', () => {
    expect(HOLD_MS).toBe(3000);
    expect(holdProgress(0)).toBe(0);
    expect(holdProgress(1500)).toBe(0.5);
    expect(holdProgress(1800)).toBeCloseTo(0.6, 10); // «утримання · 60 %» на борді
    expect(holdProgress(3000)).toBe(1);
    expect(holdProgress(9999)).toBe(1);
    expect(holdProgress(-50)).toBe(0);
  });

  it('власна тривалість; нульова чи нечислова — миттєво', () => {
    expect(holdProgress(500, 1000)).toBe(0.5);
    expect(holdProgress(1, 0)).toBe(1);
    expect(holdProgress(1, Number.NaN)).toBe(1);
  });
});

describe('ringOffset', () => {
  it('довжина кола r = 29 ≈ 182,2 (борд: dasharray 109 183 при 60 %)', () => {
    expect(RING_R).toBe(29);
    expect(RING_LENGTH).toBeCloseTo(182.21, 2);
    expect(RING_LENGTH * 0.6).toBeCloseTo(109.3, 1);
  });

  it('зсув: 0 → вся довжина (порожньо), 1 → 0 (повне коло); поза діапазоном обрізається', () => {
    expect(ringOffset(0)).toBeCloseTo(RING_LENGTH, 10);
    expect(ringOffset(1)).toBe(0);
    expect(ringOffset(0.5)).toBeCloseTo(RING_LENGTH / 2, 10);
    expect(ringOffset(2)).toBe(0);
    expect(ringOffset(-1)).toBeCloseTo(RING_LENGTH, 10);
  });
});
