import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from './cx';
import { HOLD_MS, RING_LENGTH, RING_R, holdProgress, ringOffset } from './holdProgress';
import styles from './HoldToConfirm.module.css';

export interface HoldToConfirmProps {
  /** aria-label: польське пояснення жесту, напр. «Strefa rodzica — przytrzymaj 3 sekundy». */
  label: string;
  /** Викликається один раз, коли утримання дійшло до кінця. */
  onConfirm: () => void;
  durationMs?: number;
  /** Іконка всередині кружка 48 px (шестерня). */
  children: ReactNode;
  className?: string;
}

/** Кнопка, яку треба утримувати (шестерня батьків, BRIEF §6.14): кільце заповнюється лінійно за 3 с, відпустив раніше — кільце
 *  згасає за 150 мс і нічого не стається. Дитина випадково не потрапить у Strefa rodzica. Працює мишею, дотиком і клавіатурою
 *  (утримувати Enter або пробіл). Зона дотику 64 px; сам кружок спокійний (ink-soft, без краю), щоб не приваблювати. */
export function HoldToConfirm({ label, onConfirm, durationMs = HOLD_MS, children, className }: HoldToConfirmProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const frame = useRef(0);
  const startedAt = useRef(0);
  const active = useRef(false);
  const confirm = useRef(onConfirm);

  useEffect(() => {
    confirm.current = onConfirm;
  });

  const stop = useCallback(() => {
    active.current = false;
    cancelAnimationFrame(frame.current);
    setHolding(false);
    setProgress(0);
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (!active.current) return;
      const p = holdProgress(now - startedAt.current, durationMs);
      setProgress(p);
      if (p >= 1) {
        stop();
        confirm.current();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    },
    [durationMs, stop],
  );

  const begin = useCallback(() => {
    if (active.current) return;
    active.current = true;
    startedAt.current = performance.now();
    setHolding(true);
    frame.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => stop, [stop]); // зняти кадр при розмонтуванні

  return (
    <button
      type="button"
      aria-label={label}
      data-holding={holding}
      className={cx(styles.zone, className)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        begin();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          event.preventDefault();
          begin();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === 'Enter' || event.key === ' ') stop();
      }}
      onBlur={stop}
    >
      <svg className={styles.ring} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle className={styles.track} cx="32" cy="32" r={RING_R} />
        <circle
          className={styles.bar}
          cx="32"
          cy="32"
          r={RING_R}
          style={{ strokeDasharray: RING_LENGTH, strokeDashoffset: ringOffset(progress) }}
        />
      </svg>
      <span className={styles.disc}>{children}</span>
    </button>
  );
}
