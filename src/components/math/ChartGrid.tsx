import { Digits } from '../ui/Digits';
import { cssVars, cx } from '../ui/cx';
import type { WorldKey } from '../../curriculum/types';
import styles from './ChartGrid.module.css';

/** normal — число; leaf — закрито листочком («?»); ask — листочок, під яким шукане число (золота рамка); hl — золота підсвітка (рядок, стовпчик, ціль); painted — розфарбовано; selected — вибрано дитиною (кільце); dim — приглушено (поза діапазоном). */
export type ChartCell = 'normal' | 'leaf' | 'ask' | 'hl' | 'painted' | 'selected' | 'dim';

export interface ChartGridProps {
  /** Числа клітинок за порядком (ряд за рядом): 1…100 для всієї таблиці, 10 чисел одного ряду для лупи. */
  numbers: readonly number[];
  /** Скільки клітинок у ряду: 10 — таблиця й широка лупа, 5 — лупа на вузькому екрані (рядок у два шматки). */
  cols: number;
  /** Сторона клітинки, px (межі — лінії, без проміжків). */
  cell: number;
  world: WorldKey;
  state: (n: number) => ChartCell;
  /** Числа в клітинках (на мініатюрі дрібніших за 24 px їх не показують). */
  showNumbers?: boolean;
  /** Яким із 4 кольорів розфарбовано клітинку (0–3) — лише для стану painted: вільне розфарбовування в «Plac Zabaw». */
  paint?: (n: number) => number;
  /** Дотик по клітинці; без нього клітинки — звичайні елементи. */
  onPress?: (n: number) => void;
  /** aria-label клітинки (зі словами, не цифрами: диктор читає число). */
  labelOf?: (n: number) => string;
  className?: string;
  label?: string;
}

/** Таблиця 100 і її шматки (BRIEF §10, §12): клітинки без проміжків, між ними лінії; число SVG-цифрами; стани — не лише кольором (листочок має «?», вибране — кільце,
 *  розфарбоване — заливка кольору світу + галочка-крапка). Той самий компонент малює мініатюру всієї таблиці (cell 15–40) і лупу-рядок (cell ≥ 64). */
/** Чотири кольори розфарбовування: зелений, помаранчевий, блакитний, кораловий (кольори світів W1–W4). */
export const PAINT_COLORS = ['var(--kl-w1-500)', 'var(--kl-w2-500)', 'var(--kl-w3-500)', 'var(--kl-w4-500)'] as const;

export function ChartGrid({ numbers, cols, cell, world, state, showNumbers = true, paint, onPress, labelOf, className, label }: ChartGridProps) {
  const rows = Math.ceil(numbers.length / cols);
  const digit = Math.round(cell * 0.42);
  return (
    <div
      className={cx(styles.grid, className)}
      role={label ? 'group' : undefined}
      aria-label={label}
      style={cssVars(
        { '--cg-500': `var(--kl-${world}-500)`, '--cg-100': `var(--kl-${world}-100)`, '--cg-700': `var(--kl-${world}-700)` },
        { gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px`, width: cols * cell + 6, height: rows * cell + 6 },
      )}
    >
      {numbers.map((n) => {
        const st = state(n);
        const inner =
          st === 'leaf' || st === 'ask' ? (
            <span className={styles.leaf} aria-hidden="true">
              <b style={{ fontSize: Math.max(10, Math.round(cell * 0.5)) }}>?</b>
            </span>
          ) : showNumbers ? (
            <Digits value={n} style={{ height: digit }} />
          ) : null;
        const paintIdx = st === 'painted' ? paint?.(n) : undefined;
        const common = { className: styles.cell, 'data-state': st, style: paintIdx === undefined ? undefined : { background: PAINT_COLORS[paintIdx % PAINT_COLORS.length] } } as const;
        return onPress ? (
          <button key={n} type="button" {...common} aria-label={labelOf?.(n)} onClick={() => onPress(n)}>
            {inner}
          </button>
        ) : (
          <span key={n} {...common}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}
