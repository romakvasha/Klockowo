import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { PlayerPup } from '../characters/PlayerPup';
import { PUP_TINTS } from '../characters/pups';
import { useViewport } from '../app/useViewport';
import { BASE_URL } from '../components/map/art';
import { anchor, landscapeScale, layoutFor, mapOrientation, type MapLayout } from '../components/map/mapLayout';
import { WorldIsland } from '../components/map/WorldIsland';
import { AvatarButton } from '../components/ui/AvatarButton';
import { HoldToConfirm } from '../components/ui/HoldToConfirm';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { cssVars } from '../components/ui/cx';
import { currentWorldId, isWorldComplete, isWorldUnlocked } from '../curriculum/progression';
import type { WorldId } from '../curriculum/types';
import { WORLD_IDS } from '../curriculum/worlds';
import { BUTTONS, LABELS, PARENT_GEAR_LABEL, WORLD_NAMES, changePlayerLabel, type IslandState } from '../speech/lines';
import { sfx } from '../speech/sfx';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import styles from './AdventureMap.module.css';

function stateOf(world: WorldId, progress: Parameters<typeof isWorldUnlocked>[0], current: WorldId): IslandState {
  if (!isWorldUnlocked(progress, world)) return 'locked';
  if (isWorldComplete(progress, world)) return 'completed';
  return world === current ? 'current' : 'open';
}

function Trail({ layout, unlocked }: { layout: MapLayout; unlocked: (world: WorldId) => boolean }) {
  return (
    <svg className={styles.trail} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
      <g className={styles.waves}>
        {layout.waves.map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y} q10 -6 20 0 t20 0`} />
        ))}
      </g>
      {layout.trail.map((seg) => (
        <g key={`${seg.from}-${seg.to}`} data-open={unlocked(seg.to)}>
          <path className={styles.trailEdge} d={seg.d} />
          <path className={styles.trailTop} d={seg.d} />
        </g>
      ))}
    </svg>
  );
}

/** Mapa przygody (BRIEF §6.4, design etap1/17): 7 островів уздовж стежки, «Plac Zabaw» і «Baza Drużyny». Заблоковані — сірий камінь із замком;
 *  Kubik на картингу стоїть біля поточного світу. Угорі: аватар, «Naklejki», шестерня (утримувати 3 с). Альбом — сцена 1280×720 за розміром
 *  вікна; портрет — вертикальна стежка, що гортається. Загального лічильника кісточок немає. */
export function AdventureMap() {
  const navigate = useNavigate();
  const viewport = useViewport();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);
  const profileCount = useAppStore((s) => s.profiles.length);
  const [shaking, setShaking] = useState<WorldId | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const orientation = mapOrientation(viewport.width, viewport.height);
  const layout = layoutFor(orientation);
  const scale = orientation === 'portrait' ? viewport.width / layout.width : landscapeScale(viewport.width, viewport.height);
  const current = currentWorldId(progress);

  // у портреті мапа відкривається там, де Kubik: поточний світ посередині екрана
  useEffect(() => {
    const box = scroller.current;
    if (!box || orientation !== 'portrait') return;
    const y = anchor(layout, current === 'hub' ? 'w1' : current).y * scale;
    box.scrollTop = Math.max(0, y - box.clientHeight / 2);
  }, [orientation, layout, scale, current]);

  if (!profile) return <Navigate to="/start" replace />;

  const press = (world: WorldId) => {
    if (!isWorldUnlocked(progress, world)) {
      sfx.play('retry');
      setShaking(world);
      window.setTimeout(() => setShaking(null), 400);
      return;
    }
    navigate(world === 'hub' ? '/playground' : `/world/${world}`);
  };

  const base = layout.nodes.base;
  const stage = (
    <div className={styles.stage} style={cssVars({ '--s': scale }, { width: layout.width, height: layout.height })}>
      <Trail layout={layout} unlocked={(w) => isWorldUnlocked(progress, w)} />
      <div className={styles.base} style={{ left: base.x, top: base.y, width: layout.island.w, height: layout.island.h }}>
        <img src={BASE_URL()} alt={LABELS.base} draggable={false} />
        <span className={styles.baseChip} aria-hidden="true">Baza</span>
      </div>
      {WORLD_IDS.map((world) => (
        <WorldIsland
          key={world}
          world={world}
          state={stateOf(world, progress, current)}
          name={WORLD_NAMES[world]}
          layout={layout}
          shaking={shaking === world}
          onPress={press}
        />
      ))}
    </div>
  );

  return (
    <main className={styles.map} data-orientation={orientation}>
      <header className={styles.chrome}>
        {profileCount > 1 ? (
          <AvatarButton
            size={72}
            profileName={profile.name}
            aria-label={changePlayerLabel(profile.name)}
            tint={PUP_TINTS[profile.pup]}
            style={cssVars({ '--size': 'var(--kl-btn)' })}
            onClick={() => navigate('/start', { state: { pick: true } })}
          >
            <PlayerPup id={profile.pup} />
          </AvatarButton>
        ) : (
          <span className={styles.avatar} style={cssVars({ '--tint': `var(--kl-${PUP_TINTS[profile.pup]}-50)` })} aria-hidden="true">
            <PlayerPup id={profile.pup} />
          </span>
        )}
        <div className={styles.right}>
          <IconButton icon="stickers" label={BUTTONS.stickers} onClick={() => navigate('/album')} />
          <HoldToConfirm label={PARENT_GEAR_LABEL} onConfirm={() => navigate('/parent-gate')}>
            <Icon name="gear" />
          </HoldToConfirm>
        </div>
      </header>

      {orientation === 'landscape' ? (
        <div className={styles.fit}>{stage}</div>
      ) : (
        <div ref={scroller} className={styles.scroller}>
          <div className={styles.sizer} style={{ height: layout.height * scale }}>{stage}</div>
        </div>
      )}
    </main>
  );
}
