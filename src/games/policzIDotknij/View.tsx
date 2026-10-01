import { useEffect, useMemo, useState } from 'react';
import { CountableObject, type ObjectState } from '../../components/math/CountableObject';
import { OBJECTS } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { countingOrder, itemSize, layoutObjects } from '../engine/layoutObjects';
import { createRng, hashSeed } from '../engine/rng';
import type { SceneProps } from '../engine/types';
import type { CountInstance } from './generate';
import { variation } from './look';
import styles from './View.module.css';

/** Сцена «Policz i dotknij» (BRIEF §7 гра 1): предмет, якого торкнулися, підстрибує, отримує номерок і голос називає число. Лічба в порядку дотиків;
 *  Kubik у підказці й «разом» лічить сам — сцена додає до зарахованих предмети за `assist.step` у порядку лічби. */
export function CountScene({ instance, area, reserved, assist, phase, celebrating, onTouch }: SceneProps<CountInstance>) {
  const noun = OBJECTS[instance.object];
  const reservedKey = JSON.stringify(reserved);
  const layout = useMemo(
    () =>
      layoutObjects({
        arrangement: instance.arrangement,
        count: instance.count,
        area,
        size: itemSize(area),
        rng: createRng(hashSeed('layout', instance.seed)),
        reserved,
      }),
    // reserved береться з reservedKey: вміст, а не ідентичність масиву
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instance.arrangement, instance.count, instance.seed, area.w, area.h, reservedKey],
  );
  const order = useMemo(() => countingOrder(instance.arrangement, layout.items, layout.size), [instance.arrangement, layout]);
  const [counted, setCounted] = useState<number[]>([]);

  // Kubik лічить сам: стадія допомоги додає предмети в порядку лічби (ті, що дитина вже зарахувала, лишаються на своїх номерах)
  useEffect(() => {
    if (assist.mode === 'none' || assist.step <= 0) return;
    const target = Math.min(assist.step, instance.count);
    setCounted((prev) => {
      const next = [...prev];
      for (const index of order) {
        if (next.length >= target) break;
        if (!next.includes(index)) next.push(index);
      }
      return next.length === prev.length ? prev : next;
    });
  }, [assist.mode, assist.step, instance.count, order]);

  const touch = (index: number) => {
    if (phase !== 'play') return;
    onTouch?.();
    const known = counted.indexOf(index);
    if (known >= 0) {
      void tts.speak(numberWords(known + 1), { interrupt: true });
      return;
    }
    const n = counted.length + 1;
    setCounted([...counted, index]);
    sfx.play('pop');
    void tts.speak(numberWords(n), { interrupt: true });
  };

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      {layout.items.map((p, i) => {
        const n = counted.indexOf(i);
        const state: ObjectState = n >= 0 ? 'counted' : 'idle';
        const v = variation(instance, i);
        return (
          <CountableObject
            key={i}
            object={instance.object}
            size={layout.size}
            x={p.x}
            y={p.y}
            state={state}
            number={n >= 0 ? n + 1 : undefined}
            flip={v.flip}
            tilt={v.tilt}
            scale={v.scale}
            label={n >= 0 ? `${noun.one}, ${numberWords(n + 1)}` : noun.one}
            celebrate={celebrating}
            disabled={phase !== 'play'}
            onPress={() => touch(i)}
          />
        );
      })}
    </div>
  );
}
