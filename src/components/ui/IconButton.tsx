import type { ComponentPropsWithRef } from 'react';
import { actionColor, type BrickColor } from './brick';
import { cssVars, cx } from './cx';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { pressHandler } from './tick';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'color'> {
  icon: IconName;
  /** Польське слово дії (aria-label, звучить при дотику) — з BUTTONS у speech/lines.ts. Кнопки дитини без видимого тексту. */
  label: string;
  /** Колір цеглинки. За замовчуванням — колір дії (ACTION_COLOR): «Mapa» помаранчева, «Posłuchaj» і «Dalej» сині, «Pomóż mi» жовта… */
  color?: BrickColor;
  /** Діаметр, px. За замовчуванням 72 → 80 на телефоні; «Dalej» на Koniec poziomu — 88. */
  size?: number;
  /** Один раз пульсує — «Posłuchaj», коли голос договорив нову інструкцію. Щоб повторити, скиньте й увімкніть знову. */
  pulse?: boolean;
  /** Без звукового «тика» — коли екран сам грає потрібний звук. */
  silent?: boolean;
}

/** Кругла глянцева цеглинка з одним пупирцем і значком 56 % діаметра (полотно D1, HUD). */
export function IconButton({ icon, label, color, size, pulse = false, silent, className, style, onPointerDown, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-brick={color ?? actionColor(icon)}
      data-pulse={pulse ? 'true' : undefined}
      className={cx('kl-brick', 'kl-stud', styles.root, className)}
      style={cssVars(
        { '--size': size === undefined ? undefined : `${size}px`, '--icon': size === undefined ? undefined : `${Math.round(size * 0.56)}px` },
        style,
      )}
      onPointerDown={pressHandler(silent, rest.disabled, onPointerDown)}
      {...rest}
    >
      <Icon name={icon} className={cx('kl-glyph', styles.icon)} />
    </button>
  );
}
