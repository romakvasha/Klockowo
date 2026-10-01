import type { WorldKey } from '../../curriculum/types';
import { cx } from '../ui/cx';
import { groupBoxes, type DotLayout } from './dotPatterns';
import styles from './DotCard.module.css';

export interface DotCardProps {
  layout: DotLayout;
  /** front — крапки видно; back — «сорочка» (зворот): дитина має запам'ятати, скільки було. */
  face: 'front' | 'back';
  /** Обвести групи, на які розпадаються крапки («trzy i dwa to pięć»). */
  groups?: boolean;
  /** Сторона картки, px. */
  size: number;
  /** Світ: колір сорочки. */
  world: WorldKey;
  /** Підпис для екранного диктора (без числа, щоб не видати відповідь). */
  label: string;
  className?: string;
}

/** Карти в SVG-одиницях 100×100: крапки в [10, 90] (відображення x ↦ 10 + 80x). */
const px = (v: number): number => 10 + v * 80;

/** DotCard (design etap2/07): біла картка з контуром ink і крапками; сорочка — блоковий візерунок кольору світу; групи обводяться двома рамками.
 *  Рамка-десятка малює комірки 5×2. Поворот лицем/зворотом — 300 мс (kl-flip). */
export function DotCard({ layout, face, groups = false, size, world, label, className }: DotCardProps) {
  const n = layout.dots.length;
  const r = layout.frame ? 5.6 : n >= 7 ? 6.6 : 8.4;
  const boxes = groups && face === 'front' ? groupBoxes(layout.dots, layout.groups, r / 80, 0.045) : [];
  return (
    <svg
      key={face}
      className={cx(styles.card, className)}
      data-face={face}
      data-world={world}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      focusable="false"
    >
      <rect className={styles.paper} x="2.5" y="2.5" width="95" height="95" rx="14" />
      {face === 'front' ? (
        <>
          {layout.frame && (
            <g className={styles.frame}>
              {Array.from({ length: 10 }, (_, i) => (
                <rect key={i} x={10 + (i % 5) * 16} y={34 + Math.floor(i / 5) * 16} width="16" height="16" />
              ))}
            </g>
          )}
          {boxes.map((b, i) => (
            <rect
              key={i} className={styles.group} data-group={i}
              x={px(b.x)} y={px(b.y)} width={b.w * 80} height={b.h * 80} rx="9"
            />
          ))}
          {layout.dots.map((d, i) => (
            <circle key={i} className={styles.dot} cx={px(d.x)} cy={px(d.y)} r={r} />
          ))}
        </>
      ) : (
        <g className={styles.back}>
          <rect className={styles.backFill} x="8" y="8" width="84" height="84" rx="10" />
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} className={styles.backCell} data-odd={(Math.floor(i / 4) + (i % 4)) % 2 === 1} x={12 + (i % 4) * 19} y={12 + Math.floor(i / 4) * 19} width="17" height="17" rx="3" />
          ))}
          <text className={styles.question} x="50" y="66" textAnchor="middle">?</text>
        </g>
      )}
    </svg>
  );
}
