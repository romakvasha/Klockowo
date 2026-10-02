import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Vehicle } from '../characters/Vehicle';
import { WorldBuilding } from '../components/map/WorldBuilding';
import { animalUrl } from '../components/math/art';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { Kubik } from '../characters/Kubik';
import { albumCount, albumSlots, isAlbumEmpty, sceneStickers, type AlbumSlot } from '../curriculum/rewards';
import type { WorldKey } from '../curriculum/types';
import { WORLD_KEYS } from '../curriculum/worlds';
import { ALBUM, BUILDING_NAMES, BUTTONS, VEHICLE_NAMES } from '../speech/lines';
import { ANIMALS, type AnimalId } from '../speech/nouns';
import { sfx } from '../speech/sfx';
import { tts } from '../speech/tts';
import { currentWorldId } from '../curriculum/progression';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import styles from './rewards/Rewards.module.css';

type Tab = WorldKey | 'scene';
const cap = (s: string): string => s.charAt(0).toLocaleUpperCase('pl') + s.slice(1);

/** Назва наліпки, яку каже Kubik при дотику: «Miś!», «Balon!», «Wiatrak!». */
export function stickerName(slot: AlbumSlot): string {
  if (slot.kind === 'animal') return `${cap(ANIMALS[slot.animal].one)}!`;
  if (slot.kind === 'vehicle') return `${cap(VEHICLE_NAMES[slot.vehicle])}!`;
  return `${cap(BUILDING_NAMES[slot.world])}!`;
}

function Slot({ slot }: { slot: AlbumSlot }) {
  const owned = slot.owned;
  const name = stickerName(slot);
  const art =
    slot.kind === 'animal' ? (
      <img src={animalUrl(slot.animal, true)} alt="" draggable={false} />
    ) : slot.kind === 'vehicle' ? (
      <Vehicle kind={slot.vehicle} scale={slot.vehicle === 'pociag' ? 0.3 : 0.5} />
    ) : (
      <WorldBuilding world={slot.world} width={86} />
    );
  return (
    <button
      type="button"
      className={styles.slot}
      data-owned={owned}
      aria-label={owned ? name : ALBUM.empty}
      onClick={() => {
        sfx.play(owned ? 'pop' : 'tap');
        if (owned) void tts.speak(name, { interrupt: true });
      }}
    >
      {slot.kind === 'animal' && slot.star && <Icon name="star" className={styles.star} />}
      {art}
      {!owned && <span className={styles.question} aria-hidden="true">?</span>}
    </button>
  );
}

interface Placed {
  id: number;
  animal: AnimalId;
  x: number;
  y: number;
}

/** Вільна сцена: вибираєш наліпку з лотка й торкаєшся полотна — вона стає там; торкнувся наліпки на полотні — зникає. (Дотик по наліпці → дотик по місцю — як скрізь у грі; сцена не зберігається.) */
function FreeScene({ animals }: { animals: readonly AnimalId[] }) {
  const [selected, setSelected] = useState<AnimalId | null>(animals[0] ?? null);
  const [placed, setPlaced] = useState<readonly Placed[]>([]);
  const [next, setNext] = useState(1);

  const put = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selected === null) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100;
    const y = ((e.clientY - box.top) / box.height) * 100;
    sfx.play('pop');
    setPlaced((list) => [...list, { id: next, animal: selected, x, y }]);
    setNext(next + 1);
  };

  return (
    <>
      <div className={styles.tray} role="radiogroup" aria-label={ALBUM.scene}>
        {animals.map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={selected === a}
            aria-label={ANIMALS[a].one}
            className={`kl-block ${styles.pick}`}
            data-selected={selected === a}
            onClick={() => {
              setSelected(a);
              void tts.speak(`${cap(ANIMALS[a].one)}!`, { interrupt: true });
            }}
          >
            <img src={animalUrl(a, true)} alt="" draggable={false} />
          </button>
        ))}
        <IconButton icon="retry" label={ALBUM.clear} variant="retry" size={72} onClick={() => setPlaced([])} />
      </div>
      <div className={styles.canvas} onClick={put} role="presentation">
        {placed.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.placed}
            aria-label={ANIMALS[p.animal].one}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              sfx.play('tap');
              setPlaced((list) => list.filter((x) => x.id !== p.id));
            }}
          >
            <img src={animalUrl(p.animal, true)} alt="" draggable={false} />
          </button>
        ))}
      </div>
    </>
  );
}

/** Album z naklejkami (BRIEF §6 п.10): сторінка на кожен світ — врятовані тваринки (по одній за рівень), машинка гостя й споруда (після свята світу); порожнє місце — силует зі «?»;
 *  дотик до наліпки — Kubik називає її; вільна сцена для наліпок. Сторінка «Odznaki» — окремо (кнопка зі значком). */
export function StickerAlbum() {
  const navigate = useNavigate();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);
  const start = currentWorldId(progress);
  const [tab, setTab] = useState<Tab>(start === 'hub' ? 'w1' : start);
  if (!profile) return <Navigate to="/start" replace />;

  const rewards = { levels: progress.levels, celebrated: progress.celebrated };
  const animals = sceneStickers(rewards);

  return (
    <main className={styles.page}>
      <header className={styles.bar}>
        <IconButton icon="home" label={BUTTONS.map} variant="neutral" onClick={() => navigate('/map')} />
        <h1 className={styles.title}>{ALBUM.title}</h1>
        <IconButton icon="star" label={ALBUM.badges} variant="secondary" onClick={() => navigate('/badges')} />
      </header>
      <nav className={styles.tabs} aria-label={ALBUM.page}>
        {WORLD_KEYS.map((w) => {
          const { owned, total } = albumCount(w, rewards);
          return (
            <button
              key={w}
              type="button"
              className={`kl-block ${styles.tab}`}
              data-active={tab === w}
              aria-pressed={tab === w}
              aria-label={`${ALBUM.page} ${w.slice(1)}: ${owned}/${total}`}
              style={{ background: `var(--kl-${w}-500)`, ['--edge' as string]: `var(--kl-${w}-700)` }}
              onClick={() => setTab(w)}
            >
              <Icon name={w} />
            </button>
          );
        })}
        <button type="button" className={`kl-block ${styles.tab}`} data-active={tab === 'scene'} aria-pressed={tab === 'scene'} aria-label={ALBUM.scene} style={{ background: 'var(--kl-reward)' }} onClick={() => setTab('scene')}>
          <Icon name="stickers" />
        </button>
      </nav>
      {isAlbumEmpty(rewards) && (
        // порожній альбом (BRIEF §6 п.16): Kubik підбадьорює — силуети нижче чекають на першу наліпку
        <div className={styles.emptyAlbum} role="note">
          <Kubik pose="encouraging" size={150} />
        </div>
      )}
      {tab === 'scene' ? (
        animals.length > 0 ? (
          <FreeScene animals={animals} />
        ) : (
          <p className={styles.emptyNote}>?</p>
        )
      ) : (
        <div className={styles.grid} role="list">
          {albumSlots(tab, rewards).map((slot, i) => (
            <div key={i} role="listitem" style={{ display: 'contents' }}>
              <Slot slot={slot} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
