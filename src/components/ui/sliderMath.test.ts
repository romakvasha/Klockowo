import { describe, expect, it } from 'vitest';
import { sliderFraction, sliderTickCount } from './sliderMath';

describe('sliderFraction', () => {
  it('відсотки: 80 із 0–100 → 0,8', () => {
    expect(sliderFraction(80, 0, 100)).toBe(0.8);
    expect(sliderFraction(0, 0, 100)).toBe(0);
    expect(sliderFraction(100, 0, 100)).toBe(1);
  });

  it('темп мови 0,7…1,2: 0,9 → 0,4 (у борді дизайну «40 %»)', () => {
    expect(sliderFraction(0.9, 0.7, 1.2)).toBeCloseTo(0.4, 10);
  });

  it('значення поза діапазоном обрізається; вироджений діапазон → 0', () => {
    expect(sliderFraction(150, 0, 100)).toBe(1);
    expect(sliderFraction(-5, 0, 100)).toBe(0);
    expect(sliderFraction(5, 10, 10)).toBe(0);
    expect(sliderFraction(5, 10, 0)).toBe(0);
  });
});

describe('sliderTickCount', () => {
  it('темп 0,7…1,2 крок 0,1 → 6 поділок; відсотки крок 10 → 11', () => {
    expect(sliderTickCount(0.7, 1.2, 0.1)).toBe(6);
    expect(sliderTickCount(0, 100, 10)).toBe(11);
  });

  it('некоректний діапазон чи крок → 0', () => {
    expect(sliderTickCount(1, 1, 0.1)).toBe(0);
    expect(sliderTickCount(0, 10, 0)).toBe(0);
  });
});
