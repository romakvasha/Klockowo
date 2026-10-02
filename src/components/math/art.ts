// Арт предметів лічби й тваринок із src/assets (BRIEF §10). Предмети W1–W3 намальовано в дизайні; W4–W7 — ще ні (itemUrl → null).
import type { AnimalId, ObjectId } from '../../speech/nouns';

const items = import.meta.glob<string>('../../assets/items/*.svg', { query: '?url', import: 'default', eager: true });
const animals = import.meta.glob<string>('../../assets/animals/*.svg', { query: '?url', import: 'default', eager: true });
const hands = import.meta.glob<string>('../../assets/hands/*.svg', { query: '?url', import: 'default', eager: true });

const ITEM_URLS = new Map<string, string>();
for (const [path, url] of Object.entries(items)) {
  const id = /\/w\d-([a-z]+)\.svg$/.exec(path)?.[1];
  if (id) ITEM_URLS.set(id, url);
}

const ANIMAL_URLS = new Map<string, string>();
for (const [path, url] of Object.entries(animals)) {
  const name = /\/animal-([a-z]+(?:-happy)?)\.svg$/.exec(path)?.[1];
  if (name) ANIMAL_URLS.set(name, url);
}

/** Картинка предмета (квадрат; пропорції 1 : 1) або null, якщо його ще не намальовано. */
export function itemUrl(id: ObjectId): string | null {
  return ITEM_URLS.get(id) ?? null;
}

/** Тваринка 120×136; `happy` — радісна (Koniec poziomu, наліпка). */
export function animalUrl(id: AnimalId, happy = false): string {
  const url = ANIMAL_URLS.get(happy ? `${id}-happy` : id);
  if (!url) throw new Error(`Animal art not found: ${id}${happy ? ' (happy)' : ''}`);
  return url;
}

const HAND_URLS = new Map<number, string>();
for (const [path, url] of Object.entries(hands)) {
  const n = /\/hand-(\d+)\.svg$/.exec(path)?.[1];
  if (n !== undefined) HAND_URLS.set(Number(n), url);
}

/** Рука, що показує 0–5 пальців (100×124). Для 6–10 беруть дві руки: 5 і решту (handsFor у setCard.ts). */
export function handUrl(fingers: number): string {
  const url = HAND_URLS.get(fingers);
  if (!url) throw new Error(`Hand art not found: ${fingers}`);
  return url;
}

/** Предмети з готовим малюнком (для тесту: збігаються з файлами в assets/items). */
export function drawnItemIds(): string[] {
  return [...ITEM_URLS.keys()];
}
