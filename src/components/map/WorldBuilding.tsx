import type { CSSProperties } from 'react';
import type { WorldKey } from '../../curriculum/types';
import { cx } from '../ui/cx';
import { BUILD_URL } from './art';
import styles from './WorldBuilding.module.css';

export interface WorldBuildingProps {
  world: WorldKey;
  /** Ширина коробки, px; висота — 1,2 ширини (картинка вписується й стоїть на низу). */
  width: number;
  /** Споруда щойно з'явилась: «виростає» з землі. */
  building?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** Споруда пройденого світу (D5: картинка з цеглинок) — вітряк, оранжерея, маяк, міст із вежею, будинок на дереві, вежа, ракета. Декоративна (aria-label — назва споруди). */
export function WorldBuilding({ world, width, building = false, label, className, style }: WorldBuildingProps) {
  return (
    <span
      className={cx(styles.building, className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-building={building}
      style={{ width, height: Math.round(width * 1.2), ...style }}
    >
      <img src={BUILD_URL(world)} alt="" draggable={false} />
    </span>
  );
}
