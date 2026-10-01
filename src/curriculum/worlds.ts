import { WORLD_OBJECT_IDS, type WorldKey } from '../speech/nouns';
import type { GameId, LevelId, World, WorldId } from './types';

/** 7 світів і хаб (BRIEF §5, PEDAGOGY §1). Назви світів — WORLD_NAMES у speech/lines.ts; кольори тут = --kl-wN-500 у tokens.css. */
export const WORLDS: readonly World[] = [
  {
    id: 'w1', order: 1, color: '#7BCB5A', guest: 'latka', range: [1, 10], mainLevels: 12, starLevels: 0, starBranchAfter: null,
    games: ['policzIDotknij', 'blysk', 'nakarmZwierzaka'], objects: WORLD_OBJECT_IDS.w1,
  },
  {
    id: 'w2', order: 2, color: '#FF9F43', guest: 'latka', range: [0, 10], mainLevels: 12, starLevels: 0, starBranchAfter: null,
    games: ['policzIDotknij', 'blysk', 'cyfraIObrazek', 'zgubionyWagonik', 'nakarmZwierzaka', 'ktoMaWiecej', 'autobusDziesiatka'],
    objects: WORLD_OBJECT_IDS.w2,
  },
  {
    id: 'w3', order: 3, color: '#3FA9F5', guest: 'pufka', range: [0, 10], mainLevels: 15, starLevels: 0, starBranchAfter: null,
    games: ['blysk', 'autobusDziesiatka', 'domekLiczb', 'ileRazem', 'skokiZabki', 'zrobDziesiatke', 'historyjki'],
    objects: WORLD_OBJECT_IDS.w3,
  },
  {
    // ★-гілка «8+5 через десяток» відкривається, коли пройдено 6 основних вузлів (борд etap2/16: ★-вузол відкритий, коли основний шлях на 7-му)
    id: 'w4', order: 4, color: '#FF6B6B', guest: 'tofik', range: [11, 20], mainLevels: 12, starLevels: 4, starBranchAfter: 6,
    games: [
      'policzIDotknij', 'cyfraIObrazek', 'zgubionyWagonik', 'ktoMaWiecej', 'autobusDziesiatka', 'domekLiczb', 'ileRazem', 'skokiZabki',
      'zrobDziesiatke', 'historyjki',
    ],
    objects: WORLD_OBJECT_IDS.w4,
  },
  {
    id: 'w5', order: 5, color: '#2FA58B', guest: 'tofik', range: [10, 100], mainLevels: 12, starLevels: 0, starBranchAfter: null,
    games: ['zgubionyWagonik', 'nakarmZwierzaka', 'paczkiPoDziesiec'], objects: WORLD_OBJECT_IDS.w5,
  },
  {
    id: 'w6', order: 6, color: '#D46BD8', guest: 'all', range: [1, 100], mainLevels: 12, starLevels: 0, starBranchAfter: null,
    games: ['zgubionyWagonik', 'ktoMaWiecej', 'paczkiPoDziesiec', 'tajemniczaTablica'], objects: WORLD_OBJECT_IDS.w6,
  },
  {
    // ★-гілка «38+5» після навички 42+5 (рівні 7–10): відкривається, коли пройдено 10 основних вузлів
    id: 'w7', order: 7, color: '#6C63FF', guest: 'iskra', range: [20, 100], mainLevels: 12, starLevels: 4, starBranchAfter: 10,
    games: ['skokiZabki', 'zrobDziesiatke', 'tajemniczaTablica', 'historyjki'], objects: WORLD_OBJECT_IDS.w7,
  },
  {
    id: 'hub', order: 8, color: '#FFC21A', guest: null, range: [1, 100], mainLevels: 0, starLevels: 0, starBranchAfter: null,
    games: ['tajemniczaTablica'], objects: [],
  },
];

export const WORLD_IDS: readonly WorldId[] = WORLDS.map((w) => w.id);
/** Лише 7 світів зі стежками (без хаба). */
export const WORLD_KEYS: readonly WorldKey[] = WORLDS.filter((w) => w.id !== 'hub').map((w) => w.id as WorldKey);

const BY_ID: ReadonlyMap<WorldId, World> = new Map(WORLDS.map((w) => [w.id, w]));

export function isWorldId(value: unknown): value is WorldId {
  return typeof value === 'string' && BY_ID.has(value as WorldId);
}

export function worldById(id: WorldId): World {
  const world = BY_ID.get(id);
  if (!world) throw new Error(`Unknown world: ${id}`);
  return world;
}

/** Світ, у якому грає цей ігровий вид (для довідки й тестів каталогу). */
export function worldsWithGame(game: GameId): readonly WorldId[] {
  return WORLDS.filter((w) => w.games.includes(game)).map((w) => w.id);
}

// ---------- Ідентифікатори рівнів ----------
const LEVEL_ID = /^(w[1-7])-(s?)([1-9]\d?)$/;

export interface ParsedLevelId {
  world: WorldKey;
  kind: 'main' | 'star';
  index: number;
}

/** `w1-3` → { w1, main, 3 }; `w4-s2` → { w4, star, 2 }; усе інше — null (параметр маршруту з адресного рядка недовірений). */
export function parseLevelId(id: string): ParsedLevelId | null {
  const m = LEVEL_ID.exec(id);
  if (!m) return null;
  return { world: m[1] as WorldKey, kind: m[2] ? 'star' : 'main', index: Number(m[3]) };
}

export function levelId(world: WorldKey, index: number, kind: 'main' | 'star' = 'main'): LevelId {
  return (kind === 'star' ? `${world}-s${index}` : `${world}-${index}`) as LevelId;
}

/** Усі основні рівні світу за порядком: `w1-1` … `w1-12`. */
export function mainLevelIds(world: WorldKey): readonly LevelId[] {
  const n = worldById(world).mainLevels;
  return Array.from({ length: n }, (_, i) => levelId(world, i + 1));
}

/** ★-гілка світу за порядком: `w4-s1` … `w4-s4` (порожньо, якщо гілки немає). */
export function starLevelIds(world: WorldKey): readonly LevelId[] {
  const n = worldById(world).starLevels;
  return Array.from({ length: n }, (_, i) => levelId(world, i + 1, 'star'));
}
