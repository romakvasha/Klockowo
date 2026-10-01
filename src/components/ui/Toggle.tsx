import type { ComponentPropsWithoutRef } from 'react';
import { sfx } from '../../speech/sfx';
import { cx } from './cx';
import styles from './Toggle.module.css';

export interface ToggleProps extends Omit<ComponentPropsWithoutRef<'label'>, 'onChange' | 'children'> {
  /** Видимий підпис і назва для диктора (Strefa rodzica, текст дорослого 18 px). */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Без звукового «тика». */
  silent?: boolean;
}

/** Перемикач «Mniej animacji», «Zadania dodatkowe ★»… (design etap1/10): рядок 56 px, перемикач 56×32, зона дотику 64×44,
 *  клікабельний увесь рядок. Справжній <input type="checkbox" role="switch">: клавіатура (Space) і диктор працюють самі.
 *  Увімкнено — синій трек + біла кулька праворуч із галочкою; вимкнено — світлий трек із рамкою + темна кулька ліворуч. */
export function Toggle({ label, checked, onChange, disabled, silent, className, ...rest }: ToggleProps) {
  return (
    <label className={cx(styles.row, className)} {...rest}>
      <span className={styles.text}>{label}</span>
      <input
        className={styles.input}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          if (!silent) sfx.play('tap');
          onChange(event.target.checked);
        }}
      />
      <span className={styles.zone} aria-hidden="true">
        <span className={styles.track}>
          <span className={styles.thumb}>
            {checked && (
              <svg viewBox="0 0 16 16" className={styles.tick} focusable="false">
                <path d="M3 8.5 L6.5 12 L13 5" />
              </svg>
            )}
          </span>
        </span>
      </span>
    </label>
  );
}
