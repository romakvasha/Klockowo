import { describe, expect, it } from 'vitest';
import { ARC_ROOM, FROG_H, PAD, PITCH, ROW_H, arcBetween, colOptions, frogAnchor, labelledPads, padLayout } from './padLayout';

describe('padLayout', () => {
  it('0–10 у 11 колонках — один ряд; у 6 — два ряди (6 + 5)', () => {
    const one = padLayout(10, 11);
    expect(one.rows).toBe(1);
    expect(one.pads).toHaveLength(11);
    expect(one.width).toBe(10 * PITCH + PAD);
    expect(one.height).toBe(ROW_H);
    const two = padLayout(10, 6);
    expect(two.rows).toBe(2);
    expect(two.pads[5]).toMatchObject({ row: 0, col: 5 });
    expect(two.pads[6]).toMatchObject({ row: 1, col: 0 });
  });

  it('0–20: 11 колонок — два ряди (11 + 10), 7 колонок — три', () => {
    expect(padLayout(20, 11).rows).toBe(2);
    expect(padLayout(20, 7).rows).toBe(3);
    expect(padLayout(20, 11).pads[11]).toMatchObject({ row: 1, col: 0 });
  });

  it('листки не перекриваються й лежать у межах поля', () => {
    for (const max of [10, 20]) {
      for (const cols of colOptions(max)) {
        const l = padLayout(max, cols);
        l.pads.forEach((p, i) => {
          expect(p.x - PAD / 2, `${max}/${cols} #${i}`).toBeGreaterThanOrEqual(0);
          expect(p.x + PAD / 2).toBeLessThanOrEqual(l.width);
          expect(p.y - PAD / 2).toBeGreaterThanOrEqual(ARC_ROOM);
          expect(p.y + PAD / 2).toBeLessThanOrEqual(l.height);
          for (let j = i + 1; j < l.pads.length; j++) {
            const q = l.pads[j]!;
            expect(Math.hypot(p.x - q.x, p.y - q.y), `${i}/${j}`).toBeGreaterThanOrEqual(PAD);
          }
        });
      }
    }
  });

  it('неправильні аргументи — помилка', () => {
    expect(() => padLayout(0, 5)).toThrow(RangeError);
    expect(() => padLayout(10.5, 5)).toThrow(RangeError);
  });
});

describe('arcBetween', () => {
  it('у межах ряду: дуга над листками, бейдж посередині й над листками', () => {
    const l = padLayout(10, 11);
    const arc = arcBetween(l, 2, 3);
    const a = l.pads[2]!;
    const b = l.pads[3]!;
    expect(arc.mid.x).toBeCloseTo((a.x + b.x) / 2);
    expect(arc.mid.y).toBeLessThan(a.y - PAD / 2);
    expect(arc.mid.y).toBeGreaterThan(0);
    expect(arc.d.startsWith(`M${a.x} `)).toBe(true);
  });

  it('довший стрибок — вище, але не вище за відведене місце', () => {
    const l = padLayout(10, 11);
    expect(arcBetween(l, 0, 3).mid.y).toBeLessThan(arcBetween(l, 0, 1).mid.y);
    for (let to = 1; to <= 10; to++) expect(arcBetween(l, 0, to).mid.y).toBeGreaterThanOrEqual(0);
  });

  it('між рядами: похила лінія між листками (від низу одного до верху другого)', () => {
    const l = padLayout(20, 11);
    const arc = arcBetween(l, 10, 11);
    const a = l.pads[10]!;
    const b = l.pads[11]!;
    expect(arc.mid.y).toBeGreaterThan(a.y);
    expect(arc.mid.y).toBeLessThan(b.y);
    expect(arc.d).toBe(`M${a.x} ${a.y + PAD / 2} L${b.x} ${b.y - PAD / 2}`);
  });

  it('листка поза прямою — помилка', () => {
    expect(() => arcBetween(padLayout(10, 11), 10, 11)).toThrow(RangeError);
  });
});

describe('frogAnchor і labelledPads', () => {
  it('жабка стоїть над центром листка й вміщується над ним', () => {
    const l = padLayout(10, 11);
    const a = frogAnchor(l, 4);
    expect(a.x).toBe(l.pads[4]!.x);
    expect(a.y - FROG_H).toBeGreaterThanOrEqual(0);
    expect(() => frogAnchor(l, 11)).toThrow(RangeError);
  });

  it('numbered — усі листки; landmarks — 0, 5, 10 і стартовий; reveal додає ще', () => {
    expect(labelledPads(10, 'numbered', 3).size).toBe(11);
    expect([...labelledPads(10, 'landmarks', 3)].sort((a, b) => a - b)).toEqual([0, 3, 5, 10]);
    expect([...labelledPads(20, 'landmarks', 5)].sort((a, b) => a - b)).toEqual([0, 5, 10, 15, 20]);
    expect([...labelledPads(10, 'landmarks', 3, [7])].sort((a, b) => a - b)).toEqual([0, 3, 5, 7, 10]);
  });
});
