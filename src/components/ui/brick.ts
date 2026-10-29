import type { IconName } from './icons';

/** Кольори глянцевих цеглинок v2 (styles/brick.css, атрибут data-brick; токени --kl-brick-* у tokens.css).
 *  blue — за замовчуванням; pale — плитка після помилки й порожня кісточка. */
export const BRICK_COLORS = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'white', 'grey', 'pale'] as const;
export type BrickColor = (typeof BRICK_COLORS)[number];

/** Колір дії (полотно D1): одна дія — одна іконка (BRIEF §8) — один колір на всіх екранах. */
export const ACTION_COLOR: Readonly<Partial<Record<IconName, BrickColor>>> = {
  play: 'green',
  home: 'orange',
  speaker: 'blue',
  bulb: 'yellow',
  next: 'blue',
  retry: 'orange',
  check: 'orange',
  stickers: 'purple',
  badge: 'yellow',
  pour: 'purple',
  pack: 'green',
  equal: 'white',
  close: 'white',
  gear: 'white',
  lock: 'grey',
  'speaker-off': 'grey',
};

export function actionColor(icon: IconName): BrickColor {
  return ACTION_COLOR[icon] ?? 'blue';
}
