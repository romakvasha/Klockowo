import { parseSvg, type SvgArt } from './svgArt';

/** 26 іконок (design/extracted/svg/icons → src/assets/icons): одна дія — одна іконка (BRIEF §8). badge — квадратний жетон-цеглинка
 *  «Odznaki» (D2b: ★ лише для необов'язкових гілок). На цеглинках v2 значок білий із темним контуром — клас kl-glyph (styles/brick.css). */
export const ICON_NAMES = [
  'play', 'home', 'speaker', 'speaker-off', 'bulb', 'next', 'retry', 'check', 'equal', 'pour', 'pack', 'close',
  'stickers', 'badge', 'lock', 'gear', 'star', 'bone', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'hub',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

const sources = import.meta.glob<string>('../../assets/icons/icon-*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const ICONS = new Map<string, SvgArt>();
for (const [path, source] of Object.entries(sources)) {
  const name = /icon-(.+)\.svg$/.exec(path)?.[1];
  if (name) ICONS.set(name, parseSvg(source));
}

export function iconArt(name: IconName): SvgArt {
  const art = ICONS.get(name);
  if (!art) throw new Error(`Icon not found: ${name}`);
  return art;
}

/** Імена, які реально знайдено в assets (для тесту: збігаються з ICON_NAMES). */
export function loadedIconNames(): string[] {
  return [...ICONS.keys()];
}
