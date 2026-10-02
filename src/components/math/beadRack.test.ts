import { describe, expect, it } from 'vitest';
import { RACK_BEADS, RACK_COLS, beadX, movedPerRow, rackBeads } from './beadRack';

describe('рахівниця на 20', () => {
  it('20 кульок у двох дротах по 10; п\'ять одного відтінку й п\'ять іншого', () => {
    const beads = rackBeads(0);
    expect(beads).toHaveLength(RACK_BEADS);
    expect(beads.filter((b) => b.row === 0)).toHaveLength(RACK_COLS);
    expect(beads.filter((b) => b.row === 1)).toHaveLength(RACK_COLS);
    for (let row = 0; row < 2; row++) {
      const tones = beads.filter((b) => b.row === row).map((b) => b.tone);
      expect(tones.slice(0, 5).every((t) => t === 'a')).toBe(true);
      expect(tones.slice(5).every((t) => t === 'b')).toBe(true);
    }
  });

  it('відсунуто перші n кульок; n зрізається до 0…20', () => {
    expect(rackBeads(13).filter((b) => b.moved)).toHaveLength(13);
    expect(rackBeads(13)[12]!.moved).toBe(true);
    expect(rackBeads(13)[13]!.moved).toBe(false);
    expect(rackBeads(-4).some((b) => b.moved)).toBe(false);
    expect(rackBeads(99).every((b) => b.moved)).toBe(true);
    expect(rackBeads(7.9).filter((b) => b.moved)).toHaveLength(7);
  });

  it('movedPerRow: 13 → [10, 3]; 4 → [4, 0]', () => {
    expect(movedPerRow(13)).toEqual([10, 3]);
    expect(movedPerRow(4)).toEqual([4, 0]);
    expect(movedPerRow(20)).toEqual([10, 10]);
  });

  it('beadX: відсунуті тісно ліворуч, решта — тісно праворуч; кульки не перекриваються й лишаються на дроті', () => {
    const size = 36;
    const width = RACK_COLS * size + 54;
    for (let m = 0; m <= 10; m++) {
      const row = rackBeads(m).filter((b) => b.row === 0);
      const xs = row.map((b) => beadX(b, width, size));
      for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!, `m=${m} #${i}`).toBeGreaterThanOrEqual(size - 1e-9);
      expect(xs[0]!).toBeGreaterThanOrEqual(size / 2);
      expect(xs[xs.length - 1]!).toBeLessThanOrEqual(width - size / 2 + 1e-9);
    }
  });
});
