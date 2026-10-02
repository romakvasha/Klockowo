import type { CSSProperties } from 'react';
import { cx } from '../ui/cx';
import styles from './Blocks.module.css';

/** Колір розряду: tens — десятки (синій), ones — одиниці (помаранчевий), plain — нейтральний. Сигнал — ще й форма: стовпчик чи кубик, тож колір не єдиний носій (BRIEF §13). */
export type BlockTone = 'tens' | 'ones' | 'plain';

export interface BlockCubeProps {
  /** Сторона кубика, px. */
  size: number;
  tone?: BlockTone;
  className?: string;
  style?: CSSProperties;
}

/** Кубик-одиниця (BRIEF §10 «кубик»): заокруглений квадрат із контуром і світлим бліком. Колір розряду — токени --kl-ones / --kl-tens. */
export function BlockCube({ size, tone = 'ones', className, style }: BlockCubeProps) {
  return <span className={cx(styles.cube, className)} data-tone={tone} style={{ width: size, height: size, ...style }} aria-hidden="true" />;
}
