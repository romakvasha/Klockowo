import type { CSSProperties } from 'react';
import { LEVEL_LINES } from '../../speech/lines';

export interface DiligenceBadgeProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Значок «Nie poddajesz się!» (BRIEF §6.8, §6.10): квадратний жетон-кубик #FFC21A, як на нашийнику Kubika. Дається, коли рівень
 *  хоч раз розв'язували разом із Kubikom. */
export function DiligenceBadge({ size = 150, className, style }: DiligenceBadgeProps) {
  return (
    <svg
      viewBox="0 0 96 96" width={size} height={size} className={className} style={style} role="img" aria-label={LEVEL_LINES.diligence}
      focusable="false"
    >
      <rect x="4" y="8" width="88" height="86" rx="20" fill="#E8A800" />
      <rect x="4" y="2" width="88" height="86" rx="20" fill="#FFC21A" stroke="#2D2A4A" strokeWidth="4" />
      <rect x="14" y="10" width="68" height="10" rx="5" fill="#fff" fillOpacity=".4" />
      <g stroke="#2D2A4A" strokeWidth="3.5" strokeLinejoin="round">
        <path d="M48 24 L70 35 L48 46 L26 35 Z" fill="#FFF3C4" />
        <path d="M26 35 L48 46 L48 72 L26 61 Z" fill="#E8A800" />
        <path d="M70 35 L48 46 L48 72 L70 61 Z" fill="#C98F00" />
      </g>
    </svg>
  );
}
