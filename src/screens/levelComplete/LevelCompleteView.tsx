import { Kubik } from '../../characters/Kubik';
import { Bone } from '../../components/ui/Bone';
import { BONES_PER_LEVEL } from '../../components/ui/boneStates';
import { Confetti } from '../../components/ui/Confetti';
import { DiligenceBadge } from '../../components/ui/DiligenceBadge';
import { IconButton } from '../../components/ui/IconButton';
import { StickerTile } from '../../components/ui/StickerTile';
import { cssVars } from '../../components/ui/cx';
import { animalUrl } from '../../components/math/art';
import type { WorldKey } from '../../curriculum/types';
import { BUTTONS } from '../../speech/lines';
import type { AnimalId } from '../../speech/nouns';
import { groundColors } from '../mission/missionLayout';
import { Bowl } from './Bowl';
import { boneFlight, completeLayout, completeOrientation, completeScale, slotCenter } from './levelCompleteLayout';
import styles from './LevelComplete.module.css';

export interface LevelCompleteViewProps {
  world: WorldKey;
  animal: AnimalId;
  /** Підпис наліпки для екранного диктора. */
  stickerLabel: string;
  /** Скільки кісточок уже вилетіло з ряду (їхні слоти порожні). */
  launched: number;
  /** Кісточка, що летить просто зараз (індекс слота), або null. */
  flying: number | null;
  /** Скільки кісточок уже в мисці. */
  landed: number;
  showAnimal: boolean;
  showSticker: boolean;
  showBadge: boolean;
  confetti: boolean;
  /** Kubik говорить (рот A/O/E). */
  talking: boolean;
  viewport: { width: number; height: number };
  onMap: () => void;
  onNext: () => void;
}

/** Koniec poziomu: Kubik святкує, кісточки з ряду летять у його миску, врятована тваринка дякує, відкривається наліпка (і значок). Лише показ — стадії
 *  змінює сценарій у LevelComplete; ту саму композицію показує вітрина /#/dev/done. */
export function LevelCompleteView(p: LevelCompleteViewProps) {
  const orientation = completeOrientation(p.viewport.width, p.viewport.height);
  const layout = completeLayout(orientation);
  const scale = completeScale(orientation, p.viewport.width, p.viewport.height);
  const ground = groundColors(p.world);
  const groundTop = (p.viewport.height - layout.height * scale) / 2 + layout.ground * scale;
  const bowl = layout.bowl;
  const flyStart = p.flying === null ? null : slotCenter(layout.rail, p.flying);
  const flight = p.flying === null ? null : boneFlight(layout, p.flying);
  const boneSize = layout.rail.slotH;

  return (
    <main
      className={styles.page}
      data-orientation={orientation}
      style={cssVars({ '--bg': `var(--kl-${p.world}-50)`, '--ground': ground.fill, '--ground-line': ground.line, '--ground-top': `${groundTop}px` })}
    >
      <div className={styles.ground} aria-hidden="true" />
      {p.confetti && <Confetti key="confetti" seed={7} />}

      <header className={styles.chrome}>
        <IconButton icon="home" label={BUTTONS.map} onClick={p.onMap} />
      </header>

      <div className={styles.fit}>
        <div className={styles.stage} style={cssVars({ '--s': scale }, { width: layout.width, height: layout.height })}>
          {/* ряд кісточок: слот порожніє, коли його кісточка вилітає */}
          <div className={styles.rail} aria-hidden="true">
            {Array.from({ length: BONES_PER_LEVEL }, (_, i) => (
              <span key={i} className={styles.slot} style={{ left: layout.rail.x + i * layout.rail.pitch, top: layout.rail.y, width: layout.rail.slotW, height: layout.rail.slotH }}>
                <Bone empty={i < p.launched} className={styles.slotBone} />
              </span>
            ))}
          </div>

          <div className={styles.animal} data-show={p.showAnimal} style={{ left: layout.animal.x, top: layout.animal.y, width: layout.animal.w, height: layout.animal.h }}>
            <img src={animalUrl(p.animal, true)} alt="" draggable={false} />
            <span className={styles.heart} style={{ left: '8%', top: '-6%' }} aria-hidden="true" />
            <span className={styles.heart} data-late="true" style={{ right: '4%', top: '-14%' }} aria-hidden="true" />
          </div>

          <div className={styles.kubik} style={{ left: layout.kubik.x, top: layout.kubik.y, width: layout.kubik.w, height: layout.kubik.h }}>
            <Kubik pose="celebrating" accessory={p.world} size={layout.kubik.h} talking={p.talking} />
          </div>

          <div className={styles.bowl} style={{ left: bowl.x, top: bowl.y, transform: `scale(${bowl.scale})` }}>
            <Bowl landed={p.landed} bump={p.landed > 0} key={p.landed} />
          </div>

          {p.flying !== null && flyStart && flight && (
            <Bone
              key={p.flying}
              className={styles.flying}
              style={cssVars(
                { '--dx': `${flight.dx}px`, '--dy': `${flight.dy}px` },
                { left: flyStart.x - boneSize / 2, top: flyStart.y - boneSize / 2, width: boneSize, height: boneSize },
              )}
            />
          )}

          {p.showSticker && (
            <div className={styles.reveal} style={{ left: layout.sticker.x, top: layout.sticker.y, width: layout.sticker.w, height: layout.sticker.h }}>
              <StickerTile animal={p.animal} world={p.world} size={layout.sticker.w} label={p.stickerLabel} />
            </div>
          )}

          {p.showBadge && (
            <div className={styles.reveal} style={{ left: layout.badge.x, top: layout.badge.y, width: layout.badge.w, height: layout.badge.h }}>
              <DiligenceBadge size={layout.badge.w} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.next}>
        <IconButton icon="next" label={BUTTONS.next} variant="primary" size={88} onClick={p.onNext} />
      </div>
    </main>
  );
}
