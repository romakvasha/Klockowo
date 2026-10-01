import { describe, expect, it } from 'vitest';
import { createRng, hashSeed } from './rng';

describe('createRng', () => {
  it('те саме зерно — та сама послідовність', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 8 }, () => a.next())).toEqual(Array.from({ length: 8 }, () => b.next()));
  });

  it('інше зерно — інша послідовність', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('next ∈ [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 2000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int: усі значення діапазону трапляються, за межі не виходить', () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = rng.int(2, 6);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([2, 3, 4, 5, 6]);
    expect(createRng(1).int(4, 4)).toBe(4);
  });

  it('int відхиляє нецілі й перевернуті межі', () => {
    expect(() => createRng(1).int(3, 2)).toThrow(RangeError);
    expect(() => createRng(1).int(1.5, 3)).toThrow(RangeError);
  });

  it('pick бере елемент зі списку; порожній список — помилка', () => {
    const rng = createRng(5);
    for (let i = 0; i < 50; i++) expect(['a', 'b', 'c']).toContain(rng.pick(['a', 'b', 'c']));
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it('shuffle — перестановка тих самих елементів, оригінал не змінюється, детермінована', () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = createRng(9).shuffle(list);
    expect([...out].sort((a, b) => a - b)).toEqual(list);
    expect(list).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(createRng(9).shuffle(list)).toEqual(out);
    expect(out).not.toEqual(list);
  });

  it('fork: незалежні потоки за сіллю; не залежить від того, скільки взяли з батька', () => {
    const a = createRng(11);
    const b = createRng(11);
    a.next();
    a.next();
    expect(a.fork('task-1').next()).toBe(b.fork('task-1').next());
    expect(b.fork('task-1').next()).not.toBe(b.fork('task-2').next());
  });
});

describe('hashSeed', () => {
  it('стабільний і чутливий до кожної частини', () => {
    expect(hashSeed('w1-1', 5)).toBe(hashSeed('w1-1', 5));
    expect(hashSeed('w1-1', 5)).not.toBe(hashSeed('w1-1', 6));
    expect(hashSeed('w1-1', 5)).not.toBe(hashSeed('w1-2', 5));
    expect(hashSeed('a', 'bc')).not.toBe(hashSeed('ab', 'c'));
  });

  it('повертає беззнакове 32-бітне', () => {
    for (const s of ['x', 'level', 'w4-s3']) {
      const h = hashSeed(s, 1);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });
});
