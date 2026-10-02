import { describe, expect, it } from 'vitest';
import { afterLoadingPath, shouldShowNoVoice } from './noVoice';

describe('екран «Brak polskiego głosu»', () => {
  it('показується, коли голосу нема (no-voice, unsupported) і ще не показували; готовий голос і loading — ні', () => {
    expect(shouldShowNoVoice('no-voice', false)).toBe(true);
    expect(shouldShowNoVoice('unsupported', false)).toBe(true);
    expect(shouldShowNoVoice('ready', false)).toBe(false);
    expect(shouldShowNoVoice('loading', false)).toBe(false);
    expect(shouldShowNoVoice('no-voice', true)).toBe(false);
  });

  it('afterLoadingPath: без голосу — на екран про голос, інакше — на Start', () => {
    expect(afterLoadingPath('no-voice', false)).toBe('/no-voice');
    expect(afterLoadingPath('no-voice', true)).toBe('/start');
    expect(afterLoadingPath('ready', false)).toBe('/start');
  });
});
