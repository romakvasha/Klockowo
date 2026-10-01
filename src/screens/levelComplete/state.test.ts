import { describe, expect, it } from 'vitest';
import { QUIET_STATE, readCompleteState, readDevState } from './state';

describe('readCompleteState', () => {
  it('приймає лише булеві true; усе інше — «спокійна» версія', () => {
    expect(readCompleteState({ firstTime: true, together: true })).toEqual({ firstTime: true, together: true });
    expect(readCompleteState({ firstTime: true })).toEqual({ firstTime: true, together: false });
    expect(readCompleteState({ firstTime: 'yes', together: 1 })).toEqual(QUIET_STATE);
    expect(readCompleteState(null)).toEqual(QUIET_STATE);
    expect(readCompleteState(undefined)).toEqual(QUIET_STATE);
    expect(readCompleteState('x')).toEqual(QUIET_STATE);
  });
});

describe('readDevState', () => {
  it('у збірці для дитини параметри адреси ігноруються', () => {
    expect(readDevState('?first=1&together=1', false)).toBeNull();
  });

  it('у розробці: first=1 і together=1', () => {
    expect(readDevState('?first=1&together=1', true)).toEqual({ firstTime: true, together: true });
    expect(readDevState('?first=1', true)).toEqual({ firstTime: true, together: false });
    expect(readDevState('?together=1', true)).toEqual({ firstTime: false, together: true });
  });

  it('без параметрів — null: працює стан навігації', () => {
    expect(readDevState('', true)).toBeNull();
    expect(readDevState('?foo=1', true)).toBeNull();
  });
});
