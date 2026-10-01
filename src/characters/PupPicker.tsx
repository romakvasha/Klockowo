import { useRef, type KeyboardEvent } from 'react';
import { StateBadge } from '../components/ui/StateBadge';
import { cssVars, cx } from '../components/ui/cx';
import { pressHandler } from '../components/ui/tick';
import { PUPS, START_LINES } from '../speech/lines';
import { PlayerPup } from './PlayerPup';
import { PUP_TINTS, pupLabel, type PupId } from './pups';
import styles from './PupPicker.module.css';

export interface PupPickerProps {
  /** Обране цуценя; null — ще нічого не обрано («Gotowe» неактивна). */
  value: PupId | null;
  /** Дотик до картки обирає її; екран озвучує репліку цуценяти («Kudłaty piesek!»). */
  onPick: (id: PupId) => void;
  className?: string;
}

/** 8 цуценят у сітці 4×2 (телефон 2×4): картка 176, цуценя 144 (design etap1/10). Група перемикачів: стрілки клавіатури
 *  переходять між картками й обирають, Tab входить у групу один раз. Обрана картка піднімається на 8 px, має синє кільце й галочку. */
export function PupPicker({ value, onPick, className }: PupPickerProps) {
  const cards = useRef<Array<HTMLButtonElement | null>>([]);
  const tabStop = Math.max(0, PUPS.findIndex((p) => p.id === value));

  const move = (from: number, step: number) => {
    const next = (from + step + PUPS.length) % PUPS.length;
    const pup = PUPS[next];
    if (!pup) return;
    onPick(pup.id);
    cards.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(index, 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(index, -1);
    }
  };

  return (
    <div role="radiogroup" aria-label={START_LINES.choosePup} className={cx(styles.grid, className)}>
      {PUPS.map((pup, index) => {
        const selected = pup.id === value;
        return (
          <div key={pup.id} className={styles.slot}>
            <button
              ref={(el) => {
                cards.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={pupLabel(pup.id)}
              tabIndex={index === tabStop ? 0 : -1}
              data-selected={selected}
              className={cx('kl-block', styles.card)}
              style={cssVars({ '--tint': `var(--kl-${PUP_TINTS[pup.id]}-50)` })}
              onClick={() => onPick(pup.id)}
              onPointerDown={pressHandler(false, false)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              <PlayerPup id={pup.id} className={styles.pup} />
            </button>
            {selected && <StateBadge kind="chosen" className={styles.badge} />}
          </div>
        );
      })}
    </div>
  );
}
