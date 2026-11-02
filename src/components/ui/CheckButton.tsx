import type { ComponentPropsWithRef } from 'react';
import { BUTTONS } from '../../speech/lines';
import { cx } from './cx';
import { Icon } from './Icon';
import { pressHandler } from './tick';
import styles from './CheckButton.module.css';

export interface CheckButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** aria-label і слово, що звучить: «Gotowe». */
  label?: string;
  /** Без звукового «тика» — «Gotowe» зазвичай одразу грає «correct» або «retry». */
  silent?: boolean;
}

/** «Gotowe» — помаранчева цеглинка з галочкою в колі, 120×88 (телефон 80×80), є в кожному завданні з вибором (полотно D1).
 *  Активна лише після вибору (`disabled`, доки нічого не вибрано): дотик до плитки лише вибирає й озвучує число, перевірка — тільки тут (BRIEF §7). */
export function CheckButton({ label = BUTTONS.done, silent, className, onPointerDown, ...rest }: CheckButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-brick="orange"
      className={cx('kl-brick', 'kl-studs', styles.root, className)}
      onPointerDown={pressHandler(silent, rest.disabled, onPointerDown)}
      {...rest}
    >
      <Icon name="check" className={cx('kl-glyph', styles.icon)} />
    </button>
  );
}
