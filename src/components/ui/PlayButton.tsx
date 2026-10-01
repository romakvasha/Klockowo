import type { ComponentPropsWithRef } from 'react';
import { BUTTONS } from '../../speech/lines';
import { cssVars, cx } from './cx';
import { Icon } from './Icon';
import { pressHandler } from './tick';
import styles from './PlayButton.module.css';

export interface PlayButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** aria-label і слово, що звучить: «Graj!». */
  label?: string;
  /** Діаметр, px. За замовчуванням 160 (Start) → 96 на телефоні; на Wprowadzenie — 120. */
  size?: number;
  /** «Дихання» у спокої (2,4 с): лише для стартових екранів. */
  idle?: boolean;
  /** Без звукового «тика» — коли екран сам грає потрібний звук. */
  silent?: boolean;
}

/** «Graj!» — велика кругла primary-кнопка з трикутником-play (BRIEF §8, design etap1/06). */
export function PlayButton({ label = BUTTONS.play, size, idle = false, silent, className, style, onPointerDown, ...rest }: PlayButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-idle={idle ? 'true' : undefined}
      className={cx('kl-block', styles.root, className)}
      style={cssVars({ '--size': size === undefined ? undefined : `${size}px` }, style)}
      onPointerDown={pressHandler(silent, rest.disabled, onPointerDown)}
      {...rest}
    >
      <Icon name="play" className={styles.icon} />
    </button>
  );
}
