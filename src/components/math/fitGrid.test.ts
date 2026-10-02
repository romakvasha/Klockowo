import { describe, expect, it } from 'vitest';
import { fitGrid, gridCell } from './fitGrid';

describe('fitGrid', () => {
  it('порожня сітка або нульова область — розмір 0', () => {
    expect(fitGrid(0, 100, 100).size).toBe(0);
    expect(fitGrid(5, 0, 100).size).toBe(0);
  });

  it('усе вміщується в прямокутник для будь-якого числа предметів 1–20 і різних областей', () => {
    for (const [w, h] of [[200, 120], [120, 200], [300, 300], [90, 60], [400, 80]] as const) {
      for (let n = 1; n <= 20; n++) {
        const fit = fitGrid(n, w, h, 4);
        expect(fit.cols * fit.rows, `${n} в ${w}×${h}`).toBeGreaterThanOrEqual(n);
        expect(fit.cols * fit.size + (fit.cols - 1) * fit.gap, `ширина ${n}`).toBeLessThanOrEqual(w);
        expect(fit.rows * fit.size + (fit.rows - 1) * fit.gap, `висота ${n}`).toBeLessThanOrEqual(h);
      }
    }
  });

  it('менше предметів — клітинки не менші; maxSize обмежує зверху', () => {
    expect(fitGrid(2, 200, 120).size).toBeGreaterThanOrEqual(fitGrid(12, 200, 120).size);
    expect(fitGrid(1, 400, 400, 4, 60).size).toBe(60);
  });

  it('gridCell: клітинки не перекриваються й лишаються всередині прямокутника', () => {
    const [w, h] = [220, 140];
    for (let n = 1; n <= 20; n++) {
      const fit = fitGrid(n, w, h, 4);
      const cells = Array.from({ length: n }, (_, i) => gridCell(fit, i, n, w, h));
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeGreaterThanOrEqual(0);
        expect(c.x + fit.size).toBeLessThanOrEqual(w);
        expect(c.y + fit.size).toBeLessThanOrEqual(h);
      }
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = cells[i]!;
          const b = cells[j]!;
          expect(a.x < b.x + fit.size && b.x < a.x + fit.size && a.y < b.y + fit.size && b.y < a.y + fit.size, `${n}: ${i} і ${j}`).toBe(false);
        }
      }
    }
  });
});
