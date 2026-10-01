import { useMemo } from 'react';
import { CONFETTI_MAX, confettiPieces } from './confettiPieces';
import { cssVars } from './cx';
import styles from './Confetti.module.css';

export interface ConfettiProps {
  count?: number;
  /** Зерно: той самий малюнок при повторі; інший — для іншого святкування. */
  seed?: number;
}

/** Конфеті з кольорових кубиків на весь екран, до 1,5 с (BRIEF §11): лише наприкінці рівня чи світу. У режимі «Mniej animacji» не показується. */
export function Confetti({ count = CONFETTI_MAX, seed = 1 }: ConfettiProps) {
  const pieces = useMemo(() => confettiPieces(count, seed), [count, seed]);
  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={cssVars({
            '--x': `${p.x}%`,
            '--size': `${p.size}px`,
            '--color': p.color,
            '--spin': `${p.spin}deg`,
            '--drift': `${p.drift}vw`,
            '--delay': `${p.delay}ms`,
            '--dur': `${p.duration}ms`,
          })}
        />
      ))}
    </div>
  );
}
