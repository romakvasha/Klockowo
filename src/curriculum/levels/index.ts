import { WORLD_KEYS, levelId, mainLevelIds, starLevelIds, worldById } from '../worlds';
import type { Level, LevelId, WorldKey } from '../types';
import { W1_LEVELS } from './w1';
import { W2_LEVELS } from './w2';
import { W3_LEVELS } from './w3';

/** Заготовка рівня: структура світу відома (номер, вид), завдання опише етап зі PLAN (M9 → W2 … M19 → W7). */
function stub(world: WorldKey, index: number, kind: Level['kind']): Level {
  return { id: levelId(world, index, kind), world, index, kind, newIdea: false, skills: [], tasks: [], draft: true };
}

function buildWorld(world: WorldKey): readonly Level[] {
  if (world === 'w1') return W1_LEVELS;
  if (world === 'w2') return W2_LEVELS;
  if (world === 'w3') return W3_LEVELS;
  const w = worldById(world);
  return [
    ...Array.from({ length: w.mainLevels }, (_, i) => stub(world, i + 1, 'main')),
    ...Array.from({ length: w.starLevels }, (_, i) => stub(world, i + 1, 'star')),
  ];
}

/** Усі рівні програми: 87 основних + 8 ★-рівнів. */
export const LEVELS: readonly Level[] = WORLD_KEYS.flatMap(buildWorld);

const BY_ID: ReadonlyMap<LevelId, Level> = new Map(LEVELS.map((l) => [l.id, l]));

export function levelById(id: LevelId): Level {
  const level = BY_ID.get(id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export function findLevel(id: string): Level | undefined {
  return BY_ID.get(id as LevelId);
}

/** Рівні світу: спершу основні за порядком, потім ★-гілка. */
export function levelsOfWorld(world: WorldKey): readonly Level[] {
  return [...mainLevelIds(world), ...starLevelIds(world)].map(levelById);
}
