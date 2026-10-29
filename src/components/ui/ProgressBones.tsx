import { bonesLabel } from '../../speech/lines';
import { BONES_PER_LEVEL, boneStates } from './boneStates';
import { cx } from './cx';
import { iconArt } from './icons';
import styles from './ProgressBones.module.css';

const BONE = iconArt('bone');
/** Рамка самої кісточки в іконці 48×48 (полотно D1: bone-full.svg, bone-empty.svg). */
const BONE_BOX = '3 15 42 18';

export interface ProgressBonesProps {
  /** Слотів завжди 6 (кісточку дають і після «показу разом»). */
  total?: number;
  /** Скільки слотів заповнено, разом із тим, що долітає. */
  filled: number;
  /** Індекс слота, куди кісточка щойно долетіла: підсвічений слот + посадка за 600 мс. Лише одна за раз. */
  arriving?: number | null;
  className?: string;
}

/** Кісточки рівня на білій картці (BRIEF §7, полотно D1 HUD): повна — жовта суцільна, порожня — бліда з пунктиром. Не інтерактивні;
 *  розкладка за в'юпортом із --kl-bone-* (responsive.css): ряд 6 → 2 ряди по 3 на телефоні → компактний ряд у 844×390. */
export function ProgressBones({ total = BONES_PER_LEVEL, filled, arriving = null, className }: ProgressBonesProps) {
  const states = boneStates(total, filled, arriving);
  return (
    <div role="img" aria-label={bonesLabel(filled, total)} className={cx('kl-card', styles.bones, className)}>
      {states.map((state, i) => (
        <span key={i} className={styles.slot} data-state={state}>
          <svg viewBox={BONE_BOX} className={styles.bone} aria-hidden="true" focusable="false">
            <g className={styles.shape} dangerouslySetInnerHTML={{ __html: BONE.inner }} />
            {state !== 'empty' && <path className={styles.shine} d="M15 22.6 H33" />}
          </svg>
        </span>
      ))}
    </div>
  );
}
