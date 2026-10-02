import type { CSSProperties } from 'react';
import { cx } from '../ui/cx';
import styles from './Blocks.module.css';

export interface BlockPlateProps {
  /** Сторона плити, px. */
  size: number;
  className?: string;
  style?: CSSProperties;
}

/** Плита 10×10 (сотня; BRIEF §10): квадрат із лініями десятків — десять стовпчиків поруч. Колір десятків. */
export function BlockPlate({ size, className, style }: BlockPlateProps) {
  const cell = size / 10;
  return (
    <span
      className={cx(styles.plate, className)}
      style={{ width: size, height: size, backgroundSize: `${cell}px ${cell}px`, ...style }}
      aria-hidden="true"
    />
  );
}
