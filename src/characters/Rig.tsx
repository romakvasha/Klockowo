import { useState, type CSSProperties } from 'react';
import { cssVars, cx } from '../components/ui/cx';
import type { RigMarkup } from './markup';
import type { Motion } from './poses';
import styles from './Rig.module.css';

export interface RigProps {
  art: RigMarkup;
  /** Назва пози — лише для data-pose (відладка, CSS). */
  pose: string;
  motion: Motion;
  /** Рот A/O/E; без руху (reduced-motion, animate=false) — просто відкритий рот. Зазвичай tts.speaking. */
  talking?: boolean;
  /** false — повністю статична фігура (альбом, список). */
  animate?: boolean;
  /** Висота фігури, px. За замовчуванням --kl-kubik-h за в'юпортом (184 → 150 → 120 → 100). */
  size?: number;
  /** Дзеркально (команда дивиться вправо, вліво — flip). */
  flip?: boolean;
  /** Підпис для екранного диктора; без нього фігура декоративна. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** Фігура персонажа: розмітка пози + рух чистим CSS (дихання 3 с, кліпання раз на 4–6 с, рот A/O/E, стрибок і хвіст).
 *  Компонент, що викликає, ставить `key={pose}`: нова поза монтує фігуру заново й програє «появу». */
export function Rig({ art, pose, motion, talking = false, animate = true, size, flip = false, label, className, style }: RigProps) {
  // кожна фігура кліпає у свій час, щоб кілька персонажів не кліпали хором
  const [blink] = useState(() => ({ every: 4 + Math.random() * 2, offset: -Math.random() * 4 }));
  return (
    <svg
      viewBox={art.viewBox}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cx(styles.rig, flip && styles.flip, className)}
      data-pose={pose}
      data-motion={motion}
      data-animate={animate ? 'true' : 'false'}
      data-talking={talking ? 'true' : 'false'}
      data-blink={art.blink ? 'true' : 'false'}
      style={cssVars(
        { '--rig-h': size === undefined ? undefined : `${size}px`, '--blink-every': `${blink.every}s`, '--blink-offset': `${blink.offset}s` },
        style,
      )}
    >
      <g className={styles.motion} dangerouslySetInnerHTML={{ __html: art.inner }} />
    </svg>
  );
}
