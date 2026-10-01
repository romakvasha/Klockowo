import type { CSSProperties, ReactNode, Ref } from 'react';
import { cx } from '../ui/cx';
import { StateBadge } from '../ui/StateBadge';
import styles from './DropZone.module.css';

/** empty — пунктир, чекає · target — предмет над зоною чи вибрано предмет (синя рамка, +3 %) · filled — предмети всередині · correct — зелена рамка й галочка.
 *  Стани — design etap2/07. */
export type DropZoneState = 'empty' | 'target' | 'filled' | 'correct';

export interface DropZoneProps {
  state?: DropZoneState;
  /** Форма: еліпс (тарілка), заокруглений прямокутник (коробка, кошик, клітинка). */
  shape?: 'plate' | 'box';
  /** Підпис для екранного диктора («talerz», «koszyk»). */
  label: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** З useDragTap().zoneProps(zone): ref для влучання й дотик «предмет → місце». */
  zoneRef?: Ref<HTMLDivElement>;
  onPress?: () => void;
}

/** Місце, куди кладуть предмети: тарілка, кошик, вагон, клітинка рамки. Дотик по ньому при вибраному предметі ставить його сюди. */
export function DropZone({ state = 'empty', shape = 'plate', label, children, className, style, zoneRef, onPress }: DropZoneProps) {
  return (
    <div
      ref={zoneRef}
      role="button"
      tabIndex={0}
      aria-label={label}
      className={cx(styles.zone, shape === 'plate' ? styles.plate : styles.box, className)}
      data-state={state}
      style={style}
      onClick={onPress}
      onKeyDown={(e) => {
        if (onPress && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPress();
        }
      }}
    >
      <span className={styles.items}>{children}</span>
      {state === 'correct' && <StateBadge kind="ok" />}
    </div>
  );
}
