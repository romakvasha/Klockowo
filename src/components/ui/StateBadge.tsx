import { cx } from './cx';
import styles from './StateBadge.module.css';

/** ok — правильно (зелена галочка), chosen — обрано в PupPicker (синя галочка), retry — «спробуй ще» (кругова стрілка).
 *  Значок завжди непрозорий: сигнал ніколи не лише кольором, контраст рамки від 3:1 (BRIEF §7, §13). */
export type BadgeKind = 'ok' | 'chosen' | 'retry';

export function StateBadge({ kind, className }: { kind: BadgeKind; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cx(styles.badge, className)} aria-hidden="true" focusable="false">
      {kind === 'retry' ? (
        <>
          <circle className={cx(styles.ring, styles.ringRetry)} cx="20" cy="20" r="17.5" />
          <path className={styles.arc} d="M20 11 A9 9 0 1 1 11 20" />
          <path className={styles.head} d="M11 12.5 L6.5 20 L15.5 20 Z" />
        </>
      ) : (
        <>
          <circle className={styles.ring} cx="20" cy="20" r="17.5" />
          <path className={cx(styles.tick, kind === 'chosen' ? styles.tickChosen : styles.tickOk)} d="M12 20.5 L17.5 26 L28.5 15" pathLength="100" />
        </>
      )}
    </svg>
  );
}
