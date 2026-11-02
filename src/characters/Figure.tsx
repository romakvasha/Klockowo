import type { CSSProperties, ReactNode } from 'react';
import { cssVars, cx } from '../components/ui/cx';
import type { Art } from './art';
import type { Motion } from './poses';
import styles from './Figure.module.css';

/** Пропорції коробки фігури (як у старих SVG 200×250): з нею зона провідника не «стрибає» від пози до пози. */
const BOX_RATIO = 0.8;

export interface FigureProps {
  art: Art;
  /** Назва пози — лише для data-pose (відладка, CSS). */
  pose: string;
  motion: Motion;
  /** Говорить: рот A/O/E, якщо поза має кадри рота (`mouth`), інакше — легке кивання. Зазвичай tts.speaking. */
  talking?: boolean;
  /** false — повністю статична фігура (альбом, список). */
  animate?: boolean;
  /** Висота коробки, px. За замовчуванням --kl-kubik-h за в'юпортом (184 → 150 → 120 → 100). */
  size?: number;
  /** Дзеркально (команда показує вправо, вліво — flip). */
  flip?: boolean;
  /** Підпис для екранного диктора; без нього фігура декоративна. */
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Шари поверх картинки (рот, картка) — у частках її рамки. */
  children?: ReactNode;
  /** Серед шарів є кадри рота (.mouth); інакше під час мовлення фігура киває. */
  mouth?: boolean;
}

/** Шар поверх картинки в частках її рамки (0–1). */
export function boxStyle(box: { x: number; y: number; w: number; h: number }): CSSProperties {
  const pct = (v: number) => `${(v * 100).toFixed(3)}%`;
  return { left: pct(box.x), top: pct(box.y), width: pct(box.w), height: pct(box.h) };
}

/** Фігура персонажа: картинка пози в коробці 4 : 5 (по низу й центру, без обрізання) + рух чистим CSS — дихання 3 с, стрибок,
 *  рот A/O/E. Компонент, що викликає, ставить `key={pose}`: нова поза монтує фігуру заново й програє «появу». */
export function Figure({ art, pose, motion, talking = false, animate = true, size, flip = false, label, className, style, children, mouth = false }: FigureProps) {
  const ratio = art.w / art.h;
  const frame = ratio > BOX_RATIO ? { width: '100%', height: `${(BOX_RATIO / ratio) * 100}%` } : { width: `${(ratio / BOX_RATIO) * 100}%`, height: '100%' };
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx(styles.figure, flip && styles.flip, className)}
      data-pose={pose}
      data-motion={motion}
      data-animate={animate ? 'true' : 'false'}
      data-talking={talking ? 'true' : 'false'}
      data-mouth={mouth ? 'true' : 'false'}
      style={cssVars({ '--fig-h': size === undefined ? undefined : `${size}px` }, style)}
    >
      <div className={styles.motion} style={frame}>
        <img className={styles.art} src={art.url} alt="" width={art.w} height={art.h} draggable={false} />
        {children}
      </div>
    </div>
  );
}
