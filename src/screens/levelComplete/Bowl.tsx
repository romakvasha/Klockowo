import { Bone } from '../../components/ui/Bone';
import styles from './Bowl.module.css';

/** Куди лягає кожна з шести кісточок над отвором миски (лівий верхній кут кісточки 44×44 у координатах 220×120): нижня частина ховається
 *  за переднім краєм миски, тож купка «лежить усередині». */
export const BOWL_HEAP: readonly { x: number; y: number; r: number }[] = [
  { x: 46, y: 14, r: -20 }, { x: 112, y: 10, r: 14 }, { x: 78, y: 18, r: -6 },
  { x: 132, y: 20, r: 28 }, { x: 92, y: 6, r: 8 }, { x: 60, y: 6, r: 22 },
];

export interface BowlProps {
  /** Скільки кісточок уже в мисці (0…6). */
  landed: number;
  /** Підстрибнути (щойно долетіла кісточка). */
  bump?: boolean;
}

/** Миска Kubika 220×120 (BRIEF §6.8): блокова, червона, із жовтою смужкою; кісточки, що долетіли, лежать купкою всередині — за переднім краєм.
 *  У дизайні її не намальовано — зібрано з наявних кольорів і контурів: миска мальована одним шаром, а кісточки обрізано контуром її отвору — видно лише те, що вище переднього краю. */
export function Bowl({ landed, bump = false }: BowlProps) {
  return (
    <div className={styles.bowl} data-bump={bump} aria-hidden="true">
      <svg className={styles.layer} viewBox="0 0 220 120" width="220" height="120" focusable="false">
        <ellipse cx="110" cy="106" rx="92" ry="12" fill="#2D2A4A" fillOpacity=".14" />
        <path d="M20 44 H200 L184 98 Q181 106 173 106 H47 Q39 106 36 98 Z" fill="#FF6B6B" stroke="#2D2A4A" strokeWidth="4" strokeLinejoin="round" />
        <path d="M27 68 H193 L188 84 H32 Z" fill="#FFC21A" stroke="#2D2A4A" strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="110" cy="44" rx="90" ry="18" fill="#C63E42" stroke="#2D2A4A" strokeWidth="4" />
        <ellipse cx="110" cy="46" rx="74" ry="12" fill="#7A2428" />
      </svg>
      <div className={styles.heap}>
        {BOWL_HEAP.slice(0, Math.max(0, Math.min(landed, BOWL_HEAP.length))).map((b, i) => (
          <Bone key={i} className={styles.bone} style={{ left: b.x, top: b.y, transform: `rotate(${b.r}deg)` }} />
        ))}
      </div>
    </div>
  );
}
