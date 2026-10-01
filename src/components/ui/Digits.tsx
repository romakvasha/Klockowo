import type { SVGProps } from 'react';
import { digitArt } from './digitArt';
import { DIGIT_H, layoutDigits, type Place } from './digitLayout';

const PLACE_STROKE: Readonly<Record<Place, string | undefined>> = {
  tens: 'var(--kl-tens-digit)',
  ones: 'var(--kl-ones-digit)',
  plain: undefined, // успадковує currentColor
};

export interface DigitsProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'ref' | 'children'> {
  value: number;
  /** Кольорові розряди (десятки #1A4FA0, одиниці #A34700): лише на білому чи світлому тлі, ніколи на заливці розряду. */
  places?: boolean;
}

/** Число 0–999 SVG-цифрами шкільного стилю. Розмір задає CSS (`height`), ширина — з пропорції; колір — `currentColor`. */
export function Digits({ value, places = false, style, ...rest }: DigitsProps) {
  const layout = layoutDigits(value, { places });
  return (
    <svg
      viewBox={`0 0 ${layout.width} ${DIGIT_H}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={15}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ aspectRatio: `${layout.width} / ${DIGIT_H}`, ...style }}
      {...rest}
    >
      {layout.glyphs.map((glyph) => {
        const stroke = PLACE_STROKE[glyph.place];
        return (
          <g
            key={glyph.x}
            transform={`translate(${glyph.x} 0)`}
            style={stroke ? { stroke } : undefined}
            dangerouslySetInnerHTML={{ __html: digitArt(glyph.digit).inner }}
          />
        );
      })}
    </svg>
  );
}
