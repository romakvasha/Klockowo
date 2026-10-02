// Голос: Web Speech API (pl-PL) — єдине місце в коді, що торкається speechSynthesis (CLAUDE.md).
//  • черга: фрази звучать по одній; speak() повертає Promise, який вирішується, коли голос ДОГОВОРИВ
//    (або фразу скасовано, або голосу немає) — на цьому тримається правило «наступне завдання — лише коли голос договорив»;
//  • до першого дотику (unlock) — тиша: браузер не дозволяє озвучувати без жесту, а застарілі фрази не мають «вибухнути» після нього;
//  • немає польського голосу → status 'no-voice' (екран NoVoice), speak() тихо повертає 'skipped';
//  • застосунок згорнуто (setHidden) — голос замовкає, але сценарії не обриваються: фрази вирішуються як 'skipped', не 'cancelled';
//  • окрему фразу можна замінити записаним mp3 з public/audio/ (clips.ts);
//  • subscribe() — для React (useTts) і для музики, що стихає під голосом (M2b).
import { clipSlug, clipUrl, loadClipManifest } from './clips';
import type {
  AudioLike, ClipEnv, SpeakOptions, SpeakResult, SynthLike, Tts, TtsConfig, TtsEnv, TtsState, TtsStatus, UtteranceLike,
} from './ttsTypes';
import { pickVoice, polishVoices } from './voices';

export type {
  AudioLike, ClipEnv, SpeakOptions, SpeakResult, SynthLike, Tts, TtsConfig, TtsEnv, TtsState, TtsStatus, UtteranceLike,
} from './ttsTypes';

export const DEFAULT_RATE = 0.9; // POLISH_COPY §8: числа слухати на ≈0,9
const VOICE_WAIT_MS = 2500; // повільні пристрої вантажать голоси довго; до цього часу status = 'loading'
const CANCEL_COOLDOWN_MS = 80;
const PRIME_CLEANUP_MS = 500;
const CLIP_WATCHDOG_MS = 15000;

const clamp = (x: number, min: number, max: number): number => Math.min(max, Math.max(min, x));

/** Сторожовий таймер: якщо браузер «загубив» подію end (буває), гра не має зависнути. */
export function watchdogMs(text: string, rate: number): number {
  return Math.ceil((text.length * 150) / rate) + 4000;
}

interface Job {
  text: string;
  rate: number;
  clip: string;
  resolve: (r: SpeakResult) => void;
}

interface Active {
  job: Job;
  done: boolean;
  stop: () => void;
  timer: ReturnType<typeof setTimeout> | undefined;
  /** Тримаємо посилання на utterance/audio, щоб збирач сміття не з'їв подію end (відомий баг Chrome). */
  keep: unknown;
}

export function createTts(env: TtsEnv, cfg: TtsConfig = {}): Tts {
  const { synth, clips: clipEnv } = env;
  const voiceWaitMs = cfg.voiceWaitMs ?? VOICE_WAIT_MS;
  const cooldownMs = cfg.cancelCooldownMs ?? CANCEL_COOLDOWN_MS;

  let state: TtsState = {
    unlocked: false,
    status: synth ? 'loading' : 'unsupported',
    speaking: false,
    voices: [],
    voiceCount: 0,
    voiceURI: null,
    rate: DEFAULT_RATE,
    volume: 1,
  };
  const listeners = new Set<() => void>();
  const queue: Job[] = [];
  let active: Active | null = null;
  let coolingDown = false;
  let hidden = false;
  let voicesSettled = !synth;
  let voiceWaiters: (() => void)[] = [];
  let clipSet: ReadonlySet<string> = new Set();

  function patch(p: Partial<TtsState>): void {
    state = { ...state, ...p };
    for (const l of [...listeners]) l();
  }

  // ---------- Голоси ----------
  function refreshVoices(): void {
    if (!synth) return;
    const all = synth.getVoices();
    const polish = polishVoices(all);
    const same = polish.length === state.voices.length && polish.every((v, i) => v.voiceURI === state.voices[i]?.voiceURI);
    const status: TtsStatus = polish.length > 0 ? 'ready' : voicesSettled ? 'no-voice' : 'loading';
    if (!same || status !== state.status || all.length !== state.voiceCount) {
      patch({ voices: same ? state.voices : polish, status, voiceCount: all.length });
    }
    if (polish.length > 0) flushVoiceWaiters();
  }

  function flushVoiceWaiters(): void {
    const waiters = voiceWaiters;
    voiceWaiters = [];
    for (const w of waiters) w();
  }

  if (synth) {
    synth.onvoiceschanged = refreshVoices;
    refreshVoices();
    if (!voicesSettled) {
      setTimeout(() => {
        voicesSettled = true;
        refreshVoices();
        flushVoiceWaiters();
      }, voiceWaitMs);
    }
  }
  if (clipEnv) {
    clipEnv.load().then(
      (list) => { clipSet = new Set(list); },
      () => { /* немає маніфесту — синтез */ },
    );
  }

  // ---------- Черга ----------
  /** Chrome губить speak(), викликаний одразу після cancel(), тому після скасування трохи чекаємо. */
  function startCooldown(): void {
    if (coolingDown) return;
    coolingDown = true;
    setTimeout(() => {
      coolingDown = false;
      pump();
    }, cooldownMs);
  }

  function finish(a: Active, result: SpeakResult): void {
    if (a.done) return;
    a.done = true;
    if (a.timer !== undefined) clearTimeout(a.timer);
    a.keep = undefined;
    if (active === a) active = null;
    a.job.resolve(result);
    pump();
  }

  function pump(): void {
    if (active || coolingDown) return;
    const job = queue.shift();
    if (!job) {
      if (state.speaking) patch({ speaking: false });
      return;
    }
    if (!state.speaking) patch({ speaking: true });
    begin(job);
  }

  function begin(job: Job): void {
    const a: Active = { job, done: false, stop: () => {}, timer: undefined, keep: undefined };
    active = a;
    if (clipEnv && clipSet.has(job.clip)) playClip(a, clipEnv);
    else speakSynth(a);
  }

  function speakSynth(a: Active): void {
    if (!synth) return finish(a, 'skipped');
    refreshVoices(); // голоси могли з'явитися без події voiceschanged
    if (!voicesSettled && state.status === 'loading') {
      // Польські голоси ще вантажаться: чекаємо (не довше voiceWaitMs); до того часу фраза лишається «активною»
      voiceWaiters.push(() => {
        if (!a.done) speakSynth(a);
      });
      return;
    }
    const voice = pickVoice(synth.getVoices(), state.voiceURI);
    if (!voice) return finish(a, 'skipped');

    const u = env.makeUtterance(a.job.text);
    u.lang = voice.lang;
    u.voice = voice;
    u.rate = clamp(state.rate * a.job.rate, 0.3, 2);
    u.volume = state.volume;
    u.pitch = 1;
    u.onend = () => finish(a, 'spoken');
    u.onerror = (e) => finish(a, e.error === 'canceled' || e.error === 'interrupted' ? 'cancelled' : 'skipped');
    a.keep = u;
    a.stop = () => synth.cancel();
    a.timer = setTimeout(() => {
      // Спершу пауза й finish, потім cancel(): його синхронна подія error вже нічого не змінить
      startCooldown();
      finish(a, 'skipped');
      synth.cancel();
    }, watchdogMs(a.job.text, u.rate));
    synth.speak(u);
  }

  function playClip(a: Active, env2: ClipEnv): void {
    const audio = env2.make(env2.url(a.job.clip));
    audio.volume = state.volume;
    const fallback = (): void => {
      if (a.done) return;
      audio.onended = null;
      audio.onerror = null;
      if (a.timer !== undefined) clearTimeout(a.timer);
      try {
        audio.pause();
      } catch {
        /* ігноруємо */
      }
      speakSynth(a); // файл не зіграв — озвучуємо синтезом
    };
    audio.onended = () => finish(a, 'spoken');
    audio.onerror = fallback;
    a.keep = audio;
    a.stop = () => audio.pause();
    a.timer = setTimeout(fallback, CLIP_WATCHDOG_MS);
    audio.play().catch(fallback);
  }

  function stopAll(result: SpeakResult): void {
    for (const job of queue.splice(0)) job.resolve(result);
    const a = active;
    if (!a) return;
    startCooldown();
    finish(a, result); // спершу вирішуємо: синхронний error від cancel() нічого не змінить
    a.stop();
  }
  const cancelAll = (): void => stopAll('cancelled');

  // ---------- Публічне API ----------
  function speak(text: string, opts: SpeakOptions = {}): Promise<SpeakResult> {
    const clean = text.trim();
    if (import.meta.env.DEV && /\d/.test(clean)) {
      console.warn(`tts.speak: у тексті цифри («${clean}») — числа озвучуємо словами (numberWords.ts)`);
    }
    if (!clean || !state.unlocked || hidden) return Promise.resolve('skipped');
    if (opts.interrupt) cancelAll();
    return new Promise<SpeakResult>((resolve) => {
      queue.push({ text: clean, rate: opts.rate ?? 1, clip: opts.clip ?? clipSlug(clean), resolve });
      pump();
    });
  }

  function unlock(): void {
    if (state.unlocked) return;
    patch({ unlocked: true });
    refreshVoices();
    if (!synth || synth.speaking) return;
    // Тиха «розминка» просто в жесті: iOS дозволяє подальші speak() лише після першого виклику з дотику.
    const primer = env.makeUtterance(' ');
    primer.volume = 0;
    synth.speak(primer);
    setTimeout(() => {
      if (!active && synth.speaking) synth.cancel(); // розминка «застрягла» — не блокуємо чергу браузера
    }, PRIME_CLEANUP_MS);
  }

  /** Вкладку сховано (застосунок згорнуто, екран заблоковано): голос замовкає, а фрази, що звучали чи чекали, вирішуються як 'skipped' —
   *  сценарій (похвала, підказка, показ «разом») іде далі без голосу, а не обривається, інакше завдання зависло б у фазі відгуку.
   *  Поки вкладку сховано, нові фрази теж не звучать. */
  function setHidden(next: boolean): void {
    hidden = next;
    if (next) stopAll('skipped');
  }

  return {
    speak,
    cancel: cancelAll,
    setHidden,
    unlock,
    setRate: (rate) => patch({ rate: clamp(rate, 0.5, 1.5) }),
    setVolume: (volume) => patch({ volume: clamp(volume, 0, 1) }),
    setVoiceURI: (voiceURI) => patch({ voiceURI }),
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ---------- Справжній браузер ----------
export function browserEnv(): TtsEnv {
  const hasSpeech =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const base = import.meta.env.BASE_URL;
  return {
    synth: hasSpeech ? (window.speechSynthesis as unknown as SynthLike) : undefined,
    makeUtterance: (text) => new SpeechSynthesisUtterance(text) as unknown as UtteranceLike,
    clips:
      typeof Audio === 'undefined'
        ? undefined
        : {
            load: () => loadClipManifest(base),
            url: (slug) => clipUrl(base, slug),
            make: (url) => new Audio(url) as unknown as AudioLike,
          },
  };
}

/** Єдиний голос додатка. */
export const tts: Tts = createTts(browserEnv());
