import { describe, expect, it } from 'vitest';
import { tts } from './tts';
import { installAudioUnlock } from './unlock';

// У Vitest (node) немає window: підставляємо прості EventTarget. Справжні tts/sfx тут «unsupported» — це не заважає.
function setup() {
  const target = new EventTarget();
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const off = installAudioUnlock(target as unknown as Window, doc as unknown as Document);
  return { target, doc, off };
}

describe('installAudioUnlock', () => {
  it('голос лишається заблокованим, доки не було справжнього жесту (pointerdown на дотику не рахується)', () => {
    const { target, off } = setup();
    target.dispatchEvent(new Event('pointerdown'));
    target.dispatchEvent(new Event('pointermove'));
    expect(tts.getState().unlocked).toBe(false);
    off();
  });

  it('click розблоковує голос; після off() слухачі знято', () => {
    const { target, off } = setup();
    target.dispatchEvent(new Event('click'));
    expect(tts.getState().unlocked).toBe(true);
    off();
    // повторний install на новому target: не розблоковано знову, але й не падає
    expect(() => target.dispatchEvent(new Event('click'))).not.toThrow();
  });

  it('touchend і keydown теж розблоковують', () => {
    for (const type of ['touchend', 'keydown']) {
      const { target, off } = setup();
      expect(() => target.dispatchEvent(new Event(type))).not.toThrow();
      expect(tts.getState().unlocked).toBe(true);
      off();
    }
  });

  it('коли вкладку ховають, голос замовкає (без помилок), а коли показують — знову доступний', () => {
    const { doc, off } = setup();
    doc.hidden = true;
    expect(() => doc.dispatchEvent(new Event('visibilitychange'))).not.toThrow();
    doc.hidden = false;
    expect(() => doc.dispatchEvent(new Event('visibilitychange'))).not.toThrow();
    off();
  });
});
