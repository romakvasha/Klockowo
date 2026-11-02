import type { CSSProperties } from 'react';
import type { WorldKey } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import { BG_URL } from '../map/art';
import { itemUrl } from '../math/art';
import { cx } from './cx';
import { Icon } from './Icon';
import styles from './MissionCard.module.css';

export interface MissionCardProps {
  world: WorldKey;
  /** Предмет місії: його розкидано по сцені картки й показано в бульбашці «?». */
  object: ObjectId;
  /** Текст місії — для екранного диктора («Kaczuszki się zgubiły! Pomożesz je policzyć?»). */
  label: string;
  className?: string;
  style?: CSSProperties;
}

interface Placed {
  x: number;
  y: number;
  s: number;
  flip?: boolean;
}

/** Предмети на сцені: 5 розкиданих (борд etap2/17); у W3 — 3 рибки (борд etap2/18, у масштабі картки 640×360). */
const SCATTER: readonly Placed[] = [
  { x: 110, y: 196, s: 74 }, { x: 196, y: 238, s: 74, flip: true }, { x: 330, y: 220, s: 74 },
  { x: 404, y: 150, s: 74, flip: true }, { x: 520, y: 174, s: 60 },
];
const SEA: readonly Placed[] = [{ x: 89, y: 202, s: 89 }, { x: 257, y: 243, s: 89, flip: true }, { x: 448, y: 209, s: 89 }];

/** MissionCard 640×360 (design etap2/06, 17; v2 — D6): сцена місії на фото світу (bg-wN) — предмети, яких треба порахувати, значок світу
 *  й бульбашка «?»; у W3 — 3 рибки на воді (борд etap2/18). Малюється в одиницях 640×360; стискання до compact 380×214 робить батько через transform. */
export function MissionCard({ world, object, label, className, style }: MissionCardProps) {
  const art = itemUrl(object);
  const places = world === 'w3' ? SEA : SCATTER;
  return (
    <div className={cx(styles.card, className)} role="img" aria-label={label} style={style} data-world={world}>
      <img className={styles.photo} src={BG_URL(world)} alt="" draggable={false} />
      {places.map((p) => (
        <img
          key={`${p.x}-${p.y}`} className={styles.item} src={art} alt="" draggable={false}
          style={{ left: p.x, top: p.y, width: p.s, height: p.s, transform: p.flip ? 'scaleX(-1)' : undefined }}
        />
      ))}
      <span className={cx('kl-card', styles.chip)} aria-hidden="true">
        <Icon name={world} />
      </span>
      <span className={cx('kl-card', styles.ask)} aria-hidden="true">
        <img src={art} alt="" draggable={false} />
        <b>?</b>
      </span>
    </div>
  );
}
