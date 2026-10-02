import { describe, expect, it } from 'vitest';
import { afterBreakPath, breakSteps, repPose } from './breakPlan';

describe('breakSteps', () => {
  it('три вправи за BRIEF: «Podskocz dziesięć razy!», «Klaśnij pięć razy!», «Tupnij osiem razy!»', () => {
    const steps = breakSteps();
    expect(steps.map((s) => s.line)).toEqual(['Podskocz dziesięć razy!', 'Klaśnij pięć razy!', 'Tupnij osiem razy!']);
    expect(steps.map((s) => s.n)).toEqual([10, 5, 8]);
    expect(steps.map((s) => s.pose)).toEqual(['break-jump', 'break-clap', 'break-stomp']);
  });

  it('лічба повторів — числа словами від одного до n, без цифр', () => {
    for (const step of breakSteps()) {
      const said = Array.from({ length: step.n }, (_, i) => step.count(i + 1));
      expect(said[0]).toBe('jeden');
      expect(said).toHaveLength(step.n);
      for (const w of said) expect(w).not.toMatch(/\d/);
    }
    expect(breakSteps()[0]!.count(10)).toBe('dziesięć');
  });

  it('repPose: непарні повтори — поза вправи, парні — спокій', () => {
    const [jump] = breakSteps();
    expect([1, 2, 3, 4].map((k) => repPose(jump!, k))).toEqual(['break-jump', 'idle', 'break-jump', 'idle']);
  });
});

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
