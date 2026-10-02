import { describe, expect, it } from 'vitest';
import { createRng } from '../games/engine/rng';
import { PARENT_TTL_MS, createParentAccess, isGrantValid } from './access';
import { INITIAL_GATE, MAX_ATTEMPTS, gateReducer, makeChallenge, type GateKey, type GateState } from './gate';

const type = (state: GateState, text: string, challenge: ReturnType<typeof makeChallenge>): GateState =>
  [...text].reduce((s, d) => gateReducer(s, { type: 'digit', digit: Number(d) }, challenge), state);
const submit: GateKey = { type: 'submit' };

describe('makeChallenge', () => {
  it('множення двох цифр 3…9; відповідь = a × b; детерміновано; не повторює попереднє', () => {
    let prev: ReturnType<typeof makeChallenge> | undefined;
    for (let seed = 1; seed <= 200; seed++) {
      const c = makeChallenge(createRng(seed), prev);
      expect(c.a).toBeGreaterThanOrEqual(3);
      expect(c.a).toBeLessThanOrEqual(9);
      expect(c.b).toBeGreaterThanOrEqual(3);
      expect(c.b).toBeLessThanOrEqual(9);
      expect(c.answer).toBe(c.a * c.b);
      expect(makeChallenge(createRng(seed), prev)).toEqual(c);
      if (prev) expect(c.a === prev.a && c.b === prev.b).toBe(false);
      prev = c;
    }
  });

  it('приклад щоразу інший: за багатьох зерен трапляються різні пари', () => {
    const pairs = new Set(Array.from({ length: 60 }, (_, s) => { const c = makeChallenge(createRng(s + 1)); return `${c.a}×${c.b}`; }));
    expect(pairs.size).toBeGreaterThan(15);
  });
});

describe('gateReducer', () => {
  const c = { a: 7, b: 8, answer: 56 };

  it('правильна відповідь відкриває бар\'єр', () => {
    const s = gateReducer(type(INITIAL_GATE, '56', c), submit, c);
    expect(s.status).toBe('open');
  });

  it('хибна: ввід очищується, помилка +1; три помилки — locked, далі нічого не міняється', () => {
    let s: GateState = INITIAL_GATE;
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      s = gateReducer(type(s, '12', c), submit, c);
      expect(s.errors).toBe(i);
      expect(s.input).toBe('');
      expect(s.status).toBe(i < MAX_ATTEMPTS ? 'wrong' : 'locked');
    }
    expect(gateReducer(type(s, '56', c), submit, c)).toBe(s);
  });

  it('порожній ввід не перевіряється й не рахується помилкою', () => {
    expect(gateReducer(INITIAL_GATE, submit, c)).toBe(INITIAL_GATE);
  });

  it('ввід: до трьох цифр, «⌫» стирає, зайвий нуль на початку не накопичується, недопустимі цифри ігноруються', () => {
    let s = type(INITIAL_GATE, '5678', c);
    expect(s.input).toBe('567');
    s = gateReducer(s, { type: 'back' }, c);
    expect(s.input).toBe('56');
    expect(gateReducer(INITIAL_GATE, { type: 'digit', digit: 10 }, c)).toBe(INITIAL_GATE);
    expect(gateReducer(INITIAL_GATE, { type: 'digit', digit: -1 }, c)).toBe(INITIAL_GATE);
    expect(type(INITIAL_GATE, '05', c).input).toBe('5');
    expect(gateReducer(INITIAL_GATE, { type: 'back' }, c).input).toBe('');
  });

  it('після «wrong» новий ввід знову typing', () => {
    let s = gateReducer(type(INITIAL_GATE, '1', c), submit, c);
    expect(s.status).toBe('wrong');
    s = gateReducer(s, { type: 'digit', digit: 5 }, c);
    expect(s.status).toBe('typing');
  });
});

describe('parentAccess', () => {
  const memoryStore = () => {
    const data = new Map<string, string>();
    return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
  };

  it('isGrantValid: діє TTL хвилин; з майбутнього й сміття — ні', () => {
    expect(isGrantValid(1000, 1000 + PARENT_TTL_MS - 1)).toBe(true);
    expect(isGrantValid(1000, 1000 + PARENT_TTL_MS)).toBe(false);
    expect(isGrantValid(2000, 1000)).toBe(false);
    expect(isGrantValid(null, 1000)).toBe(false);
    expect(isGrantValid(Number.NaN, 1000)).toBe(false);
  });

  it('grant → isGranted → revoke; інший екземпляр на тому самому сховищі бачить дозвіл; після TTL — ні', () => {
    let now = 5_000_000;
    const store = memoryStore();
    const access = createParentAccess(store, () => now);
    expect(access.isGranted()).toBe(false);
    access.grant();
    expect(access.isGranted()).toBe(true);
    expect(createParentAccess(store, () => now).isGranted()).toBe(true);
    now += PARENT_TTL_MS + 1;
    expect(access.isGranted()).toBe(false);
    access.grant();
    access.revoke();
    expect(access.isGranted()).toBe(false);
    expect(store.data.size).toBe(0);
  });

  it('без сховища дозвіл живе в пам\'яті', () => {
    const access = createParentAccess(null, () => 10);
    access.grant();
    expect(access.isGranted()).toBe(true);
    access.revoke();
    expect(access.isGranted()).toBe(false);
  });
});
