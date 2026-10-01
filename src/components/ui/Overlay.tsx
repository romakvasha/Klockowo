import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BUTTONS } from '../../speech/lines';
import { cx } from './cx';
import { IconButton } from './IconButton';
import styles from './Overlay.module.css';

export interface OverlayProps {
  open: boolean;
  /** aria-label діалогу — польська репліка, напр. «Masz nową naklejkę!». */
  label: string;
  /** Є — у кутку панелі з'являється «Zamknij» (72 px), Esc теж закриває. Немає — діалог закривається власними кнопками. */
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}

// Поки відкрито хоч один Overlay, решта застосунку (#root) стає inert: фокус і дотики лишаються в діалозі, диктор не бачить тла.
let openCount = 0;
function lockApp(): () => void {
  const root = document.getElementById('root');
  openCount += 1;
  root?.setAttribute('inert', '');
  return () => {
    openCount -= 1;
    if (openCount === 0) root?.removeAttribute('inert');
  };
}

/** Модальна панель поверх сцени (BRIEF §8, design etap1/08): затемнення ink 55 %, панель радіус 24 з контуром 3,
 *  поява scale .9 → 1 + згасання 300 мс. Тло не закривається дотиком повз панель — дитина не закриє випадково. */
export function Overlay({ open, label, onClose, children, className }: OverlayProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockApp();
    panel.current?.focus();
    return () => {
      unlock();
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className={styles.backdrop}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={cx(styles.panel, className)}>
        <div className={styles.body}>{children}</div>
        {onClose && <IconButton className={styles.close} icon="close" label={BUTTONS.close} onClick={onClose} />}
      </div>
    </div>,
    document.body,
  );
}
