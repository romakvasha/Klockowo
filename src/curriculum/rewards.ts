// Нагороди (BRIEF §6 п.9–10, M20): сторінка альбому на кожен світ (врятовані тваринки — по одній за пройдений рівень, машинка гостя й споруда — після свята світу),
// наліпки для вільної сцени й значки «Nie poddajesz się!». Чиста логіка над мінімальним знімком прогресу.
import type { TeamMember, VehicleKind } from '../characters/poses';
import type { AnimalId } from '../speech/nouns';
import { rescuedAnimal } from './flow';
import { levelsOfWorld } from './levels';
import type { LevelId, WorldKey } from './types';
import { WORLD_KEYS, worldById } from './worlds';

/** Що дитина вже має. */
export interface RewardsProgress {
  readonly levels: Readonly<Record<string, unknown>>;
  readonly celebrated: readonly WorldKey[];
}

/** Слот сторінки альбому: тваринка рівня, машинка гостя чи споруда світу. owned — вже є; інакше показується силует зі «?». */
export type AlbumSlot =
  | { kind: 'animal'; level: LevelId; animal: AnimalId; owned: boolean; star: boolean }
  | { kind: 'vehicle'; world: WorldKey; vehicle: VehicleKind; owned: boolean }
  | { kind: 'building'; world: WorldKey; owned: boolean };

/** Транспорт світу: гість місій веде свою машинку (W6 — «усі разом»: паровозик). */
export function vehicleOfWorld(world: WorldKey): VehicleKind {
  const guest = worldById(world).guest;
  const byGuest: Record<TeamMember, VehicleKind> = { latka: 'balon', pufka: 'zaglowka', tofik: 'pociag', iskra: 'rakieta' };
  return guest === 'all' || guest === null ? 'pociag' : byGuest[guest];
}

/** Сторінка альбому світу: тваринка за кожен основний рівень (потім ★-рівні), далі машинка й споруда. */
export function albumSlots(world: WorldKey, progress: RewardsProgress): AlbumSlot[] {
  const celebrated = progress.celebrated.includes(world);
  const animals = levelsOfWorld(world).map((l): AlbumSlot => ({
    kind: 'animal', level: l.id, animal: rescuedAnimal(l.id), owned: Object.hasOwn(progress.levels, l.id), star: l.kind === 'star',
  }));
  return [...animals, { kind: 'vehicle', world, vehicle: vehicleOfWorld(world), owned: celebrated }, { kind: 'building', world, owned: celebrated }];
}

/** Скільки наліпок на сторінці світу є / усього. */
export function albumCount(world: WorldKey, progress: RewardsProgress): { owned: number; total: number } {
  const slots = albumSlots(world, progress);
  return { owned: slots.filter((s) => s.owned).length, total: slots.length };
}

/** Тваринки-наліпки, які дитина може ставити на вільну сцену: усі різні тваринки, врятовані в пройдених рівнях, за порядком програми. */
export function sceneStickers(progress: RewardsProgress): AnimalId[] {
  const seen = new Set<AnimalId>();
  for (const world of WORLD_KEYS) {
    for (const l of levelsOfWorld(world)) if (Object.hasOwn(progress.levels, l.id)) seen.add(rescuedAnimal(l.id));
  }
  return [...seen];
}

/** Альбом порожній: нічого не пройдено й жоден світ не відсвятковано. */
export const isAlbumEmpty = (progress: RewardsProgress): boolean => Object.keys(progress.levels).length === 0 && progress.celebrated.length === 0;
