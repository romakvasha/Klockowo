import type { CSSProperties } from 'react';
import type { WorldKey } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import { DECOR_URL } from '../map/art';
import { DECOR_SIZE, pathLayoutFor } from '../map/pathLayout';
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

/** Пучки трави: ті, що за предметами, і ті, що перед ними (борд etap2/17). */
const TUFTS_BACK: readonly (readonly [number, number])[] = [[60, 196], [250, 210], [470, 190], [560, 230]];
const TUFTS_FRONT: readonly (readonly [number, number])[] = [[400, 190], [530, 214], [150, 252]];
const WAVES: readonly string[] = ['M44 330 q14 -9 28 0 t28 0', 'M324 340 q14 -9 28 0 t28 0', 'M545 316 q14 -9 28 0 t28 0'];

function Tuft({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="12" width="14" height="40" rx="7" />
      <rect x="11" y="0" width="14" height="52" rx="7" />
      <rect x="22" y="16" width="14" height="36" rx="7" />
    </g>
  );
}

/** MissionCard 640×360 (design etap2/06, 17): сцена місії — предмети, яких треба порахувати, значок світу й бульбашка «?».
 *  Для W3 фон — вода (борд etap2/18). Малюється в одиницях 640×360; стискання до compact 380×214 робить батько через transform. */
export function MissionCard({ world, object, label, className, style }: MissionCardProps) {
  const art = itemUrl(object);
  const sea = world === 'w3';
  const places = sea ? SEA : SCATTER;
  const decorKind = sea ? null : (pathLayoutFor(world, 'landscape').decor[0]?.kind ?? null);
  const decorSize = decorKind ? DECOR_SIZE[decorKind] : null;
  return (
    <div className={cx(styles.card, className)} role="img" aria-label={label} style={style} data-world={world}>
      <svg className={styles.scene} viewBox="0 0 632 352" aria-hidden="true" focusable="false">
        {sea ? (
          <g>
            <rect x="0" y="192" width="632" height="160" className={styles.water} />
            <path d="M0 192 H632" className={styles.waterLine} />
            <g className={styles.waves}>{WAVES.map((d) => <path key={d} d={d} />)}</g>
          </g>
        ) : (
          <g>
            <rect x="0" y="250" width="632" height="102" className={styles.ground} />
            <g className={styles.tuft}>{TUFTS_BACK.map(([x, y]) => <Tuft key={`${x}-${y}`} x={x} y={y} />)}</g>
          </g>
        )}
      </svg>
      {decorKind && decorSize && (
        <img
          className={styles.decor} src={DECOR_URL(decorKind)} alt="" draggable={false}
          style={{ left: 632 - decorSize[0] - 12, top: 10, width: decorSize[0], height: decorSize[1] }}
        />
      )}
      {art && places.map((p) => (
        <img
          key={`${p.x}-${p.y}`} className={styles.item} src={art} alt="" draggable={false}
          style={{ left: p.x, top: p.y, width: p.s, height: p.s, transform: p.flip ? 'scaleX(-1)' : undefined }}
        />
      ))}
      {!sea && (
        <svg className={styles.scene} viewBox="0 0 632 352" aria-hidden="true" focusable="false">
          <g className={styles.tuft}>{TUFTS_FRONT.map(([x, y]) => <Tuft key={`${x}-${y}`} x={x} y={y} />)}</g>
        </svg>
      )}
      <span className={styles.chip} aria-hidden="true">
        <Icon name={world} />
      </span>
      <span className={styles.ask} aria-hidden="true">
        {art ? <img src={art} alt="" draggable={false} /> : <Icon name={world} className={styles.askIcon} />}
        <b>?</b>
      </span>
    </div>
  );
}
