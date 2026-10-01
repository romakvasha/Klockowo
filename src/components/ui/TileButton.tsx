import type { ComponentPropsWithRef } from 'react';
import { tileLabel } from '../../speech/lines';
import { cssVars, cx } from './cx';
import { Digits } from './Digits';
import { Dots } from './Dots';
import { layoutDots } from './dotsLayout';
import { Icon } from './Icon';
import { StateBadge } from './StateBadge';
import { pressHandler } from './tick';
import styles from './Tile.module.css';

/** default · selected (кільце 4 px) · correct (зелена + галочка) · retry (лаванда + стрілка, вміст 40 %, неактивна) ·
 *  locked (замок) · dragging (×1,1) · highlighted (підказка / показ разом). pressed і focus-visible — це :active і :focus-visible. */
export type TileState = 'default' | 'selected' | 'correct' | 'retry' | 'locked' | 'dragging' | 'highlighted';

export interface TileButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Число на плитці (0–999); aria-label — число словами польською, зі станом для correct/retry/locked. */
  value: number;
  state?: TileState;
  /** Сторона плитки, px (за замовчуванням --kl-tile за в'юпортом: 120 → 140 / 128 / 96 / 88). */
  size?: number;
  /** Висота цифри, px (за замовчуванням --kl-tile-digit: 72 → 80 / 76 / 56 / 49). */
  digit?: number;
  /** Кольорові розряди (десятки/одиниці) на двоцифрових: W4–W7, лише на білій плитці; у correct цифри стають ink. */
  places?: boolean;
  /** W1: кількість крапок під цифрою. */
  dots?: number;
  dotsPerRow?: number;
  /** Без звукового «тика» — коли екран сам грає потрібний звук. */
  silent?: boolean;
  /** Внутрішнє: квадратна плитка чи картка 3:4. Користуйтеся AnswerTile / DigitCard. */
  shape?: 'square' | 'card';
}

export function TileButton({
  value, state = 'default', size, digit, places = false, dots, dotsPerRow = 5, silent, shape = 'square',
  className, style, disabled, onPointerDown, ...rest
}: TileButtonProps) {
  const locked = state === 'locked';
  const inactive = locked || state === 'retry' || disabled;
  const selectable = state === 'default' || state === 'selected';
  const hasDots = dots !== undefined && !locked;
  return (
    <button
      type="button"
      aria-label={tileLabel(value, state)}
      aria-pressed={selectable ? state === 'selected' : undefined}
      data-state={state}
      data-dot-rows={hasDots ? layoutDots(dots, dotsPerRow).rows.length : undefined}
      disabled={inactive}
      className={cx('kl-block', styles.tile, shape === 'card' && styles.card, hasDots && styles.withDots, className)}
      style={cssVars(
        { '--kl-tile': size === undefined ? undefined : `${size}px`, '--kl-tile-digit': digit === undefined ? undefined : `${digit}px` },
        style,
      )}
      onPointerDown={pressHandler(silent, inactive, onPointerDown)}
      {...rest}
    >
      {locked ? (
        <Icon name="lock" className={styles.lock} />
      ) : (
        <span className={styles.glyphs}>
          <Digits value={value} places={places && state !== 'correct'} className={styles.digit} />
          {hasDots && (
            <Dots count={dots} perRow={dotsPerRow} unit={`calc(var(--kl-tile) / ${shape === 'card' ? 109 : 120})`} className={styles.dots} />
          )}
        </span>
      )}
      {state === 'correct' && <StateBadge kind="ok" />}
      {state === 'retry' && <StateBadge kind="retry" />}
    </button>
  );
}
