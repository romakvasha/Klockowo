import type { WorldKey } from '../../curriculum/types';
import { LABELS } from '../../speech/lines';
import { Digits } from '../ui/Digits';
import { cssVars } from '../ui/cx';
import { RACK_COLS, RACK_ROWS, beadX, rackBeads } from './beadRack';
import styles from './BeadRack20.module.css';

export interface BeadRack20Props {
  /** Скільки кульок відсунуто ліворуч (0–20). */
  moved: number;
  world: WorldKey;
  /** Діаметр кульки, px. */
  bead?: number;
  /** Номер, який Kubik щойно назвав на кульці (лічба разом); індекс 0–19. */
  marks?: readonly (number | null)[];
  label?: string;
}

/** Рахівниця на 20 (BRIEF §10): два дроти по 10 кульок, п'ять + п'ять різних відтінків. Відсунуті кульки лежать ліворуч, решта — праворуч; у відсунутих є світла обводка
 *  (сигнал — положення й обводка, а не лише колір). */
export function BeadRack20({ moved, world, bead = 36, marks, label = LABELS.abacus }: BeadRack20Props) {
  const beads = rackBeads(moved);
  const width = RACK_COLS * bead + Math.round(bead * 1.5); // дріт довший за десять кульок: між відсунутими й рештою лишається просвіт
  const rowH = bead + 16;
  const badge = Math.max(18, Math.round(bead * 0.62));
  return (
    <div
      className={styles.rack}
      role="img"
      aria-label={label}
      style={cssVars({ '--br-a': `var(--kl-${world}-500)`, '--br-b': `var(--kl-${world}-700)` }, { width: width + 24, height: RACK_ROWS * rowH + 8 })}
    >
      {Array.from({ length: RACK_ROWS }, (_, row) => (
        <span key={row} className={styles.wire} style={{ left: 12, top: 4 + row * rowH + rowH / 2 - 2, width }} aria-hidden="true" />
      ))}
      {beads.map((b) => {
        const mark = marks?.[b.index] ?? null;
        return (
          <span
            key={b.index}
            className={styles.bead}
            data-tone={b.tone}
            data-moved={b.moved}
            style={{ left: 12 + beadX(b, width, bead) - bead / 2, top: 4 + b.row * rowH + (rowH - bead) / 2, width: bead, height: bead }}
          >
            {mark !== null && (
              <span className={styles.mark} style={{ width: badge, height: badge }}>
                <Digits value={mark} style={{ height: Math.round(badge * (mark >= 10 ? 0.46 : 0.58)) }} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
