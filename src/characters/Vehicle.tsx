import { cx } from '../components/ui/cx';
import { VEHICLE_URL, need } from './art';
import { VEHICLE_SIZE, type VehicleKind } from './poses';
import styles from './Vehicle.module.css';

export interface VehicleProps {
  kind: VehicleKind;
  /** Множник розміру борда дизайну (balon 124×148, zaglowka 180×147, pociag 300×133, rakieta 91×148). */
  scale?: number;
  /** Приїжджає за 600 мс і завмирає: лише Wprowadzenie, Koniec poziomu й альбом (design etap2/13). */
  arrive?: boolean;
  className?: string;
}

/** Транспорт гостя: куля Łatki, вітрильник Pufki, паровозик Tofika, ракета Iskry. Декоративний. */
export function Vehicle({ kind, scale = 1, arrive = false, className }: VehicleProps) {
  const [w, h] = VEHICLE_SIZE[kind];
  return (
    <img
      className={cx(styles.vehicle, arrive && styles.arrive, className)}
      src={need(VEHICLE_URL, kind, 'Vehicle')}
      alt=""
      width={Math.round(w * scale)}
      height={Math.round(h * scale)}
    />
  );
}
