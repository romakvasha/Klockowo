import type { CSSProperties } from 'react';
import styles from './Blocks.module.css';

export interface StickBundleProps {
  /** Висота пучка, px (ширина — 0,7 від неї). */
  height: number;
  /** Скільки паличок у пучку (10 — зв'язаний пучок із поясом; менше — розсипані без пояса). */
  count?: number;
  className?: string;
  style?: CSSProperties;
}

/** Пучок із 10 паличок (BRIEF §10), зв'язаний поясом; менше десяти — палички без пояса («ще не пучок»). */
export function StickBundle({ height, count = 10, className, style }: StickBundleProps) {
  const sticks = Math.max(0, Math.min(10, count));
  return (
    <svg
      className={className}
      width={Math.round(height * 0.7)}
      height={height}
      viewBox="0 0 70 100"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: sticks }, (_, i) => (
        <rect key={i} className={styles.stick} x={4 + i * 6} y={4} width={5} height={92} rx={2.5} />
      ))}
      {sticks === 10 && <rect className={styles.band} x={1} y={40} width={68} height={20} rx={6} />}
    </svg>
  );
}
