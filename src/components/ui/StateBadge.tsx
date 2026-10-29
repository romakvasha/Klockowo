import { cx } from './cx';
import styles from './StateBadge.module.css';

/** ok — правильно (галочка на зеленому), chosen — обрано в PupPicker (галочка на синьому), retry — «спробуй ще» (кругова стрілка на фіолетовому).
 *  Значок завжди непрозорий: сигнал ніколи не лише кольором, контраст білого знака з кругом від 4 : 1 (BRIEF §7, §13; полотно D1). */
export type BadgeKind = 'ok' | 'chosen' | 'retry';

const RING: Readonly<Record<BadgeKind, string | undefined>> = { ok: styles.ringOk, chosen: styles.ringChosen, retry: styles.ringRetry };

export function StateBadge({ kind, className }: { kind: BadgeKind; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cx(styles.badge, className)} aria-hidden="true" focusable="false">
      <circle className={cx(styles.ring, RING[kind])} cx="20" cy="20" r="17.5" />
      {kind === 'retry' ? (
        <>
          <path className={styles.arc} d="M20 11 A9 9 0 1 1 11 20" />
          <path className={styles.head} d="M11 12.5 L6.5 20 L15.5 20 Z" />
        </>
      ) : (
        <path className={styles.tick} d="M12 20.5 L17.5 26 L28.5 15" pathLength="100" />
      )}
    </svg>
  );
}
