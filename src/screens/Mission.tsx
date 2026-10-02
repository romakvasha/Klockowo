import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useViewport } from '../app/useViewport';
import { missionObject } from '../curriculum/flow';
import { findLevel } from '../curriculum/levels';
import { canPlay } from '../curriculum/progression';
import type { Level } from '../curriculum/types';
import { MISSION_LINES, missionLine } from '../speech/lines';
import { OBJECTS } from '../speech/nouns';
import { sfx } from '../speech/sfx';
import { useScript } from '../speech/useScript';
import { useTts } from '../speech/useTts';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import { demoKindFor, demoSteps } from './mission/ideaDemo';
import type { MissionPhase } from './mission/missionLayout';
import { MissionView } from './mission/MissionView';

type Speaker = 'guest' | 'kubik' | null;

function MissionScreen({ level }: { level: Level }) {
  const navigate = useNavigate();
  const viewport = useViewport();
  const speaking = useTts().speaking;
  const object = missionObject(level);
  const noun = OBJECTS[object];
  const line = missionLine(object, noun);
  const kind = demoKindFor(level.skills, level.tasks);
  const steps = useMemo(() => demoSteps(kind, noun), [kind, noun]);

  const [phase, setPhase] = useState<MissionPhase>('card');
  const [stage, setStage] = useState(0);
  const [speaker, setSpeaker] = useState<Speaker>(null);
  const [finished, setFinished] = useState(false);
  const [replay, setReplay] = useState(0);

  // Сценарій (BRIEF §6.6, до 5 с; з новою ідеєю — до 20 с): гість звертається → Kubik «Łapki w górę, liczymy!» →
  // [картка стискається, «Patrz, pokażę ci.» і демонстрація] → «Graj!» дихає, «Posłuchaj» пульсує. Кожна репліка — лише після попередньої.
  useScript(async ({ say, wait }) => {
    setPhase('card');
    setStage(0);
    setFinished(false);
    setSpeaker('guest');
    await wait(350);
    await say(line);
    setSpeaker('kubik');
    await say(MISSION_LINES.slogan);
    if (level.newIdea) {
      setSpeaker(null);
      setPhase('idea');
      sfx.play('whoosh');
      await wait(550);
      setSpeaker('kubik');
      await say(MISSION_LINES.showIdea);
      for (const step of steps) {
        setStage(step.stage);
        if (step.say) await say(step.say);
        await wait(step.hold);
      }
    }
    setSpeaker(null);
    setFinished(true);
  }, replay);

  return (
    <MissionView
      world={level.world}
      object={object}
      line={line}
      phase={phase}
      kind={kind}
      stage={stage}
      scatter={level.skills[0] === 'count-scatter'}
      talking={speaker === 'kubik' && speaking}
      finished={finished}
      viewport={viewport}
      onMap={() => navigate(`/world/${level.world}`)}
      onListen={() => setReplay((r) => r + 1)}
      onPlay={() => navigate(`/play/${level.id}`)}
    />
  );
}

/** Wprowadzenie (BRIEF §6.6): адреса /mission/:levelId недовірена — невідомий рівень веде на мапу, недоступний (замок, ★ вимкнено) — на стежку світу. */
export function Mission() {
  const { levelId } = useParams();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);
  const extraTasks = useAppStore((s) => s.settings.extraTasks);

  if (!profile) return <Navigate to="/start" replace />;
  const level = levelId ? findLevel(levelId) : undefined;
  if (!level) return <Navigate to="/map" replace />;
  if (!canPlay(progress, level.id, { extraTasks })) return <Navigate to={`/world/${level.world}`} replace />;
  return <MissionScreen key={level.id} level={level} />;
}
