import { describe, expect, it } from 'vitest';
import { afterBreakPath } from './breakPlan';

describe('afterBreakPath', () => {
  it('повертає адресу зі стану; сміття, чужі адреси й петля на /break → мапа', () => {
    expect(afterBreakPath({ next: { to: '/world/w2' } })).toBe('/world/w2');
    expect(afterBreakPath({ next: { to: '/world-done/w1' } })).toBe('/world-done/w1');
    expect(afterBreakPath(null)).toBe('/map');
    expect(afterBreakPath({})).toBe('/map');
    expect(afterBreakPath({ next: { to: 5 } })).toBe('/map');
    expect(afterBreakPath({ next: { to: 'https://evil.example' } })).toBe('/map');
    expect(afterBreakPath({ next: { to: '//evil.example' } })).toBe('/map');
    expect(afterBreakPath({ next: { to: '/break' } })).toBe('/map');
  });
});
