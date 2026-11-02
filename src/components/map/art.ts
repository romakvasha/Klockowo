// Арт світів v2 (D5): картинки Gemini з src/assets/v2/world (tools/art/process.py). Острови, скрині, «Baza Drużyny» й споруди — у precache
// (мапа — перший екран); фони світів (bg-*) і доріжок (path-*) важчі (≈ 3 МБ), тож у першому завантаженні їх немає: вони кешуються, коли
// з'являються на екрані, а картинки світу, в який дитина заходить, підвантажуються наперед (prefetchWorldArt; vite.config — runtimeCaching).
import type { WorldId, WorldKey } from '../../curriculum/types';

const world = import.meta.glob<string>('../../assets/v2/world/*.webp', { query: '?url', import: 'default', eager: true });

function find(sources: Record<string, string>, file: string): string {
  const entry = Object.entries(sources).find(([path]) => path.endsWith(`/${file}`));
  if (!entry) throw new Error(`Map art not found: ${file}`);
  return entry[1];
}

/** Острів мапи: 'w1' … 'w7', 'hub' або 'locked' (туман із замком). */
export const ISLAND_URL = (id: WorldId | 'locked'): string => find(world, `island-${id}.webp`);
export const BASE_URL = (): string => find(world, 'base-druzyna.webp');
/** Скриня світу: 'locked' | 'ready' | 'open'. */
export const CHEST_URL = (state: string): string => find(world, `chest-${state}.webp`);
/** Споруда пройденого світу (вітряк, оранжерея, маяк, міст, будинок на дереві, вежа, ракета). */
export const BUILD_URL = (w: WorldKey): string => find(world, `build-${w}.webp`);

/** Фон екрана: 'start' (село), 'hub' (Plac Zabaw, альбом, перерва) або світ — фон гри, місії, кінця рівня. */
export type BackdropScene = 'start' | WorldId;
export const BG_URL = (scene: BackdropScene): string => find(world, `bg-${scene}.webp`);
/** Фон «Ścieżka świata»: вид згори, посередині порожньо — доріжку з вузлами малює гра. */
export const PATH_URL = (w: WorldKey): string => find(world, `path-${w}.webp`);

const fetched = new Set<string>();

/** Тихо підвантажує фони світу (доріжка й гра), щоб вони були в кеші до першого екрана світу й без мережі. Повторно не просить. */
export function prefetchWorldArt(w: WorldKey): void {
  if (typeof Image === 'undefined') return;
  for (const url of [PATH_URL(w), BG_URL(w)]) {
    if (fetched.has(url)) continue;
    fetched.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}
