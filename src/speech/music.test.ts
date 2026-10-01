import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMusic, type Music } from './music';
import { DEFAULT_VOLUME, DUCK_LEVEL, SCENE_LEVEL, WORLD_MUSIC, generateBar } from './musicTheory';

// ---------- Підробка Web Audio: лише те, що використовує music.ts ----------
class FakeParam {
  value = 0;
  calls: { fn: string; args: number[] }[] = [];
  setValueAtTime(...args: number[]) { this.calls.push({ fn: 'set', args }); }
  linearRampToValueAtTime(...args: number[]) { this.calls.push({ fn: 'linear', args }); }
  exponentialRampToValueAtTime(...args: number[]) { this.calls.push({ fn: 'exp', args }); }
  setTargetAtTime(...args: number[]) { this.calls.push({ fn: 'target', args }); }
  targets(): number[][] { return this.calls.filter((c) => c.fn === 'target').map((c) => c.args); }
}
class FakeNode {
  connect() { return this; }
}
class FakeGain extends FakeNode {
  gain = new FakeParam();
}
class FakeOsc extends FakeNode {
  type = '';
  frequency = new FakeParam();
  startedAt: number | undefined;
  stoppedAt: number | undefined;
  start(t: number) { this.startedAt = t; }
  stop(t: number) { this.stoppedAt = t; }
}
class FakeFilter extends FakeNode {
  type = '';
  frequency = new FakeParam();
}
class FakeDelay extends FakeNode {
  delayTime = new FakeParam();
}
class FakeCtx {
  state: 'suspended' | 'running' = 'running';
  currentTime = 10;
  destination = new FakeNode();
  gains: FakeGain[] = [];
  oscs: FakeOsc[] = [];
  delays: FakeDelay[] = [];
  createGain() { const g = new FakeGain(); this.gains.push(g); return g; }
  createOscillator() { const o = new FakeOsc(); this.oscs.push(o); return o; }
  createBiquadFilter() { return new FakeFilter(); }
  createDelay() { const d = new FakeDelay(); this.delays.push(d); return d; }
  resume() { this.state = 'running'; return Promise.resolve(); }
}

/** Підроблений tts: лише speaking + підписка. */
function fakeTts() {
  const listeners = new Set<() => void>();
  let speaking = false;
  return {
    getState: () => ({ speaking }) as ReturnType<typeof import('./tts').tts.getState>,
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    setSpeaking(v: boolean) {
      speaking = v;
      for (const l of [...listeners]) l();
    },
  };
}

function setup(opts: { seed?: number; enabled?: boolean; ctx?: boolean } = {}) {
  const ctx = new FakeCtx();
  let available = false; // sfx створює контекст лише після першого дотику
  const tts = fakeTts();
  const music: Music = createMusic({
    getContext: () => (available && opts.ctx !== false ? (ctx as unknown as AudioContext) : undefined),
    tts,
    seed: opts.seed ?? 1,
    enabled: opts.enabled,
  });
  /** Перший дотик: sfx створив контекст → music.unlock(). */
  const tap = (): void => {
    available = true;
    music.unlock();
  };
  const master = (): FakeParam => ctx.gains[0]!.gain; // перший створений вузол — вихідний gain музики
  const lastTarget = (): number => master().targets().at(-1)?.[0] ?? NaN;
  const tick = (ms = 250): void => {
    ctx.currentTime += ms / 1000;
    vi.advanceTimersByTime(ms);
  };
  return { ctx, tts, music, tap, master, lastTarget, tick };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('music: старт лише після першого дотику', () => {
  it('start() до дотику нічого не створює й не звучить', () => {
    const { ctx, music, tick } = setup();
    music.start();
    tick(2000);
    expect(ctx.gains).toHaveLength(0);
    expect(ctx.oscs).toHaveLength(0);
    expect(music.getState()).toMatchObject({ unlocked: false, playing: false });
  });

  it('start() до дотику «запам’ятовується»: перший дотик вмикає музику', () => {
    const { ctx, music, tap } = setup();
    music.start();
    tap();
    expect(music.getState()).toMatchObject({ unlocked: true, playing: true });
    expect(ctx.oscs.length).toBeGreaterThan(0);
  });

  it('дотик без start(): музика не грає, доки її не запросять', () => {
    const { ctx, music, tap } = setup();
    tap();
    expect(music.getState()).toMatchObject({ unlocked: true, playing: false });
    expect(ctx.oscs).toHaveLength(0);
    music.start();
    expect(music.getState().playing).toBe(true);
  });

  it('браузер без Web Audio: усе — безпечні пустишки', () => {
    const { music, tap } = setup({ ctx: false });
    music.start();
    expect(() => {
      tap();
      music.setWorld('w3');
      music.setScene('game');
      music.setVolume(0.8);
      music.setHidden(true);
      music.stop();
    }).not.toThrow();
    expect(music.getState().playing).toBe(false);
  });

  it('MUSIC_ENABLED = false: start() нічого не робить', () => {
    const { ctx, music, tap } = setup({ enabled: false });
    music.start();
    tap();
    expect(music.getState().playing).toBe(false);
    expect(ctx.oscs).toHaveLength(0);
  });
});

describe('music: ноти', () => {
  it('планує ноти першого такту хаба за seed: частоти збігаються з generateBar', () => {
    const { ctx, music, tap } = setup({ seed: 5 });
    music.start();
    tap();
    const first = generateBar('hub', 5, 0);
    const wanted = first.map((e) => 440 * 2 ** ((e.midi - 69) / 12));
    const played = new Set(ctx.oscs.map((o) => o.frequency.calls[0]?.args[0]));
    for (const f of wanted) expect(played.has(f)).toBe(true);
    // кожен осцилятор запущено в майбутньому і зупинено після початку
    for (const o of ctx.oscs) {
      expect(o.startedAt).toBeGreaterThanOrEqual(ctx.currentTime);
      expect(o.stoppedAt).toBeGreaterThan(o.startedAt ?? 0);
    }
  });

  it('грає далі: з часом з’являються нові такти, а не лише перший', () => {
    const { ctx, music, tap, tick } = setup();
    music.start();
    tap();
    const first = ctx.oscs.length;
    for (let i = 0; i < 40; i++) tick(); // ≈ 10 с
    expect(ctx.oscs.length).toBeGreaterThan(first * 2);
  });

  it('ноти планує з випередженням, а не всі одразу', () => {
    const { ctx, music, tap } = setup();
    music.start();
    tap();
    const latest = Math.max(...ctx.oscs.map((o) => o.startedAt ?? 0));
    expect(latest).toBeLessThan(ctx.currentTime + 1.6 + (60 / WORLD_MUSIC.hub.bpm) * 4);
  });

  it('якщо таймер запізнився (фонова вкладка), музика не «наздоганяє» купою нот', () => {
    const { ctx, music, tap } = setup();
    music.start();
    tap();
    const before = ctx.oscs.length;
    ctx.currentTime += 120; // 2 хвилини «сну» таймера
    vi.advanceTimersByTime(250);
    const added = ctx.oscs.length - before;
    expect(added).toBeGreaterThan(0);
    expect(added).toBeLessThan(80); // кілька тактів, а не 120 с музики
  });

  it('stop(): гучність → 0, нових нот немає; start() знову вмикає', () => {
    const { ctx, music, tap, tick, lastTarget } = setup();
    music.start();
    tap();
    music.stop();
    expect(lastTarget()).toBe(0);
    expect(music.getState().playing).toBe(false);
    const n = ctx.oscs.length;
    tick(5000);
    expect(ctx.oscs.length).toBe(n);
    music.start();
    expect(music.getState().playing).toBe(true);
    expect(lastTarget()).toBeCloseTo(DEFAULT_VOLUME, 6);
  });

  it('setWorld змінює темп відлуння; нова мелодія — з початку нової фрази', () => {
    const { ctx, music, tap, tick } = setup({ seed: 3 });
    music.start();
    tap();
    tick(500);
    music.setWorld('w7');
    const delay = ctx.delays[0]!.delayTime.targets().at(-1);
    expect(delay?.[0]).toBeCloseTo((60 / WORLD_MUSIC.w7.bpm) * 0.75, 6);
    expect(music.getState().world).toBe('w7');
  });
});

describe('music: гучність', () => {
  it('на старті — DEFAULT_VOLUME (≈30 %) із плавним наростанням', () => {
    const { music, tap, lastTarget, master } = setup();
    music.start();
    tap();
    expect(lastTarget()).toBeCloseTo(0.3, 6);
    expect(master().targets().at(-1)?.[2]).toBe(0.5); // τ = fade
  });

  it('повзунок «Muzyka» і сцена game', () => {
    const { music, tap, lastTarget } = setup();
    music.start();
    tap();
    music.setVolume(0.6);
    expect(lastTarget()).toBeCloseTo(0.6, 6);
    music.setScene('game');
    expect(lastTarget()).toBeCloseTo(0.6 * SCENE_LEVEL.game, 6);
    music.setScene('menu');
    expect(lastTarget()).toBeCloseTo(0.6, 6);
    music.setVolume(5);
    expect(music.getState().volume).toBe(1);
  });

  it('стихає під голосом (швидко) і повертається після нього (повільно)', () => {
    const { music, tts, tap, lastTarget, master } = setup();
    music.start();
    tap();
    tts.setSpeaking(true);
    expect(music.getState().ducked).toBe(true);
    expect(lastTarget()).toBeCloseTo(DEFAULT_VOLUME * DUCK_LEVEL, 6);
    const attackTau = master().targets().at(-1)?.[2] ?? 0;
    tts.setSpeaking(false);
    expect(music.getState().ducked).toBe(false);
    expect(lastTarget()).toBeCloseTo(DEFAULT_VOLUME, 6);
    const releaseTau = master().targets().at(-1)?.[2] ?? 0;
    expect(attackTau).toBeLessThan(releaseTau);
  });

  it('голос може заговорити ще до першого дотику: ducking запам’ятовується', () => {
    const { music, tts, tap, lastTarget } = setup();
    music.start();
    tts.setSpeaking(true);
    tap();
    expect(lastTarget()).toBeCloseTo(DEFAULT_VOLUME * DUCK_LEVEL, 6);
  });

  it('вкладка прихована: пауза (гучність 0, нових нот немає); повернулась — грає знову', () => {
    const { ctx, music, tap, tick, lastTarget } = setup();
    music.start();
    tap();
    music.setHidden(true);
    expect(lastTarget()).toBe(0);
    const n = ctx.oscs.length;
    tick(10000);
    expect(ctx.oscs.length).toBe(n);
    music.setHidden(false);
    expect(lastTarget()).toBeCloseTo(DEFAULT_VOLUME, 6);
    tick(250);
    expect(ctx.oscs.length).toBeGreaterThan(n);
  });

  it('вкладка сховалась ще до старту: музика стартує, але не планує нот, доки вкладка не повернеться', () => {
    const { ctx, music, tap } = setup();
    music.setHidden(true);
    music.start();
    tap();
    expect(music.getState().playing).toBe(true);
    expect(ctx.oscs).toHaveLength(0);
    music.setHidden(false);
    expect(ctx.oscs.length).toBeGreaterThan(0);
  });
});

describe('music: підписка', () => {
  it('subscribe сповіщає про зміни стану; відписка працює', () => {
    const { music, tap } = setup();
    const seen: boolean[] = [];
    const off = music.subscribe(() => seen.push(music.getState().playing));
    music.start();
    tap();
    expect(seen).toContain(true);
    off();
    const n = seen.length;
    music.stop();
    expect(seen).toHaveLength(n);
  });
});
