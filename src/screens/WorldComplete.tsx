import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Kubik } from '../characters/Kubik';
import { TeamPup } from '../characters/TeamPup';
import { WorldBuilding } from '../components/map/WorldBuilding';
import { CHEST_URL } from '../components/map/art';
import { Confetti } from '../components/ui/Confetti';
import { IconButton } from '../components/ui/IconButton';
import { isWorldComplete } from '../curriculum/progression';
import { isWorldId, worldById } from '../curriculum/worlds';
import type { WorldKey } from '../curriculum/types';
import { BUILDING_NAMES, BUTTONS, LEVEL_LINES } from '../speech/lines';
import { sfx } from '../speech/sfx';
import { tts } from '../speech/tts';
import { useTts } from '../speech/useTts';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import styles from './rewards/Rewards.module.css';

function WorldCompleteScreen({ world }: { world: WorldKey }) {
  const navigate = useNavigate();
  const celebrate = useAppStore((s) => s.celebrateWorld);
  const speaking = useTts().speaking;
  const guest = worldById(world).guest;

  // Скриня відкривається з конфеті: звук і голос «Wszystkie misje w tym świecie wykonane!»; світ записується як відсвяткований (скриня на стежці — відкрита, на мапі — споруда)
  useEffect(() => {
    celebrate(world);
    sfx.play('correct');
    void tts.speak(LEVEL_LINES.worldDone, { interrupt: true });
    return () => tts.cancel();
    // лише при відкритті екрана
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.done} style={{ '--world': `var(--kl-${world}-100)` } as React.CSSProperties}>
      <Confetti seed={world.charCodeAt(1)} />
      <div className={styles.doneStage}>
        {guest && guest !== 'all' && <TeamPup member={guest} pose="happy" size={170} className={styles.guest} />}
        <div className={styles.chest}>
          <img src={CHEST_URL('open')} alt="" draggable={false} width={220} height={259} />
          <WorldBuilding world={world} width={150} building label={BUILDING_NAMES[world]} className={styles.building} />
        </div>
        <Kubik pose="celebrating" accessory={world} size={190} talking={speaking} />
      </div>
      <IconButton icon="next" label={BUTTONS.next} variant="primary" size={88} className={styles.next} onClick={() => navigate('/map', { replace: true })} />
    </main>
  );
}

/** Świat ukończony (BRIEF §6 п.9): скриня відкривається з конфеті, «Wszystkie misje w tym świecie wykonane!»; на мапі з'являється нова споруда з блоків, відкривається наступний світ.
 *  Адреса /world-done/:worldId недовірена: невідомий світ — на мапу, світ, не пройдений до кінця, — на його стежку. */
export function WorldComplete() {
  const { worldId } = useParams();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);
  if (!profile) return <Navigate to="/start" replace />;
  if (!worldId || !isWorldId(worldId) || worldId === 'hub') return <Navigate to="/map" replace />;
  if (!isWorldComplete(progress, worldId)) return <Navigate to={`/world/${worldId}`} replace />;
  return <WorldCompleteScreen world={worldId} />;
}
