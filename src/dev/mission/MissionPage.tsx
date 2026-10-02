import { Link, useSearchParams } from 'react-router';
import { useViewport } from '../../app/useViewport';
import type { ObjectId } from '../../speech/nouns';
import { WORLD_OBJECT_IDS } from '../../speech/nouns';
import { missionLine } from '../../speech/lines';
import { OBJECTS } from '../../speech/nouns';
import type { WorldKey } from '../../curriculum/types';
import { WORLD_KEYS } from '../../curriculum/worlds';
import { MissionView } from '../../screens/mission/MissionView';
import type { DemoKind } from '../../screens/mission/ideaDemo';
import type { MissionPhase } from '../../screens/mission/missionLayout';
import styles from '../path/Path.module.css';

const KINDS: readonly DemoKind[] = ['count', 'flash', 'plate', 'sum', 'compare', 'bus'];
const num = (v: string | null, d: number) => (v === null || Number.isNaN(Number(v)) ? d : Number(v));

/** /#/dev/mission?world=w3&phase=idea&kind=sum&stage=2&object=rybka&scatter=1&panel=0 — композиція Wprowadzenie без голосу й сценарію (етап M7):
 *  будь-який світ, фаза «card»/«idea», вид демонстрації й її стадія. `panel=0` ховає панель керування (для скриншотів). */
export function MissionPage() {
  const [params, setParams] = useSearchParams();
  const viewport = useViewport();
  const world = ((WORLD_KEYS as readonly string[]).includes(params.get('world') ?? '') ? params.get('world') : 'w1') as WorldKey;
  const phase: MissionPhase = params.get('phase') === 'idea' ? 'idea' : 'card';
  const kind = (KINDS as readonly string[]).includes(params.get('kind') ?? '') ? (params.get('kind') as DemoKind) : 'count';
  const objects = WORLD_OBJECT_IDS[world] as readonly ObjectId[];
  const object = (objects as readonly string[]).includes(params.get('object') ?? '') ? (params.get('object') as ObjectId) : (objects[0] as ObjectId);
  const stage = Math.max(0, num(params.get('stage'), 0));
  const scatter = params.get('scatter') === '1';
  const panel = params.get('panel') !== '0';

  const set = (patch: Record<string, string | null>) => {
    const copy = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v === null ? copy.delete(k) : copy.set(k, v));
    setParams(copy, { replace: true });
  };

  return (
    <>
      <MissionView
        key={world}
        world={world}
        object={object}
        line={missionLine(object, OBJECTS[object])}
        phase={phase}
        kind={kind}
        stage={stage}
        scatter={scatter}
        talking={params.get('talk') === '1'}
        finished={params.get('done') === '1'}
        viewport={viewport}
        onMap={() => undefined}
        onListen={() => undefined}
        onPlay={() => undefined}
      />
      {panel && (
        <aside className={styles.panel}>
          <Link to="/dev">← Dev</Link>
          {WORLD_KEYS.map((w) => (
            <button key={w} type="button" data-on={w === world} onClick={() => set({ world: w, object: null })}>{w}</button>
          ))}
          <button type="button" data-on={phase === 'card'} onClick={() => set({ phase: 'card' })}>card</button>
          <button type="button" data-on={phase === 'idea'} onClick={() => set({ phase: 'idea' })}>idea</button>
          {KINDS.map((k) => (
            <button key={k} type="button" data-on={k === kind} onClick={() => set({ kind: k })}>{k}</button>
          ))}
          <button type="button" onClick={() => set({ stage: String(Math.max(0, stage - 1)) })}>−</button>
          <span>стадія {stage}</span>
          <button type="button" onClick={() => set({ stage: String(stage + 1) })}>+</button>
          {objects.map((o) => (
            <button key={o} type="button" data-on={o === object} onClick={() => set({ object: o })}>{o}</button>
          ))}
        </aside>
      )}
    </>
  );
}
