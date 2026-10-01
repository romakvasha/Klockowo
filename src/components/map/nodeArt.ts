// Арт вузла-платформи «Ścieżka świata» (design etap2/14–16, node-*.svg): блок-платформа в кольорах світу, viewBox -52 -60 104 112.
// Малюється розміткою-рядком (як персонажі): колір світу береться з WorldKey, тож один код дає вузли всіх семи світів і ★-вузли.
// Сяйво під «наступним» вузлом — окремий елемент LevelNode (як на бордах), тут лише біла грань. Піксельний візерунок — `url(#kl-px)`: його <pattern> один раз на сторінці визначає WorldPathView.

export type NodeArtState = 'locked' | 'next' | 'done' | 'star' | 'review';

export const NODE_VIEWBOX = '-52 -60 104 112';
export const NODE_PATTERN_ID = 'kl-px';

const INK = '#2D2A4A';
const WHITE = '#FFFFFF';

/** Змішує два кольори #RRGGBB: t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(channel(a, i) * (1 - t) + channel(b, i) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export interface NodePalette {
  top: string;
  left: string;
  right: string;
}

/** Світлий верх, лівий і правий боки темніші: 12 % до білого, 14 % і 28 % до чорнила (виміряно з node-w1-*.svg). */
export function worldPalette(color: string): NodePalette {
  return { top: mix(color, WHITE, 0.12), left: mix(color, INK, 0.14), right: mix(color, INK, 0.28) };
}

export const LOCKED_PALETTE: NodePalette = { top: '#C9C4D6', left: '#928DA6', right: '#827D97' };
export const STAR_PALETTE: NodePalette = { top: '#FFEAB1', left: '#E2AD21', right: '#C49727' };

const LEFT_FACE = 'M-48 0 L0 24 L0 46 L-48 22 Z';
const RIGHT_FACE = 'M48 0 L0 24 L0 46 L48 22 Z';
const TOP_FACE = 'M0 -24 L48 0 L0 24 L-48 0 Z';

const face = (d: string, fill: string) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
const pixels = (d: string) => `<path d="${d}" fill="url(#${NODE_PATTERN_ID})"/>`;

/** «Пройдено»: біла галочка-значок угорі справа й жовта монета-наліпка з серцем на платформі. */
const DONE_BADGES =
  `<g transform="translate(14 -54)"><circle cx="16" cy="16" r="14.5" fill="${WHITE}" stroke="${INK}" stroke-width="3"/>` +
  '<path d="M9.5 16.5 L14 21 L22.5 12" fill="none" stroke="#25964F" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g>' +
  `<g transform="translate(-12 -12)"><circle cx="12" cy="12" r="11" fill="#FFC21A" stroke="${WHITE}" stroke-width="3"/>` +
  `<circle cx="12" cy="12" r="12.5" fill="none" stroke="${INK}" stroke-width="1.5"/>` +
  `<path d="M12 17 C12 17 6.5 13.8 6.5 10.3 C6.5 8.6 7.8 7.3 9.4 7.3 C10.5 7.3 11.4 7.9 12 8.8 C12.6 7.9 13.5 7.3 14.6 7.3 C16.2 7.3 17.5 8.6 17.5 10.3 C17.5 13.8 12 17 12 17 Z" fill="${INK}"/></g>`;

/** «Do powtórki»: лавандова кругова стрілка. */
const REVIEW_BADGE =
  `<g transform="translate(14 -54)"><circle cx="16" cy="16" r="14.5" fill="${WHITE}" stroke="#7F6CE0" stroke-width="3"/>` +
  '<path d="M16 8.5 A7.5 7.5 0 1 1 8.5 16" fill="none" stroke="#7F6CE0" stroke-width="3.5" stroke-linecap="round"/>' +
  '<path d="M8.5 9.5 L4.8 16 L12.2 16 Z" fill="#7F6CE0" stroke="#7F6CE0" stroke-width="1.8" stroke-linejoin="round"/></g>';

/** Замок у колі зліва вгорі. */
const LOCK_BADGE =
  `<g transform="translate(-20 -52)"><circle cx="20" cy="20" r="19" fill="${WHITE}" stroke="${INK}" stroke-width="3"/>` +
  `<g transform="translate(6 5) scale(.6)" fill="${INK}">` +
  `<path d="M16 21 L16 15 C16 10.6 19.6 7 24 7 C28.4 7 32 10.6 32 15 L32 21" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
  '<path fill-rule="evenodd" d="M15 20 H33 A5 5 0 0 1 38 25 V37 A5 5 0 0 1 33 42 H15 A5 5 0 0 1 10 37 V25 A5 5 0 0 1 15 20 Z M20.8 29 A3.2 3.2 0 1 0 27.2 29 A3.2 3.2 0 1 0 20.8 29 Z"/></g></g>';

const STAR_PATH = 'M17 2.5 L21.2 12.8 L32.3 13.5 L23.7 20.6 L26.4 31.4 L17 25.4 L7.6 31.4 L10.3 20.6 L1.7 13.5 L12.8 12.8 Z';

/** Відкритий ★-вузол: велика золота зірка зверху. */
const STAR_BADGE = `<g transform="translate(-17 -40)"><path d="${STAR_PATH}" fill="#FFC21A" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></g>`;

/** Закритий ★-вузол: маленька золота зірочка-чип на правому боці (борд etap2/16, `s4-starchip`). */
const STAR_CHIP =
  '<g transform="translate(19.5 -23) scale(1.083)">' +
  `<circle cx="14" cy="14" r="12.5" fill="#FFEAB1" stroke="${INK}" stroke-width="2.5"/>` +
  `<path d="M14 5.5 L16.6 11.2 L22.8 11.8 L18.1 15.9 L19.5 22 L14 18.8 L8.5 22 L9.9 15.9 L5.2 11.8 L11.4 11.2 Z" fill="#FFC21A" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/></g>`;

export interface NodeArtOptions {
  /** Вузол ★-гілки: золота палітра замість кольору світу, у закритому стані — зірочка-чип. */
  star?: boolean;
}

/** Вміст SVG вузла (без обгортки <svg>) для стану `state` у кольорах світу `color` (#RRGGBB). */
export function nodeMarkup(state: NodeArtState, color: string, { star = false }: NodeArtOptions = {}): string {
  const base = state === 'locked' ? LOCKED_PALETTE : star ? STAR_PALETTE : worldPalette(color);
  const top = state === 'next' ? WHITE : base.top;

  const parts = [
    face(LEFT_FACE, base.left),
    face(RIGHT_FACE, base.right),
    face(TOP_FACE, top),
    pixels(LEFT_FACE),
    pixels(RIGHT_FACE),
    pixels(TOP_FACE),
  ];
  if (state === 'done') parts.push(DONE_BADGES);
  else if (state === 'review') parts.push(REVIEW_BADGE);
  else if (state === 'locked') parts.push(star ? STAR_CHIP : '', LOCK_BADGE);
  else if (state === 'star') parts.push(STAR_BADGE);
  return parts.join('');
}

/** <pattern> піксельного візерунка — вставляється один раз у прихований <svg> сторінки. */
export const NODE_PATTERN =
  `<pattern id="${NODE_PATTERN_ID}" width="16" height="16" patternUnits="userSpaceOnUse">` +
  `<rect width="4" height="4" fill="${WHITE}" fill-opacity=".14"/>` +
  `<rect x="8" y="4" width="4" height="4" fill="${INK}" fill-opacity=".07"/>` +
  `<rect x="4" y="12" width="4" height="4" fill="${INK}" fill-opacity=".06"/>` +
  `<rect x="12" y="8" width="4" height="4" fill="${WHITE}" fill-opacity=".1"/></pattern>`;
