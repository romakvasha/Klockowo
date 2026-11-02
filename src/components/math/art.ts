// Арт предметів лічби, тваринок і рук — картинки v2 (src/assets/v2; тваринки — D4, предмети й руки — D6): усі 28 предметів W1–W7.
// Пропорції різні, тож <img> вписує їх object-fit: contain (global.css, img[src*='/animal-'], '/item-', '/hand-').
import type { AnimalId, ObjectId } from '../../speech/nouns';

const items = import.meta.glob<string>('../../assets/v2/items/*.webp', { query: '?url', import: 'default', eager: true });
const animals = import.meta.glob<string>('../../assets/v2/animals/*.webp', { query: '?url', import: 'default', eager: true });
const brickDigits = import.meta.glob<string>('../../assets/v2/digits/*.webp', { query: '?url', import: 'default', eager: true });
const hands = import.meta.glob<string>('../../assets/v2/hands/*.webp', { query: '?url', import: 'default', eager: true });

const ITEM_URLS = new Map<string, string>();
for (const [path, url] of Object.entries(items)) {
  const id = /\/item-([a-z]+)\.webp$/.exec(path)?.[1];
  if (id) ITEM_URLS.set(id, url);
}

const ANIMAL_URLS = new Map<string, string>();
for (const [path, url] of Object.entries(animals)) {
  const name = /\/animal-([a-z]+(?:-happy)?)\.webp$/.exec(path)?.[1];
  if (name) ANIMAL_URLS.set(name, url);
}

/** Картинка предмета (вписується в квадрат). */
export function itemUrl(id: ObjectId): string {
  const url = ITEM_URLS.get(id);
  if (!url) throw new Error(`Item art not found: ${id}`);
  return url;
}

/** Тваринка (коробка 120×136, картинка вписана); `happy` — радісна (Koniec poziomu, наліпка). */
export function animalUrl(id: AnimalId, happy = false): string {
  const url = ANIMAL_URLS.get(happy ? `${id}-happy` : id);
  if (!url) throw new Error(`Animal art not found: ${id}${happy ? ' (happy)' : ''}`);
  return url;
}

const HAND_URLS = new Map<number, string>();
for (const [path, url] of Object.entries(hands)) {
  const n = /\/hand-(\d+)\.webp$/.exec(path)?.[1];
  if (n !== undefined) HAND_URLS.set(Number(n), url);
}

/** Рука, що показує 0–5 пальців (вища, ніж широка; вписується). Для 6–10 беруть дві руки: 5 і решту (handsFor у setCard.ts). */
export function handUrl(fingers: number): string {
  const url = HAND_URLS.get(fingers);
  if (!url) throw new Error(`Hand art not found: ${fingers}`);
  return url;
}

/** Цифра з цеглинок 0–9 — лише прикраса (Plac Zabaw): у розмірі плитки читається гірше, ніж шкільні SVG-цифри (Digits), тож на плитках її немає. */
export function brickDigitUrl(digit: number): string {
  const entry = Object.entries(brickDigits).find(([path]) => path.endsWith(`/digit-${digit}.webp`));
  if (!entry) throw new Error(`Brick digit not found: ${digit}`);
  return entry[1];
}

/** Предмети з картинкою (для тесту: усі 28 предметів W1–W7). */
export function drawnItemIds(): string[] {
  return [...ITEM_URLS.keys()];
}
