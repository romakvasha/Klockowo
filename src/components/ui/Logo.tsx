import { useId, type CSSProperties } from 'react';
import { SITE_NAME } from '../../speech/lines';
import type { BrickColor } from './brick';
import { cx } from './cx';
import styles from './Logo.module.css';

/** Літери на кольорових цеглинках (полотно D1 «Логотип», Start): K l o c k o w o. */
const LETTERS: ReadonlyArray<readonly [string, BrickColor]> = [
  ['K', 'red'], ['l', 'yellow'], ['o', 'blue'], ['c', 'green'], ['k', 'orange'], ['o', 'purple'], ['w', 'red'], ['o', 'blue'],
];
const COLORS = [...new Set(LETTERS.map(([, c]) => c))];
/** Цеглинка 62×72 з проміжком 8; пупирці виступають на 9 px угорі, край — 7 px унизу. */
const W = 62;
const H = 72;
const GAP = 8;
const TOP = 12;
const VIEW_W = LETTERS.length * (W + GAP) - GAP;

const tone = (c: BrickColor, part = ''): string => `var(--kl-brick-${c}${part})`;

/** Логотип «Klockowo» — літери Fredoka на глянцевих цеглинках v2 (DESIGN_V2 §4). Ширину задає клас/батько, висота — з пропорції. */
export function Logo({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={cx(styles.logo, className)} viewBox={`0 0 ${VIEW_W} 94`} role="img" aria-label={SITE_NAME} focusable="false">
      <defs>
        {COLORS.map((c) => (
          <linearGradient key={c} id={`${id}${c}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: tone(c, '-hi') }} />
            <stop offset=".46" style={{ stopColor: tone(c) }} />
            <stop offset="1" style={{ stopColor: tone(c, '-lo') }} />
          </linearGradient>
        ))}
        {COLORS.map((c) => (
          <linearGradient key={`${c}-s`} id={`${id}${c}-s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: tone(c, '-stud') }} />
            <stop offset="1" style={{ stopColor: tone(c) }} />
          </linearGradient>
        ))}
      </defs>
      {LETTERS.map(([ch, c], i) => {
        const x = i * (W + GAP);
        const edge: CSSProperties = { fill: tone(c, '-edge') };
        const glyph: CSSProperties = c === 'yellow' ? { fill: tone(c, '-glyph') } : { fill: '#fff', stroke: tone(c, '-out') };
        return (
          <g key={i}>
            <rect x={x} y={TOP + 7} width={W} height={H} rx="14" style={edge} />
            <rect x={x} y={TOP} width={W} height={H} rx="14" fill={`url(#${id}${c})`} />
            <rect x={x + 6} y={TOP + 2} width={W - 12} height="4" rx="2" fill="#fff" fillOpacity=".5" />
            {[x + 18.5, x + W - 18.5].map((cx) => (
              <g key={cx}>
                <ellipse cx={cx} cy={TOP} rx="8" ry="6" style={edge} />
                <ellipse cx={cx} cy={TOP - 3} rx="8" ry="6" fill={`url(#${id}${c}-s)`} />
              </g>
            ))}
            <text className={styles.letter} x={x + W / 2} y={TOP + 51} style={glyph}>{ch}</text>
          </g>
        );
      })}
    </svg>
  );
}
