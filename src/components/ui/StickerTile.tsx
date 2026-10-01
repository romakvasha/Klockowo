import type { CSSProperties } from 'react';
import type { WorldKey } from '../../curriculum/types';
import type { AnimalId } from '../../speech/nouns';
import { animalUrl } from '../math/art';
import { cssVars, cx } from './cx';
import { Icon } from './Icon';
import styles from './StickerTile.module.css';

export interface StickerTileProps {
  animal: AnimalId;
  /** Світ рівня: колір диска й значок у кутку. */
  world: WorldKey;
  /** Сторона квадрата, px. */
  size?: number;
  /** Порожнє місце в альбомі: темний силует зі «?» (BRIEF §6.10). */
  locked?: boolean;
  /** Підпис для екранного диктора («Naklejka — miś»). */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** Наліпка рівня — врятована тваринка в квадратній рамці кольору світу (BRIEF §6.8, §6.10). Використовують Koniec poziomu й альбом. */
export function StickerTile({ animal, world, size = 200, locked = false, label, className, style }: StickerTileProps) {
  return (
    <div
      className={cx(styles.tile, className)}
      data-locked={locked}
      data-world={world}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={cssVars({ '--size': `${size}px` }, style)}
    >
      <span className={styles.disc}>
        <img src={animalUrl(animal, true)} alt="" draggable={false} />
        {locked && <b className={styles.question}>?</b>}
      </span>
      {!locked && (
        <span className={styles.chip}>
          <Icon name={world} />
        </span>
      )}
    </div>
  );
}
