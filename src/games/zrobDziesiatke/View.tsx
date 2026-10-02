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
import { frameView, hintCount } from './assist';
import { TEN, frameCells, missing, type TenInstance } from './generate';
import styles from './View.module.css';

/** Рамка в design-px: комірка 64 (≥ 64 px дотику на ПК; на екрані вона лише більша — maxScale), 5 × 2 + рамка; через десяток — дві рамки одна під одною. */
export const CELL = 64;
/** Над рамкою — рівняння («n + ? = 10» у режимі цифр, «8 + 5 = ?» через десяток): там це єдина підказка про число, а Kubik на телефоні схований. */
export const EQUATION_H = 64;
export const FRAME_H = 2 * CELL + 6;
export const DESIGN = { w: 332, h: FRAME_H + 8 + EQUATION_H } as const;
/** Рамка з видимими відомими фішками: рівняння не потрібне — композиція нижча, тож масштаб (а з ним і комірки) більший. */
export const DESIGN_FRAME = { w: 332, h: FRAME_H + 8 } as const;
export const DESIGN_BRIDGE = { w: 332, h: 2 * FRAME_H + 8 + 8 + EQUATION_H } as const;
const MAX_SCALE = 1.7;

/** Скільки фішок можна докласти: коли відомі видно — решта до кінця рамки (10 чи 20 комірок); коли рамка порожня (лише цифра) — десять. */
export const capacity = (known: number, knownShown: boolean, cells: number = TEN): number => (knownShown ? cells - known : cells);

/** Сцена «Zrób dziesiątkę»: рамка-десятка (через десяток — дві). Дотик по порожній комірці докладає фішку (завжди в наступну вільну — лічимо по одній, голос називає скільки докладено),
 *  дотик по докладеній фішці знімає останню. Рамка повна — спалахує золотим. У режимі цифр (рамка порожня) відомі фішки з'являються як допомога. */
export function TenScene({ instance, world, area, reserved, assist, phase, celebrating, onRespond, onTouch }: SceneProps<TenInstance>) {
  const design = instance.bridge ? DESIGN_BRIDGE : instance.show === 'digit' ? DESIGN : DESIGN_FRAME;
  const place = useMemo(
    () => placeContent(area, reserved, design, { maxScale: MAX_SCALE, margin: 4 }),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, instance.bridge, instance.show, JSON.stringify(reserved)],
  );
  const { known } = instance;
  const need = missing(instance);
  const cellsTotal = frameCells(instance);
  const [added, setAdded] = useState(0);
  const [helped, setHelped] = useState(false);
  const interactive = phase === 'play' && assist.mode === 'none';

  // допомога Kubika: будь-яка підказка відкриває відомі фішки; показ «разом» докладає фішки по одній
  useEffect(() => {
    if (assist.mode === 'hint' || assist.mode === 'together') setHelped(true);
    if (assist.mode === 'together') setAdded(Math.min(assist.step, need));
  }, [assist.mode, assist.step, need]);

  const knownShown = instance.bridge || instance.show === 'frame' || helped || celebrating;
  const cap = capacity(known, knownShown, cellsTotal);
  // коли відомі фішки відкрилися, а докладено вже більше, ніж лишилось місця, — зайве зникає
  useEffect(() => {
    setAdded((a) => Math.min(a, cap));
  }, [cap]);

  // через десяток голос лічить «від числа» (osiem… dziewięć, dziesięć, jedenaście…), інакше — скільки докладено
  const spoken = (n: number) => (instance.bridge ? known + n : n);
  const speakCount = (n: number) => {
    if (n > 0) void tts.speak(numberWords(spoken(n)), { interrupt: true });
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
  const view = frameView(known, added, { knownShown, hintStep, togetherStep, cells: cellsTotal, hintLimit: hintCount(instance) });
  const first = knownShown ? known : 0;
  const pulsing = assist.mode === 'hint' && (assist.level ?? 1) <= 1;
  const showEquation = instance.show === 'digit' || instance.bridge;
  const h = instance.bridge ? 28 : 36;

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div
        className={styles.stage}
        style={{ left: place.x, top: place.y, width: design.w, height: design.h, transform: `scale(${place.scale})` }}
      >
        {showEquation && (
        <div className={styles.equation} style={{ height: EQUATION_H }} role="img" aria-label={LABELS.equation} data-visible={showEquation}>
          {instance.bridge ? (
            <>
              <Digits value={known} style={{ height: 44 }} />
              <Operator kind="plus" style={{ height: h + 8 }} />
              <Digits value={instance.add} style={{ height: 44 }} />
              <Operator kind="equals" style={{ height: h + 8 }} />
              <b>?</b>
            </>
          ) : (
            <>
              <Digits value={known} style={{ height: 44 }} />
              <Operator kind="plus" style={{ height: h }} />
              <b>?</b>
              <Operator kind="equals" style={{ height: h }} />
              <Digits value={TEN} style={{ height: 44 }} />
            </>
          )}
        </div>
        )}
        <TenFrame
          cells={cellsTotal}
          state={view.cells}
          world={world}
          cell={CELL}
          marks={view.marks}
          gold={celebrating}
          pulse={(i) => pulsing && i < TEN}
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
