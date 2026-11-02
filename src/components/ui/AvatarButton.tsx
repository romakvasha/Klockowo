import type { ComponentPropsWithRef, ReactNode } from 'react';
import { PROFILE_NO_NAME } from '../../speech/lines';
import type { WorldKey } from '../../speech/nouns';
import { cssVars, cx } from './cx';
import { pressHandler } from './tick';
import styles from './AvatarButton.module.css';

export interface AvatarButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'name'> {
  /** Картинка цуценяти (зазвичай <img> із src/assets/v2/pups); показується знизу, обрізається колом. */
  children: ReactNode;
  /** Колір профілю — один зі світів: тло 50, обідок 500, край обідка 700 (полотно D1 «Kto dziś gra?»). */
  tint?: WorldKey | 'hub';
  /** Діаметр, px: 160 (Start), 72 (Mapa przygody, угорі ліворуч). */
  size?: number;
  /** Ім'я профілю — лише для дорослого: aria-label і підпис під аватаром. Немає — «Profil bez imienia» і підпис «—». */
  profileName?: string | null;
  /** Показати підпис з іменем під аватаром (на Start). */
  showName?: boolean;
  /** Без звукового «тика». */
  silent?: boolean;
}

/** Круглий аватар профілю (BRIEF §8; v2 — білий кружок із кольоровим обідком і об'ємним краєм, полотно D1). Свій aria-label
 *  (напр. «Ola — mapa» для 72 px на мапі) — через aria-label. */
export function AvatarButton({
  children, tint = 'hub', size = 160, profileName = null, showName = false, silent, className, style, onPointerDown, ...rest
}: AvatarButtonProps) {
  return (
    <span className={styles.wrap}>
      <button
        type="button"
        aria-label={profileName ?? PROFILE_NO_NAME}
        className={cx('kl-block', styles.root, className)}
        style={cssVars(
          { '--size': `${size}px`, '--tint': `var(--kl-${tint}-50)`, '--ring': `var(--kl-${tint}-500)`, '--ring-d': `var(--kl-${tint}-700)` },
          style,
        )}
        onPointerDown={pressHandler(silent, rest.disabled, onPointerDown)}
        {...rest}
      >
        {children}
      </button>
      {showName && (
        <span className={cx(styles.name, profileName === null && styles.noName)} aria-hidden="true">
          {profileName ?? '—'}
        </span>
      )}
    </span>
  );
}
