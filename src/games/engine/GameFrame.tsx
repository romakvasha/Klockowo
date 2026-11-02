import { useMemo, useState, type ReactNode } from 'react';
import { useElementSize, type ElementSize } from '../../app/useElementSize';
import { useViewport } from '../../app/useViewport';
import { MascotStage } from '../../characters/MascotStage';
import type { MascotState } from '../../characters/poses';
import { BG_URL } from '../../components/map/art';
import { Backdrop } from '../../components/world/Backdrop';
import { CheckButton } from '../../components/ui/CheckButton';
import { HUD } from '../../components/ui/HUD';
import { HintButton } from '../../components/ui/HintButton';
import type { WorldKey } from '../../curriculum/types';
import { LABELS } from '../../speech/lines';
import { frameKind, sceneReserved, type FrameKind } from './frameMath';
import type { Rect } from './layoutObjects';
import styles from './GameFrame.module.css';

export interface FrameScene {
  area: ElementSize;
  reserved: Rect[];
  kind: FrameKind;
  /** Лоток: у іграх-конструкторах сцена виносить у нього зони для предметів (портал); у іграх із плитками — null. */
  tray: HTMLElement | null;
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

/** Ігровий екран (BRIEF §7, полотно D1 «сітка гри», docs/DESIGN_V2.md §3): CSS Grid із зонами HUD · провідник (Kubik, бульбашка, лампочка) · дошка (сцена) · лоток · «Gotowe».
 *  Зони не перетинаються: wide — провідник колонкою ліворуч, лоток і «Gotowe» під дошкою; portrait — провідник рядом над дошкою, лоток і «Gotowe» під нею;
 *  phone — бічна смуга HUD, дошка, колонка провідника з «Gotowe» унизу, лоток-стовпець. Лише верстка: стан, голос і перевірку веде TaskPlayer. */
export function GameFrame({ world, filled, arriving, listenPulse, onMap, onListen, mascot, speaking, bubble, hint, sceneLabel, tray, check, children }: GameFrameProps) {
  const viewport = useViewport();
  const kind = frameKind(viewport.width, viewport.height);
  const [sceneRef, area] = useElementSize<HTMLDivElement>();
  const reserved = useMemo(() => sceneReserved(kind, area), [kind, area]);
  const [trayEl, setTrayEl] = useState<HTMLElement | null>(null);
  const hintButton = <HintButton visible={hint.visible} active={hint.active} onPress={hint.onPress} />;

  return (
    <main className={styles.game} data-kind={kind} data-world={world}>
      <Backdrop src={BG_URL(world)} blur />
      <HUD className={styles.hud} world={world} filled={filled} arriving={arriving} onMap={onMap} onListen={onListen} listenPulse={listenPulse} stripExtra={hintButton} />
      <aside className={styles.guide}>
        <MascotStage state={mascot} world={world} bubble={bubble} speaking={speaking} layout={kind === 'portrait' ? 'row' : 'column'} />
        <span className={styles.hintSlot}>{hintButton}</span>
      </aside>
      <section className={styles.scene} role="group" aria-label={sceneLabel}>
        <div ref={sceneRef} className={styles.content}>
          {area.w > 0 && area.h > 0 && children({ area, reserved, kind, tray: trayEl })}
        </div>
      </section>
      <div ref={setTrayEl} className={styles.tray} role="group" aria-label={LABELS.answers}>
        {tray}
      </div>
      <div className={styles.check}>{check && <CheckButton disabled={!check.enabled} onClick={check.onPress} />}</div>
    </main>
  );
}
