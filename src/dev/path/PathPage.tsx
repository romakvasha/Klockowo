import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useViewport } from '../../app/useViewport';
import type { VisibleNodeState } from '../../components/map/LevelNode';
import { WorldPathView } from '../../components/map/WorldPathView';
import { isWorldComplete, nextLevelId, nodeState, type ProgressSnapshot } from '../../curriculum/progression';
import { levelsOfWorld } from '../../curriculum/levels';
import type { LevelId, WorldKey } from '../../curriculum/types';
import { WORLD_KEYS, levelId, mainLevelIds } from '../../curriculum/worlds';
import styles from './Path.module.css';

const num = (v: string | null, d: number) => (v === null || Number.isNaN(Number(v)) ? d : Number(v));

/** /#/dev/path?world=w1&done=4&stars=1&review=2,3&extra=1&from=w1-3&panel=0 — стежка світу з вигаданим прогресом (етап M7):
 *  усі стани вузлів, ★-гілка, скриня, Kubik. `panel=0` ховає панель керування (для скриншотів). */
export function PathPage() {
  const [params, setParams] = useSearchParams();
  const viewport = useViewport();
  const world = (WORLD_KEYS as readonly string[]).includes(params.get('world') ?? '') ? (params.get('world') as WorldKey) : 'w1';
  const mains = mainLevelIds(world);
  const done = Math.min(mains.length, Math.max(0, num(params.get('done'), 4)));
  const stars = Math.min(4, Math.max(0, num(params.get('stars'), 0)));
  const extra = params.get('extra') !== '0';
  const review = new Set<LevelId>((params.get('review') ?? '').split(',').filter(Boolean).map((n) => levelId(world, Number(n))));
  const from = params.get('from') as LevelId | null;
  const panel = params.get('panel') !== '0';

  const progress: ProgressSnapshot = useMemo(
    () => ({
      levels: Object.fromEntries([...mains.slice(0, done), ...Array.from({ length: stars }, (_, i) => levelId(world, i + 1, 'star'))].map((id) => [id, {}])),
      manualUnlocks: [world],
    }),
    [mains, done, stars, world],
  );
  const states = useMemo(() => {
    const out: Record<string, VisibleNodeState> = {};
    for (const level of levelsOfWorld(world)) {
      const s = nodeState(progress, level.id, { extraTasks: extra, reviewLevels: review });
      if (s !== 'hidden') out[level.id] = s;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, world, extra, params.get('review')]);

  const next = nextLevelId(progress, world);
  const set = (patch: Record<string, string | null>) => {
    const copy = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v === null ? copy.delete(k) : copy.set(k, v));
    setParams(copy, { replace: true });
  };

  return (
    <>
      <WorldPathView
        key={`${world}-${from ?? ''}`}
        world={world}
        viewport={viewport}
        states={states}
        chest={isWorldComplete(progress, world) ? 'ready' : 'locked'}
        kubikAt={next ?? 'chest'}
        kubikFrom={from}
        fresh={from ? next : null}
        onNode={() => undefined}
        onChest={() => undefined}
        onMap={() => undefined}
      />
      {panel && (
        <aside className={styles.panel}>
          <Link to="/dev">← Dev</Link>
          {WORLD_KEYS.map((w) => (
            <button key={w} type="button" data-on={w === world} onClick={() => set({ world: w, done: '4', stars: '0', from: null })}>{w}</button>
          ))}
          <button type="button" onClick={() => set({ done: String(Math.max(0, done - 1)) })}>−</button>
          <span>пройдено {done}/{mains.length}</span>
          <button type="button" onClick={() => set({ done: String(Math.min(mains.length, done + 1)) })}>+</button>
          <button type="button" onClick={() => set({ stars: String((stars + 1) % 5) })}>★ {stars}</button>
          <button type="button" data-on={extra} onClick={() => set({ extra: extra ? '0' : '1' })}>★-гілка</button>
          <button type="button" onClick={() => set({ review: review.size ? null : '1,2' })}>Do powtórki</button>
          <button type="button" onClick={() => set({ from: from ? null : mains[Math.max(0, done - 1)] ?? null })}>Біг Kubika</button>
        </aside>
      )}
    </>
  );
}
