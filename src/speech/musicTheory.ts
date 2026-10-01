// Музика, чиста логіка (без Web Audio): ладі й темп кожного світу, послідовність нот за seed, гучність із ducking.
// Рушій, який це грає, — music.ts. Усе тут детерміноване й покрите тестами.
import type { WorldKey } from './nouns';

export type MusicWorld = WorldKey | 'hub';
export type Scene = 'menu' | 'game';
export const MUSIC_WORLDS: readonly MusicWorld[] = ['hub', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'];

// ---------- Лади: п'ятиступеневі (пентатоніка) — будь-яка комбінація нот звучить м'яко, дисонансів немає ----------
export const MAJOR_PENT = [0, 2, 4, 7, 9] as const;
export const MINOR_PENT = [0, 3, 5, 7, 10] as const;
/** «Підвішена»: відкрита, зависла — для космосу. */
export const SUS_PENT = [0, 2, 5, 7, 10] as const;
/** Рюкю: мажорна з великою септимою — мрійлива, для острова. */
export const RYUKYU_PENT = [0, 4, 5, 7, 11] as const;

export interface WorldMusic {
  scale: readonly number[];
  /** MIDI тоніки в 4-й октаві (C4 = 60). */
  root: number;
  bpm: number;
  /** Імовірність, що нота візерунка промовчить: більше — рідша, повітряніша мелодія. */
  rest: number;
  /** Скільки «відлуння» (0–1). */
  echo: number;
  /** Службовий опис для dev-сторінки. */
  label: string;
}

export const WORLD_MUSIC: Readonly<Record<MusicWorld, WorldMusic>> = {
  hub: { scale: MAJOR_PENT, root: 60, bpm: 80, rest: 0.2, echo: 0.2, label: 'C, мажорна пентатоніка, 80' },
  w1: { scale: MAJOR_PENT, root: 62, bpm: 72, rest: 0.2, echo: 0.2, label: 'D, мажорна пентатоніка, 72 — світла лука' },
  w2: { scale: MAJOR_PENT, root: 57, bpm: 68, rest: 0.25, echo: 0.22, label: 'A, мажорна пентатоніка, 68 — спокійний сад' },
  w3: { scale: RYUKYU_PENT, root: 62, bpm: 64, rest: 0.25, echo: 0.3, label: 'D, рюкю, 64 — мрійливий острів' },
  w4: { scale: MAJOR_PENT, root: 65, bpm: 76, rest: 0.15, echo: 0.2, label: 'F, мажорна пентатоніка, 76 — бадьорий міст' },
  w5: { scale: MINOR_PENT, root: 57, bpm: 60, rest: 0.3, echo: 0.25, label: 'A, мінорна пентатоніка, 60 — тихий ліс' },
  w6: { scale: SUS_PENT, root: 63, bpm: 70, rest: 0.2, echo: 0.22, label: 'E♭, підвішена, 70 — місто' },
  w7: { scale: SUS_PENT, root: 58, bpm: 54, rest: 0.35, echo: 0.35, label: 'B♭, підвішена, 54 — космос' },
};

export const midiToHz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** Нота ладу за номером ступеня (будь-яким, і від'ємним): ступінь 5 — тоніка октавою вище. */
export function scaleNote(world: MusicWorld, degree: number): number {
  const { scale, root } = WORLD_MUSIC[world];
  const n = scale.length;
  const octave = Math.floor(degree / n);
  return root + 12 * octave + (scale[((degree % n) + n) % n] ?? 0);
}

// ---------- Випадковість за seed ----------
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Змішує числа в один seed (FNV-подібний хеш). */
export function mixSeed(...parts: number[]): number {
  let h = 0x811c9dc5;
  for (const p of parts) {
    h = Math.imul(h ^ (p | 0), 16777619);
    h ^= h >>> 13;
  }
  return h >>> 0;
}

// ---------- Мелодія ----------
export type Voice = 'melody' | 'bass';
export interface NoteEvent {
  voice: Voice;
  /** Позиція в такті, у чвертях (0 ≤ beat < 4). */
  beat: number;
  midi: number;
  /** Скільки чвертей нота «дзвенить»; рушій переводить це в час затухання. */
  dur: number;
  /** Відносна гучність 0–1. */
  gain: number;
}

export const BEATS_PER_BAR = 4;
export const BARS_PER_PHRASE = 4;
/** Мелодія грає ступені MELODY_MIN…MELODY_MAX відносно тоніки октавою вище (≈ G4…C6). */
const MELODY_OFFSET = 5;
const MELODY_MIN = -2;
const MELODY_MAX = 5;
const BASS_OFFSET = -5;
const TOP_MIDI = 86; // вище «музична скринька» вже різка: переносимо вниз на октаву

const PATTERNS: readonly (readonly number[])[] = [
  [0, 1, 2, 3], [0, 1.5, 2, 3], [0, 2], [0, 0.5, 1, 2.5], [0.5, 1, 2, 3], [0, 1, 3], [0, 1.5, 2.5],
];
const CADENCE: readonly number[] = [0, 1, 2]; // кінець фрази: остання нота — тоніка, довга
const STEPS = [-2, -1, -1, 1, 1, 2] as const;

const pick = <T>(rng: () => number, items: readonly T[]): T => items[Math.floor(rng() * items.length)] as T;
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

function melodyMidi(world: MusicWorld, degree: number): number {
  let midi = scaleNote(world, degree + MELODY_OFFSET);
  while (midi > TOP_MIDI) midi -= 12;
  return midi;
}

/**
 * Один такт музики. Не залежить від попередніх тактів: «якорі» ступенів задає seed фрази (4 такти),
 * тож будь-який такт можна згенерувати окремо. Кінець кожної фрази — тоніка.
 */
export function generateBar(world: MusicWorld, seed: number, bar: number): NoteEvent[] {
  const cfg = WORLD_MUSIC[world];
  const phrase = Math.floor(bar / BARS_PER_PHRASE);
  const pos = bar % BARS_PER_PHRASE;
  const world$ = MUSIC_WORLDS.indexOf(world);

  const pr = mulberry32(mixSeed(seed, world$, phrase));
  const anchors = [pick(pr, [0, 2, 3]), pick(pr, [-1, 1, 2, 3, 4]), pick(pr, [-1, 1, 2, 3, 4]), pick(pr, [1, 2, 4])];
  const bassDegrees = [0, pick(pr, [2, 3]), pick(pr, [1, 3, 4]), 0];

  const events: NoteEvent[] = [
    { voice: 'bass', beat: 0, midi: scaleNote(world, (bassDegrees[pos] ?? 0) + BASS_OFFSET), dur: BEATS_PER_BAR, gain: 0.55 },
  ];

  const br = mulberry32(mixSeed(seed, world$, bar, 7));
  const cadence = pos === BARS_PER_PHRASE - 1;
  const pattern = cadence ? CADENCE : pick(br, pos === 0 ? PATTERNS.filter((p) => p[0] === 0) : PATTERNS);

  let degree = anchors[pos] ?? 0;
  pattern.forEach((beat, i) => {
    const last = i === pattern.length - 1;
    // rng викликаємо завжди: послідовність не залежить від того, які ноти промовчали
    const step = pick(br, STEPS);
    const skip = br() < cfg.rest;
    const velocity = 0.7 + 0.3 * br();
    if (i > 0) degree = clamp(degree + step, MELODY_MIN, MELODY_MAX);
    if (cadence && last) degree = 0;
    else if (cadence && i === 1) degree = degree > 0 ? degree - 1 : degree + 1;
    if (i > 0 && skip && !(cadence && last)) return;
    const next = pattern[i + 1];
    events.push({
      voice: 'melody',
      beat,
      midi: melodyMidi(world, degree),
      dur: cadence && last ? BEATS_PER_BAR - beat : Math.max(2, (next ?? BEATS_PER_BAR) - beat + 1),
      gain: i === 0 ? 1 : velocity,
    });
  });
  return events;
}

// ---------- Гучність: повзунок «Muzyka», сцена, ducking під голосом ----------
export const DEFAULT_VOLUME = 0.3; // «Muzyka» за замовчуванням ≈ 30 %
/** У завданнях музика тихіша: увага дитини — на задачі. */
export const SCENE_LEVEL: Readonly<Record<Scene, number>> = { menu: 1, game: 0.5 };
/** Скільки лишається від гучності, поки говорить голос. */
export const DUCK_LEVEL = 0.2;
/** Сталі часу плавної зміни гучності, с: стихає швидко, повертається повільно — «видихає» після голосу. */
export const TAU = { duckAttack: 0.1, duckRelease: 0.9, user: 0.05, scene: 0.4, fade: 0.5 } as const;

export interface GainInput {
  volume: number;
  scene: Scene;
  speaking: boolean;
  hidden: boolean;
  playing: boolean;
}

export function musicGain({ volume, scene, speaking, hidden, playing }: GainInput): number {
  if (!playing || hidden) return 0;
  return clamp(volume, 0, 1) * SCENE_LEVEL[scene] * (speaking ? DUCK_LEVEL : 1);
}
