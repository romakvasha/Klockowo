import type { ComponentPropsWithRef } from 'react';
import { BUTTONS } from '../../speech/lines';
import { cssVars, cx } from './cx';
import { Icon } from './Icon';
import { pressHandler } from './tick';
import styles from './PlayButton.module.css';

export interface PlayButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** aria-label і слово, що звучить: «Graj!». */
  label?: string;
  /** Висота, px (ширина — 1,6 × висота). За замовчуванням 120 (Start) → 96 на телефоні; на Wprowadzenie — 120 / 96. */
  size?: number;
  /** «Дихання» у спокої (2,4 с): лише для стартових екранів. */
  idle?: boolean;
  /** Без звукового «тика» — коли екран сам грає потрібний звук. */
  silent?: boolean;
}

/** «Graj!» — велика зелена цеглинка з двома пупирцями й трикутником-play (полотно D1; бриф §4: кнопки дитини — лише іконки). */
export function PlayButton({ label = BUTTONS.play, size, idle = false, silent, className, style, onPointerDown, ...rest }: PlayButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-brick="green"
      data-idle={idle ? 'true' : undefined}
      className={cx('kl-brick', 'kl-studs', styles.root, className)}
      style={cssVars({ '--size': size === undefined ? undefined : `${size}px` }, style)}
      onPointerDown={pressHandler(silent, rest.disabled, onPointerDown)}
      {...rest}
    >
      <Icon name="play" className={cx('kl-glyph', styles.icon)} />
    </button>
  );
}
