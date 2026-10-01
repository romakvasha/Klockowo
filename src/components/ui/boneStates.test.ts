import { describe, expect, it } from 'vitest';
import { BONES_PER_LEVEL, boneStates } from './boneStates';

describe('boneStates', () => {
  it('слотів на рівні завжди 6', () => {
    expect(BONES_PER_LEVEL).toBe(6);
  });

  it('початок рівня: усі порожні; кінець: усі заповнені', () => {
    expect(boneStates(6, 0)).toEqual(Array(6).fill('empty'));
    expect(boneStates(6, 6)).toEqual(Array(6).fill('filled'));
  });

  it('кісточка, що долітає, позначається в її слоті (design: 3-тя з 6)', () => {
    expect(boneStates(6, 3, 2)).toEqual(['filled', 'filled', 'arriving', 'empty', 'empty', 'empty']);
  });

  it('індекс «долітає» поза заповненими слотами ігнорується', () => {
    expect(boneStates(6, 2, 4)).toEqual(['filled', 'filled', 'empty', 'empty', 'empty', 'empty']);
    expect(boneStates(6, 2, null)).toEqual(['filled', 'filled', 'empty', 'empty', 'empty', 'empty']);
  });

  it('некоректні значення — RangeError', () => {
    expect(() => boneStates(6, 7)).toThrow(RangeError);
    expect(() => boneStates(6, -1)).toThrow(RangeError);
    expect(() => boneStates(6, 1.5)).toThrow(RangeError);
    expect(() => boneStates(0, 0)).toThrow(RangeError);
  });
});
