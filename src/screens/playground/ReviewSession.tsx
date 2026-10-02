import { useMemo, useState } from 'react';
import { findLevel } from '../../curriculum/levels';
import { PLAYGROUND_COUNT, playgroundTasks } from '../../curriculum/playground';
import { adaptTask } from '../../curriculum/adaptSpec';
import { freshSeed } from '../../games/engine/rng';
import { planLevel } from '../../games/engine/levelPlan';
import { TaskPlayer, type SolvedResult } from '../../games/engine/TaskPlayer';
import { resolveGame } from '../../games/registry';
import { dayKey, selectActiveProgress, useAppStore } from '../../store';
import { PLAYGROUND } from '../../speech/lines';
import styles from './Playground.module.css';

/** Мішане повторення: 6 завдань із пройдених рівнів (пріоритет — навичкам, що чекають повторення; curriculum/playground). Кожне завдання йде зі свого рівня (світ, предмети, ігри) через
 *  справжній TaskPlayer; відповіді пишуться в навички (повторення працює далі), але рівні й наліпки не чіпаються. Після шостого — назад до Plac Zabaw. */
export function ReviewSession({ onExit }: { onExit: () => void }) {
  const progress = useAppStore(selectActiveProgress);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const addPlayTime = useAppStore((s) => s.addPlayTime);
  const [init] = useState(() => {
    const seed = freshSeed();
    return { seed, tasks: playgroundTasks(progress, dayKey(new Date()), seed, (game) => resolveGame(game) !== undefined) };
  });
  const [index, setIndex] = useState(0);
  const total = Math.min(init.tasks.length, PLAYGROUND_COUNT);

  const current = init.tasks[index];
  const level = current ? findLevel(current.level) : undefined;
  const planned = useMemo(() => {
    if (!current || !level) return undefined;
    // кожне завдання планується окремо у своєму рівні; крок складності навички — як у звичайній грі
    const skill = progress.skills[current.spec.skill];
    return planLevel(level, init.seed + index, resolveGame, { specs: [current.spec], adapt: (spec) => adaptTask(spec, skill, 0, level.world) })[0];
    // лише при зміні завдання
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (total === 0 || !current || !level || !planned) {
    return (
      <div className={styles.empty}>
        <p>{PLAYGROUND.empty}</p>
        <button type="button" className={`kl-block ${styles.back}`} onClick={onExit}>
          {PLAYGROUND.title}
        </button>
      </div>
    );
  }

  const solved = ({ entry, minutes }: SolvedResult) => {
    if (entry) recordAnswer(entry);
    addPlayTime(minutes);
    if (index + 1 >= total) onExit();
    else setIndex(index + 1);
  };

  return <TaskPlayer key={index} level={level} planned={planned} filled={index} onSolved={solved} onMap={onExit} />;
}
