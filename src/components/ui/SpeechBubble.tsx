import type { ReactNode } from 'react';
import { cx } from './cx';
import styles from './SpeechBubble.module.css';

/** speech — звичайна; thinking — «хмаринка» з двома кружечками; talking — блакитна, Kubik говорить;
 *  hint — тепла (лампочка, «Patrz, pokażę ci.»); retry — лавандова рамка (кругова стрілка, «спробуй ще»). */
export type BubbleVariant = 'speech' | 'thinking' | 'talking' | 'hint' | 'retry';

export interface SpeechBubbleProps {
  variant?: BubbleVariant;
  /** Хвостик до рота Kubika: зліва внизу (стандарт) або справа. */
  tail?: 'left' | 'right';
  /** Підпис для екранного диктора. Без нього бульбашка прихована від нього: те саме вже звучить голосом. */
  label?: string;
  /** Лише іконки або цифри — дитина ще не читає, тексту в бульбашці немає. */
  children?: ReactNode;
  className?: string;
}

/** Бульбашка Kubika (BRIEF §7, design etap1/08): біла, контур 3, радіус 24, мін. висота 104. Хвостик виступає на 22 px під бульбашку. */
export function SpeechBubble({ variant = 'speech', tail = 'left', label, children, className }: SpeechBubbleProps) {
  return (
    <div
      className={cx(styles.bubble, variant !== 'speech' && styles[variant], className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className={styles.body}>{children}</div>
      {variant === 'thinking' ? (
        <svg className={cx(styles.cloud, tail === 'right' && styles.mirror)} viewBox="0 0 44 36" aria-hidden="true" focusable="false">
          <circle className={styles.shape} cx="14" cy="8" r="7" />
          <circle className={styles.shape} cx="6" cy="27" r="4.5" />
        </svg>
      ) : (
        <svg className={cx(styles.tail, tail === 'right' && styles.mirror)} viewBox="0 0 40 26" aria-hidden="true" focusable="false">
          <path className={styles.shape} d="M2 0 L10 24 L30 0" />
          <path className={styles.cover} d="M4 -1 H28" />
        </svg>
      )}
    </div>
  );
}
