import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { cssVars, cx } from './cx';
import { sliderFraction, sliderTickCount } from './sliderMath';
import styles from './Slider.module.css';

export interface SliderProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  /** Назва повзунка для диктора; без `startLabel` показується ліворуч («Mowa», «Efekty», «Muzyka»). */
  label: string;
  value: number;
  /** Під час перетягування (кожна зміна). */
  onChange: (value: number) => void;
  /** Після відпускання (і після кожного кроку клавіатурою): напр. пробна фраза «Brawo!» після зміни «Mowa». */
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Текст праворуч, напр. «80%». */
  valueText?: string;
  /** Підпис ліворуч замість `label` (темп: «Wolniej»). */
  startLabel?: string;
  /** Підпис праворуч замість `valueText` (темп: «Szybciej»). */
  endLabel?: string;
  /** Поділки під треком (темп мови: 6). */
  showTicks?: boolean;
  disabled?: boolean;
}

/** Повзунок (design etap1/10): трек 8 px, кулька 28 px, зона дотику 44 px; справжній <input type="range">, тож стрілки клавіатури
 *  крокують на `step`. Перетягування — кулька 36 px із тінню. Інтерфейс дорослого (Strefa rodzica): 18 px, Nunito 600. */
export function Slider({
  label, value, onChange, onCommit, min = 0, max = 100, step = 1, valueText, startLabel, endLabel, showTicks = false, disabled, className, ...rest
}: SliderProps) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = input.current;
    if (!el || !onCommit) return;
    const handler = () => onCommit(Number(el.value));
    el.addEventListener('change', handler); // нативний change: відпускання пальця/миші, крок клавіатури
    return () => el.removeEventListener('change', handler);
  }, [onCommit]);

  const ticks = showTicks ? sliderTickCount(min, max, step) : 0;
  return (
    <div className={cx(styles.row, className)} {...rest}>
      <span className={styles.start}>{startLabel ?? label}</span>
      <div className={styles.control}>
        <input
          ref={input}
          className={styles.range}
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          style={cssVars({ '--p': sliderFraction(value, min, max) })}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {ticks > 0 && (
          <span className={styles.ticks} aria-hidden="true">
            {Array.from({ length: ticks }, (_, i) => (
              <span key={i} className={styles.tick} />
            ))}
          </span>
        )}
      </div>
      <span className={styles.end}>{endLabel ?? valueText}</span>
    </div>
  );
}
