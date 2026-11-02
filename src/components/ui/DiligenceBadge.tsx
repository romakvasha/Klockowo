import { useId, type CSSProperties } from 'react';
import { LEVEL_LINES } from '../../speech/lines';

export interface DiligenceBadgeProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const fill = (token: string): CSSProperties => ({ fill: `var(--kl-brick-yellow${token})` });
const stop = (token: string): CSSProperties => ({ stopColor: `var(--kl-brick-yellow${token})` });

/** Значок «Nie poddajesz się!» (BRIEF §6.8, §6.10): квадратний жетон-кубик, як на нашийнику Kubika, — глянцева жовта цеглинка
 *  з одним великим пупирцем і вушком (v2, полотно D1; без зірки: ★ лише для необов'язкових гілок). Дається, коли рівень
 *  хоч раз розв'язували разом із Kubikom. */
export function DiligenceBadge({ size = 150, className, style }: DiligenceBadgeProps) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 96 96" width={size} height={size} className={className} style={style} role="img" aria-label={LEVEL_LINES.diligence}
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('-hi')} />
          <stop offset=".46" style={stop('')} />
          <stop offset="1" style={stop('-lo')} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={stop('-stud')} />
          <stop offset="1" style={stop('')} />
        </linearGradient>
      </defs>
      <circle cx="48" cy="9" r="6.5" fill="none" strokeWidth="4" style={{ stroke: 'var(--kl-brick-yellow-edge)' }} />
      <rect x="6" y="20" width="84" height="72" rx="18" style={fill('-edge')} />
      <rect x="6" y="14" width="84" height="72" rx="18" fill={`url(#${id}f)`} />
      <rect x="16" y="18" width="64" height="5" rx="2.5" fill="#fff" fillOpacity=".55" />
      <circle cx="48" cy="54" r="21" style={fill('-edge')} />
      <circle cx="48" cy="50" r="21" fill={`url(#${id}s)`} />
      <ellipse cx="41" cy="41" rx="7" ry="4" fill="#fff" fillOpacity=".6" />
    </svg>
  );
}
