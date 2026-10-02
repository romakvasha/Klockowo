import { useEffect, useMemo, useState } from 'react';
import { ObjectArt } from '../../components/math/ObjectArt';
import { PlaceValueMat, placeValueMatSize } from '../../components/math/PlaceValueMat';
import { fitGrid, gridCell } from '../../components/math/fitGrid';
import { Digits } from '../../components/ui/Digits';
import { IconButton } from '../../components/ui/IconButton';
import { Operator } from '../../components/ui/Operator';
import { cssVars } from '../../components/ui/cx';
import { BUTTONS, LABELS } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { placeContent } from '../engine/placeContent';
import type { SceneProps } from '../engine/types';
import { boxesFor } from './assist';
import { digitsOf, type PackInstance } from './generate';
import styles from './View.module.css';

/** Розсипані предмети — ліворуч, коробки по 10 (3×3) чи мат розрядів — праворуч; кнопка «Zapakuj» — між ними (80 px у координатах сцени, не масштабується). */
export const PACK_DESIGN = { w: 660, h: 330 } as const;
export const LOOSE_ZONE = { w: 290, h: 300 } as const;
export const RIGHT_X = 330;
export const BOX = 100;
export const BOX_GAP = 10;
export const PACK_BUTTON = 80;
/** Мат у режимі «Zbuduj»: стовпчики й кубики того ж розміру, ліворуч; праворуч — дві кнопки «+10» і «+1» по 96 px. */
export const CELL = 17;
export const MAT_CELL = 20;
export const BUILD_BUTTON = 96;
/** Мат у режимі «Zbuduj»: на ПК клітинка 20, на вузьких екранах — 14 (мат вужчий, тож кнопки «+10» і «+1» лишаються ≥ 64 px після масштабування). */
export const MAT_CELL_NARROW = 14;
export function buildDesign(cell: number): { w: number; h: number } {
  const mat = placeValueMatSize(cell);
  return { w: mat.w + 24 + BUILD_BUTTON, h: mat.h };
}
export const BUILD_DESIGN = buildDesign(MAT_CELL);
const MAX_SCALE = 1.4;

/** Позиція i-ї коробки в сітці 3×3 правої зони (design-px). */
export const boxPosition = (i: number): { x: number; y: number } => ({ x: RIGHT_X + (i % 3) * (BOX + BOX_GAP), y: Math.floor(i / 3) * (BOX + BOX_GAP) });

/** Коробка на десять: рамка кольору десятків, усередині десять предметів 5 × 2. */
function PackBox({ object, hl, counted, label, onPress }: { object: PackInstance['object']; hl: boolean; counted: number | null; label: string; onPress?: () => void }) {
  const inner = (
    <>
      <span className={styles.boxItems}>
        {Array.from({ length: 10 }, (_, i) => (
          <ObjectArt key={i} object={object} size={15} />
        ))}
      </span>
      {counted !== null && (
        <span className={styles.boxCount}>
          <Digits value={counted} style={{ height: 22 }} />
        </span>
      )}
    </>
  );
  return onPress ? (
    <button type="button" className={styles.box} data-hl={hl} aria-label={label} onClick={onPress}>
      {inner}
    </button>
  ) : (
    <span className={styles.box} data-hl={hl} role="img" aria-label={label}>
      {inner}
    </span>
  );
}

/** Сцена «Paczki po dziesięć», режими loose/packed: розсипані предмети пакуються кнопкою «Zapakuj» по десять (з'являється коробка), коробки й одиниці можна лічити дотиками —
 *  «dziesięć, dwadzieścia…», далі «від десятків». Відповідь — плитка. Підказка 1 підсвічує коробки по черзі, підказка 2 і правильна відповідь показують мат із цифрами розрядів. */
function PackScene({ instance, area, reserved, assist, phase, celebrating, onTouch }: SceneProps<PackInstance>) {
  const { total, object } = instance;
  const { tens, ones } = digitsOf(total);
  const place = useMemo(
    () => placeContent(area, reserved, PACK_DESIGN, { maxScale: MAX_SCALE }),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, JSON.stringify(reserved)],
  );
  const [boxes, setBoxes] = useState(instance.mode === 'packed' ? tens : 0);
  const [countedBoxes, setCountedBoxes] = useState<number[]>([]);
  const [countedSingles, setCountedSingles] = useState(0);
  const [matShown, setMatShown] = useState(false);
  const interactive = phase === 'play' && assist.mode === 'none';

  // допомога пакує все, що можна; підказка 2 й «разом» показують мат
  useEffect(() => {
    if (assist.mode === 'hint' || assist.mode === 'together') setBoxes(boxesFor(total));
    if (assist.mode === 'hint' && (assist.level ?? 1) >= 2) setMatShown(true);
    if (assist.mode === 'together' && assist.step >= tens + ones) setMatShown(true);
  }, [assist.mode, assist.step, assist.level, total, tens, ones]);

  const loose = total - 10 * boxes;
  const showMat = matShown || celebrating;
  const fit = useMemo(() => fitGrid(loose, LOOSE_ZONE.w, LOOSE_ZONE.h, 8, 52), [loose]);

  const say = (n: number) => void tts.speak(numberWords(n), { interrupt: true });
  const pack = () => {
    if (!interactive || loose < 10) return;
    onTouch?.();
    sfx.play('whoosh');
    setBoxes(boxes + 1);
    setCountedBoxes([]);
    setCountedSingles(0);
  };
  const tapBox = (i: number) => {
    if (!interactive || countedBoxes.includes(i)) return;
    onTouch?.();
    sfx.play('pop');
    const next = countedBoxes.length + 1;
    say(next * 10);
    setCountedBoxes([...countedBoxes, i]);
  };
  const tapSingle = () => {
    if (!interactive) return;
    onTouch?.();
    sfx.play('pop');
    const next = countedSingles + 1;
    say(countedBoxes.length * 10 + next);
    setCountedSingles(next);
  };

  const hintBox = assist.mode === 'hint' && (assist.level ?? 1) <= 1 ? assist.step - 1 : assist.mode === 'together' && assist.step <= tens ? assist.step - 1 : -1;
  const hintSingle = assist.mode === 'together' && assist.step > tens ? assist.step - tens - 1 : -1;
  const button = {
    x: Math.round(place.x + (RIGHT_X - 20) * place.scale),
    y: Math.round(place.y + (PACK_DESIGN.h / 2) * place.scale),
  };

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div
        className={styles.stage}
        style={{ left: place.x, top: place.y, width: PACK_DESIGN.w, height: PACK_DESIGN.h, transform: `scale(${place.scale})`, ...cssVars({ '--pk-tens': 'var(--kl-tens)' }) }}
      >
        <div className={styles.loose} style={{ width: LOOSE_ZONE.w, height: LOOSE_ZONE.h }} role="group" aria-label={LABELS.looseItems}>
          {Array.from({ length: loose }, (_, i) => {
            const p = gridCell(fit, i, loose, LOOSE_ZONE.w, LOOSE_ZONE.h);
            const isSingleZone = loose < 10 || instance.mode === 'packed';
            const counted = isSingleZone && i < countedSingles;
            return (
              <button
                key={i}
                type="button"
                className={styles.single}
                data-counted={counted}
                data-hl={i === hintSingle}
                aria-label={LABELS.looseItem}
                style={{ left: p.x, top: p.y, width: fit.size, height: fit.size }}
                onClick={tapSingle}
              >
                <ObjectArt object={object} size={Math.round(fit.size * 0.88)} />
              </button>
            );
          })}
        </div>
        {!showMat &&
          Array.from({ length: boxes }, (_, i) => {
            const p = boxPosition(i);
            const order = countedBoxes.indexOf(i);
            return (
              <div key={i} className={styles.slot} style={{ left: p.x, top: p.y }}>
                <PackBox
                  object={object}
                  hl={i === hintBox}
                  counted={order >= 0 ? (order + 1) * 10 : null}
                  label={LABELS.box}
                  onPress={interactive ? () => tapBox(i) : undefined}
                />
              </div>
            );
          })}
        {showMat && (
          <div className={styles.matSlot} style={{ left: RIGHT_X, top: 0, width: PACK_DESIGN.w - RIGHT_X }}>
            <PlaceValueMat tens={tens} ones={ones} cell={CELL} celebrate={celebrating} />
          </div>
        )}
      </div>
      {instance.mode === 'loose' && loose >= 10 && interactive && !showMat && (
        <IconButton
          icon="pack"
          label={BUTTONS.pack}
          variant="primary"
          size={PACK_BUTTON}
          pulse
          silent
          className={styles.pack}
          style={{ left: button.x - PACK_BUTTON / 2, top: button.y - PACK_BUTTON / 2 }}
          onClick={pack}
        />
      )}
    </div>
  );
}

/** Сцена «Paczki po dziesięć», режим build: «Zbuduj liczbę czterdzieści siedem.» Мат «dziesiątki | jedności», праворуч — «+10» і «+1» (96 px). Десять кубиків-одиниць самі зчіплюються
 *  в стовпчик-десяток; дотик по блоку знімає його. Дитина бачить, скільки вже зібрано, цифрами розрядів; «Gotowe» перевіряє число. */
function BuildScene({ instance, kind, area, reserved, assist, phase, celebrating, onRespond, onTouch }: SceneProps<PackInstance>) {
  const target = digitsOf(instance.total);
  const cell = kind === 'wide' ? MAT_CELL : MAT_CELL_NARROW;
  const design = buildDesign(cell);
  const place = useMemo(
    () => placeContent(area, reserved, design, { maxScale: MAX_SCALE, margin: 4 }),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, cell, JSON.stringify(reserved)],
  );
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const interactive = phase === 'play' && assist.mode === 'none';
  const total = tens * 10 + ones;

  useEffect(() => {
    onRespond?.(total > 0 ? total : null);
  }, [total, onRespond]);

  // «разом»: Kubik ставить стовпчики по одному, далі кубики (step 1…tens, далі tens + 1…tens + ones)
  useEffect(() => {
    if (assist.mode !== 'together') return;
    setTens(Math.min(assist.step, target.tens));
    setOnes(Math.max(0, Math.min(assist.step - target.tens, target.ones)));
  }, [assist.mode, assist.step, target.tens, target.ones]);

  const say = (n: number) => void tts.speak(numberWords(n), { interrupt: true });
  const addTen = () => {
    if (!interactive || tens >= 9) return;
    onTouch?.();
    sfx.play('pop');
    say((tens + 1) * 10 + ones);
    setTens(tens + 1);
  };
  const addOne = () => {
    if (!interactive) return;
    if (ones >= 9 && tens >= 9) return;
    onTouch?.();
    sfx.play('pop');
    say(total + 1);
    if (ones >= 9) {
      // десять кубиків зчіплюються в стовпчик-десяток
      sfx.play('whoosh');
      setOnes(0);
      setTens(tens + 1);
    } else setOnes(ones + 1);
  };
  const removeRod = () => {
    if (!interactive || tens <= 0) return;
    onTouch?.();
    sfx.play('tap');
    setTens(tens - 1);
  };
  const removeCube = () => {
    if (!interactive || ones <= 0) return;
    onTouch?.();
    sfx.play('tap');
    setOnes(ones - 1);
  };

  const hintLevel = assist.mode === 'hint' ? assist.level ?? 1 : 0;
  const highlight = hintLevel === 1 ? 'tens' : hintLevel >= 2 ? 'ones' : null;

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div
        className={styles.stage}
        style={{ left: place.x, top: place.y, width: design.w, height: design.h, transform: `scale(${place.scale})` }}
      >
        <PlaceValueMat
          tens={tens}
          ones={ones}
          cell={cell}
          highlight={highlight}
          celebrate={celebrating}
          onRodPress={interactive ? removeRod : undefined}
          onCubePress={interactive ? removeCube : undefined}
        />
        <div className={styles.buttons} style={{ left: design.w - BUILD_BUTTON }}>
          <button type="button" className={`kl-block ${styles.add}`} data-place="tens" aria-label={LABELS.addTen} disabled={!interactive || tens >= 9} onClick={addTen}>
            <Operator kind="plus" style={{ height: 32 }} />
            <Digits value={10} style={{ height: 36 }} />
          </button>
          <button type="button" className={`kl-block ${styles.add}`} data-place="ones" aria-label={LABELS.addOne} disabled={!interactive} onClick={addOne}>
            <Operator kind="plus" style={{ height: 32 }} />
            <Digits value={1} style={{ height: 36 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Сцена за режимом завдання. */
export function PaczkiScene(props: SceneProps<PackInstance>) {
  return props.instance.mode === 'build' ? <BuildScene {...props} /> : <PackScene {...props} />;
}
