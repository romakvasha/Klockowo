import { useEffect, useMemo, useState } from 'react';
import { Basket, type BasketItem } from '../../components/math/Basket';
import { Digits } from '../../components/ui/Digits';
import { IconButton } from '../../components/ui/IconButton';
import { Operator } from '../../components/ui/Operator';
import { BUTTONS, LABELS } from '../../speech/lines';
import { sfx } from '../../speech/sfx';
import { placeContent } from '../engine/placeContent';
import type { SceneProps } from '../engine/types';
import { basketMarks, mergedItems } from './assist';
import { sumAnswer, type SumInstance } from './generate';
import styles from './View.module.css';

/** Композиція «Ile razem?» у дизайнових px: рівняння згори, під ним два кошики з проміжком під кнопку «Wsyp!» (спільний кошик — по центру). */
export const DESIGN = { w: 600, h: 344 } as const;
export const EQUATION_H = 84;
export const BASKETS_Y = 104;
export const BASKET = { w: 230, h: 230 } as const;
export const MERGED = { w: 320, h: 230 } as const;
/** Кнопка «Wsyp!»: 80 px завжди (BRIEF §12 — не менше 64, на телефоні 80); не масштабується разом із композицією. */
export const POUR_SIZE = 80;

/** Де в координатах сцени центр кнопки «Wsyp!»: посередині проміжку між кошиками. */
export function pourButtonCenter(place: { x: number; y: number; scale: number }): { x: number; y: number } {
  return { x: Math.round(place.x + (DESIGN.w / 2) * place.scale), y: Math.round(place.y + (BASKETS_Y + BASKET.h / 2) * place.scale) };
}

const objects = (n: number): BasketItem[] => Array.from({ length: n }, () => ({ kind: 'object' }));

/** Сцена «Ile razem?»: «3 + 2 = ?» і два кошики. «Wsyp!» нахиляє другий кошик і зсипає предмети в спільний (з'являються по черзі); відповідь дитина вибирає плиткою.
 *  Кришка на першому кошику ховає його предмети — лічити треба від числа на кришці. Режим «символи»: кошики з'являються лише як допомога. Допомога Kubika
 *  сама зсипає кошики, нумерує предмети й (2-га підказка) відкриває кришку. */
export function SumScene({ instance, world, area, reserved, assist, celebrating, onTouch }: SceneProps<SumInstance>) {
  const place = useMemo(
    () => placeContent(area, reserved, DESIGN),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, JSON.stringify(reserved)],
  );
  const { a, b } = instance;
  const [poured, setPoured] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [helped, setHelped] = useState(false);
  const helping = assist.mode === 'hint' || assist.mode === 'together';
  // допомога лишає кошики зсипаними (а після 2-ї підказки — відкритими) до кінця завдання
  useEffect(() => {
    if (!helping) return;
    setHelped(true);
    setPoured(true);
    if (assist.mode === 'together' || (assist.level ?? 1) >= 2) setLidOpen(true);
  }, [helping, assist.mode, assist.level]);

  const showBaskets = !instance.symbols || helped;
  const isPoured = poured || celebrating;
  const lidded = instance.lid && !lidOpen;
  const sum = sumAnswer(instance);
  const merged = mergedItems(a, b, lidded);
  const marks = basketMarks(a, b, lidded, helping ? assist.step : 0);
  const firstFresh = lidded ? 1 : a;
  const showPourButton = showBaskets && !isPoured && assist.mode === 'none';
  const button = pourButtonCenter(place);

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div className={styles.stage} style={{ left: place.x, top: place.y, width: DESIGN.w, height: DESIGN.h, transform: `scale(${place.scale})` }}>
        <div className={styles.equation} style={{ top: showBaskets ? 0 : (DESIGN.h - EQUATION_H) / 2 - 24, height: EQUATION_H }} role="img" aria-label={LABELS.equation}>
          <Digits value={a} style={{ height: 64 }} />
          <Operator kind="plus" style={{ height: 52 }} />
          <Digits value={b} style={{ height: 64 }} />
          <Operator kind="equals" style={{ height: 52 }} />
          {celebrating ? <Digits value={sum} className={styles.sum} style={{ height: 64 }} /> : <b className={styles.unknown}>?</b>}
        </div>
        {showBaskets && !isPoured && (
          <>
            <div className={styles.basket} style={{ left: 0, top: BASKETS_Y }}>
              <Basket
                items={objects(a)} object={instance.object} world={world} width={BASKET.w} height={BASKET.h}
                lid={instance.lid ? a : null} label={instance.lid ? LABELS.basketLid : LABELS.basket}
              />
            </div>
            <div className={styles.basket} style={{ left: DESIGN.w - BASKET.w, top: BASKETS_Y }}>
              <Basket items={objects(b)} object={instance.object} world={world} width={BASKET.w} height={BASKET.h} label={LABELS.basket} />
            </div>
          </>
        )}
        {showBaskets && isPoured && (
          <>
            <div className={styles.basket} style={{ left: (DESIGN.w - MERGED.w) / 2, top: BASKETS_Y }} data-merged>
              <Basket
                items={merged} object={instance.object} world={world} width={MERGED.w} height={MERGED.h}
                marks={marks} freshFrom={firstFresh} celebrate={celebrating} label={LABELS.basketMerged}
              />
            </div>
            {/* порожній кошик, що нахиляється до спільного, — лише прикраса */}
            <div className={styles.ghost} style={{ left: DESIGN.w - BASKET.w, top: BASKETS_Y }} aria-hidden="true">
              <Basket items={[]} object={instance.object} world={world} width={BASKET.w} height={BASKET.h} label={LABELS.basket} />
            </div>
          </>
        )}
      </div>
      {showPourButton && (
        <IconButton
          icon="pour"
          label={BUTTONS.pour}
          variant="primary"
          size={POUR_SIZE}
          pulse
          silent
          className={styles.pour}
          style={{ left: button.x - POUR_SIZE / 2, top: button.y - POUR_SIZE / 2 }}
          onClick={() => {
            onTouch?.();
            sfx.play('whoosh');
            setPoured(true);
          }}
        />
      )}
    </div>
  );
}
