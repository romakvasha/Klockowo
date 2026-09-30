import { describe, expect, it } from 'vitest';
import { RECIPES, createSfx, pitchFactor, type SfxName } from './sfx';

// ---------- Підробка Web Audio: лише те, що використовує sfx.ts ----------
class FakeParam {
  value = 0;
  calls: { fn: string; args: number[] }[] = [];
  setValueAtTime(...args: number[]) { this.calls.push({ fn: 'set', args }); }
  linearRampToValueAtTime(...args: number[]) { this.calls.push({ fn: 'linear', args }); }
  exponentialRampToValueAtTime(...args: number[]) { this.calls.push({ fn: 'exp', args }); }
  setTargetAtTime(...args: number[]) { this.calls.push({ fn: 'target', args }); }
}
class FakeNode {
  connect() { return this; }
}
class FakeGain extends FakeNode {
  gain = new FakeParam();
}
class FakeSource extends FakeNode {
  onended: (() => void) | null = null;
  startedAt: number | undefined;
  stoppedAt: number | undefined;
  start(t: number) { this.startedAt = t; }
  stop(t: number) { this.stoppedAt = t; }
}
class FakeOsc extends FakeSource {
  type = 'sine';
  frequency = new FakeParam();
}
class FakeBufferSource extends FakeSource {
  buffer: unknown = null;
  loop = false;
}
class FakeFilter extends FakeNode {
  type = '';
  Q = { value: 0 };
  frequency = new FakeParam();
}
class FakeCtx {
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 1;
  sampleRate = 8000;
  destination = new FakeNode();
  resumed = 0;
  gains: FakeGain[] = [];
  oscs: FakeOsc[] = [];
  noises: FakeBufferSource[] = [];
  filters: FakeFilter[] = [];
  createGain() { const g = new FakeGain(); this.gains.push(g); return g; }
  createOscillator() { const o = new FakeOsc(); this.oscs.push(o); return o; }
  createBufferSource() { const s = new FakeBufferSource(); this.noises.push(s); return s; }
  createBiquadFilter() { const f = new FakeFilter(); this.filters.push(f); return f; }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  resume() { this.resumed++; this.state = 'running'; return Promise.resolve(); }
}

function setup() {
  const made: FakeCtx[] = [];
  const sfx = createSfx(() => {
    const c = new FakeCtx();
    made.push(c);
    return c as unknown as AudioContext;
  });
  return { sfx, made };
}

describe('sfx: звук лише після першого дотику', () => {
  it('до unlock() нічого не створюється і нічого не звучить', () => {
    const { sfx, made } = setup();
    sfx.play('tap');
    expect(made).toHaveLength(0);
    expect(sfx.isUnlocked()).toBe(false);
    expect(sfx.getContext()).toBeUndefined();
  });

  it('unlock() створює один AudioContext і будить його; повторні виклики лише «будять»', () => {
    const { sfx, made } = setup();
    sfx.unlock();
    sfx.unlock();
    expect(made).toHaveLength(1);
    expect(made[0]?.resumed).toBe(1); // вдруге контекст уже running
    expect(sfx.isUnlocked()).toBe(true);
    expect(sfx.getContext()).toBe(made[0] as unknown as AudioContext);
  });

  it('браузер без Web Audio: unlock() і play() — безпечні пустишки', () => {
    const sfx = createSfx(() => undefined);
    expect(() => {
      sfx.unlock();
      sfx.play('correct');
    }).not.toThrow();
    expect(sfx.isUnlocked()).toBe(false);
  });
});

describe('sfx: відтворення', () => {
  it.each(Object.keys(RECIPES) as SfxName[])('«%s» планує всі частини рецепта і зупиняє їх', (name) => {
    const { sfx, made } = setup();
    sfx.unlock();
    sfx.play(name);
    const c = made[0]!;
    const parts = RECIPES[name];
    expect(c.oscs.length + c.noises.length).toBe(parts.length);
    for (const s of [...c.oscs, ...c.noises]) {
      expect(s.startedAt).toBeGreaterThanOrEqual(c.currentTime);
      expect(s.stoppedAt).toBeGreaterThan(s.startedAt ?? 0);
    }
  });

  it('whoosh — шум через смуговий фільтр; tap — один осцилятор', () => {
    const { sfx, made } = setup();
    sfx.unlock();
    sfx.play('whoosh');
    sfx.play('tap');
    const c = made[0]!;
    expect(c.noises).toHaveLength(1);
    expect(c.noises[0]?.loop).toBe(true);
    expect(c.filters[0]?.type).toBe('bandpass');
    expect(c.oscs).toHaveLength(1);
  });

  it('pitch зсуває частоту в півтонах: +12 → вдвічі вище', () => {
    const { sfx, made } = setup();
    sfx.unlock();
    sfx.play('pop');
    sfx.play('pop', { pitch: 12 });
    const [low, high] = made[0]!.oscs;
    expect(high?.frequency.calls[0]?.args[0]).toBeCloseTo((low?.frequency.calls[0]?.args[0] ?? 0) * 2);
    expect(pitchFactor(0)).toBe(1);
    expect(pitchFactor(100)).toBe(pitchFactor(24)); // обмежено
    expect(pitchFactor(-100)).toBe(pitchFactor(-12));
  });

  it('гучність 0 («Efekty» вимкнено) — тиша; повзунок змінює головний підсилювач', () => {
    const { sfx, made } = setup();
    sfx.unlock();
    sfx.setVolume(0);
    sfx.play('tap');
    expect(made[0]?.oscs).toHaveLength(0);
    sfx.setVolume(2);
    expect(sfx.getVolume()).toBe(1);
    sfx.setVolume(0.4);
    expect(made[0]?.gains[0]?.gain.calls.at(-1)).toEqual({ fn: 'target', args: [0.4, 1, 0.01] });
  });

  it('якщо контекст «заснув», play() його будить', () => {
    const { sfx, made } = setup();
    sfx.unlock();
    const c = made[0]!;
    c.state = 'suspended';
    sfx.play('tap');
    expect(c.resumed).toBe(2);
  });

  it('швидкі дотики не накопичують голосів понад ліміт', () => {
    const { sfx, made } = setup();
    sfx.unlock();
    for (let i = 0; i < 100; i++) sfx.play('correct'); // жодне джерело не завершилось (onended не викликано)
    expect(made[0]!.oscs.length).toBeLessThanOrEqual(16);
    // коли джерела завершуються, можна знову грати
    for (const o of made[0]!.oscs) o.onended?.();
    const before = made[0]!.oscs.length;
    sfx.play('tap');
    expect(made[0]!.oscs.length).toBe(before + 1);
  });
});

describe('RECIPES: безпечність для дитини', () => {
  const all = Object.entries(RECIPES) as [SfxName, (typeof RECIPES)[SfxName]][];

  it('п’ять ефектів з плану: tap, correct, retry, pop, whoosh', () => {
    expect(Object.keys(RECIPES).sort()).toEqual(['correct', 'pop', 'retry', 'tap', 'whoosh']);
  });

  it.each(all)('«%s»: тихий, короткий, без надвисоких частот', (_name, parts) => {
    let end = 0;
    let peak = 0;
    for (const p of parts) {
      expect(p.gain).toBeGreaterThan(0);
      expect(p.gain).toBeLessThanOrEqual(0.25);
      expect(p.dur).toBeGreaterThan(0);
      expect(p.dur).toBeLessThanOrEqual(0.6);
      for (const f of [p.from, p.to]) {
        expect(f).toBeGreaterThanOrEqual(150);
        expect(f).toBeLessThanOrEqual(4200);
      }
      end = Math.max(end, p.at + p.dur);
      peak += p.gain;
    }
    expect(end).toBeLessThanOrEqual(0.8); // усе звучить менше за 0,8 с
    expect(peak).toBeLessThanOrEqual(0.7); // навіть усі частини разом — не голосно
  });

  it('«retry» м’який: менший за «correct» за загальною гучністю і без різкого шуму', () => {
    const sum = (parts: readonly { gain: number }[]) => parts.reduce((s, p) => s + p.gain, 0);
    expect(sum(RECIPES.retry)).toBeLessThan(sum(RECIPES.correct));
    expect(RECIPES.retry.every((p) => p.kind === 'tone' && p.wave === 'sine')).toBe(true);
  });
});
