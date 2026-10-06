// Типи голосу (Tts, TtsState…) і «навколишнє середовище» (SynthLike, AudioLike…), яке в браузері справжнє, а в тестах підроблене.
// Їх реекспортує tts.ts: усі споживачі імпортують лише з tts.ts.
import type { Lang } from './langCode';
import type { VoiceLike } from './voices';

export type TtsStatus = 'unsupported' | 'loading' | 'no-voice' | 'ready';
/** spoken — договорив; cancelled — скасовано (cancel / interrupt); skipped — не озвучено (немає дотику, голосу, збій). */
export type SpeakResult = 'spoken' | 'cancelled' | 'skipped';

export interface SpeakOptions {
  /** Множник до загального темпу: < 1 — повільніше (плутані пари 13/30, 14/40…). */
  rate?: number;
  /** Спершу скасувати поточну фразу й чергу («Posłuchaj» — повторити інструкцію спочатку). */
  interrupt?: boolean;
  /** slug mp3-файла; за замовчуванням — із тексту фрази (clipSlug). */
  clip?: string;
}

export interface TtsState {
  unlocked: boolean;
  status: TtsStatus;
  speaking: boolean;
  /** Голоси браузера мовою гри (за замовчуванням — польські), найкращі першими. */
  voices: readonly VoiceLike[];
  /** Скільки голосів бачить браузер усього (для діагностики «немає польського»). */
  voiceCount: number;
  /** Голос, обраний у Strefa rodzica; null — автовибір. */
  voiceURI: string | null;
  rate: number;
  volume: number;
}

export interface Tts {
  speak(text: string, opts?: SpeakOptions): Promise<SpeakResult>;
  /** Зупиняє поточну фразу й очищає чергу; усі очікувані Promise вирішуються як 'cancelled'. */
  cancel(): void;
  /** Вкладку сховано / знову видно: схована — голос замовкає, очікувані Promise вирішуються як 'skipped' (сценарії йдуть далі), нові фрази не звучать. */
  setHidden(hidden: boolean): void;
  /** Мова гри: голос і статус — для неї (за замовчуванням польська). */
  setLanguage(lang: Lang): void;
  /** Викликати в обробнику першого дотику (installAudioUnlock робить це сам). */
  unlock(): void;
  setRate(rate: number): void;
  setVolume(volume: number): void;
  setVoiceURI(uri: string | null): void;
  getState(): TtsState;
  subscribe(listener: () => void): () => void;
}

// ---------- Навколишнє середовище (у браузері — справжнє, у тестах — підроблене) ----------
export interface UtteranceLike {
  text: string;
  lang: string;
  voice: VoiceLike | null;
  rate: number;
  volume: number;
  pitch: number;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
}
export interface SynthLike {
  readonly speaking: boolean;
  speak(u: UtteranceLike): void;
  cancel(): void;
  getVoices(): VoiceLike[];
  onvoiceschanged: (() => void) | null;
}
export interface AudioLike {
  volume: number;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play(): Promise<void>;
  pause(): void;
}
export interface ClipEnv {
  load(): Promise<readonly string[]>;
  url(slug: string): string;
  make(url: string): AudioLike;
}
export interface TtsEnv {
  synth: SynthLike | undefined;
  makeUtterance(text: string): UtteranceLike;
  clips?: ClipEnv;
}
export interface TtsConfig {
  /** Скільки чекати на асинхронне завантаження голосів, перш ніж вирішити «польського голосу немає». */
  voiceWaitMs?: number;
  /** Пауза після скасування перед наступною фразою (Chrome губить speak() одразу після cancel()). */
  cancelCooldownMs?: number;
}
