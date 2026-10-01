import { useMemo, type ReactNode } from 'react';
import { useElementSize, type ElementSize } from '../../app/useElementSize';
import { useViewport } from '../../app/useViewport';
import { MascotStage } from '../../characters/MascotStage';
import type { MascotState } from '../../characters/poses';
import { DECOR_URL } from '../../components/map/art';
import { DECOR_SIZE, pathLayoutFor } from '../../components/map/pathLayout';
import { CheckButton } from '../../components/ui/CheckButton';
import { HUD } from '../../components/ui/HUD';
import { HintButton } from '../../components/ui/HintButton';
import { cssVars } from '../../components/ui/cx';
import type { WorldKey } from '../../curriculum/types';
import { LABELS } from '../../speech/lines';
import { frameKind, sceneReserved } from './frameMath';
import type { Rect } from './layoutObjects';
import styles from './GameFrame.module.css';

export interface FrameScene {
  area: ElementSize;
  reserved: Rect[];
}

export interface GameFrameProps {
  world: WorldKey;
  /** Скільки з 6 кісточок заповнено (разом із тією, що долітає) і індекс слота, куди долітає. */
  filled: number;
  arriving: number | null;
  /** «Posłuchaj» пульсує один раз, коли голос договорив інструкцію. */
  listenPulse: boolean;
  onMap: () => void;
  onListen: () => void;
  mascot: MascotState;
  /** Kubik говорить (рот A/O/E). */
  speaking: boolean;
  /** Вміст бульбашки Kubika: предмет + «?». */
  bubble: ReactNode;
  hint: { visible: boolean; active: boolean; onPress: () => void };
  /** Підпис сцени для екранного диктора. */
  sceneLabel: string;
  /** Плитки-відповіді (лоток); без них лоток порожній. */
  tray?: ReactNode;
  /** «Gotowe»; null — кнопки нема (завдання без вибору). */
  check: { enabled: boolean; onPress: () => void } | null;
  /** Вміст сцени: отримує виміряну область і ділянки під Kubika. */
  children: (scene: FrameScene) => ReactNode;
}

/** Блоковий декор лише по краях сцени (BRIEF §7, борд etap2/00): три предмети з набору світу — унизу ліворуч, угорі праворуч, унизу праворуч. */
function Decor({ world }: { world: WorldKey }) {
  const kinds = pathLayoutFor(world, 'landscape').decor;
  const spots = ['bl', 'tr', 'br'] as const;
  return (
    <>
      {spots.map((spot, i) => {
        const d = kinds[i];
        if (!d) return null;
        const [w, h] = DECOR_SIZE[d.kind];
        return (
          <img
            key={spot} className={styles.decor} data-spot={spot} src={DECOR_URL(d.kind)} alt="" draggable={false}
            style={cssVars({ '--w': `${w}px`, '--h': `${h}px` })}
          />
        );
      })}
    </>
  );
}

/** Ігровий екран (BRIEF §7, design etap2/00–05): верхня панель (Mapa, 6 кісточок, Posłuchaj), сцена, унизу Kubik з бульбашкою й лампочкою «Pomóż mi»,
 *  лоток із плитками й «Gotowe». Три вигляди: wide (альбом), portrait (сцена-квадрат, лоток під нею), phone (бічна смуга, лоток-стовпець).
 *  Лише верстка: стан, голос і перевірку веде TaskPlayer. */
export function GameFrame({ world, filled, arriving, listenPulse, onMap, onListen, mascot, speaking, bubble, hint, sceneLabel, tray, check, children }: GameFrameProps) {
  const viewport = useViewport();
  const kind = frameKind(viewport.width, viewport.height);
  const [sceneRef, area] = useElementSize<HTMLDivElement>();
  // на широких екранах предмети лежать у «сцені» ≤ 1280 px по центру (борд etap2/01); ділянка Kubika рахується від лівого краю сторінки
  const left = kind === 'wide' ? Math.max(0, (viewport.width - area.w) / 2) : 0;
  const reserved = useMemo(() => sceneReserved(kind, viewport.width, area, left), [kind, viewport.width, area, left]);
  const hintButton = <HintButton visible={hint.visible} active={hint.active} onPress={hint.onPress} />;

  return (
    <main className={styles.game} data-kind={kind} data-world={world}>
      <HUD world={world} tone="page" filled={filled} arriving={arriving} onMap={onMap} onListen={onListen} listenPulse={listenPulse} stripExtra={hintButton} />
      <div className={styles.body}>
        <section className={styles.scene} role="group" aria-label={sceneLabel}>
          <Decor world={world} />
          <div ref={sceneRef} className={styles.content}>
            {area.w > 0 && area.h > 0 && children({ area, reserved })}
          </div>
        </section>
        <footer className={styles.footer}>
          <div className={styles.tray} role="group" aria-label={LABELS.answers}>
            {tray}
          </div>
          <div className={styles.bottom}>
            <div className={styles.guide}>
              <MascotStage state={mascot} world={world} bubble={bubble} speaking={speaking} />
              <span className={styles.hintSlot}>{hintButton}</span>
            </div>
            <div className={styles.check}>{check && <CheckButton disabled={!check.enabled} onClick={check.onPress} />}</div>
          </div>
        </footer>
      </div>
    </main>
  );
}
