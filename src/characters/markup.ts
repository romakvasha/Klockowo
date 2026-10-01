// Збірка розмітки персонажів: поза + (рот A/O/E) + (аксесуар світу) + (картка з числом) → рядок для <svg>.
import { digitArt } from '../components/ui/digitArt';
import { layoutDigits } from '../components/ui/digitLayout';
import { parseSvg } from '../components/ui/svgArt';
import type { WorldKey } from '../speech/nouns';
import { ACCESSORY_SVG, KUBIK_SVG, TEAM_SVG, need } from './art';
import { MOUTH_SHAPES, type KubikPose, type TeamMember, type TeamPose } from './poses';
import {
  eyesOpen, extractGroup, groupContent, idsToParts, injectAccessory, insertBefore, withMouths, wrapTail, type Mouths,
} from './rigMarkup';

/** Готова розмітка: viewBox, внутрішній вміст <svg> (id замінено на data-part) і чи можна кліпати. */
export interface RigMarkup {
  viewBox: string;
  inner: string;
  blink: boolean;
}

function readInner(source: string): { viewBox: string; inner: string } {
  return parseSvg(source);
}

let mouths: Mouths | undefined;
function talkingMouths(): Mouths {
  if (!mouths) {
    const content = (shape: string): string => {
      const group = extractGroup(readInner(need(KUBIK_SVG, `talking-${shape}`, 'Kubik pose')).inner, 'mouth');
      if (group === null) throw new Error(`talking-${shape} has no #mouth`);
      return groupContent(group);
    };
    const [a, o, e] = MOUTH_SHAPES.map(content);
    mouths = { a: a ?? '', o: o ?? '', e: e ?? '' };
  }
  return mouths;
}

// Картка-число в лапах (поза with-card): між тілом і лапами, 48×60, цифри ink; двоцифрові — дрібніше.
const CARD = { x: 76, y: 132, w: 48, h: 60, pad: 8 } as const;

/** Картка з числом у системі координат пози; `value` 0–99. */
export function cardMarkup(value: number): string {
  const layout = layoutDigits(value);
  const digitH = layout.glyphs.length > 1 ? 28 : 38;
  const digitW = (digitH * layout.width) / layout.height;
  const x = CARD.x + (CARD.w - digitW) / 2;
  const y = CARD.y + (CARD.h - digitH) / 2;
  const glyphs = layout.glyphs
    .map((g) => `<g transform="translate(${g.x} 0)">${digitArt(g.digit).inner}</g>`)
    .join('');
  return (
    `<g id="card"><rect x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" rx="10" fill="#FFFFFF" stroke="#2D2A4A" stroke-width="4.5" stroke-linejoin="round"></rect>` +
    `<svg x="${x}" y="${y}" width="${digitW}" height="${digitH}" viewBox="0 0 ${layout.width} ${layout.height}" fill="none" stroke="#2D2A4A" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">${glyphs}</svg></g>`
  );
}

export interface KubikOptions {
  /** Аксесуар світу на голові (W1–W7). У хабі аксесуара немає. */
  accessory?: WorldKey | null;
  /** Число на картці для пози with-card. */
  card?: number;
}

const cache = new Map<string, RigMarkup>();

export function kubikMarkup(pose: KubikPose, { accessory = null, card }: KubikOptions = {}): RigMarkup {
  const key = `k|${pose}|${accessory ?? ''}|${pose === 'with-card' ? (card ?? '') : ''}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { viewBox, inner } = readInner(need(KUBIK_SVG, pose, 'Kubik pose'));
  let markup = withMouths(inner, talkingMouths());
  if (accessory) markup = injectAccessory(markup, readInner(need(ACCESSORY_SVG, accessory, 'Kubik accessory')).inner);
  if (pose === 'with-card' && card !== undefined) markup = insertBefore(markup, 'paw-l', cardMarkup(card));
  const made: RigMarkup = { viewBox, inner: idsToParts(wrapTail(markup)), blink: eyesOpen(inner) };
  cache.set(key, made);
  return made;
}

export function teamMarkup(member: TeamMember, pose: TeamPose): RigMarkup {
  const key = `t|${member}|${pose}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { viewBox, inner } = readInner(need(TEAM_SVG, `${member}-${pose}`, 'Team pose'));
  const made: RigMarkup = { viewBox, inner: idsToParts(wrapTail(inner)), blink: eyesOpen(inner) };
  cache.set(key, made);
  return made;
}
