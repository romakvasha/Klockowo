import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { findLevel } from '../curriculum/levels';
import { canPlay, isLevelDone } from '../curriculum/progression';
import type { Level } from '../curriculum/types';
import { isLevelFinished, planLevel, summarize } from '../games/engine/levelPlan';
import { freshSeed } from '../games/engine/rng';
import { TaskPlayer, type SolvedResult } from '../games/engine/TaskPlayer';
import { resolveGame } from '../games/registry';
import { selectActiveProfile, selectActiveProgress, useAppStore, type TaskOutcome } from '../store';
import type { LevelCompleteState } from './levelComplete/state';
import stubStyles from './ScreenStub.module.css';

/** Рівень-заготовка (завдання ще не описано): на час розробки — повідомлення й повернення на стежку. */
function DraftLevel({ level }: { level: Level }) {
  return (
    <main className={stubStyles.stub}>
      <h1 className={stubStyles.title}>{level.id}</h1>
      <p className={stubStyles.note}>Рівень — заготовка: завдання з’являться в наступних етапах.</p>
      <Link className={stubStyles.link} to={`/world/${level.world}`}>
        Стежка
      </Link>
    </main>
  );
}

function LevelGame({ level }: { level: Level }) {
  const navigate = useNavigate();
  const progress = useAppStore(selectActiveProgress);
  const saveRun = useAppStore((s) => s.saveRun);
  const completeLevel = useAppStore((s) => s.completeLevel);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const addPlayTime = useAppStore((s) => s.addPlayTime);

  // Початковий стан знімаємо один раз: збережений забіг (зерно + результати) продовжує рівень з того самого місця, інакше — новий забіг
  const [init] = useState(() => {
    const run = progress.runs[level.id];
    return {
      seed: run?.seed ?? freshSeed(),
      startedAt: run?.startedAt ?? new Date().toISOString(),
      results: [...(run?.results ?? [])] as TaskOutcome[],
      resumed: run !== undefined,
      wasDone: isLevelDone(progress, level.id),
    };
  });
  const [results, setResults] = useState<TaskOutcome[]>(init.results);
  const plan = useMemo(() => planLevel(level, init.seed, resolveGame), [level, init.seed]);

  const finish = (all: readonly TaskOutcome[]) => {
    completeLevel(level.id, summarize(all));
    const state: LevelCompleteState = { firstTime: !init.wasDone, together: all.includes('together') };
    navigate(`/done/${level.id}`, { replace: true, state });
  };

  // новий забіг одразу зберігається (з першого завдання «Mapa» вже не губить рівень); завершений, але не закритий забіг закриваємо
  useEffect(() => {
    if (plan.length === 0) return;
    if (!init.resumed) saveRun(level.id, { seed: init.seed, results: [], startedAt: init.startedAt });
    else if (isLevelFinished(init.results, plan.length)) finish(init.results);
    // лише при монтуванні рівня
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (plan.length === 0) return <DraftLevel level={level} />;
  const index = results.length;
  const planned = plan[index];
  if (!planned) return null;

  const solved = ({ outcome, entry, minutes }: SolvedResult) => {
    if (entry) recordAnswer(entry);
    addPlayTime(minutes);
    const next = [...results, outcome];
    if (isLevelFinished(next, plan.length)) {
      finish(next);
      return;
    }
    saveRun(level.id, { seed: init.seed, results: next, startedAt: init.startedAt });
    setResults(next);
  };

  return <TaskPlayer key={index} level={level} planned={planned} filled={index} onSolved={solved} onMap={() => navigate(`/world/${level.world}`)} />;
}

/** Ekran gry (BRIEF §6.7, §7): адреса /play/:levelId недовірена — невідомий рівень веде на мапу, недоступний (замок, ★ вимкнено) — на стежку світу. */
export function GameScreen() {
  const { levelId } = useParams();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);
  const extraTasks = useAppStore((s) => s.settings.extraTasks);

  if (!profile) return <Navigate to="/start" replace />;
  const level = levelId ? findLevel(levelId) : undefined;
  if (!level) return <Navigate to="/map" replace />;
  if (!canPlay(progress, level.id, { extraTasks })) return <Navigate to={`/world/${level.world}`} replace />;
  return <LevelGame key={level.id} level={level} />;
}
