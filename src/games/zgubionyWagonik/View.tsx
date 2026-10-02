import { useEffect, useMemo, useState } from 'react';
import { TrainEngine, TrainWagon, type WagonState } from '../../components/math/TrainWagon';
import { trainLayout } from '../../components/math/trainLayout';
import { LABELS, wagonLabel } from '../../speech/lines';
import type { SceneProps } from '../engine/types';
import { readOrder } from './assist';
import type { TrainInstance } from './generate';
import styles from './View.module.css';

/** Що зараз підсвічує допомога: індекс вагона, який «читає» Kubik (−1 — жоден), і чи вказує вона на прогалину. */
export function helpFocus(instance: Pick<TrainInstance, 'numbers' | 'gapIndex'>, assist: SceneProps<TrainInstance>['assist']): { reading: number; gap: boolean } {
  if (assist.mode === 'together') return { reading: assist.step - 1, gap: false };
  if (assist.mode !== 'hint') return { reading: -1, gap: false };
  const order = readOrder(instance, assist.level ?? 1);
  if (assist.step >= 1 && assist.step <= order.length) return { reading: order[assist.step - 1]!, gap: false };
  return { reading: -1, gap: assist.step === order.length + 1 };
}

/** Сцена «Zgubiony wagonik»: паровозик і вагони з номерами, на місці загубленого — пунктирне «?». Підказка читає вагони по одному (золота рамка) й показує на прогалину;
 *  показ «разом» читає весь потяг, а загублений вагончик заїжджає на місце й лишається. Після правильної відповіді він заїжджає теж. */
export function TrainScene({ instance, area, reserved, assist, celebrating }: SceneProps<TrainInstance>) {
  const count = instance.numbers.length;
  const layout = useMemo(
    () => trainLayout(area, reserved, count),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, count, JSON.stringify(reserved)],
  );
  const [arrived, setArrived] = useState(false);

  // показ «разом» ставить вагончик на місце, і він лишається, поки дитина торкається «Gotowe»
  useEffect(() => {
    if (assist.mode === 'together' && assist.step > instance.gapIndex) setArrived(true);
  }, [assist.mode, assist.step, instance.gapIndex]);

  const focus = helpFocus(instance, assist);
  const gapFilled = celebrating || arrived;

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      {layout.rails.map((rail, i) => (
        <div key={i} className={styles.rail} style={{ left: rail.x, top: rail.y, width: rail.w }} />
      ))}
      {layout.items.map((item) => {
        const pos = { left: item.x, top: item.y };
        if (item.kind === 'engine') {
          return (
            <div key="engine" className={styles.item} style={pos}>
              <TrainEngine size={layout.wagon} label={LABELS.engine} />
            </div>
          );
        }
        const i = item.index;
        const isGap = i === instance.gapIndex;
        const value = instance.numbers[i]!;
        let state: WagonState = i === focus.reading ? 'reading' : 'idle';
        if (isGap) state = gapFilled ? 'arriving' : focus.gap ? 'gapHint' : 'gap';
        return (
          <div key={i} className={styles.item} style={pos}>
            <TrainWagon
              value={isGap && !gapFilled ? null : value}
              state={state}
              tone={i}
              size={item.w}
              label={isGap && !gapFilled ? LABELS.wagonGap : wagonLabel(value)}
            />
          </div>
        );
      })}
    </div>
  );
}
