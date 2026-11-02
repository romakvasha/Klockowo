import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Kubik } from '../../characters/Kubik';
import type { KubikPose } from '../../characters/poses';
import type { LevelId, WorldKey } from '../../curriculum/types';
import { BUTTONS, WORLD_NAMES } from '../../speech/lines';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { cssVars } from '../ui/cx';
import { Backdrop } from '../world/Backdrop';
import { PATH_URL, prefetchWorldArt } from './art';
import { LevelNode, type VisibleNodeState } from './LevelNode';
import { kubikSpot, pathKindFor, pathLayoutFor, pathScale, type PathLayout } from './pathLayout';
import { TreasureChest, type ChestState } from './TreasureChest';
import styles from './WorldPathView.module.css';

export interface WorldPathViewProps {
  world: WorldKey;
  viewport: { width: number; height: number };
  /** Стани видимих вузлів; прихованих (★ вимкнено налаштуванням) тут немає — вони не малюються. */
  states: Readonly<Record<string, VisibleNodeState>>;
  chest: ChestState;
  /** Біля чого стоїть Kubik: наступний вузол, а коли все пройдено — скриня. */
  kubikAt: LevelId | 'chest';
  /** Звідки Kubik біжить до `kubikAt` (після проходження рівня, 1,2 с); без цього він одразу стоїть на місці. */
  kubikFrom?: LevelId | 'chest' | null;
  /** Вузол, що щойно відкрився: «замок відкривається». */
  fresh?: LevelId | null;
  /** Що хитається після дотику до закритого. */
  shaking?: LevelId | 'chest' | null;
  talking?: boolean;
  onNode: (id: LevelId) => void;
  onChest: () => void;
  onMap: () => void;
}

/** Піщана (відкрита), сіра (закрита) й золота (★-гілка) дорога: темний контур 24/20 px + пунктирна смуга (борди etap2/14–16). */
function Roads({ layout, states, chest }: { layout: PathLayout; states: WorldPathViewProps['states']; chest: ChestState }) {
  return (
    <g fill="none">
      {layout.links.map((link) => {
        if (link.to !== 'chest' && states[link.to] === undefined) return null; // прихований ★-вузол
        const open = link.to === 'chest' ? chest !== 'locked' : states[link.to] !== 'locked';
        return (
          <g key={link.to} data-open={open} data-star={link.star}>
            <path className={styles.edge} d={link.d} />
            <path className={styles.top} d={link.d} />
          </g>
        );
      })}
    </g>
  );
}

/** Ścieżka świata (BRIEF §6.5, design etap2/14–16), лише показ: вузли зі станами, дорога, скриня, Kubik біля наступного вузла.
 *  Стани, дотики й голос дає екран WorldPath; цей компонент — і для вітрини /#/dev/path.
 *  Альбом — сцена 1280×720 за розміром вікна; портрет — вертикальна змійка, що гортається; телефон в альбомі — горизонтальна смуга. */
export function WorldPathView({ world, viewport, states, chest, kubikAt, kubikFrom = null, fresh = null, shaking = null, talking = false, onNode, onChest, onMap }: WorldPathViewProps) {
  const kind = pathKindFor(viewport.width, viewport.height);
  const layout = pathLayoutFor(world, kind);
  const scale = pathScale(kind, layout, viewport.width, viewport.height);
  // фон гри цього світу — у кеш, поки дитина дивиться на стежку
  useEffect(() => prefetchWorldArt(world), [world]);

  // Kubik стартує біля `kubikFrom`, а на наступному кадрі переходить до `kubikAt` — CSS-перехід і є «біг по стежці»
  const [kubikId, setKubikId] = useState<LevelId | 'chest'>(kubikFrom ?? kubikAt);
  useEffect(() => {
    if (kubikId === kubikAt) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setKubikId(kubikAt));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [kubikAt, kubikId]);
  const spot = useMemo(() => kubikSpot(layout, kubikId), [layout, kubikId]);

  // портрет і смуга гортаються: сцена відкривається там, де Kubik
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = scroller.current;
    if (!box || kind === 'landscape') return;
    const target = kubikSpot(layout, kubikAt);
    const cx = (target.x + target.w / 2) * scale;
    const cy = (target.y + target.h / 2) * scale;
    box.scrollTo({ left: kind === 'strip' ? Math.max(0, cx - box.clientWidth / 2) : 0, top: kind === 'portrait' ? Math.max(0, cy - box.clientHeight / 2) : 0 });
  }, [kind, layout, scale, kubikAt]);

  const pose = { left: 'pointing-left', right: 'pointing-right', down: 'pointing-down', up: 'idle' }[spot.pointing] as KubikPose;

  const stage: ReactNode = (
    <div className={styles.stage} style={cssVars({ '--s': scale }, { width: layout.width, height: layout.height })}>
      <svg className={styles.scene} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
        <Roads layout={layout} states={states} chest={chest} />
      </svg>
      <TreasureChest state={chest} x={layout.chest.x} y={layout.chest.y} shaking={shaking === 'chest'} onPress={onChest} />
      {layout.nodes.map((node) => {
        const state = states[node.id];
        if (state === undefined) return null;
        return (
          <LevelNode
            key={node.id} id={node.id} x={node.x} y={node.y} state={state} star={node.star}
            shaking={shaking === node.id} fresh={fresh === node.id} onPress={onNode}
          />
        );
      })}
      <div className={styles.kubik} style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}>
        <Kubik pose={pose} accessory={world} size={spot.h} talking={talking} />
      </div>
    </div>
  );

  return (
    <main
      className={styles.page}
      data-kind={kind}
      data-world={world}
      style={cssVars({ '--bg': `var(--kl-${world}-50)`, '--chip-edge': `var(--kl-${world}-700)`, '--chip-shadow': `var(--kl-${world}-100)`, '--chip-dot': `var(--kl-${world}-500)` })}
    >
      <Backdrop src={PATH_URL(world)} />
      <header className={styles.chrome}>
        <IconButton icon="home" label={BUTTONS.map} onClick={onMap} />
        <span className={styles.chip}>
          <span className={styles.chipIcon} aria-hidden="true">
            <Icon name={world} />
          </span>
          <span>{WORLD_NAMES[world]}</span>
        </span>
      </header>

      {kind === 'landscape' ? (
        <div className={styles.fit}>{stage}</div>
      ) : (
        <div ref={scroller} className={styles.scroller}>
          <div className={styles.sizer} style={{ width: layout.width * scale, height: layout.height * scale }}>{stage}</div>
        </div>
      )}
    </main>
  );
}
