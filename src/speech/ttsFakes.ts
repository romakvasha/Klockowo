// Підробки браузера для тестів голосу (tts.test.ts, recorded.test.ts): поводяться, як Chrome. Гра їх не імпортує.
import type { ClipManifest } from './clips';
import type { Lang } from './langCode';
import { createTts, type AudioLike, type ClipEnv, type SynthLike, type TtsConfig, type UtteranceLike } from './tts';
import type { VoiceLike } from './voices';

export class FakeUtterance implements UtteranceLike {
  lang = '';
  voice: VoiceLike | null = null;
  rate = 1;
  volume = 1;
  pitch = 1;
  onend: (() => void) | null = null;
  onerror: ((e: { error?: string }) => void) | null = null;
  constructor(public text: string) {}
}

export class FakeSynth implements SynthLike {
  speaking = false;
  onvoiceschanged: (() => void) | null = null;
  utterances: FakeUtterance[] = [];
  cancelCount = 0;
  constructor(public voices: VoiceLike[]) {}
  speak(u: UtteranceLike): void {
    this.utterances.push(u as FakeUtterance);
    this.speaking = true;
  }
  /** Як Chrome: cancel() завершує поточну фразу подією error 'canceled'. */
  cancel(): void {
    this.cancelCount++;
    this.speaking = false;
    this.utterances.at(-1)?.onerror?.({ error: 'canceled' });
  }
  getVoices(): VoiceLike[] {
    return this.voices;
  }
  /** Справжні фрази (без тихої «розминки» unlock). */
  get real(): FakeUtterance[] {
    return this.utterances.filter((u) => u.text !== ' ');
  }
  /** Озвучення фрази закінчилось. */
  end(u: FakeUtterance | undefined = this.real.at(-1)): void {
    this.speaking = false;
    u?.onend?.();
  }
}

export class FakeAudio implements AudioLike {
  volume = 1;
  playbackRate = 1;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  played = false;
  paused = false;
  /** Як iOS без дотику: play() відхиляється. */
  constructor(public url: string, private refuse = false) {}
  play(): Promise<void> {
    this.played = true;
    return this.refuse ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
  /** Запис дограв. */
  end(): void {
    this.onended?.();
  }
}

export const PL: VoiceLike = { name: 'Microsoft Paulina', lang: 'pl-PL', voiceURI: 'paulina', localService: true };
export const PL2: VoiceLike = { name: 'Google polski', lang: 'pl-PL', voiceURI: 'google-pl', localService: false };
export const EN: VoiceLike = { name: 'Microsoft Zira', lang: 'en-US', voiceURI: 'zira', localService: true };

export interface FakeClips {
  /** Маніфести за мовою; мови без маніфеста — записів немає. */
  manifests?: Partial<Record<Lang, ClipManifest>>;
  /** play() відхиляється (iOS без дотику). */
  refuse?: boolean;
}

export function setup(voices: VoiceLike[] = [EN, PL], cfg: TtsConfig = {}, fake: FakeClips | null = null) {
  const synth = new FakeSynth(voices);
  const audios: FakeAudio[] = [];
  const loads: Lang[] = [];
  let primes = 0;
  const clips: ClipEnv | undefined = fake
    ? {
        load: (lang) => {
          loads.push(lang);
          return Promise.resolve(fake.manifests?.[lang] ?? null);
        },
        url: (lang, file) => `audio/${lang}/${file}.mp3`,
        make: (url) => {
          const a = new FakeAudio(url, fake.refuse);
          audios.push(a);
          return a;
        },
        prime: () => {
          primes++;
        },
      }
    : undefined;
  const tts = createTts({ synth, makeUtterance: (t) => new FakeUtterance(t), clips }, cfg);
  return { synth, tts, audios, loads, primes: () => primes };
}
