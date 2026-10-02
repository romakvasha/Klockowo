import type { CSSProperties } from 'react';
import type { WorldKey } from '../../curriculum/types';
import { BUILDING_H, BUILDING_W, buildingCells } from './worldBuildings';
import { cssVars, cx } from '../ui/cx';
import styles from './WorldBuilding.module.css';

export interface WorldBuildingProps {
  world: WorldKey;
  /** Ширина споруди, px (висота — за пропорцією 9 : 8). */
  width: number;
  /** Споруда щойно з'явилась: клітинки «складаються» знизу вгору. */
  building?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** Споруда світу з блоків: решітка 9 × 8 клітинок кольору світу — вітряк, оранжерея, маяк, міст, будинок на дереві, хмарочос, ракетна вежа. Декоративна (aria-label — назва споруди). */
export function WorldBuilding({ world, width, building = false, label, className, style }: WorldBuildingProps) {
  const cell = width / BUILDING_W;
  const rows = buildingCells(world);
  return (
    <span
      className={cx(styles.building, className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-building={building}
      style={cssVars({ '--wb-500': `var(--kl-${world}-500)`, '--wb-700': `var(--kl-${world}-700)` }, { width, height: cell * BUILDING_H, gridTemplateColumns: `repeat(${BUILDING_W}, 1fr)`, ...style })}
    >
      {rows.flatMap((row, y) =>
        row.map((c, x) => (
          <i
            key={`${x}-${y}`}
            className={styles.cell}
            data-cell={c}
            style={building ? { animationDelay: `${(BUILDING_H - 1 - y) * 110 + x * 12}ms` } : undefined}
          />
        )),
      )}
    </span>
  );
}
