import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Level } from '../../curriculum/types';
import { planLevel } from '../../games/engine/levelPlan';
import { TaskPlayer } from '../../games/engine/TaskPlayer';
import { resolveGame } from '../../games/registry';
import { PRESETS, presetById } from './presets';
import styles from './Games.module.css';

const seedOf = (v: string | null): number => (v !== null && Number.isFinite(Number(v)) ? Math.abs(Math.trunc(Number(v))) : 1);

/** /#/dev/games?preset=wagon-mid&seed=3&panel=0 — гра на вигаданому рівні з 6 однакових завдань через справжній TaskPlayer (етап M10): без прогресу й профілю.
 *  Після 6-го завдання рівень починається з нового зерна. `panel=0` ховає панель вибору (для скриншотів). */
export function GamesPage() {
  const [params, setParams] = useSearchParams();
  const preset = presetById(params.get('preset'));
  const seed = seedOf(params.get('seed'));
  const panel = params.get('panel') !== '0';
  const [index, setIndex] = useState(0);

  const level: Level = useMemo(
    () => ({
      id: `${preset.world}-1`, world: preset.world, index: 1, kind: 'main', newIdea: false, skills: [preset.spec.skill],
      tasks: Array.from({ length: 6 }, () => preset.spec), draft: false,
    }),
    [preset],
  );
  const plan = useMemo(() => planLevel(level, seed, resolveGame), [level, seed]);

  const set = (patch: Record<string, string>) => {
    const copy = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) copy.set(k, v);
    setParams(copy, { replace: true });
    setIndex(0);
  };
  const planned = plan[index];
  if (!planned) return null;
  const next = () => {
    if (index + 1 < plan.length) setIndex(index + 1);
    else set({ seed: String(seed + 1) });
  };

  return (
    <>
      <TaskPlayer
        key={`${preset.id}-${seed}-${index}`}
        level={level}
        planned={planned}
        filled={index}
        onSolved={next}
        onMap={() => window.location.assign('#/dev')}
      />
      {panel && (
        <aside className={styles.panel}>
          <Link to="/dev" className={styles.link}>← Dev</Link>
          <select value={preset.id} onChange={(e) => set({ preset: e.target.value })} aria-label="Пресет">
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <button type="button" onClick={() => set({ seed: String(seed + 1) })}>Нове зерно ({seed})</button>
          <button type="button" onClick={next}>Пропустити завдання ({index + 1}/6)</button>
        </aside>
      )}
    </>
  );
}
