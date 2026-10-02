import styles from './Parent.module.css';

export interface ConfirmBoxProps {
  message: string;
  cancel: string;
  confirm: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Підтвердження для дорослого (BRIEF §6 п.15, ConfirmDialog): текст, [Anuluj] [Tak, usuń]. Вбудований у картку (не модальний, без затемнення — це не дитячий екран);
 *  «Anuluj» — перша й виділена, щоб випадкове натискання не видаляло. */
export function ConfirmBox({ message, cancel, confirm, onCancel, onConfirm }: ConfirmBoxProps) {
  return (
    <div className={styles.confirm} role="alertdialog" aria-label={message}>
      <p className={styles.confirmText}>{message}</p>
      <div className={styles.rowActions}>
        <button type="button" className={styles.langButton} autoFocus onClick={onCancel}>{cancel}</button>
        <button type="button" className={`${styles.langButton} ${styles.danger}`} onClick={onConfirm}>{confirm}</button>
      </div>
    </div>
  );
}
