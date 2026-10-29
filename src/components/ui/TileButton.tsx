import type { ComponentPropsWithRef } from 'react';
import { tileLabel } from '../../speech/lines';
import type { BrickColor } from './brick';
import { cssVars, cx } from './cx';
import { Digits } from './Digits';
import { Dots } from './Dots';
import { layoutDots } from './dotsLayout';
import { Icon } from './Icon';
import { StateBadge } from './StateBadge';
import { pressHandler } from './tick';
import styles from './Tile.module.css';

/** default · selected (піднята, біла рамка із синім обідком, крапка під нею) · correct (зелена + галочка) · retry (бліда, вміст 40 %,
 *  непрозора фіолетова рамка й стрілка, неактивна) · locked (сіра із замком) · dragging (×1,1) · highlighted (підказка / показ разом).
 *  pressed і focus-visible — це :active і :focus-visible. */
export type TileState = 'default' | 'selected' | 'correct' | 'retry' | 'locked' | 'dragging' | 'highlighted';

export interface TileButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'color'> {
  /** Число на плитці (0–999); aria-label — число словами польською, зі станом для correct/retry/locked. */
  value: number;
  state?: TileState;
  /** Колір цеглинки (полотно D1): за замовчуванням синя, з `places` — біла. Стани correct / retry / locked мають власний. */
  color?: BrickColor;
  /** Сторона плитки, px (за замовчуванням --kl-tile за в'юпортом: 120 → 140 / 128 / 96 / 88). */
  size?: number;
  /** Висота цифри, px (за замовчуванням --kl-tile-digit: 72 → 80 / 76 / 56 / 49). */
  digit?: number;
  /** Кольорові розряди (десятки/одиниці) на двоцифрових: W4–W7, лише на білій плитці; у correct цифри стають білими. */
  places?: boolean;
  /** W1: кількість крапок під цифрою. */
  dots?: number;
  dotsPerRow?: number;
  /** Без звукового «тика» — коли екран сам грає потрібний звук. */
  silent?: boolean;
  /** Внутрішнє: квадратна плитка чи картка 3:4. Користуйтеся AnswerTile / DigitCard. */
  shape?: 'square' | 'card';
}

const STATE_COLOR: Partial<Record<TileState, BrickColor>> = { correct: 'green', retry: 'pale', locked: 'grey' };

export function TileButton({
  value, state = 'default', color, size, digit, places = false, dots, dotsPerRow = 5, silent, shape = 'square',
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
      data-brick={STATE_COLOR[state] ?? color ?? (places ? 'white' : 'blue')}
      data-dot-rows={hasDots ? layoutDots(dots, dotsPerRow).rows.length : undefined}
      disabled={inactive}
      className={cx('kl-brick', shape === 'card' ? 'kl-stud' : 'kl-studs', styles.tile, shape === 'card' && styles.card, hasDots && styles.withDots, className)}
      style={cssVars(
        { '--kl-tile': size === undefined ? undefined : `${size}px`, '--kl-tile-digit': digit === undefined ? undefined : `${digit}px` },
        style,
      )}
      onPointerDown={pressHandler(silent, inactive, onPointerDown)}
      {...rest}
    >
      {locked ? (
        <Icon name="lock" className={cx('kl-glyph', styles.lock)} />
      ) : (
        <span className={cx('kl-glyph', styles.glyphs)}>
          <Digits value={value} places={places && state !== 'correct'} className={styles.digit} />
          {hasDots && (
            <Dots count={dots} perRow={dotsPerRow} unit={`calc(var(--kl-tile) / ${shape === 'card' ? 109 : 120})`} className={styles.dots} />
          )}
        </span>
      )}
      {(state === 'selected' || state === 'retry') && <span className={styles.ring} aria-hidden="true" />}
      {state === 'selected' && <span className={styles.selDot} aria-hidden="true" />}
      {state === 'correct' && <StateBadge kind="ok" />}
      {state === 'retry' && <StateBadge kind="retry" />}
    </button>
  );
}
