// Арт персонажів із src/assets (design/extracted/svg): позами й командою — сирі SVG (їх збирає markup.ts),
// транспортом, силуетами й цуценятами — URL для <img>.
const kubik = import.meta.glob<string>('../assets/kubik/kubik-*.svg', { query: '?raw', import: 'default', eager: true });
const accessories = import.meta.glob<string>('../assets/kubik/acc-w*.svg', { query: '?raw', import: 'default', eager: true });
const team = import.meta.glob<string>('../assets/team/team-*.svg', { query: '?raw', import: 'default', eager: true });
const vehicles = import.meta.glob<string>('../assets/team/veh-*.svg', { query: '?url', import: 'default', eager: true });
const silhouettes = import.meta.glob<string>('../assets/team/sil-*.svg', { query: '?url', import: 'default', eager: true });
const pups = import.meta.glob<string>('../assets/pups/pup-*.svg', { query: '?url', import: 'default', eager: true });

function indexBy(sources: Record<string, string>, pattern: RegExp): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const [path, value] of Object.entries(sources)) {
    const name = pattern.exec(path)?.[1];
    if (name) map.set(name, value);
  }
  return map;
}

/** 'idle', 'pointing-left', 'talking-a', … */
export const KUBIK_SVG = indexBy(kubik, /kubik-(.+)\.svg$/);
/** 'w1' … 'w7' */
export const ACCESSORY_SVG = indexBy(accessories, /acc-(w\d)\.svg$/);
/** 'latka-idle', 'tofik-pointing', … */
export const TEAM_SVG = indexBy(team, /team-(.+)\.svg$/);
/** 'balon', 'zaglowka', 'pociag', 'rakieta' */
export const VEHICLE_URL = indexBy(vehicles, /veh-(.+)\.svg$/);
/** 'kubik', 'latka', 'pufka', 'tofik', 'iskra' */
export const SILHOUETTE_URL = indexBy(silhouettes, /sil-(.+)\.svg$/);
/** 'pon', 'nowofundland', 'pudel', 'chart', 'papillon', 'shihtzu', 'sharpei', 'akita' */
export const PUP_URL = indexBy(pups, /pup-(.+)\.svg$/);

export function need(map: ReadonlyMap<string, string>, key: string, what: string): string {
  const value = map.get(key);
  if (value === undefined) throw new Error(`${what} not found: ${key}`);
  return value;
}
