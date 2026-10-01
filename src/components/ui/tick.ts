import type { PointerEvent } from 'react';
import { sfx } from '../../speech/sfx';

/** М'який «тик» (sfx 'tap') при дотику до блокових кнопок і плиток. Звуку до першого дотику немає (sfx.play нічого не робить).
 *  `silent` вимикає тик — коли екран сам грає потрібний звук; вимкнений елемент (`inactive`) тиків не дає. */
export function pressHandler<E extends Element>(
  silent: boolean | undefined,
  inactive: boolean | undefined,
  next?: (event: PointerEvent<E>) => void,
): (event: PointerEvent<E>) => void {
  return (event) => {
    if (!silent && !inactive) sfx.play('tap');
    next?.(event);
  };
}
