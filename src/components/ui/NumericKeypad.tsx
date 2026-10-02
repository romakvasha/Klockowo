import { sfx } from '../../speech/sfx';
import styles from './NumericKeypad.module.css';

export interface NumericKeypadProps {
  onDigit: (digit: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  /** Підписи для диктора й кнопки «Wejdź» (мова панелі). */
  backLabel: string;
  submitLabel: string;
  disabled?: boolean;
}

const ROWS: readonly (readonly number[])[] = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];

/** Цифрова клавіатура бар'єра для дорослих (BRIEF §6 п.14, компонент NumericKeypad): 3 × 4, кнопки від 64 px з проміжками 12 px; внизу «⌫», «0» і «Wejdź». Справжні <button> — працює й клавіатура. */
export function NumericKeypad({ onDigit, onBack, onSubmit, backLabel, submitLabel, disabled = false }: NumericKeypadProps) {
  const press = (action: () => void) => () => {
    if (disabled) return;
    sfx.play('tap');
    action();
  };
  return (
    <div className={styles.pad} role="group">
      {ROWS.map((row) =>
        row.map((d) => (
          <button key={d} type="button" className={`kl-block ${styles.key}`} disabled={disabled} onClick={press(() => onDigit(d))}>
            {d}
          </button>
        )),
      )}
      <button type="button" className={`kl-block ${styles.key} ${styles.back}`} disabled={disabled} aria-label={backLabel} onClick={press(onBack)}>
        <span aria-hidden="true">⌫</span>
      </button>
      <button type="button" className={`kl-block ${styles.key}`} disabled={disabled} onClick={press(() => onDigit(0))}>
        0
      </button>
      <button type="button" className={`kl-block ${styles.key} ${styles.submit}`} disabled={disabled} onClick={press(onSubmit)}>
        {submitLabel}
      </button>
    </div>
  );
}
