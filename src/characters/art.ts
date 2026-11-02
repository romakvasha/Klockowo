// Арт персонажів v2 (D4): картинки Gemini з src/assets/v2 (tools/art/process.py) — URL для <img> і розмір картинки
// (sizes.json, tools/art/sizes.py), щоб рамка фігури мала пропорції ще до завантаження. Рот Kubika — tools/art/mouths.py.
import SIZES from '../assets/v2/sizes.json';
import MOUTH_FIT from './mouthFit.json';

const kubik = import.meta.glob<string>('../assets/v2/kubik/kubik-*.webp', { query: '?url', import: 'default', eager: true });
const mouths = import.meta.glob<string>('../assets/v2/kubik/mouth/*.webp', { query: '?url', import: 'default', eager: true });
const team = import.meta.glob<string>('../assets/v2/team/*.webp', { query: '?url', import: 'default', eager: true });
const pups = import.meta.glob<string>('../assets/v2/pups/pup-*.webp', { query: '?url', import: 'default', eager: true });

function indexBy(sources: Record<string, string>, pattern: RegExp): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const [path, value] of Object.entries(sources)) {
    const name = pattern.exec(path)?.[1];
    if (name) map.set(name, value);
  }
  return map;
}

/** 'idle', 'pointing-left', 'w3-idle', 'w3-happy', 'talking-a', … */
export const KUBIK_URL = indexBy(kubik, /kubik-([^/]+)\.webp$/);
/** 'idle-a', 'w1-idle-o', … — латка мордочки з ротом A/O/E для пози спокою (з аксесуаром світу чи без). */
export const MOUTH_URL = indexBy(mouths, /mouth\/([^/]+)\.webp$/);
/** 'latka-idle', 'tofik-pointing', … */
export const TEAM_URL = indexBy(team, /team-([^/]+)\.webp$/);
/** 'balon', 'zaglowka', 'pociag', 'rakieta' */
export const VEHICLE_URL = indexBy(team, /veh-([^/]+)\.webp$/);
/** 'pon', 'nowofundland', 'pudel', 'chart', 'papillon', 'shihtzu', 'sharpei', 'akita' */
export const PUP_URL = indexBy(pups, /pup-([^/]+)\.webp$/);

export function need(map: ReadonlyMap<string, string>, key: string, what: string): string {
  const value = map.get(key);
  if (value === undefined) throw new Error(`${what} not found: ${key}`);
  return value;
}

/** Картинка з розміром у px (ширина × висота). */
export interface Art {
  url: string;
  w: number;
  h: number;
}

const sizes: Readonly<Record<string, readonly number[]>> = SIZES;

/** `file` — ім'я файла без розширення (kubik-idle, team-latka-happy). */
export function artOf(map: ReadonlyMap<string, string>, key: string, file: string): Art {
  const size = sizes[file];
  if (!size) throw new Error(`Art size not found: ${file}`);
  return { url: need(map, key, 'Art'), w: size[0] ?? 1, h: size[1] ?? 1 };
}

/** Прямокутник у частках рамки картинки (0–1). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Де лежить мордочка з ротом на позі спокою: 'idle', 'w1-idle' … 'w7-idle'. */
export const MOUTH_BOX: Readonly<Record<string, Box>> = MOUTH_FIT;

/** Порожня картка в лапах kubik-with-card (591×768) — поле для цифр між великими пальцями. */
export const CARD_BOX: Box = { x: 175 / 591, y: 410 / 768, w: 220 / 591, h: 145 / 768 };
