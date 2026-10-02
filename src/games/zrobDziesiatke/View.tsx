import { useEffect, useMemo, useState } from 'react';
import { TenFrame } from '../../components/math/TenFrame';
import { Digits } from '../../components/ui/Digits';
import { Operator } from '../../components/ui/Operator';
import { LABELS } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { placeContent } from '../engine/placeContent';
import type { SceneProps } from '../engine/types';
import { frameView } from './assist';
import { TEN, missing, type TenInstance } from './generate';
import styles from './View.module.css';

/** Рамка в design-px: комірка 64 (≥ 64 px дотику на ПК; на екрані вона лише більша — maxScale), 5 × 2 + рамка. */
export const CELL = 64;
/** Над рамкою — рівняння «n + ? = 10» (лише в режимі цифр: там це єдина підказка про число, а Kubik на телефоні схований). */
export const EQUATION_H = 64;
export const DESIGN = { w: 332, h: 140 + EQUATION_H } as const;
const MAX_SCALE = 1.7;

/** Скільки фішок можна докласти: коли відомі видно — решта до десяти; коли рамка порожня (лише цифра) — десять. */
export const capacity = (known: number, knownShown: boolean): number => (knownShown ? TEN - known : TEN);

/** Сцена «Zrób dziesiątkę»: рамка-десятка. Дотик по порожній комірці докладає фішку (завжди в наступну вільну — лічимо по одній, голос називає скільки докладено),
 *  дотик по докладеній фішці знімає останню. Рамка повна — спалахує золотим. У режимі цифр (рамка порожня) відомі фішки з'являються як допомога. */
export function TenScene({ instance, world, area, reserved, assist, phase, celebrating, onRespond, onTouch }: SceneProps<TenInstance>) {
  const place = useMemo(
    () => placeContent(area, reserved, DESIGN, { maxScale: MAX_SCALE }),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, JSON.stringify(reserved)],
  );
  const { known } = instance;
  const need = missing(instance);
  const [added, setAdded] = useState(0);
  const [helped, setHelped] = useState(false);
  const interactive = phase === 'play' && assist.mode === 'none';

  // допомога Kubika: будь-яка підказка відкриває відомі фішки; показ «разом» докладає фішки по одній
  useEffect(() => {
    if (assist.mode === 'hint' || assist.mode === 'together') setHelped(true);
    if (assist.mode === 'together') setAdded(Math.min(assist.step, need));
  }, [assist.mode, assist.step, need]);

  const knownShown = instance.show === 'frame' || helped || celebrating;
  const cap = capacity(known, knownShown);
  // коли відомі фішки відкрилися, а докладено вже більше, ніж лишилось місця, — зайве зникає
  useEffect(() => {
    setAdded((a) => Math.min(a, cap));
  }, [cap]);

  const speakCount = (n: number) => {
    if (n > 0) void tts.speak(numberWords(n), { interrupt: true });
  };
  const add = () => {
    if (!interactive || added >= cap) return;
    onTouch?.();
    sfx.play('pop');
    speakCount(added + 1);
    setAdded(added + 1);
  };
  const removeLast = () => {
    if (!interactive || added <= 0) return;
    onTouch?.();
    sfx.play('tap');
    speakCount(added - 1);
    setAdded(added - 1);
  };

  // що докладено — число для «Gotowe»; нічого — null
  useEffect(() => {
    onRespond?.(added > 0 ? added : null);
  }, [added, onRespond]);

  const hintStep = assist.mode === 'hint' && (assist.level ?? 1) >= 2 ? assist.step : 0;
  const togetherStep = assist.mode === 'together' ? assist.step : 0;
  const view = frameView(known, added, { knownShown, hintStep, togetherStep });
  const first = knownShown ? known : 0;
  const pulsing = assist.mode === 'hint' && (assist.level ?? 1) <= 1;

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div
        className={styles.stage}
        style={{ left: place.x, top: place.y, width: DESIGN.w, height: DESIGN.h, transform: `scale(${place.scale})` }}
      >
        <div className={styles.equation} style={{ height: EQUATION_H }} role="img" aria-label={LABELS.equation} data-visible={instance.show === 'digit'}>
          <Digits value={known} style={{ height: 44 }} />
          <Operator kind="plus" style={{ height: 36 }} />
          <b>?</b>
          <Operator kind="equals" style={{ height: 36 }} />
          <Digits value={TEN} style={{ height: 44 }} />
        </div>
        <TenFrame
          cells={TEN}
          state={view.cells}
          world={world}
          cell={CELL}
          marks={view.marks}
          gold={celebrating}
          pulse={() => pulsing}
          press={(i) => {
            if (!interactive) return null;
            if (view.cells[i] === 'empty') return added < cap ? { label: LABELS.frameAdd, onPress: add } : null;
            return i >= first && i < first + added ? { label: LABELS.frameRemove, onPress: removeLast } : null;
          }}
        />
      </div>
    </div>
  );
}
