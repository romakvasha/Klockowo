import type { WorldKey } from '../../curriculum/types';
import type { AnimalId } from '../../speech/nouns';
import { LABELS } from '../../speech/lines';
import { Digits } from '../ui/Digits';
import { cssVars, cx } from '../ui/cx';
import { animalUrl } from './art';
import { BUS_ROOF, BUS_WHEEL, busGeometry } from './busLayout';
import styles from './BusFrame.module.css';

export interface BusFrameProps {
  /** Що на кожному місці: тваринка чи null (вільне). Довжина кратна 5 (ряд — 5 місць). */
  seats: readonly (AnimalId | null)[];
  world: WorldKey;
  /** Ширина автобуса, px. */
  width: number;
  /** Місця закриті «завісою»: дитина мала запам'ятати, скільки тваринок (вступний показ). */
  covered?: boolean;
  /** Рамка, що пульсує навколо ряду, і число-значок на ній (перший ряд = «5»). */
  pulseRow?: { row: number; value: number } | null;
  /** Номер, що підказка щойно назвала на місці (лічба разом): золоте місце з числом; null — без позначки. */
  marks?: readonly (number | null)[];
  /** Тваринки радіють (правильна відповідь). */
  celebrate?: boolean;
  /** Підпис для екранного диктора (без числа, щоб не видати відповідь). */
  label?: string;
}

/** Автобус із блоків (design BusFrame ще не намальовано — зібрано за описом BRIEF §7): кузов кольору світу, вікна-місця 5×N, колеса. Вільне місце —
 *  пунктирне, зайняте — тваринка в білій комірці; сигнал — наповнення, а не лише колір. */
export function BusFrame({ seats, world, width, covered = false, pulseRow = null, marks, celebrate = false, label = LABELS.bus }: BusFrameProps) {
  const g = busGeometry(width, Math.max(1, Math.ceil(seats.length / 5)));
  const badge = Math.max(30, Math.round(g.cell * 0.5));
  return (
    <div
      className={styles.bus}
      role="img"
      aria-label={label}
      data-covered={covered}
      style={cssVars({ '--bus-500': `var(--kl-${world}-500)`, '--bus-100': `var(--kl-${world}-100)`, '--bus-700': `var(--kl-${world}-700)` }, { width: g.width, height: g.height })}
    >
      <div className={styles.body} style={{ height: g.bodyH }}>
        <div className={styles.roof} style={{ height: BUS_ROOF }} />
      </div>
      {[0.2, 0.8].map((at) => (
        <span key={at} className={styles.wheel} style={{ left: Math.round(g.width * at - BUS_WHEEL / 2), top: g.bodyH - BUS_WHEEL / 2, width: BUS_WHEEL, height: BUS_WHEEL }} />
      ))}
      {g.rows >= 4 && (
        <span className={styles.deck} style={{ left: g.seat(0).x - 6, top: g.rowBox(1).y + g.rowBox(1).h + 1, width: g.rowBox(0).w + 4 }} aria-hidden="true" />
      )}
      {seats.map((animal, i) => {
        const p = g.seat(i);
        const mark = marks?.[i] ?? null;
        return (
          <span
            key={i}
            className={styles.seat}
            data-taken={animal !== null}
            data-marked={mark !== null}
            data-celebrate={celebrate && animal !== null}
            style={{ left: p.x, top: p.y, width: g.cell, height: g.cell }}
            aria-hidden="true"
          >
            {animal !== null && <img className={styles.animal} src={animalUrl(animal, celebrate)} alt="" draggable={false} />}
            {mark !== null && (
              <span className={styles.mark} style={{ width: badge, height: badge }}>
                <Digits value={mark} style={{ height: Math.round(badge * (mark >= 10 ? 0.5 : 0.62)) }} />
              </span>
            )}
          </span>
        );
      })}
      {covered && (
        <span className={styles.cover} style={{ left: g.seat(0).x - 4, top: g.seat(0).y - 4, width: g.rowBox(0).w, height: g.rowBox(g.rows - 1).y + g.rowBox(g.rows - 1).h - g.seat(0).y + 4 }}>
          <b>?</b>
        </span>
      )}
      {pulseRow && (
        <span className={cx(styles.row)} style={{ left: g.rowBox(pulseRow.row).x, top: g.rowBox(pulseRow.row).y, width: g.rowBox(pulseRow.row).w, height: g.rowBox(pulseRow.row).h }}>
          <span className={styles.rowBadge} style={{ width: badge, height: badge }}>
            <Digits value={pulseRow.value} style={{ height: Math.round(badge * 0.62) }} />
          </span>
        </span>
      )}
    </div>
  );
}
