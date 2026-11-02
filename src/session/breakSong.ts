// Пісенька на «Czas na przerwę!» (docs/DESIGN_V2.md §6): «Kubik liczy do dziesięciu» (≈ 2:30) — сцени куплетів (село → цифри → мама-качка → космос → свято)
// за часом пісні (текст на екрані не показується — лише визначає, коли що звучить). Чиста логіка: який розділ і рядок звучать на секунді t.
import { SONG } from '../speech/lines';

export type SongScene = 'village' | 'numbers' | 'duck' | 'space' | 'party';

/** Сцени за порядком появи — для смужки значків під текстом. */
export const SONG_SCENES: readonly SongScene[] = ['village', 'numbers', 'duck', 'space', 'party'];

export interface SongPart {
  scene: SongScene;
  /** Секунда, з якої звучить перший рядок розділу; рядки ділять розділ порівну до початку наступного. */
  start: number;
  lines: readonly string[];
}

/** Файл пісні (public/audio/song; офлайн — кеш голосу `klockowo-voice`, vite.config.ts). */
export const SONG_FILE = 'audio/song/kubik-liczy-do-dziesieciu.mp3';

/** Кінець співу, с (далі — лише програш до кінця файла, 150 с). */
export const SONG_END = 147.5;

/** Початки розділів — за гучністю запису (вокал із ≈ 17 с, паузи ≈ 59 с і ≈ 111 с), решта — рівномірно.
 *  Підлаштувати на слух: змінюються лише ці числа. */
export const SONG_PARTS: readonly SongPart[] = [
  { scene: 'village', start: 17, lines: SONG.village },
  { scene: 'numbers', start: 38, lines: SONG.chorus },
  { scene: 'duck', start: 60, lines: SONG.duck },
  { scene: 'numbers', start: 81, lines: SONG.chorus },
  { scene: 'space', start: 102.5, lines: SONG.space },
  { scene: 'numbers', start: 120.5, lines: SONG.chorus },
  { scene: 'party', start: 138.5, lines: SONG.party },
];

export interface SongMoment {
  scene: SongScene;
  /** Рядок, що звучить; у вступі — null. */
  line: string | null;
  /** Наступний рядок (дрібніше під поточним); у вступі — перший рядок пісні. */
  next: string | null;
  /** Номер розділу (−1 — вступ) і рядка в ньому — щоб React знав, коли рядок змінився. */
  part: number;
  index: number;
}

/** Що на екрані на секунді t: у вступі — сцена першого розділу без рядка; після останнього рядка — він і лишається. */
export function songAt(t: number, parts: readonly SongPart[] = SONG_PARTS, end = SONG_END): SongMoment {
  const p = parts.findLastIndex((x) => t >= x.start);
  const part = parts[p];
  if (!part) return { scene: parts[0]?.scene ?? 'village', line: null, next: parts[0]?.lines[0] ?? null, part: -1, index: -1 };
  const until = parts[p + 1]?.start ?? end;
  const index = Math.min(part.lines.length - 1, Math.floor(((t - part.start) / Math.max(0.001, until - part.start)) * part.lines.length));
  const next = part.lines[index + 1] ?? parts[p + 1]?.lines[0] ?? null;
  return { scene: part.scene, line: part.lines[index] ?? null, next, part: p, index };
}

/** Рядок приспіву, з якого показуються цифри 6…10 («Sześć i siedem, osiem, dziewięć,»); до нього — 1…5. */
export const SONG_SECOND_FIVE = 4;

/** Частка пісні, що минула (0–1), для смужки. */
export const songProgress = (t: number, duration: number): number => (duration > 0 ? Math.min(1, Math.max(0, t / duration)) : 0);

/** Танець: поза Kubika на такті k (кожні DANCE_BEAT_MS) — стрибок, оплески, радість, тупання по колу. */
export const DANCE_BEAT_MS = 900;
export const DANCE_POSES = ['break-jump', 'break-clap', 'happy', 'break-stomp'] as const;
export const dancePose = (beat: number): (typeof DANCE_POSES)[number] => DANCE_POSES[((beat % DANCE_POSES.length) + DANCE_POSES.length) % DANCE_POSES.length] ?? 'happy';
