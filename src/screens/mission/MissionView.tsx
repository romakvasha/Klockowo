import { Kubik } from '../../characters/Kubik';
import { TEAM_MEMBERS, type TeamMember } from '../../characters/poses';
import { TeamPup } from '../../characters/TeamPup';
import { DECOR_URL } from '../../components/map/art';
import { IconButton } from '../../components/ui/IconButton';
import { MissionCard } from '../../components/ui/MissionCard';
import { PlayButton } from '../../components/ui/PlayButton';
import { cssVars } from '../../components/ui/cx';
import type { WorldKey } from '../../curriculum/types';
import { worldById } from '../../curriculum/worlds';
import { BUTTONS } from '../../speech/lines';
import type { ObjectId } from '../../speech/nouns';
import { IdeaPanel } from './IdeaPanel';
import type { DemoKind } from './ideaDemo';
import {
  CARD_H, CARD_W, PANEL_H, PANEL_W, groundColors, missionDecor, missionLayout, missionOrientation, missionScale,
  type Box, type MissionPhase,
} from './missionLayout';
import styles from '../Mission.module.css';

/** Гість місії: один із команди; у W6 — усі четверо разом, трохи менші (BRIEF §9). */
function Guests({ guest, box, phase }: { guest: TeamMember | 'all'; box: Box; phase: MissionPhase }) {
  const members: readonly TeamMember[] = guest === 'all' ? TEAM_MEMBERS : [guest];
  const many = members.length > 1;
  const h = many ? Math.round(box.h * 0.62) : box.h;
  const w = Math.round(h * 0.8);
  const step = many ? (box.w - w) / (members.length - 1) : 0;
  const pointing = phase === 'card';
  return (
    <div className={styles.guest} style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
      {members.map((member, i) => (
        <span key={member} className={styles.guestPup} style={{ left: i * step, bottom: many && i % 2 === 1 ? Math.round(box.h * 0.2) : 0 }}>
          <TeamPup member={member} pose={pointing ? 'pointing' : 'idle'} flip={pointing} size={h} />
        </span>
      ))}
    </div>
  );
}

export interface MissionViewProps {
  world: WorldKey;
  object: ObjectId;
  /** Текст місії (aria-label картки). */
  line: string;
  phase: MissionPhase;
  kind: DemoKind;
  /** Стадія демонстрації (див. ideaDemo.ts). */
  stage: number;
  /** Лічба розсипом (рівень 6 W1). */
  scatter?: boolean;
  /** Kubik зараз говорить (рот A/O/E). */
  talking: boolean;
  /** Сценарій дійшов до кінця: «Graj!» дихає, «Posłuchaj» пульсує. */
  finished: boolean;
  viewport: { width: number; height: number };
  onMap: () => void;
  onListen: () => void;
  onPlay: () => void;
}

/** Композиція Wprowadzenie (design etap2/17–18): лише показ, без голосу й сценарію — їх дає екран Mission; а також вітрина /#/dev/mission. */
export function MissionView({ world: worldKey, object, line, phase, kind, stage, scatter = false, talking, finished, viewport, onMap, onListen, onPlay }: MissionViewProps) {
  const world = worldById(worldKey);
  const orientation = missionOrientation(viewport.width, viewport.height);
  const layout = missionLayout(orientation, phase);
  const scale = missionScale(orientation, viewport.width, viewport.height);
  const ground = groundColors(worldKey);
  const groundTop = (viewport.height - layout.height * scale) / 2 + layout.ground * scale;
  const phone = viewport.width < 600 || viewport.height < 500;

  return (
    <main
      className={styles.page}
      data-orientation={orientation}
      data-phase={phase}
      style={cssVars({ '--bg': `var(--kl-${worldKey}-50)`, '--ground': ground.fill, '--ground-line': ground.line, '--ground-top': `${groundTop}px` })}
    >
      <div className={styles.ground} aria-hidden="true" />

      <header className={styles.chrome}>
        <IconButton icon="home" label={BUTTONS.map} onClick={onMap} />
        <IconButton icon="speaker" label={BUTTONS.listen} variant="secondary" pulse={finished} onClick={onListen} />
      </header>

      <div className={styles.fit}>
        <div className={styles.stage} style={cssVars({ '--s': scale }, { width: layout.width, height: layout.height })}>
          {missionDecor(worldKey, orientation).map((d) => (
            <img key={d.kind} className={styles.decor} src={DECOR_URL(d.kind)} alt="" draggable={false} style={{ left: d.x, top: d.y, width: d.w, height: d.h }} />
          ))}

          <div className={styles.cardSlot} style={{ width: CARD_W, height: CARD_H, transform: `translate(${layout.card.x}px, ${layout.card.y}px) scale(${layout.card.scale})` }}>
            <MissionCard world={worldKey} object={object} label={line} />
          </div>

          {layout.panel && (
            <div className={styles.panelSlot} style={{ width: PANEL_W, height: PANEL_H, transform: `translate(${layout.panel.x}px, ${layout.panel.y}px) scale(${layout.panel.scale})` }}>
              <IdeaPanel world={worldKey} kind={kind} stage={stage} object={object} scatter={scatter} />
            </div>
          )}

          {world.guest && <Guests guest={world.guest} box={layout.guest} phase={phase} />}

          <div className={styles.kubik} style={{ left: layout.kubik.x, top: layout.kubik.y, width: layout.kubik.w, height: layout.kubik.h }}>
            <Kubik pose={phase === 'idea' ? 'demonstrating' : 'celebrating'} accessory={worldKey} size={layout.kubik.h} talking={talking} />
          </div>
        </div>
      </div>

      <div className={styles.play}>
        <PlayButton size={phone ? 96 : 120} idle={finished} onClick={onPlay} />
      </div>
    </main>
  );
}
