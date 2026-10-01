import { bonesLabel } from '../../speech/lines';
import { BONES_PER_LEVEL, boneStates } from './boneStates';
import { cx } from './cx';
import { iconArt } from './icons';
import styles from './ProgressBones.module.css';

const BONE = iconArt('bone');

export interface ProgressBonesProps {
  /** Слотів завжди 6 (кісточку дають і після «показу разом»). */
  total?: number;
  /** Скільки слотів заповнено, разом із тим, що долітає. */
  filled: number;
  /** Індекс слота, куди кісточка щойно долетіла: підсвічений слот + посадка за 600 мс. Лише одна за раз. */
  arriving?: number | null;
  className?: string;
}

/** Ряд слотів-кісточок рівня (BRIEF §7). Не інтерактивний; розкладка за в'юпортом із --kl-bone-* (responsive.css):
 *  ряд зі слотами → 2 ряди по 3 на телефоні → compact 28 px у 844×390. */
export function ProgressBones({ total = BONES_PER_LEVEL, filled, arriving = null, className }: ProgressBonesProps) {
  const states = boneStates(total, filled, arriving);
  return (
    <div role="img" aria-label={bonesLabel(filled, total)} className={cx(styles.bones, className)}>
      {states.map((state, i) => (
        <span key={i} className={styles.slot} data-state={state}>
          <svg viewBox={BONE.viewBox} className={styles.bone} aria-hidden="true" focusable="false">
            <g className={styles.shape} dangerouslySetInnerHTML={{ __html: BONE.inner }} />
            {state !== 'empty' && <path className={styles.shine} d="M14 22.6 H30" />}
          </svg>
        </span>
      ))}
    </div>
  );
}
