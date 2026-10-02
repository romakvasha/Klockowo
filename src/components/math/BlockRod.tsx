import type { CSSProperties } from 'react';
import { cx } from '../ui/cx';
import styles from './Blocks.module.css';

export interface BlockRodProps {
  /** Сторона одного кубика, px; стовпчик — 10 кубиків угору. */
  cell: number;
  /** Скільки кубиків у стовпчику (10 — повний; менше — неповний, для підказок). */
  length?: number;
  className?: string;
  style?: CSSProperties;
}

/** Стовпчик-десяток (BRIEF §10): 10 кубиків колонкою, кольору десятків; сегменти видно — це «десять одиниць», а не одна паличка. */
export function BlockRod({ cell, length = 10, className, style }: BlockRodProps) {
  return (
    <span className={cx(styles.rod, className)} style={{ width: cell, height: cell * length, ...style }} aria-hidden="true">
      {Array.from({ length }, (_, i) => (
        <span key={i} className={styles.segment} style={{ height: cell }} />
      ))}
    </span>
  );
}
