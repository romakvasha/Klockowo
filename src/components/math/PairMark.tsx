import { cx } from '../ui/cx';
import styles from './PairMark.module.css';

/** Позначка пари «Cyfra i obrazek»: у кожного набору своя форма й колір (коло, квадрат, трикутник, ромб) — така ж з'являється на цифрі, з якою його з'єднано.
 *  Форма дублює колір: пари розрізняються й без нього (BRIEF §13). */
export const PAIR_SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const;
export type PairShape = (typeof PAIR_SHAPES)[number];

/** Кольори пар: помаранчевий, бірюзовий, пурпурний, коричневий — без жовтого (підказка), зеленого (правильно), фіолетового (спробуй ще) і синього (вибір). */
export const PAIR_COLORS = [
  { fill: '#FF8A3D', edge: '#D9661C' },
  { fill: '#2FA58B', edge: '#007E67' },
  { fill: '#D46BD8', edge: '#A847AC' },
  { fill: '#A0714F', edge: '#6E4A2E' },
] as const;

export interface PairMarkProps {
  /** Номер пари 0–3: за ним форма й колір. */
  pair: number;
  /** Сторона позначки, px. */
  size?: number;
  className?: string;
}

const GLYPH: Record<PairShape, string> = {
  circle: 'M20 9 a11 11 0 1 0 0.01 0 Z',
  square: 'M10 10 H30 V30 H10 Z',
  triangle: 'M20 8 L32 31 H8 Z',
  diamond: 'M20 7 L33 20 L20 33 L7 20 Z',
};

/** Кружечок кольору пари з білою формою всередині: стоїть у кутку картки набору й картки-цифри. */
export function PairMark({ pair, size = 36, className }: PairMarkProps) {
  const index = ((pair % PAIR_SHAPES.length) + PAIR_SHAPES.length) % PAIR_SHAPES.length;
  const shape = PAIR_SHAPES[index]!;
  const color = PAIR_COLORS[index]!;
  return (
    <svg className={cx(styles.mark, className)} data-shape={shape} viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18" fill={color.fill} stroke={color.edge} strokeWidth="3" />
      <path d={GLYPH[shape]} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
