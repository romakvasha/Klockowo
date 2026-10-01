import { CHEST_LABELS } from '../../speech/lines';
import { pressHandler } from '../ui/tick';
import { CHEST_URL } from './art';
import { CHEST_H, CHEST_W } from './pathTypes';
import styles from './TreasureChest.module.css';

export type ChestState = 'locked' | 'ready' | 'open';

export interface TreasureChestProps {
  state: ChestState;
  /** Лівий верхній кут коробки 132×155 у координатах сцени. */
  x: number;
  y: number;
  shaking?: boolean;
  onPress: () => void;
}

/** Скриня світу (design etap2/06, 132×155): замкнена — доки не пройдено всі основні рівні, готова — світиться, відкрита — після свята.
 *  Готову скриню можна натиснути (веде на «Świat ukończony»); замкнена лише хитається. */
export function TreasureChest({ state, x, y, shaking = false, onPress }: TreasureChestProps) {
  return (
    <button
      type="button"
      aria-label={CHEST_LABELS[state]}
      className={styles.chest}
      data-state={state}
      data-shake={shaking}
      style={{ left: x, top: y, width: CHEST_W, height: CHEST_H }}
      onPointerDown={pressHandler(state !== 'ready', false)}
      onClick={onPress}
    >
      <img src={CHEST_URL(state)} alt="" draggable={false} />
    </button>
  );
}
