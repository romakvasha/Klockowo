import { LABELS } from '../../speech/lines';
import { Digits } from '../ui/Digits';
import { BlockCube } from './BlockCube';
import { BlockRod } from './BlockRod';
import styles from './PlaceValueMat.module.css';

export interface PlaceValueMatProps {
  /** Скільки стовпчиків-десяток (0–9). */
  tens: number;
  /** Скільки кубиків-одиниць (0–9). */
  ones: number;
  /** Сторона кубика, px; стовпчик — 10 таких кубиків (той самий масштаб, щоб «десять кубиків = один стовпчик»). */
  cell?: number;
  /** Під колонками — цифри розрядів (десятки синім, одиниці помаранчевим). */
  digits?: boolean;
  /** Дотик по стовпчику чи кубику (зняти) — для зворотного режиму «Paczki po dziesięć»; без нього блоки не клікабельні. */
  onRodPress?: () => void;
  onCubePress?: () => void;
  /** Золота рамка навколо розряду: підказка («тут десятки»). */
  highlight?: 'tens' | 'ones' | null;
  /** Блоки радіють (правильна відповідь). */
  celebrate?: boolean;
  label?: string;
}

const GAP = 6;
const COLS = 3;

/** Мат «dziesiątki | jedności» (BRIEF §10): ліворуч стовпчики-десятки, праворуч кубики-одиниці, під ними цифри розрядів (#1A4FA0 і #A34700 — лише на світлому тлі).
 *  Ширина мату — під дев'ять стовпчиків і сітку 3×3 кубиків; розряди відділено лінією. */
export function PlaceValueMat({ tens, ones, cell = 22, digits = true, onRodPress, onCubePress, highlight = null, celebrate = false, label = LABELS.placeMat }: PlaceValueMatProps) {
  const rodsW = 9 * cell + 8 * GAP;
  const onesW = COLS * cell + (COLS - 1) * GAP;
  const bodyH = 10 * cell;
  return (
    <div className={styles.mat} role="img" aria-label={label} data-celebrate={celebrate}>
      <section className={styles.column} data-place="tens" data-highlight={highlight === 'tens'} style={{ width: rodsW + 2 * 12 }}>
        <h3 className={styles.head}>{LABELS.placeTens}</h3>
        <div className={styles.body} style={{ height: bodyH, gap: GAP }}>
          {Array.from({ length: tens }, (_, i) =>
            onRodPress ? (
              <button key={i} type="button" className={styles.piece} aria-label={LABELS.removeRod} onClick={onRodPress}>
                <BlockRod cell={cell} />
              </button>
            ) : (
              <BlockRod key={i} cell={cell} />
            ),
          )}
        </div>
        {digits && <span className={styles.digit} data-place="tens"><Digits value={tens} style={{ height: 40 }} /></span>}
      </section>
      <section className={styles.column} data-place="ones" data-highlight={highlight === 'ones'} style={{ width: onesW + 2 * 12 }}>
        <h3 className={styles.head}>{LABELS.placeOnes}</h3>
        <div className={styles.body} style={{ height: bodyH, width: onesW, gap: GAP, alignContent: 'flex-start' }}>
          {Array.from({ length: ones }, (_, i) =>
            onCubePress ? (
              <button key={i} type="button" className={styles.piece} aria-label={LABELS.removeCube} onClick={onCubePress}>
                <BlockCube size={cell} tone="ones" />
              </button>
            ) : (
              <BlockCube key={i} size={cell} tone="ones" />
            ),
          )}
        </div>
        {digits && <span className={styles.digit} data-place="ones"><Digits value={ones} style={{ height: 40 }} /></span>}
      </section>
    </div>
  );
}

/** Розміри мату для розкладки сцени (design-px). */
export function placeValueMatSize(cell = 22): { w: number; h: number } {
  const rodsW = 9 * cell + 8 * GAP + 24;
  const onesW = COLS * cell + (COLS - 1) * GAP + 24;
  return { w: rodsW + onesW + 3 * 3, h: 10 * cell + 44 + 56 + 24 };
}
