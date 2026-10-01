import type { SVGProps } from 'react';
import { DOT_R, layoutDots } from './dotsLayout';

export interface DotsProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'ref' | 'children'> {
  count: number;
  perRow?: number;
  /** Довжина однієї одиниці viewBox (CSS): висота svg = unit × висота розкладки. Напр. 'calc(var(--kl-tile) / 120)'. */
  unit?: string;
}

/** Крапки під цифрою на плитках W1 (BRIEF §7): кількість крапок = число. */
export function Dots({ count, perRow = 5, unit = '1px', style, ...rest }: DotsProps) {
  const layout = layoutDots(count, perRow);
  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ height: `calc(${unit} * ${layout.height})`, aspectRatio: `${layout.width} / ${layout.height}`, ...style }}
      {...rest}
    >
      {layout.dots.map((dot) => (
        <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={DOT_R} />
      ))}
    </svg>
  );
}
