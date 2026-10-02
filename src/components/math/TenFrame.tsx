import type { WorldKey } from '../../curriculum/types';
import { LABELS } from '../../speech/lines';
import { Digits } from '../ui/Digits';
import { cssVars } from '../ui/cx';
import styles from './TenFrame.module.css';

/** solid — фішка лежить; dim — тьмяна фішка (місце, яке ще треба заповнити: «ile brakuje»); empty — порожня комірка. */
export type FrameCell = 'solid' | 'dim' | 'empty';

export interface TenFrameProps {
  /** Скільки комірок: 10 — одна рамка 5×2, 20 — дві рамки одна під одною. */
  cells: number;
  /** Стан кожної комірки за порядком (ряд за рядом); коротший масив добиває `empty`. */
  state: readonly FrameCell[];
  world: WorldKey;
  /** Сторона комірки, px. */
  cell: number;
  /** Номер, який Kubik щойно назвав на комірці (лічба разом); null — без номера. */
  marks?: readonly (number | null)[];
  /** Повна рамка спалахує золотим. */
  gold?: boolean;
  label?: string;
}

const COLS = 5;

/** Рамка-десятка (BRIEF §10; design TenFrame): 5×2, на 20 — дві. Фішки кольору світу; тьмяні — місця, яких бракує. Сигнал — не лише колір: тьмяна
 *  фішка має пунктирний контур, порожня — просто комірка. */
export function TenFrame({ cells, state, world, cell, marks, gold = false, label = LABELS.frame }: TenFrameProps) {
  const frames = Math.max(1, Math.ceil(cells / 10));
  const badge = Math.max(18, Math.round(cell * 0.62));
  return (
    <div className={styles.root} role="img" aria-label={label} data-gold={gold} style={cssVars({ '--tf-500': `var(--kl-${world}-500)`, '--tf-700': `var(--kl-${world}-700)` })}>
      {Array.from({ length: frames }, (_, f) => (
        <div key={f} className={styles.frame} style={{ gridTemplateColumns: `repeat(${COLS}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
          {Array.from({ length: Math.min(10, cells - f * 10) }, (_, k) => {
            const i = f * 10 + k;
            const st = state[i] ?? 'empty';
            const mark = marks?.[i] ?? null;
            return (
              <span key={k} className={styles.cell} data-state={st}>
                {st !== 'empty' && <span className={styles.counter} data-state={st} />}
                {mark !== null && (
                  <span className={styles.mark} style={{ width: badge, height: badge }}>
                    <Digits value={mark} style={{ height: Math.round(badge * (mark >= 10 ? 0.46 : 0.58)) }} />
                  </span>
                )}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
