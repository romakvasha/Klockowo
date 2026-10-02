import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { useViewport } from '../app/useViewport';
import type { VisibleNodeState } from '../components/map/LevelNode';
import type { ChestState } from '../components/map/TreasureChest';
import { WorldPathView } from '../components/map/WorldPathView';
import { isNodePlayable, isWorldComplete, isWorldUnlocked, nextLevelId, nodeState, worldProgressCount } from '../curriculum/progression';
import { levelsOfWorld } from '../curriculum/levels';
import { reviewLevelIds } from '../curriculum/review';
import type { LevelId, WorldKey } from '../curriculum/types';
import { isWorldId, parseLevelId } from '../curriculum/worlds';
import { WORLD_INTROS } from '../speech/lines';
import { sfx } from '../speech/sfx';
import { tts } from '../speech/tts';
import { useTts } from '../speech/useTts';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';

/** Куди повертає «Dalej» з Koniec poziomu: рівень, щойно пройдений (звідки Kubik біжить до нового вузла). */
export interface WorldPathState {
  from?: LevelId;
}

function readFrom(state: unknown, world: WorldKey): LevelId | null {
  const from = (state as WorldPathState | null)?.from;
  return typeof from === 'string' && parseLevelId(from)?.world === world ? from : null;
}

function WorldPathScreen({ world }: { world: WorldKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const viewport = useViewport();
  const progress = useAppStore(selectActiveProgress);
  const extraTasks = useAppStore((s) => s.settings.extraTasks);
  const speaking = useTts().speaking;
  const [shaking, setShaking] = useState<LevelId | 'chest' | null>(null);
  const shakeTimer = useRef(0);

  // «Do powtórki»: пройдений вузол, де тренують навичку з невдалим повторенням (curriculum/review)
  const ctx = useMemo(() => ({ extraTasks, reviewLevels: reviewLevelIds(progress) }), [extraTasks, progress]);
  const states = useMemo(() => {
    const result: Record<string, VisibleNodeState> = {};
    for (const level of levelsOfWorld(world)) {
      const state = nodeState(progress, level.id, ctx);
      if (state !== 'hidden') result[level.id] = state;
    }
    return result;
  }, [progress, world, ctx]);

  const next = nextLevelId(progress, world);
  const chest: ChestState = isWorldComplete(progress, world) ? (progress.celebrated.includes(world) ? 'open' : 'ready') : 'locked';
  const from = readFrom(location.state, world);
  const doneCount = worldProgressCount(progress, world).done;

  // перший вхід у світ: голос коротко його представляє («Witaj na Łące Liczenia!…»); після першого рівня — тиша
  useEffect(() => {
    if (doneCount > 0) return;
    void tts.speak(WORLD_INTROS[world], { interrupt: true });
    return () => tts.cancel();
  }, [world, doneCount]);

  useEffect(() => () => window.clearTimeout(shakeTimer.current), []);

  const shake = (target: LevelId | 'chest') => {
    sfx.play('retry');
    setShaking(target);
    window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShaking(null), 400);
  };

  // «Mapa» у грі лишає виконані завдання (runs): якщо рівень уже розпочато — одразу в гру, без повторного вступу
  const pressNode = (id: LevelId) => {
    const state = states[id];
    if (!state || !isNodePlayable(state)) return shake(id);
    const run = progress.runs[id];
    navigate(run && run.results.length > 0 ? `/play/${id}` : `/mission/${id}`);
  };

  const pressChest = () => {
    if (chest !== 'locked') navigate(`/world-done/${world}`);
    else shake('chest');
  };

  return (
    <WorldPathView
      world={world}
      viewport={viewport}
      states={states}
      chest={chest}
      kubikAt={next ?? 'chest'}
      kubikFrom={from ? from : null}
      fresh={from ? next : null}
      shaking={shaking}
      talking={speaking}
      onNode={pressNode}
      onChest={pressChest}
      onMap={() => navigate('/map')}
    />
  );
}

/** Ścieżka świata (BRIEF §6.5): адреса /world/:worldId недовірена — невідомий світ веде на мапу, закритий — теж; хаб — це «Plac Zabaw». */
export function WorldPath() {
  const { worldId } = useParams();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);

  if (!profile) return <Navigate to="/start" replace />;
  if (!isWorldId(worldId)) return <Navigate to="/map" replace />;
  if (worldId === 'hub') return <Navigate to="/playground" replace />;
  if (!isWorldUnlocked(progress, worldId)) return <Navigate to="/map" replace />;
  return <WorldPathScreen key={worldId} world={worldId} />;
}
