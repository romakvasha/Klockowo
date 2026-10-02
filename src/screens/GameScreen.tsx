import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { findLevel } from '../curriculum/levels';
import { fatigueSignal, nextEase } from '../curriculum/adaptivity';
import { adaptTask } from '../curriculum/adaptSpec';
import { canPlay, isLevelDone } from '../curriculum/progression';
import { chooseSwaps, levelSpecs, type LevelQueue } from '../curriculum/review';
import type { Level } from '../curriculum/types';
import { TASKS_PER_LEVEL, isLevelFinished, planLevel, summarize, type PlannedTask } from '../games/engine/levelPlan';
import { freshSeed } from '../games/engine/rng';
import { sessionClock } from '../session/sessionClock';
import { TaskPlayer, type SolvedResult } from '../games/engine/TaskPlayer';
import { resolveGame } from '../games/registry';
import {
  appStore, dayKey, selectActiveProfile, selectActiveProgress, useAppStore, type LevelRun, type ProfileProgress, type TaskOutcome,
} from '../store';
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
  const queueRetry = useAppStore((s) => s.queueRetry);
  const dropRetry = useAppStore((s) => s.dropRetry);

  // Початковий стан знімаємо один раз: збережений забіг (зерно + результати + черга) продовжує рівень з того самого місця, інакше — новий забіг,
  // у слоти-повторення якого стають завдання з черги (curriculum/review): «разом» з інших рівнів і навички, яким час повторення
  const [init] = useState(() => {
    const run = progress.runs[level.id];
    const queue: LevelQueue = run
      ? { swaps: run.swaps, warmup: run.warmup }
      : chooseSwaps(level, progress, dayKey(new Date()), (spec) => resolveGame(spec.game) !== undefined);
    return {
      seed: run?.seed ?? freshSeed(),
      startedAt: run?.startedAt ?? new Date().toISOString(),
      results: [...(run?.results ?? [])] as TaskOutcome[],
      resumed: run !== undefined,
      wasDone: isLevelDone(progress, level.id),
      queue,
      specs: levelSpecs(level, queue),
    };
  });
  const total = Math.min(init.specs.length, TASKS_PER_LEVEL);

  // Завдання планується, коли до нього доходить черга: з кроком складності навички на цей момент (curriculum/adaptSpec) і полегшенням
  // після ознак утоми. Вже показане завдання не змінюється, навіть коли відповідь зрушила крок.
  const planAt = (index: number, skills: ProfileProgress['skills'], ease: number): PlannedTask | undefined =>
    planLevel(level, init.seed, resolveGame, {
      specs: init.specs.map((s) => s.spec),
      adapt: (spec) => adaptTask(spec, skills[spec.skill], ease, level.world),
    })[index];
  const [view, setView] = useState(() => ({ results: init.results, ease: 0, planned: planAt(init.results.length, progress.skills, 0) }));
  const run = (results: TaskOutcome[]): LevelRun => ({ seed: init.seed, results, startedAt: init.startedAt, ...init.queue });

  const finish = (all: readonly TaskOutcome[]) => {
    completeLevel(level.id, summarize(all));
    const state: LevelCompleteState = { firstTime: !init.wasDone, together: all.includes('together') };
    navigate(`/done/${level.id}`, { replace: true, state });
  };

  // новий забіг одразу зберігається (з першого завдання «Mapa» вже не губить рівень); завершений, але не закритий забіг закриваємо
  useEffect(() => {
    if (total === 0) return;
    sessionClock.touch(); // початок рівня — початок (чи продовження) сесії
    if (!init.resumed) saveRun(level.id, run([]));
    else if (isLevelFinished(init.results, total)) finish(init.results);
    // лише при монтуванні рівня
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (total === 0) return <DraftLevel level={level} />;
  const index = view.results.length;
  const planned = view.planned;
  if (!planned) return null;

  const solved = ({ outcome, entry, minutes, taps }: SolvedResult) => {
    if (entry) recordAnswer(entry);
    addPlayTime(minutes);
    // «разом» — схоже завдання повернеться в наступному рівні; завдання з черги, розв'язане без допомоги, з черги знімається
    const queued = init.specs[index];
    if (queued && outcome === 'together') queueRetry(queued.ref);
    else if (queued?.kind === 'retry') dropRetry(queued.ref);

    const next = [...view.results, outcome];
    if (isLevelFinished(next, total)) {
      finish(next);
      return;
    }
    saveRun(level.id, run(next));
    // ознака втоми (3 помилки поспіль, випадкові дотики, довга бездіяльність) → наступне завдання легше; перерву пропонує сесія (M21)
    const fatigue = fatigueSignal(next, taps);
    sessionClock.touch();
    if (fatigue) sessionClock.markFatigue(); // ознака втоми наближає «Czas na przerwę!» (curriculum/adaptivity + session)
    const ease = nextEase(view.ease, outcome, fatigue);
    const skills = selectActiveProgress(appStore.getState()).skills;
    setView({ results: next, ease, planned: planAt(next.length, skills, ease) });
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
