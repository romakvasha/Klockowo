import type { WorldId } from '../../curriculum/types';
import { Kubik } from '../../characters/Kubik';
import { islandLabel, type IslandState } from '../../speech/lines';
import { cssVars, cx } from '../ui/cx';
import { pressHandler } from '../ui/tick';
import { ISLAND_URL } from './art';
import type { MapLayout } from './mapLayout';
import styles from './WorldIsland.module.css';

export interface WorldIslandProps {
  world: WorldId;
  state: IslandState;
  /** Назва світу (чип під островом і aria-label). */
  name: string;
  layout: MapLayout;
  /** Лише «locked» хитається: стан виставляє екран на кілька сотень мс після дотику. */
  shaking?: boolean;
  onPress: (world: WorldId) => void;
}

/** Прапорець «пройдено» (design etap1/17, 60×70). */
function Flag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 70" aria-hidden="true" focusable="false">
      <path className={styles.pole} d="M12 68 V6" />
      <path className={styles.cloth} d="M14 6 L52 16 L14 30 Z" />
      <path className={styles.tick} d="M22 17 L27 22 L36 12" />
    </svg>
  );
}

/** Острів світу на мапі: заблокований — сірий камінь із замком; пройдений — із прапорцем; поточний — із сяйвом і Kubikom
 *  на картингу (BRIEF §6.4). Координати й масштаб — із MapLayout; кнопка охоплює всю картинку острова. */
export function WorldIsland({ world, state, name, layout, shaking = false, onPress }: WorldIslandProps) {
  const { x, y } = layout.nodes[world];
  const locked = state === 'locked';
  // картинг стоїть ліворуч від острова; якщо там немає місця (портрет, ліва колонка) — праворуч
  const kartSide = x - 69 * layout.scale < 0 ? 'right' : 'left';
  return (
    <div
      className={cx(styles.node, locked && styles.locked)}
      data-state={state}
      data-kart={kartSide}
      style={cssVars(
        { '--is': layout.scale, '--chip-edge': `var(--kl-${world}-700)` },
        { left: x, top: y, width: layout.island.w, height: layout.island.h },
      )}
    >
      {state === 'current' && <span className={styles.glow} aria-hidden="true" />}
      <button
        type="button"
        aria-label={islandLabel(name, state)}
        data-shake={shaking}
        className={styles.island}
        onPointerDown={pressHandler(locked, false)}
        onClick={() => onPress(world)}
      >
        <img src={ISLAND_URL(locked ? 'locked' : world)} alt="" draggable={false} />
      </button>
      {state === 'completed' && <Flag className={styles.flag} />}
      <span className={styles.chip} aria-hidden="true">{name}</span>
      {state === 'current' && <Kubik pose="on-kart" size={120 * layout.scale} className={styles.kart} />}
    </div>
  );
}
