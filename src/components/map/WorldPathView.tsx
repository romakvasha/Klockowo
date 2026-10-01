import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Kubik } from '../../characters/Kubik';
import type { KubikPose } from '../../characters/poses';
import type { LevelId, WorldKey } from '../../curriculum/types';
import { worldById } from '../../curriculum/worlds';
import { BUTTONS, WORLD_NAMES } from '../../speech/lines';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { cssVars } from '../ui/cx';
import { DECOR_URL } from './art';
import { LevelNode, type VisibleNodeState } from './LevelNode';
import { NODE_PATTERN } from './nodeArt';
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

const WAVES_BEACH: readonly string[] = ['M60 707 q8 -5 16 0 t16 0', 'M300 709 q8 -5 16 0 t16 0', 'M560 706 q8 -5 16 0 t16 0', 'M820 709 q8 -5 16 0 t16 0', 'M1060 707 q8 -5 16 0 t16 0'];
const WAVES_RIVER: readonly string[] = ['M70 344 q8 -5 16 0 t16 0', 'M270 352 q8 -5 16 0 t16 0', 'M480 342 q8 -5 16 0 t16 0', 'M690 351 q8 -5 16 0 t16 0', 'M880 343 q8 -5 16 0 t16 0', 'M1150 350 q8 -5 16 0 t16 0'];

/** Берег моря внизу сцени W3 (до дороги). */
function Beach() {
  return (
    <g>
      <rect x="0" y="680" width="1280" height="14" fill="#F3D9A0" />
      <rect x="0" y="694" width="1280" height="26" fill="#4FB3F6" />
      <path d="M0 680 H1280" stroke="#D9BE84" strokeWidth="3" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity=".85">
        {WAVES_BEACH.map((d) => <path key={d} d={d} />)}
      </g>
    </g>
  );
}

/** Річка W4 із дерев'яним мостом, яким піднімається дорога (після дороги: міст лежить поверх неї). */
function River() {
  return (
    <g>
      <rect x="0" y="322" width="1280" height="56" fill="#4FB3F6" />
      <rect x="0" y="370" width="1280" height="8" fill="#2F81CB" />
      <path d="M0 322 H1280 M0 370 H1280" stroke="#2D2A4A" strokeOpacity=".35" strokeWidth="2.5" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity=".85">
        {WAVES_RIVER.map((d) => <path key={d} d={d} />)}
      </g>
      <g stroke="#2D2A4A" strokeWidth="3" strokeLinejoin="round">
        <rect x="1006" y="308" width="68" height="84" rx="6" fill="#B7844F" />
        <path d="M1006 320 H1074 M1006 332 H1074 M1006 344 H1074 M1006 356 H1074 M1006 368 H1074 M1006 380 H1074" stroke="#8A5F3A" strokeWidth="2" />
        <rect x="999" y="304" width="11" height="92" rx="4" fill="#A0714F" strokeWidth="2.5" />
        <rect x="1070" y="304" width="11" height="92" rx="4" fill="#A0714F" strokeWidth="2.5" />
        {[[997, 298], [1068, 298], [997, 387], [1068, 387]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="15" height="15" rx="3" fill="#FF6B6B" strokeWidth="2.5" />
        ))}
      </g>
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
  const info = worldById(world);

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
        <defs dangerouslySetInnerHTML={{ __html: NODE_PATTERN }} />
        {layout.scenery === 'beach' && <Beach />}
        <Roads layout={layout} states={states} chest={chest} />
        {layout.scenery === 'river' && <River />}
      </svg>
      {layout.decor.map((d) => (
        <img key={`${d.kind}-${d.x}-${d.y}`} className={styles.decor} src={DECOR_URL(d.kind)} alt="" draggable={false} style={{ left: d.x, top: d.y, width: d.w, height: d.h }} />
      ))}
      <TreasureChest state={chest} x={layout.chest.x} y={layout.chest.y} shaking={shaking === 'chest'} onPress={onChest} />
      {layout.nodes.map((node) => {
        const state = states[node.id];
        if (state === undefined) return null;
        return (
          <LevelNode
            key={node.id} id={node.id} x={node.x} y={node.y} state={state} color={info.color} star={node.star}
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
