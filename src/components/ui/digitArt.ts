import { parseSvg, type SvgArt } from './svgArt';

/** SVG-цифри 0–9 у стилі польської школи (design etap1/04): viewBox 100×140, штрих 15 round. */
const sources = import.meta.glob<string>('../../assets/digits/digit-*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const DIGITS = new Map<number, SvgArt>();
for (const [path, source] of Object.entries(sources)) {
  const digit = /digit-(\d)\.svg$/.exec(path)?.[1];
  if (digit !== undefined) DIGITS.set(Number(digit), parseSvg(source));
}

export function digitArt(digit: number): SvgArt {
  const art = DIGITS.get(digit);
  if (!art) throw new Error(`Digit not found: ${digit}`);
  return art;
}

export function loadedDigits(): number[] {
  return [...DIGITS.keys()].sort((a, b) => a - b);
}
