import type { ComponentPropsWithRef } from 'react';
import { cssVars, cx } from './cx';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { pressHandler } from './tick';
import styles from './IconButton.module.css';

/** neutral — «Mapa», «Naklejki», «Zamknij»; secondary — «Posłuchaj»; primary — «Dalej»; hint — «Pomóż mi»; retry — «Jeszcze raz». */
export type IconButtonVariant = 'neutral' | 'secondary' | 'primary' | 'hint' | 'retry';

export interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  icon: IconName;
  /** Польське слово дії (aria-label, звучить при дотику) — з BUTTONS у speech/lines.ts. Кнопки дитини без видимого тексту. */
  label: string;
  variant?: IconButtonVariant;
  /** Діаметр, px. За замовчуванням 72 → 80 на телефоні; «Dalej» на Koniec poziomu — 88. */
  size?: number;
  /** Один раз пульсує — «Posłuchaj», коли голос договорив нову інструкцію. Щоб повторити, скиньте й увімкніть знову. */
  pulse?: boolean;
  /** Без звукового «тика» — коли екран сам грає потрібний звук. */
  silent?: boolean;
}

/** Кругла «блокова» кнопка з іконкою 40/44 px (design etap1/06). */
export function IconButton({ icon, label, variant = 'neutral', size, pulse = false, silent, className, style, onPointerDown, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-pulse={pulse ? 'true' : undefined}
      className={cx('kl-block', styles.root, styles[variant], className)}
      style={cssVars(
        { '--size': size === undefined ? undefined : `${size}px`, '--icon': size === undefined ? undefined : `${Math.round(size * 0.55)}px` },
        style,
      )}
      onPointerDown={pressHandler(silent, rest.disabled, onPointerDown)}
      {...rest}
    >
      <Icon name={icon} className={styles.icon} />
    </button>
  );
}
