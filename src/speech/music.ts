// Фонова музика: тиха генеративна «музична скринька» через Web Audio, без аудіофайлів (CLAUDE.md).
//  • стартує лише після першого дотику (unlock() викликає installAudioUnlock); start() до того лише «запам'ятовується»;
//  • свій лад і темп для кожного світу (musicTheory.ts), сцена menu/game (у завданнях тихіше);
//  • стихає під голосом (підписка на tts), на паузі, коли вкладка прихована;
//  • MUSIC_ENABLED = false вимикає її повністю — Strefa rodzica (M22) тоді ховає повзунок «Muzyka».
import { sfx } from './sfx';
import {
  BEATS_PER_BAR, BARS_PER_PHRASE, DEFAULT_VOLUME, TAU, WORLD_MUSIC, generateBar, midiToHz, musicGain,
  type MusicWorld, type NoteEvent, type Scene,
} from './musicTheory';
import { tts, type Tts } from './tts';

export const MUSIC_ENABLED = true;

export interface MusicState {
  /** Звук дозволено першим дотиком і Web Audio є. */
  unlocked: boolean;
  /** Музика зараз грає (start() викликано, звук розблоковано). */
  playing: boolean;
  world: MusicWorld;
  scene: Scene;
  /** 0–1, повзунок «Muzyka». */
  volume: number;
  /** Голос говорить — музика притишена. */
  ducked: boolean;
  /** Вкладка прихована — пауза. */
  hidden: boolean;
  seed: number;
}

export interface Music {
  start(): void;
  stop(): void;
  setWorld(world: MusicWorld): void;
  setScene(scene: Scene): void;
  setVolume(volume: number): void;
  /** Вкладка сховалась / з'явилась (installAudioUnlock). */
  setHidden(hidden: boolean): void;
  /** Виклик із першого дотику (installAudioUnlock). */
  unlock(): void;
  getState(): MusicState;
  subscribe(listener: () => void): () => void;
}

export interface MusicEnv {
  /** Спільний AudioContext із sfx; до першого дотику undefined. */
  getContext(): AudioContext | undefined;
  tts: Pick<Tts, 'getState' | 'subscribe'>;
  seed?: number;
  enabled?: boolean;
}

const TICK_MS = 250;
const LOOKAHEAD_S = 1.6; // скільки наперед планувати ноти; таймер у фоні може запізнюватись
const START_DELAY_S = 0.4;

interface PartialSpec {
  ratio: number;
  gain: number;
  /** Частка загального часу дзвону. */
  decay: number;
}
/** «Скринька»: тон + швидкий скляний відблиск (злегка неціла гармоніка). */
const MELODY_PARTIALS: readonly PartialSpec[] = [
  { ratio: 1, gain: 0.2, decay: 1 }, { ratio: 2, gain: 0.04, decay: 0.45 }, { ratio: 4.17, gain: 0.012, decay: 0.2 },
];
/** Бас — м'який, з другою гармонікою, щоб було чутно й на динаміку телефона. */
const BASS_PARTIALS: readonly PartialSpec[] = [{ ratio: 1, gain: 0.14, decay: 1 }, { ratio: 2, gain: 0.06, decay: 0.6 }];

interface Graph {
  ctx: AudioContext;
  /** Остання ланка: тут ducking, повзунок, сцена, пауза. */
  out: GainNode;
  /** Сюди йдуть усі ноти (м'який фільтр → dry і відлуння). */
  bus: BiquadFilterNode;
  echoSend: GainNode;
  delay: DelayNode;
}

export function createMusic(env: MusicEnv): Music {
  const enabled = env.enabled ?? MUSIC_ENABLED;
  let state: MusicState = {
    unlocked: false, playing: false, world: 'hub', scene: 'menu', volume: DEFAULT_VOLUME, ducked: false, hidden: false,
    seed: env.seed ?? Math.floor(Math.random() * 2 ** 31),
  };
  const listeners = new Set<() => void>();
  let wanted = false;
  let graph: Graph | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let nextBar = 0;
  let nextBarTime = 0;

  function patch(p: Partial<MusicState>): void {
    state = { ...state, ...p };
    for (const l of [...listeners]) l();
  }

  // ---------- Граф ----------
  function ensureGraph(): Graph | undefined {
    if (graph) return graph;
    const ctx = env.getContext();
    if (!ctx) return undefined;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
    const bus = ctx.createBiquadFilter(); // зрізаємо різкі верхи: «глухувата» скринька
    bus.type = 'lowpass';
    bus.frequency.value = 3200;
    bus.connect(out);
    const echoSend = ctx.createGain();
    echoSend.gain.value = WORLD_MUSIC[state.world].echo;
    const delay = ctx.createDelay(2);
    const damp = ctx.createBiquadFilter(); // кожне повторення темніше за попереднє
    damp.type = 'lowpass';
    damp.frequency.value = 1600;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    bus.connect(echoSend);
    echoSend.connect(delay);
    delay.connect(damp);
    damp.connect(out);
    damp.connect(feedback);
    feedback.connect(delay);
    graph = { ctx, out, bus, echoSend, delay };
    applyWorld();
    return graph;
  }

  function applyWorld(): void {
    if (!graph) return;
    const w = WORLD_MUSIC[state.world];
    const now = graph.ctx.currentTime;
    graph.delay.delayTime.setTargetAtTime((60 / w.bpm) * 0.75, now, 0.2); // пунктирна восьма — «танцююче» відлуння
    graph.echoSend.gain.setTargetAtTime(w.echo, now, 0.3);
  }

  function applyGain(tau: number): void {
    if (!graph) return;
    const target = musicGain({
      volume: state.volume, scene: state.scene, speaking: state.ducked, hidden: state.hidden, playing: state.playing,
    });
    graph.out.gain.setTargetAtTime(target, graph.ctx.currentTime, tau);
  }

  // ---------- Ноти ----------
  function playNote(g: Graph, ev: NoteEvent, t: number, spb: number): void {
    const bass = ev.voice === 'bass';
    const ring = bass ? ev.dur * spb : Math.min(3.5, Math.max(1.4, ev.dur * spb * 0.9));
    const attack = bass ? 0.05 : 0.006;
    const f = midiToHz(ev.midi);
    for (const p of bass ? BASS_PARTIALS : MELODY_PARTIALS) {
      const end = t + ring * p.decay;
      const env = g.ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(p.gain * ev.gain, t + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, end);
      env.connect(g.bus);
      const osc = g.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * p.ratio, t);
      osc.connect(env);
      osc.start(t);
      osc.stop(end + 0.05);
    }
  }

  function tick(): void {
    if (!graph || !state.playing || state.hidden) return;
    const { ctx } = graph;
    if (ctx.state !== 'running') ctx.resume().catch(() => {}); // Safari/iOS «присипляє» контекст
    const now = ctx.currentTime;
    if (nextBarTime < now) nextBarTime = now + 0.1; // таймер запізнився (фонова вкладка) — не наздоганяємо
    const spb = 60 / WORLD_MUSIC[state.world].bpm;
    while (nextBarTime < now + LOOKAHEAD_S) {
      for (const ev of generateBar(state.world, state.seed, nextBar)) {
        playNote(graph, ev, nextBarTime + ev.beat * spb, spb);
      }
      nextBarTime += BEATS_PER_BAR * spb;
      nextBar++;
    }
  }

  function startTicking(): void {
    if (timer === undefined) timer = setInterval(tick, TICK_MS);
  }
  function stopTicking(): void {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  }

  function begin(): void {
    const g = ensureGraph();
    if (!g || state.playing) return;
    state = { ...state, playing: true };
    nextBar = 0;
    nextBarTime = g.ctx.currentTime + START_DELAY_S;
    applyGain(TAU.fade);
    if (!state.hidden) {
      startTicking();
      tick();
    }
    patch({});
  }

  // ---------- Голос: музика стихає, поки він говорить ----------
  env.tts.subscribe(() => {
    const speaking = env.tts.getState().speaking;
    if (speaking === state.ducked) return;
    patch({ ducked: speaking });
    applyGain(speaking ? TAU.duckAttack : TAU.duckRelease);
  });

  return {
    start() {
      if (!enabled) return;
      wanted = true;
      if (state.unlocked) begin();
    },
    stop() {
      wanted = false;
      if (!state.playing) return;
      stopTicking();
      state = { ...state, playing: false };
      applyGain(TAU.fade);
      patch({});
    },
    unlock() {
      if (state.unlocked || !env.getContext()) return;
      patch({ unlocked: true });
      if (wanted) begin();
    },
    setWorld(world) {
      if (world === state.world) return;
      patch({ world });
      applyWorld();
      nextBar = Math.ceil(nextBar / BARS_PER_PHRASE) * BARS_PER_PHRASE; // нова мелодія починається з початку фрази
    },
    setScene(scene) {
      if (scene === state.scene) return;
      patch({ scene });
      applyGain(TAU.scene);
    },
    setVolume(volume) {
      patch({ volume: Math.min(1, Math.max(0, volume)) });
      applyGain(TAU.user);
    },
    setHidden(hidden) {
      if (hidden === state.hidden) return;
      state = { ...state, hidden };
      if (hidden) stopTicking();
      else if (state.playing && graph) {
        nextBarTime = graph.ctx.currentTime + START_DELAY_S;
        startTicking();
        tick();
      }
      applyGain(TAU.user);
      patch({});
    },
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Єдина музика додатка: грає через AudioContext ефектів. */
export const music: Music = createMusic({ getContext: () => sfx.getContext(), tts });
