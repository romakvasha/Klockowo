import { cx } from '../ui/cx';
import styles from './Backdrop.module.css';

export interface BackdropProps {
  /** URL фону (BG_URL / PATH_URL з components/map/art.ts); null — лише градієнт неба (мапа пригод). */
  src: string | null;
  /** Розмите тло (гра, місія, альбом, службові екрани) — щоб предмети й текст читались (docs/DESIGN_V2.md §3). */
  blur?: boolean;
  className?: string;
}

/** Фото-фон екрана (полотно D1 `.bgl`): на весь екран під усіма зонами, cover по центру, затемнення країв. Поки картинка вантажиться
 *  (або її немає офлайн) — видно колір тла сторінки. Батьківський екран має бути окремим шаром (`isolation: isolate`): фон лежить у ньому з z-index −1. */
export function Backdrop({ src, blur = false, className }: BackdropProps) {
  return (
    <div
      className={cx(styles.backdrop, className)}
      data-blur={blur}
      data-sky={src === null}
      style={src ? { backgroundImage: `url("${src}")` } : undefined}
      aria-hidden="true"
    />
  );
}
