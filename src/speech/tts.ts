// Голос: Web Speech API (pl-PL) — єдине місце в коді, що торкається speechSynthesis (CLAUDE.md).
//  • черга: фрази звучать по одній; speak() повертає Promise, який вирішується, коли голос ДОГОВОРИВ
//    (або фразу скасовано, або голосу немає) — на цьому тримається правило «наступне завдання — лише коли голос договорив»;
//  • до першого дотику (unlock) — тиша: браузер не дозволяє озвучувати без жесту, а застарілі фрази не мають «вибухнути» після нього;
//  • немає польського голосу → status 'no-voice' (екран NoVoice), speak() тихо повертає 'skipped';
//  • мова гри (setLanguage): голос, записи й статус — для польської, української чи англійської;
//  • застосунок згорнуто (setHidden) — голос замовкає, але сценарії не обриваються: фрази вирішуються як 'skipped', не 'cancelled';
//  • записаний голос (public/audio/<мова>/, clips.ts): висловлювання, усі речення якого записано, грає з mp3 речення за реченням
//    (Promise — після останнього); бракує хоч одного речення — усе висловлювання каже браузерний голос;
//  • subscribe() — для React (useTts) і для музики, що стихає під голосом (M2b).
import { sharedClipAudio } from './clipAudio';
import { warmClips } from './clipCache';
import { clipUrl, clipsFor, loadClipManifest, splitSentences, type ClipManifest } from './clips';
import type {
  ClipEnv, RecordedStatus, SpeakOptions, SpeakResult, SynthLike, Tts, TtsConfig, TtsEnv, TtsState, TtsStatus, UtteranceLike,
} from './ttsTypes';
import type { Lang } from './langCode';
import { pickVoiceFor, voicesFor } from './voices';

export type {
  AudioLike, ClipEnv, RecordedStatus, SpeakOptions, SpeakResult, SynthLike, Tts, TtsConfig, TtsEnv, TtsState, TtsStatus, UtteranceLike,
} from './ttsTypes';

export const DEFAULT_RATE = 0.9; // POLISH_COPY §8: числа слухати на ≈0,9
const VOICE_WAIT_MS = 2500; // повільні пристрої вантажать голоси довго; до цього часу status = 'loading'
const CANCEL_COOLDOWN_MS = 80;
const PRIME_CLEANUP_MS = 500;
const CLIP_WATCHDOG_MS = 15000;
const SENTENCE_GAP_MS = 220; // пауза між реченнями запису — як природна пауза в мовленні

const clamp = (x: number, min: number, max: number): number => Math.min(max, Math.max(min, x));

/** Сторожовий таймер: якщо браузер «загубив» подію end (буває), гра не має зависнути. */
export function watchdogMs(text: string, rate: number): number {
  return Math.ceil((text.length * 150) / rate) + 4000;
}

interface Job {
  text: string;
  rate: number;
  /** Файли запису (по одному на речення) або null — каже браузерний голос. */
  files: readonly string[] | null;
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
  const sentenceGapMs = cfg.sentenceGapMs ?? SENTENCE_GAP_MS;

  let state: TtsState = {
    unlocked: false,
    status: synth ? 'loading' : 'unsupported',
    speaking: false,
    voices: [],
    voiceCount: 0,
    voiceURI: null,
    rate: DEFAULT_RATE,
    volume: 1,
    recorded: 'none',
    useRecorded: true,
  };
  const listeners = new Set<() => void>();
  const queue: Job[] = [];
  let active: Active | null = null;
  let coolingDown = false;
  let hidden = false;
  let lang: Lang = 'pl';
  let voicesSettled = !synth;
  let voiceWaiters: (() => void)[] = [];
  /** Записи за мовою: ключа ще немає — не вантажили; null — записів немає (чи ще вантажаться). */
  const manifests: Partial<Record<Lang, ClipManifest | null>> = {};

  function patch(p: Partial<TtsState>): void {
    state = { ...state, ...p };
    for (const l of [...listeners]) l();
  }

  // ---------- Голоси ----------
  function refreshVoices(): void {
    if (!synth) return;
    const all = synth.getVoices();
    const forLang = voicesFor(all, lang);
    const same = forLang.length === state.voices.length && forLang.every((v, i) => v.voiceURI === state.voices[i]?.voiceURI);
    const status: TtsStatus = forLang.length > 0 ? 'ready' : voicesSettled ? 'no-voice' : 'loading';
    if (!same || status !== state.status || all.length !== state.voiceCount) {
      patch({ voices: same ? state.voices : forLang, status, voiceCount: all.length });
    }
    if (forLang.length > 0) flushVoiceWaiters();
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
  // ---------- Записаний голос ----------
  function syncRecorded(): void {
    const m = manifests[lang];
    const recorded: RecordedStatus = !m || Object.keys(m.clips).length === 0 ? 'none' : m.complete ? 'complete' : 'partial';
    if (recorded !== state.recorded) patch({ recorded });
  }

  /** Записи мови вантажаться один раз; статус recorded — для мови гри; найчутніші записи мови гри докачуються для офлайну. */
  function loadRecorded(l: Lang): void {
    if (clipEnv && !(l in manifests)) {
      manifests[l] = null;
      clipEnv.load(l).then(
        (m) => {
          manifests[l] = m;
          if (l !== lang) return;
          syncRecorded();
          if (m) clipEnv.warm?.(l, m);
        },
        () => { /* немає записів — браузерний голос */ },
      );
    } else {
      const m = manifests[l];
      if (m) clipEnv?.warm?.(l, m);
    }
    syncRecorded();
  }

  loadRecorded(lang);

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
    if (clipEnv && job.files) playClips(a, clipEnv, job.files);
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
    const voice = pickVoiceFor(synth.getVoices(), lang, state.voiceURI);
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

  /** Висловлювання з записів: речення одне за одним із паузою; темп — від «Tempo mowy» (звичайний 0,9 — запис як є), гучність — «Mowa».
   *  Файл не зіграв — решту висловлювання (з цього речення) каже браузерний голос. */
  function playClips(a: Active, env2: ClipEnv, files: readonly string[]): void {
    const sentences = splitSentences(a.job.text);
    const l = lang;
    let i = 0;
    const next = (): void => {
      if (a.done) return;
      const file = files[i];
      if (file === undefined) return finish(a, 'spoken');
      i++;
      const audio = env2.make(env2.url(l, file));
      audio.volume = state.volume;
      audio.playbackRate = clamp((state.rate * a.job.rate) / DEFAULT_RATE, 0.5, 2);
      let settled = false;
      const ended = (): void => {
        if (settled || a.done) return;
        settled = true;
        if (a.timer !== undefined) clearTimeout(a.timer);
        if (i >= files.length) finish(a, 'spoken');
        else a.timer = setTimeout(next, sentenceGapMs);
      };
      const failed = (): void => {
        if (settled || a.done) return;
        settled = true;
        if (a.timer !== undefined) clearTimeout(a.timer);
        audio.onended = null;
        audio.onerror = null;
        try {
          audio.pause();
        } catch {
          /* ігноруємо */
        }
        a.job = { ...a.job, text: sentences.slice(i - 1).join(' ') || a.job.text };
        speakSynth(a);
      };
      audio.onended = ended;
      audio.onerror = failed;
      a.keep = audio;
      a.stop = () => {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
      };
      a.timer = setTimeout(failed, CLIP_WATCHDOG_MS);
      audio.play().catch(failed);
    };
    next();
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
    const files = state.useRecorded && clipEnv ? clipsFor(manifests[lang], clean) : null;
    return new Promise<SpeakResult>((resolve) => {
      queue.push({ text: clean, rate: opts.rate ?? 1, files, resolve });
      pump();
    });
  }

  function unlock(): void {
    if (state.unlocked) return;
    patch({ unlocked: true });
    clipEnv?.prime?.();
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

  /** Мова гри: голос, записи й статус («no-voice», якщо голосу цієї мови немає) — для неї; фраза старою мовою обривається. */
  function setLanguage(next: Lang): void {
    if (next === lang) return;
    lang = next;
    cancelAll();
    refreshVoices();
    loadRecorded(next);
  }

  return {
    speak,
    cancel: cancelAll,
    setHidden,
    setLanguage,
    setUseRecorded: (useRecorded) => patch({ useRecorded }),
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
  let stopWarm = (): void => undefined;
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
            load: (l) => loadClipManifest(base, l),
            url: (l, file) => clipUrl(base, l, file),
            ...sharedClipAudio(),
            warm: (l, m) => {
              stopWarm();
              stopWarm = warmClips((m.core ?? []).map((file) => clipUrl(base, l, file)));
            },
          },
  };
}

/** Єдиний голос додатка. */
export const tts: Tts = createTts(browserEnv());
