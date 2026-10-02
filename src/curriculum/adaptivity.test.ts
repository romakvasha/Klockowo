import { describe, expect, it } from 'vitest';
import {
  IDLE_MS, NO_TAPS, RAPID_TAPS, STEP_MAX, STEP_MIN, fatigueSignal, nextEase, nextStep, tapStats, type StepState,
} from './adaptivity';

const START: StepState = { step: 0, sinceStep: 0, streak: 0, struggle: 0 };

/** Проганяє відповіді через nextStep, як це робить store: `recent` — останні 10 разом із поточною. */
function play(answers: readonly boolean[], from: StepState = START) {
  let state = from;
  const recent: boolean[] = [];
  const changes: (string | null)[] = [];
  for (const ok of answers) {
    recent.push(ok);
    const { change, ...next } = nextStep(state, recent.slice(-10));
    state = next;
    changes.push(change);
  }
  return { state, changes };
}

describe('крок складності (PEDAGOGY §3)', () => {
  it('5 з першого разу поспіль — крок угору; наступний — лише після ще 5', () => {
    const { state, changes } = play(Array(9).fill(true));
    expect(changes.slice(0, 5)).toEqual([null, null, null, null, 'up']);
    expect(changes.slice(5)).toEqual([null, null, null, null]);
    expect(state.step).toBe(1);
    expect(play(Array(10).fill(true)).state.step).toBe(2);
  });

  it('не вище STEP_MAX', () => {
    expect(play(Array(40).fill(true)).state.step).toBe(STEP_MAX);
  });

  it('2 помилки з останніх 3 — крок униз; рішення лише на нових відповідях', () => {
    const { state, changes } = play([false, true, false]);
    expect(changes).toEqual([null, null, 'down']);
    expect(state.step).toBe(-1);
    // одразу після зміни одна помилка ще не знижує
    expect(play([false], state).changes).toEqual([null]);
    expect(play([false, false], state).state.step).toBe(-2);
  });

  it('помилка обнуляє серію: 4 + помилка + 4 — без кроку вгору', () => {
    expect(play([true, true, true, true, false, true, true, true, true]).state.step).toBe(0);
  });

  it('на найнижчому кроці: спершу інша гра, потім прапорець для батьків; крок угору знімає труднощі', () => {
    const low: StepState = { step: STEP_MIN, sinceStep: 0, streak: 0, struggle: 0 };
    const first = play([false, false], low);
    expect(first.changes).toEqual([null, 'switch']);
    expect(first.state).toMatchObject({ step: STEP_MIN, struggle: 1 });
    const second = play([false, false], first.state);
    expect(second.changes).toEqual([null, 'flag']);
    expect(second.state.struggle).toBe(2);
    expect(play([false, false], second.state).changes).toEqual([null, null]);
    const up = play(Array(5).fill(true), second.state);
    expect(up.state).toMatchObject({ step: STEP_MIN + 1, struggle: 0 });
  });
});

describe('ознаки втоми', () => {
  it('tapStats: швидкі дотики й найдовша пауза (разом із паузою до відповіді)', () => {
    expect(tapStats([], 5000)).toEqual({ rapid: 0, maxGapMs: 5000 });
    expect(tapStats([1000, 1100, 1200, 4000], 4500)).toEqual({ rapid: 2, maxGapMs: 2800 });
  });

  it('3 помилки поспіль, випадкові дотики, довга бездіяльність', () => {
    expect(fatigueSignal(['first', 'retry', 'together', 'retry'], NO_TAPS)).toBe('errors');
    expect(fatigueSignal(['retry', 'first', 'retry'], NO_TAPS)).toBeNull();
    expect(fatigueSignal(['first'], { rapid: RAPID_TAPS, maxGapMs: 0 })).toBe('taps');
    expect(fatigueSignal(['first'], { rapid: 0, maxGapMs: IDLE_MS })).toBe('idle');
    expect(fatigueSignal(['first'], { rapid: RAPID_TAPS - 1, maxGapMs: IDLE_MS - 1 })).toBeNull();
  });

  it('полегшення: після ознаки — 1, після відповіді з першого разу — 0, інакше лишається', () => {
    expect(nextEase(0, 'retry', 'errors')).toBe(1);
    expect(nextEase(1, 'retry', null)).toBe(1);
    expect(nextEase(1, 'first', null)).toBe(0);
  });
});
