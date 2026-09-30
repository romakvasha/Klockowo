// Звукові ефекти: синтез через Web Audio API, без аудіофайлів (CLAUDE.md). Звук — лише після першого дотику:
// AudioContext створюється в unlock(). Усі звуки м'які й короткі (жодного різкого «баззера» для помилки).

export type SfxName = 'tap' | 'correct' | 'retry' | 'pop' | 'whoosh';

interface PartBase {
  /** Початок відносно моменту play(), с. */
  at: number;
  dur: number;
  /** Пікова гучність частини (0–1) до повзунка «Efekty». */
  gain: number;
  /** Час наростання, с (за замовчуванням 12 мс). */
  attack?: number;
}
interface Tone extends PartBase {
  kind: 'tone';
  wave: OscillatorType;
  /** Частота на початку й наприкінці, Гц (різні — плавний «ковзок»). */
  from: number;
  to: number;
}
interface Noise extends PartBase {
  kind: 'noise';
  /** Смуговий фільтр, що ковзає від `from` до `to` Гц. */
  from: number;
  to: number;
  q: number;
}
export type Part = Tone | Noise;

const tone = (wave: OscillatorType, from: number, to: number, at: number, dur: number, gain: number): Tone => ({
  kind: 'tone', wave, from, to, at, dur, gain,
});

// Ноти: C5 523,25 · E5 659,25 · G5 783,99 · C6 1046,5 · E4 329,63 · D4 293,66
export const RECIPES: Readonly<Record<SfxName, readonly Part[]>> = {
  /** Короткий м'який «тик» при дотику. */
  tap: [tone('sine', 660, 440, 0, 0.07, 0.16)],
  /** «Булькання»: зростаючий тон — предмет підстрибнув / з'явився. Висота регулюється (лічба вгору). */
  pop: [tone('sine', 420, 900, 0, 0.09, 0.2)],
  /** Правильно: весела висхідна арпеджіо C–E–G–C і тонкий «блиск». */
  correct: [
    tone('triangle', 523.25, 523.25, 0, 0.16, 0.16),
    tone('triangle', 659.25, 659.25, 0.09, 0.16, 0.16),
    tone('triangle', 783.99, 783.99, 0.18, 0.16, 0.16),
    tone('triangle', 1046.5, 1046.5, 0.27, 0.42, 0.18),
    tone('sine', 2093, 2093, 0.27, 0.3, 0.04),
  ],
  /** «Спробуй ще»: два низькі м'які «бу-бум» (E4 → D4), без різкості. */
  retry: [tone('sine', 329.63, 329.63, 0, 0.15, 0.12), tone('sine', 293.66, 293.66, 0.13, 0.24, 0.12)],
  /** Проліт: шум, що «пливе» з низьких частот у високі (перехід, кісточка летить). */
  whoosh: [{ kind: 'noise', at: 0, dur: 0.32, gain: 0.1, attack: 0.12, from: 300, to: 2600, q: 0.8 }],
};

export interface PlayOptions {
  /** Зсув висоти в півтонах (−12…+24): лічба вгору — pop з pitch 0, 1, 2… */
  pitch?: number;
}

export interface Sfx {
  unlock(): void;
  play(name: SfxName, opts?: PlayOptions): void;
  /** 0–1, повзунок «Efekty». */
  setVolume(volume: number): void;
  getVolume(): number;
  isUnlocked(): boolean;
  /** Спільний AudioContext (його використає фонова музика, M2b); до unlock — undefined. */
  getContext(): AudioContext | undefined;
}

const MAX_VOICES = 16; // швидкі дотики не мають накопичувати сотні осциляторів
const DEFAULT_VOLUME = 0.7;

export const pitchFactor = (semitones: number): number => 2 ** (Math.min(24, Math.max(-12, semitones)) / 12);

export function createSfx(makeContext: () => AudioContext | undefined): Sfx {
  let ctx: AudioContext | undefined;
  let master: GainNode | undefined;
  let noise: AudioBuffer | undefined;
  let volume = DEFAULT_VOLUME;
  let voices = 0;

  function unlock(): void {
    if (!ctx) {
      ctx = makeContext();
      if (!ctx) return;
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      noise = makeNoise(ctx);
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {}); // Safari/iOS: після згортання вкладки контекст «засинає»
  }

  function schedule(c: AudioContext, out: AudioNode, part: Part, t0: number, pitch: number): void {
    const start = t0 + part.at;
    const end = start + part.dur;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(part.gain, start + Math.min(part.attack ?? 0.012, part.dur / 2));
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(out);

    let source: AudioScheduledSourceNode;
    if (part.kind === 'tone') {
      const osc = c.createOscillator();
      osc.type = part.wave;
      osc.frequency.setValueAtTime(part.from * pitch, start);
      if (part.to !== part.from) osc.frequency.exponentialRampToValueAtTime(part.to * pitch, end);
      osc.connect(env);
      source = osc;
    } else {
      const src = c.createBufferSource();
      if (noise) src.buffer = noise;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = part.q;
      filter.frequency.setValueAtTime(part.from, start);
      filter.frequency.exponentialRampToValueAtTime(part.to, end);
      src.connect(filter);
      filter.connect(env);
      source = src;
    }
    voices++;
    source.onended = () => {
      voices--;
    };
    source.start(start);
    source.stop(end + 0.02);
  }

  function play(name: SfxName, opts: PlayOptions = {}): void {
    if (!ctx || !master || volume <= 0) return; // до першого дотику і при «Efekty = 0» — тиша
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    const parts = RECIPES[name];
    if (voices + parts.length > MAX_VOICES) return;
    const t0 = ctx.currentTime;
    const pitch = pitchFactor(opts.pitch ?? 0);
    for (const part of parts) schedule(ctx, master, part, t0, pitch);
  }

  return {
    unlock,
    play,
    setVolume(v) {
      volume = Math.min(1, Math.max(0, v));
      if (ctx && master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.01);
    },
    getVolume: () => volume,
    isUnlocked: () => ctx !== undefined,
    getContext: () => ctx,
  };
}

function makeNoise(c: AudioContext): AudioBuffer {
  const buffer = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate)), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Єдиний набір ефектів додатка. */
export const sfx: Sfx = createSfx(() => (typeof AudioContext === 'undefined' ? undefined : new AudioContext()));
