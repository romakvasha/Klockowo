import { cx } from '../components/ui/cx';
import { PUP_URL, need } from './art';
import type { PupId } from './pups';
import styles from './PlayerPup.module.css';

export interface PlayerPupProps {
  id: PupId;
  /** Сторона картинки, px; без неї — на всю ширину контейнера (аватар, картка пікера). */
  size?: number;
  className?: string;
}

/** Цуценя, яке обирає дитина (8 порід, без уніформ і транспорту; BRIEF §9). Декоративне: ім'я дає кнопка-аватар чи картка. */
export function PlayerPup({ id, size, className }: PlayerPupProps) {
  return (
    <img
      className={cx(styles.pup, className)}
      src={need(PUP_URL, id, 'Pup')}
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  );
}
