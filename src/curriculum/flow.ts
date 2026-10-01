// Потік між екранами рівня (BRIEF §6 «Потік»): що показує Wprowadzenie, яка наліпка відкривається, куди веде «Dalej» після Koniec poziomu.
// Чисті функції: екрани лише викликають їх і відкривають маршрут.
import { ANIMAL_IDS, WORLD_OBJECT_IDS, type AnimalId, type ObjectId } from '../speech/nouns';
import { isWorldComplete, type ProgressSnapshot } from './progression';
import type { Level, LevelId, WorldKey } from './types';
import { parseLevelId, worldById } from './worlds';

/** Предмет, з яким працює місія рівня: W1 починає з kaczuszki («Kaczuszki się zgubiły!» — приклад BRIEF), W3 — з rybki (борд etap2/18);
 *  далі предмети світу чергуються. ★-рівні зсунуто, щоб не збігатися з основним рівнем того ж номера. */
const FIRST_OBJECT: Partial<Record<WorldKey, number>> = { w1: 3, w3: 0 };

export function missionObject(level: Pick<Level, 'world' | 'index' | 'kind'>): ObjectId {
  const objects = WORLD_OBJECT_IDS[level.world];
  const shift = (FIRST_OBJECT[level.world] ?? 0) + (level.kind === 'star' ? level.index + 1 : level.index - 1);
  const object = objects[shift % objects.length];
  if (!object) throw new Error(`No mission object for ${level.world}-${level.index}`);
  return object;
}

/** Врятована тваринка (наліпка рівня): 8 тваринок чергуються за номером рівня; ★-рівні починають із іншої. Підсумкову сітку альбому визначить M20. */
export function rescuedAnimal(id: LevelId): AnimalId {
  const parsed = parseLevelId(id);
  if (!parsed) throw new Error(`Unknown level: ${id}`);
  const n = parsed.kind === 'star' ? parsed.index + 3 : parsed.index - 1;
  const animal = ANIMAL_IDS[n % ANIMAL_IDS.length];
  if (!animal) throw new Error(`No animal for ${id}`);
  return animal;
}

/** Куди веде «Dalej» після Koniec poziomu: на «Świat ukończony», якщо цим проходженням закрито останній основний рівень світу,
 *  інакше — назад на стежку світу (новий вузол світиться, Kubik біжить до нього). */
export type AfterLevel = { screen: 'world-path' | 'world-complete'; world: WorldKey };

export function afterLevel(progress: ProgressSnapshot, id: LevelId, firstTime: boolean): AfterLevel {
  const parsed = parseLevelId(id);
  if (!parsed) throw new Error(`Unknown level: ${id}`);
  const closesWorld = firstTime && parsed.kind === 'main' && parsed.index === worldById(parsed.world).mainLevels && isWorldComplete(progress, parsed.world);
  return { screen: closesWorld ? 'world-complete' : 'world-path', world: parsed.world };
}
