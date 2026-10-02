import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { DropZone } from '../../components/math/DropZone';
import { ObjectArt } from '../../components/math/ObjectArt';
import { animalUrl } from '../../components/math/art';
import { Digits } from '../../components/ui/Digits';
import { SpeechBubble } from '../../components/ui/SpeechBubble';
import { LABELS } from '../../speech/lines';
import { ANIMALS, OBJECTS, type ObjectId } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import type { SceneKind, SceneProps } from '../engine/types';
import { boxCounts } from './assistBoxes';
import { EMPTY_PLATE, MAX_TENS_ON_PLATE, addOne, addTen, plateTotal, removeOne, type BoxPlate } from './boxPlate';
import type { FeedInstance } from './generate';
import { boxSourcesLayout } from './layout';
import styles from './BoxView.module.css';
import viewStyles from './View.module.css';

/** Лоток із тарілкою (режим boxes — прямокутна таця): розміри за виглядом; фішка коробки й предмет поштучно (design etap2/00–05 + власний розклад для W5). */
export function trayBox(kind: SceneKind): { width: number; height: number; box: number; single: number } {
  if (kind === 'phone') return { width: 88, height: 220, box: 30, single: 20 };
  if (kind === 'portrait') return { width: 312, height: 96, box: 36, single: 26 };
  return { width: 360, height: 108, box: 42, single: 28 };
}

/** Коробка на десять: рамка кольору десятків, усередині 5 × 2 предметів (як у «Paczki po dziesięć»). */
function TenBox({ object, size, style }: { object: ObjectId; size: number; style?: CSSProperties }) {
  const item = Math.max(6, Math.floor((size - 22) / 5));
  return (
    <span className={styles.tenBox} style={{ width: size, height: size, ...style }}>
      <span className={styles.boxItems} style={{ gridTemplateColumns: `repeat(5, ${item}px)` }}>
        {Array.from({ length: 10 }, (_, i) => (
          <ObjectArt key={i} object={object} size={item} />
        ))}
      </span>
    </span>
  );
}

/** Сцена «Nakarm zwierzaka» W5: тваринка просить, скажімо, 34. Праворуч (чи під тваринкою) — стос коробок по 10 і купка їжі: дотик до стосу кладе на тарілку
 *  коробку («dziesięć, dwadzieścia…»), до купки — один предмет («…trzydzieści jeden»); десятий предмет із дев'ятьма іншими стає коробкою. Дотик до тарілки
 *  знімає предмет (а коли їх нема — коробку). Обидва джерела — великі кнопки (BRIEF §12), тож перетягувати нічого не треба. Відповідь для «Gotowe» — число на тарілці. */
export function BoxFeedScene({ instance, kind, area, reserved, assist, phase, celebrating, tray, onRespond, onTouch }: SceneProps<FeedInstance>) {
  const noun = OBJECTS[instance.food];
  const layout = useMemo(
    () => boxSourcesLayout(area, reserved),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, JSON.stringify(reserved)],
  );
  const [plate, setPlate] = useState<BoxPlate>(EMPTY_PLATE);
  const [showNeed, setShowNeed] = useState(false); // 2-га підказка: потрібне джерело світиться до кінця завдання
  const interactive = phase === 'play' && assist.mode === 'none';
  const tens = Math.floor(instance.n / 10);
  const ones = instance.n % 10;
  const total = plateTotal(plate);

  useEffect(() => {
    onRespond?.(total > 0 ? total : null);
  }, [total, onRespond]);

  // допомога Kubika: показ «разом» кладе коробки, потім предмети; 2-га підказка підсвічує, з якого джерела ще брати
  useEffect(() => {
    if (assist.mode === 'together' && assist.step >= 1) {
      const c = boxCounts(assist.step, tens, ones);
      setPlate({ tens: c.boxes, ones: c.ones });
    }
    if (assist.mode === 'hint' && (assist.level ?? 1) >= 2) setShowNeed(true);
  }, [assist.mode, assist.step, assist.level, tens, ones]);

  const change = (next: BoxPlate, sound: 'pop' | 'tap', merged = false) => {
    onTouch?.();
    sfx.play(sound);
    if (merged) sfx.play('whoosh');
    if (plateTotal(next) > 0) void tts.speak(numberWords(plateTotal(next)), { interrupt: true });
    setPlate(next);
  };
  const tapTens = () => {
    const next = interactive ? addTen(plate) : null;
    if (next) change(next, 'pop');
  };
  const tapOnes = () => {
    const next = interactive ? addOne(plate) : null;
    if (next) change(next.plate, 'pop', next.merged);
  };
  const tapPlate = () => {
    const next = interactive ? removeOne(plate) : null;
    if (next) change(next, 'tap');
  };

  const t = trayBox(kind);
  // 1-ша підказка лічить тарілку: спершу фішки-десятки, потім предмети (step 1…tens, далі tens + 1…)
  const stepHl = assist.mode === 'hint' && (assist.level ?? 1) === 1 ? assist.step - 1 : -1;
  const needTens = showNeed && plate.tens < tens;
  const needOnes = showNeed && plate.ones < ones;

  const plateNode = (
    <DropZone
      label={LABELS.plate}
      shape="box"
      state={celebrating ? 'correct' : total > 0 ? 'filled' : 'empty'}
      className={viewStyles.plate}
      style={{ width: t.width, height: t.height }}
      onPress={tapPlate}
    >
      <span className={styles.plateItems} style={{ gap: kind === 'phone' ? 2 : 4, margin: kind === 'phone' ? '0 -8px' : undefined }}>
        {Array.from({ length: plate.tens }, (_, i) => (
          <span key={`t${i}`} className={styles.chip} data-hl={i === stepHl} data-celebrate={celebrating} style={{ width: t.box, height: t.box }}>
            <Digits value={10} style={{ height: Math.round(t.box * 0.42) }} />
          </span>
        ))}
        {Array.from({ length: plate.ones }, (_, i) => (
          <span key={`o${i}`} className={viewStyles.platedItem} data-hl={plate.tens + i === stepHl} data-celebrate={celebrating}>
            <ObjectArt object={instance.food} size={t.single} />
          </span>
        ))}
      </span>
    </DropZone>
  );

  const s = layout.tens.w;
  const box = Math.round(s * 0.72);
  return (
    <div className={viewStyles.scene} style={{ width: area.w, height: area.h }}>
      <img
        className={viewStyles.animal} src={animalUrl(instance.animal, celebrating)} alt={ANIMALS[instance.animal].one} draggable={false}
        style={{ left: layout.animal.x, top: layout.animal.y, width: layout.animal.w, height: layout.animal.h }}
      />
      <div className={viewStyles.bubble} style={{ left: layout.bubble.x, top: layout.bubble.y, width: layout.bubble.w }}>
        <SpeechBubble tail="left" label={numberWords(instance.n)}>
          <span className={viewStyles.want}>
            <Digits value={instance.n} style={{ height: 56 }} />
          </span>
        </SpeechBubble>
      </div>

      {/* стос коробок по 10: дотик = +10 */}
      <button
        type="button"
        className={styles.source}
        data-place="tens"
        data-hl={needTens}
        aria-label={LABELS.box}
        disabled={!interactive || plate.tens >= MAX_TENS_ON_PLATE}
        style={{ left: layout.tens.x, top: layout.tens.y, width: s, height: s }}
        onClick={tapTens}
      >
        {[0, 1, 2].map((k) => (
          <TenBox key={k} object={instance.food} size={box} style={{ left: Math.round(k * (s - box) / 2), top: Math.round(k * (s - box) / 2) }} />
        ))}
      </button>

      {/* купка їжі: дотик = +1 */}
      <button
        type="button"
        className={styles.source}
        data-place="ones"
        data-hl={needOnes}
        aria-label={noun.one}
        disabled={!interactive}
        style={{ left: layout.ones.x, top: layout.ones.y, width: s, height: s }}
        onClick={tapOnes}
      >
        <span className={styles.pile}>
          <ObjectArt object={instance.food} size={Math.round(s * 0.36)} className={styles.pileBack} />
          <ObjectArt object={instance.food} size={Math.round(s * 0.36)} className={styles.pileBack} />
          <ObjectArt object={instance.food} size={Math.round(s * 0.5)} className={styles.pileFront} />
        </span>
      </button>
      {tray && createPortal(plateNode, tray)}
    </div>
  );
}
