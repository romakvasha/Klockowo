import { describe, expect, it } from 'vitest';
import {
  BREAK_MIN_SESSION, FATIGUE_BREAK_AFTER_MIN, IDLE_RESET_MS, createSessionClock, decideNext, elapsedMinutes, freshSession, touch, type SessionState,
} from './sessionClock';

const MIN = 60_000;
const at = (min: number): number => 1_000_000 + min * MIN;

describe('touch', () => {
  it('перша активність починає сесію; далі лише оновлює lastActive', () => {
    const first = touch(null, at(0));
    expect(first).toEqual(freshSession(at(0)));
    const second = touch(first, at(2));
    expect(second.startedAt).toBe(at(0));
    expect(second.lastActive).toBe(at(2));
  });

  it('довга пауза (> 30 хв) закриває стару сесію й починає нову, зі скинутими перервою й втомою', () => {
    const old: SessionState = { startedAt: at(0), lastActive: at(5), breakTaken: true, fatigue: true };
    const next = touch(old, at(5) + IDLE_RESET_MS + 1);
    expect(next).toEqual(freshSession(at(5) + IDLE_RESET_MS + 1));
    expect(touch(old, at(5) + IDLE_RESET_MS).startedAt).toBe(at(0));
  });
});

describe('decideNext', () => {
  const state = (over: Partial<SessionState> = {}): SessionState => ({ ...freshSession(at(0)), ...over });

  it('без сесії — просто далі', () => {
    expect(decideNext(null, 15, at(100))).toBe('continue');
  });

  it('час вичерпано → «Koniec na dziś» (для всіх тривалостей)', () => {
    for (const minutes of [10, 15, 20]) {
      expect(decideNext(state(), minutes, at(minutes - 0.01))).not.toBe('end');
      expect(decideNext(state(), minutes, at(minutes))).toBe('end');
      expect(decideNext(state({ breakTaken: true }), minutes, at(minutes + 5))).toBe('end');
    }
  });

  it('перерва — приблизно в середині сесії 15 і 20 хв, один раз', () => {
    expect(decideNext(state(), 15, at(7.4))).toBe('continue');
    expect(decideNext(state(), 15, at(7.5))).toBe('break');
    expect(decideNext(state(), 20, at(9.9))).toBe('continue');
    expect(decideNext(state(), 20, at(10))).toBe('break');
    expect(decideNext(state({ breakTaken: true }), 20, at(12))).toBe('continue');
  });

  it('10-хвилинна сесія перерви не має', () => {
    expect(BREAK_MIN_SESSION).toBe(15);
    for (let m = 0; m < 10; m += 0.5) expect(decideNext(state(), 10, at(m)), `${m}`).toBe('continue');
    expect(decideNext(state({ fatigue: true }), 10, at(6))).toBe('continue');
  });

  it('втома наближає перерву, але не раніше 3-ї хвилини й не в 10-хвилинній сесії', () => {
    expect(decideNext(state({ fatigue: true }), 20, at(FATIGUE_BREAK_AFTER_MIN - 0.1))).toBe('continue');
    expect(decideNext(state({ fatigue: true }), 20, at(FATIGUE_BREAK_AFTER_MIN))).toBe('break');
    expect(decideNext(state({ fatigue: true, breakTaken: true }), 20, at(5))).toBe('continue');
  });

  it('elapsedMinutes ≥ 0', () => {
    expect(elapsedMinutes(state(), at(3))).toBeCloseTo(3);
    expect(elapsedMinutes(state(), at(-1))).toBe(0);
  });
});

describe('createSessionClock', () => {
  const memoryStore = () => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };

  it('сесія живе у сховищі: touch → decide → markBreak → reset', () => {
    let now = at(0);
    const store = memoryStore();
    const clock = createSessionClock(store, () => now);
    expect(clock.decide(15)).toBe('continue'); // сесії ще нема
    clock.touch();
    now = at(8);
    expect(clock.decide(15)).toBe('break');
    clock.markBreak();
    expect(clock.decide(15)).toBe('continue');
    now = at(16);
    clock.touch();
    expect(clock.decide(15)).toBe('end');
    // інший екземпляр на тому самому сховищі бачить ту саму сесію (перезавантаження вкладки)
    expect(createSessionClock(store, () => now).decide(15)).toBe('end');
    clock.reset();
    expect(store.data.size).toBe(0);
    expect(clock.decide(15)).toBe('continue');
  });

  it('markFatigue вмикає перерву в 20-хвилинній сесії після 3-ї хвилини', () => {
    let now = at(0);
    const clock = createSessionClock(memoryStore(), () => now);
    clock.touch();
    clock.markFatigue();
    now = at(4);
    expect(clock.decide(20)).toBe('break');
  });

  it('пошкоджене сховище й відсутнє сховище не ламають годинник', () => {
    const broken = memoryStore();
    broken.setItem('klockowo.session', '{oops');
    const a = createSessionClock(broken, () => at(0));
    expect(a.decide(15)).toBe('continue');
    a.touch();
    expect(a.state()).not.toBeNull();
    const b = createSessionClock(null, () => at(0));
    b.touch();
    expect(b.state()?.startedAt).toBe(at(0));
    b.reset();
    expect(b.state()).toBeNull();
  });
});
