import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { useViewport } from '../app/useViewport';
import { BONES_PER_LEVEL } from '../components/ui/boneStates';
import { afterLevel, rescuedAnimal } from '../curriculum/flow';
import { findLevel } from '../curriculum/levels';
import { isLevelDone } from '../curriculum/progression';
import type { Level } from '../curriculum/types';
import { sessionClock } from '../session/sessionClock';
import { LEVEL_LINES, stickerLabel } from '../speech/lines';
import { ANIMALS } from '../speech/nouns';
import { sfx } from '../speech/sfx';
import { useScript } from '../speech/useScript';
import { useTts } from '../speech/useTts';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import { BONE_FLIGHT_MS, BONE_STAGGER_MS } from './levelComplete/levelCompleteLayout';
import { LevelCompleteView } from './levelComplete/LevelCompleteView';
import { readCompleteState, readDevState, type LevelCompleteState } from './levelComplete/state';

const noop = () => undefined;

function LevelCompleteScreen({ level, result }: { level: Level; result: LevelCompleteState }) {
  const navigate = useNavigate();
  const viewport = useViewport();
  const speaking = useTts().speaking;
  const progress = useAppStore(selectActiveProgress);
  const animal = rescuedAnimal(level.id);

  const [launched, setLaunched] = useState(0);
  const [flying, setFlying] = useState<number | null>(null);
  const [landed, setLanded] = useState(0);
  const [showAnimal, setShowAnimal] = useState(false);
  const [showSticker, setShowSticker] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [kubikTalks, setKubikTalks] = useState(false);

  // Сценарій (BRIEF §6.8): «Misja wykonana! Ten poziom za nami!» звучить, поки кісточки по одній летять у миску → тваринка дякує →
  // [нова наліпка: конфеті + «Masz nową naklejkę!»] → [значок «Nie poddajesz się!»]. Одне святкування за раз; кнопки доступні весь час.
  useScript(async ({ say, wait }) => {
    setLaunched(0); setFlying(null); setLanded(0); setShowAnimal(false); setShowSticker(false); setShowBadge(false); setConfetti(false);
    await wait(350);
    setKubikTalks(true);
    const intro = say(LEVEL_LINES.missionDone);
    intro.catch(noop); // обрив сценарію під час польоту не має лишати необроблену відмову
    for (let i = 0; i < BONES_PER_LEVEL; i++) {
      setLaunched(i + 1);
      setFlying(i);
      sfx.play('pop');
      await wait(BONE_FLIGHT_MS);
      setFlying(null);
      setLanded(i + 1);
      await wait(BONE_STAGGER_MS);
    }
    await intro;
    setKubikTalks(false);
    setShowAnimal(true);
    sfx.play('correct');
    await wait(900);
    if (result.firstTime) {
      setConfetti(true);
      setShowSticker(true);
      sfx.play('correct');
      setKubikTalks(true);
      await say(LEVEL_LINES.newSticker);
      setKubikTalks(false);
      await wait(500);
    }
    if (result.together) {
      setShowBadge(true);
      sfx.play('correct');
      setKubikTalks(true);
      await say(LEVEL_LINES.diligence);
      setKubikTalks(false);
    }
  });

  // «Dalej»: свято світу — передусім; інакше сесія вирішує — «Koniec na dziś» (час вичерпано), «Czas na przerwę!» (середина сесії 15/20 хв, втома) або стежка світу
  const sessionMinutes = useAppStore((s) => s.settings.sessionMinutes);
  const next = () => {
    const after = afterLevel(progress, level.id, result.firstTime);
    if (after.screen === 'world-complete') {
      navigate(`/world-done/${after.world}`);
      return;
    }
    const target = { to: `/world/${after.world}`, state: { from: level.id } };
    const step = sessionClock.decide(sessionMinutes);
    if (step === 'end') navigate('/end', { replace: true });
    else if (step === 'break') navigate('/break', { state: { next: target } });
    else navigate(target.to, { state: target.state });
  };

  return (
    <LevelCompleteView
      world={level.world}
      animal={animal}
      stickerLabel={stickerLabel(ANIMALS[animal])}
      launched={launched}
      flying={flying}
      landed={landed}
      showAnimal={showAnimal}
      showSticker={showSticker}
      showBadge={showBadge}
      confetti={confetti}
      talking={kubikTalks && speaking}
      viewport={viewport}
      onMap={() => navigate('/map')}
      onNext={next}
    />
  );
}

/** Koniec poziomu (BRIEF §6.8): адреса /done/:levelId недовірена — невідомий рівень веде на мапу, непройдений — на стежку світу.
 *  Що саме святкувати (нова наліпка, значок), приходить зі стану навігації від гри; без нього — спокійна версія. */
export function LevelComplete() {
  const { levelId } = useParams();
  const location = useLocation();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);

  if (!profile) return <Navigate to="/start" replace />;
  const level = levelId ? findLevel(levelId) : undefined;
  if (!level) return <Navigate to="/map" replace />;
  if (!isLevelDone(progress, level.id)) return <Navigate to={`/world/${level.world}`} replace />;
  const result = readDevState(location.search, import.meta.env.DEV) ?? readCompleteState(location.state);
  return <LevelCompleteScreen key={`${level.id}-${result.firstTime}-${result.together}`} level={level} result={result} />;
}
