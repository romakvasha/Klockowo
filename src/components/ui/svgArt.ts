/** SVG-файл із src/assets/: viewBox і внутрішня розмітка. Кореневі атрибути (fill, stroke, розмір) задає компонент,
 *  тому колір завжди йде з `currentColor` / токенів, а розмір — із CSS. */
export interface SvgArt {
  viewBox: string;
  inner: string;
}

export function parseSvg(source: string): SvgArt {
  const viewBox = /viewBox="([^"]+)"/.exec(source)?.[1];
  const start = source.indexOf('>') + 1;
  const end = source.lastIndexOf('</svg>');
  if (!viewBox || start === 0 || end < start) throw new Error('Unsupported SVG source');
  return { viewBox, inner: source.slice(start, end) };
}
