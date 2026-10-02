import type { WorldKey } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import { Digits } from '../ui/Digits';
import { cssVars } from '../ui/cx';
import { ObjectArt } from './ObjectArt';
import { fitGrid, gridCell } from './fitGrid';
import styles from './Basket.module.css';

/** Що лежить у кошику: предмет або «плашка» з числом (там, де предмети сховані кришкою: перша група лічиться «від числа»). */
export type BasketItem = { kind: 'object' } | { kind: 'chip'; value: number };

/** Розміри кошика: обідок угорі, поля й відступи — у дизайнових px, як і все в композиції «Ile razem?». */
export const BASKET_RIM = 28;
const PAD_X = 14;
const PAD_TOP = 8;
const PAD_BOTTOM = 14;
export const BASKET_OBJECT_MAX = 64;

/** Область для предметів усередині кошика заданого розміру. */
export function basketInterior(width: number, height: number): { x: number; y: number; w: number; h: number } {
  return { x: PAD_X, y: BASKET_RIM + PAD_TOP, w: width - 2 * PAD_X, h: height - BASKET_RIM - PAD_TOP - PAD_BOTTOM };
}

export interface BasketProps {
  items: readonly BasketItem[];
  object: ObjectId;
  world: WorldKey;
  width: number;
  height: number;
  /** Номер, який Kubik щойно назвав на предметі (лічба «далі»); null — без номера. */
  marks?: readonly (number | null)[];
  /** Закрита кришка з числом: предметів не видно, лічити треба від цього числа. */
  lid?: number | null;
  /** Предмети від цього індексу «висипаються» — з'являються по черзі. */
  freshFrom?: number;
  /** Предмети радіють (правильна відповідь). */
  celebrate?: boolean;
  label: string;
}

/** Basket (BRIEF §7 гра 9; design ще не намальовано — зібрано з блоків за описом): кошик із обідком кольору світу й предметами всередині. Закритий кришкою —
 *  блоковий щит із числом. Сигнал — наповнення й число, не лише колір. */
export function Basket({ items, object, world, width, height, marks, lid = null, freshFrom, celebrate = false, label }: BasketProps) {
  const inner = basketInterior(width, height);
  const fit = fitGrid(items.length, inner.w, inner.h, 6, BASKET_OBJECT_MAX);
  return (
    <div
      className={styles.basket}
      role="img"
      aria-label={label}
      style={cssVars({ '--bk-500': `var(--kl-${world}-500)`, '--bk-100': `var(--kl-${world}-100)`, '--bk-700': `var(--kl-${world}-700)` }, { width, height })}
    >
      <div className={styles.body} />
      <div className={styles.rim} style={{ height: BASKET_RIM }} />
      <div className={styles.inside} style={{ left: inner.x, top: inner.y, width: inner.w, height: inner.h }}>
        {lid === null &&
          items.map((item, i) => {
            const p = gridCell(fit, i, items.length, inner.w, inner.h);
            const mark = marks?.[i] ?? null;
            const fresh = freshFrom !== undefined && i >= freshFrom;
            return (
              <span
                key={i}
                className={styles.item}
                data-fresh={fresh}
                data-celebrate={celebrate}
                style={{ left: p.x, top: p.y, width: fit.size, height: fit.size, animationDelay: fresh ? `${(i - freshFrom) * 80}ms` : undefined }}
              >
                {item.kind === 'object' ? (
                  <ObjectArt object={object} size={Math.round(fit.size * 0.92)} />
                ) : (
                  <span className={styles.chip}>
                    <span className={styles.chipNum}>
                      <Digits value={item.value} style={{ height: Math.round(fit.size * (item.value >= 10 ? 0.34 : 0.46)) }} />
                    </span>
                  </span>
                )}
                {mark !== null && (
                  <span className={styles.badge} style={{ width: Math.round(fit.size * 0.58), height: Math.round(fit.size * 0.58) }}>
                    <Digits value={mark} style={{ height: Math.round(fit.size * (mark >= 10 ? 0.26 : 0.34)) }} />
                  </span>
                )}
              </span>
            );
          })}
        {lid !== null && (
          <span className={styles.lid}>
            <span className={styles.chipNum} style={{ padding: '6px 18px' }}>
              <Digits value={lid} style={{ height: Math.min(64, Math.round(inner.h * 0.5)) }} />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
