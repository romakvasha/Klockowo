import { jumpLabel } from '../../speech/lines';
import { Digits } from '../ui/Digits';
import type { Arc } from './padLayout';
import styles from './JumpArc.module.css';

export interface JumpArcProps {
  arc: Arc;
  /** Порядковий номер стрибка (1, 2, 3…): рахуємо стрибки, не листки. */
  n: number;
  /** Розмір поля, в якому лежить дуга (design-px). */
  width: number;
  height: number;
  /** ghost — маршрут-підказка (пунктир); next — наступна дуга, яку треба торкнутися. */
  ghost?: boolean;
  next?: boolean;
  /** З нею бейдж — кнопка (підказка 2: дитина торкається кожної дуги). */
  onPress?: () => void;
}

const BADGE = 32;

/** Дуга стрибка жабки з бейджем-номером стрибка посередині («Skoki żabki», design-px). Сигнал — не лише колір: виконана дуга суцільна, маршрут-підказка пунктирна. */
export function JumpArc({ arc, n, width, height, ghost = false, next = false, onPress }: JumpArcProps) {
  const badgeStyle = { left: arc.mid.x - BADGE / 2, top: arc.mid.y - BADGE / 2, width: BADGE, height: BADGE };
  const digits = <Digits value={n} style={{ height: n >= 10 ? 14 : 18 }} />;
  return (
    <>
      <svg className={styles.arc} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" data-ghost={ghost}>
        <path d={arc.d} pathLength={ghost ? undefined : 100} />
      </svg>
      {onPress ? (
        <button type="button" className={styles.badge} data-ghost={ghost} data-next={next} style={badgeStyle} aria-label={jumpLabel(n)} onClick={onPress}>
          {digits}
        </button>
      ) : (
        <span className={styles.badge} data-ghost={ghost} style={badgeStyle} role="img" aria-label={jumpLabel(n)}>
          {digits}
        </span>
      )}
    </>
  );
}
