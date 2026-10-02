import { useEffect, useMemo, useState } from 'react';
import { NumberHouse, HOUSE_H, HOUSE_W, type HouseWindow } from '../../components/math/NumberHouse';
import { ObjectArt } from '../../components/math/ObjectArt';
import { TenFrame, type FrameCell } from '../../components/math/TenFrame';
import { fitGrid, gridCell } from '../../components/math/fitGrid';
import { Digits } from '../../components/ui/Digits';
import { LABELS } from '../../speech/lines';
import { placeContent } from '../engine/placeContent';
import type { SceneProps } from '../engine/types';
import { frameMarks } from './assist';
import { houseAnswer, type HouseInstance } from './generate';
import styles from './View.module.css';

/** Двір під будиночком (дизайнові px): предмети цілого або рамка-десятка. Разом із будиночком — композиція 440 × 432. */
export const YARD_GAP = 12;
export const YARD_H = 120;
export const DESIGN = { w: HOUSE_W, h: HOUSE_H + YARD_GAP + YARD_H } as const;
const OBJECT_MAX = 56;

/** Сторона комірки рамки: одна рамка (до 10) — 52, дві (до 20) — 24, щоб обидві влізли у двір. */
export const frameCell = (whole: number): number => (whole > 10 ? 24 : 52);

/** Стани комірок рамки: `known` фішок лежить, решта до `whole` — тьмяні («бракує»); коли відповідь дано — усе суцільне. */
export function frameState(whole: number, known: number, filled: boolean): FrameCell[] {
  const cells = whole > 10 ? 20 : 10;
  return Array.from({ length: cells }, (_, i) => (i < known ? 'solid' : i < whole ? (filled ? 'solid' : 'dim') : 'empty'));
}

/** Сцена «Domek liczb»: будиночок із цілим на даху й двома віконцями. Під ним — предмети цілого (рівень `pictures` або 1-ша підказка; відомі — в золотих кільцях,
 *  Kubik лічить їх) чи рамка-десятка з тьмяними фішками (2-га підказка, показ «разом»). Правильна відповідь з'являється у порожньому віконці. */
export function HouseScene({ instance, world, area, reserved, assist, celebrating }: SceneProps<HouseInstance>) {
  const place = useMemo(
    () => placeContent(area, reserved, DESIGN),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, JSON.stringify(reserved)],
  );
  const [yardPinned, setYardPinned] = useState(false);
  const [framePinned, setFramePinned] = useState(false);
  // підказки залишають свою допомогу видимою до кінця завдання
  useEffect(() => {
    if (assist.mode === 'hint' && (assist.level ?? 1) <= 1) setYardPinned(true);
    if ((assist.mode === 'hint' && (assist.level ?? 1) >= 2) || assist.mode === 'together') setFramePinned(true);
  }, [assist.mode, assist.level]);

  const { whole, known } = instance;
  const answer = houseAnswer(instance);
  const showFrame = framePinned;
  const showYard = !showFrame && (instance.show === 'pictures' || yardPinned);
  const counting = assist.mode === 'hint' && (assist.level ?? 1) <= 1 ? assist.step : 0;
  const together = assist.mode === 'together';
  const revealed = celebrating || (together && assist.step >= answer);

  const empty: HouseWindow = revealed ? { kind: 'answer', value: answer } : { kind: 'empty' };
  const part: HouseWindow = { kind: 'number', value: known };
  const [left, right] = instance.missing === 'left' ? [empty, part] : [part, empty];

  const fit = useMemo(() => fitGrid(whole, DESIGN.w, YARD_H, 8, OBJECT_MAX), [whole]);

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div className={styles.stage} style={{ left: place.x, top: place.y, width: DESIGN.w, height: DESIGN.h, transform: `scale(${place.scale})` }}>
        <NumberHouse whole={whole} left={left} right={right} world={world} celebrate={celebrating} />
        <div className={styles.yard} style={{ top: HOUSE_H + YARD_GAP, width: DESIGN.w, height: YARD_H }}>
          {showYard && (
            <div className={styles.objects} role="img" aria-label={LABELS.yard}>
              {Array.from({ length: whole }, (_, i) => {
                const p = gridCell(fit, i, whole, DESIGN.w, YARD_H);
                const mark = i < known && i < counting ? i + 1 : null;
                return (
                  <span
                    key={i}
                    className={styles.item}
                    data-known={assist.mode === 'hint' || yardPinned ? i < known : false}
                    data-celebrate={celebrating}
                    style={{ left: p.x, top: p.y, width: fit.size, height: fit.size }}
                  >
                    <ObjectArt object={instance.object} size={Math.round(fit.size * 0.86)} />
                    {mark !== null && (
                      <span className={styles.badge} style={{ width: Math.round(fit.size * 0.62), height: Math.round(fit.size * 0.62) }}>
                        <Digits value={mark} style={{ height: Math.round(fit.size * (mark >= 10 ? 0.28 : 0.36)) }} />
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
          {showFrame && (
            <div className={styles.frame}>
              <TenFrame
                cells={whole > 10 ? 20 : 10}
                state={frameState(whole, known, celebrating)}
                world={world}
                cell={frameCell(whole)}
                marks={together ? frameMarks(known, answer, assist.step, whole > 10 ? 20 : 10) : undefined}
                gold={celebrating && whole % 10 === 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
