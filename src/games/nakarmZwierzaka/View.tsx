import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CountableObject } from '../../components/math/CountableObject';
import { DropZone, type DropZoneState } from '../../components/math/DropZone';
import { ObjectArt } from '../../components/math/ObjectArt';
import { animalUrl } from '../../components/math/art';
import { Digits } from '../../components/ui/Digits';
import { Dots } from '../../components/ui/Dots';
import { SpeechBubble } from '../../components/ui/SpeechBubble';
import { LABELS } from '../../speech/lines';
import { ANIMALS, OBJECTS } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { createRng, hashSeed } from '../engine/rng';
import type { SceneKind, SceneProps } from '../engine/types';
import { useDragTap } from '../engine/useDragTap';
import type { FeedInstance } from './generate';
import { feedLayout } from './layout';
import styles from './View.module.css';

/** Розміри тарілки в лотку за виглядом (design etap2/00–05): ПК — 360×108, портрет — 312×96, телефон в альбомі — вертикальна коробка 88×220. */
export function plateBox(kind: SceneKind): { width: number; height: number; shape: 'plate' | 'box'; item: number; cols: number } {
  if (kind === 'phone') return { width: 88, height: 220, shape: 'box', item: 36, cols: 2 };
  if (kind === 'portrait') return { width: 312, height: 96, shape: 'plate', item: 40, cols: 5 };
  return { width: 360, height: 108, shape: 'plate', item: 50, cols: 5 };
}

/** Предмети на тарілці зменшуються, коли їх багато (понад 6 — на 20 %). */
export function plateItemSize(base: number, count: number): number {
  return count > 6 ? Math.round(base * 0.8) : base;
}

/** Сцена «Nakarm zwierzaka»: тваринка з бульбашкою-числом, запас їжі; тарілка — в лотку (портал). Їжу перетягують на тарілку або торкаються її, потім тарілки
 *  (BRIEF §7: перетягування завжди з заміною двома дотиками); дотик до тарілки без вибраного предмета знімає останній. Кожне додавання озвучує число. */
export function FeedScene({ instance, world, kind, area, reserved, assist, phase, celebrating, tray, onRespond, onTouch }: SceneProps<FeedInstance>) {
  const noun = OBJECTS[instance.food];
  const layout = useMemo(
    () => feedLayout(area, instance.supply, reserved, createRng(hashSeed('feed', instance.seed))),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instance.supply, instance.seed, area.w, area.h, JSON.stringify(reserved)],
  );
  const [plate, setPlate] = useState<number[]>([]); // індекси предметів запасу на тарілці — за порядком кладання
  const [slotsOn, setSlotsOn] = useState(instance.slots);
  const interactive = phase === 'play';

  const speakCount = (n: number) => {
    if (n > 0) void tts.speak(numberWords(n), { interrupt: true });
  };
  const add = useCallback(
    (index: number) => {
      if (!interactive) return;
      setPlate((prev) => {
        if (prev.includes(index)) return prev;
        sfx.play('pop');
        speakCount(prev.length + 1);
        return [...prev, index];
      });
    },
    [interactive],
  );
  const removeLast = () => {
    if (!interactive) return;
    onTouch?.();
    setPlate((prev) => {
      if (prev.length === 0) return prev;
      sfx.play('tap');
      speakCount(prev.length - 1);
      return prev.slice(0, -1);
    });
  };

  const drag = useDragTap<string>({ onDrop: (id) => add(Number(id.slice(1))), disabled: !interactive });
  const zone = drag.zoneProps('plate');

  // що зібрано — число для «Gotowe»; нічого — null
  useEffect(() => {
    onRespond?.(plate.length > 0 ? plate.length : null);
  }, [plate.length, onRespond]);

  // допомога Kubika: показ «разом» кладе предмети по одному, 2-га підказка вмикає слоти
  useEffect(() => {
    if (assist.mode === 'together' && assist.step >= 1) {
      setPlate(Array.from({ length: Math.min(assist.step, instance.n) }, (_, i) => i));
    }
    if (assist.mode === 'hint' && (assist.level ?? 1) >= 2) setSlotsOn(true);
  }, [assist.mode, assist.step, assist.level, instance.n]);

  const box = plateBox(kind);
  const itemSize = plateItemSize(box.item, plate.length);
  const zoneState: DropZoneState = celebrating ? 'correct' : drag.overZone === 'plate' || drag.selectedId !== null ? 'target' : plate.length > 0 ? 'filled' : 'empty';
  const highlighted = assist.mode === 'hint' && (assist.level ?? 1) === 1 ? assist.step - 1 : -1;
  const onPlate = new Set(plate);

  const plateItems = slotsOn ? (
    <span className={styles.slots} style={{ gridTemplateColumns: `repeat(${box.cols}, ${itemSize + 4}px)` }}>
      {Array.from({ length: 10 }, (_, slot) => (
        <span key={slot} className={styles.slot} data-filled={plate[slot] !== undefined} style={{ width: itemSize + 4, height: itemSize + 4 }}>
          {plate[slot] !== undefined && <ObjectArt object={instance.food} size={itemSize} className={styles.plated} />}
        </span>
      ))}
    </span>
  ) : (
    plate.map((_, i) => (
      <span key={i} className={styles.platedItem} data-hl={i === highlighted} data-celebrate={celebrating}>
        <ObjectArt object={instance.food} size={itemSize} />
      </span>
    ))
  );

  const plateNode = (
    <DropZone
      label={LABELS.plate}
      shape={box.shape}
      state={zoneState}
      zoneRef={zone.ref}
      className={styles.plate}
      style={{ width: box.width, height: box.height }}
      onPress={() => (drag.selectedId !== null ? zone.onClick() : removeLast())}
    >
      {plateItems}
    </DropZone>
  );

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <img
        className={styles.animal} src={animalUrl(instance.animal, celebrating)} alt={ANIMALS[instance.animal].one} draggable={false}
        style={{ left: layout.animal.x, top: layout.animal.y, width: layout.animal.w, height: layout.animal.h }}
      />
      <div className={styles.bubble} style={{ left: layout.bubble.x, top: layout.bubble.y, width: layout.bubble.w }}>
        <SpeechBubble tail="left" label={numberWords(instance.n)}>
          <span className={styles.want}>
            <Digits value={instance.n} style={{ height: world === 'w1' ? 44 : 56 }} />
            {world === 'w1' && <Dots count={instance.n} perRow={5} unit="1.1px" />}
          </span>
        </SpeechBubble>
      </div>

      {layout.supply.map((p, i) =>
        onPlate.has(i) ? null : (
          <CountableObject
            key={i}
            object={instance.food}
            size={layout.size}
            x={p.x}
            y={p.y}
            state={drag.draggingId === `s${i}` ? 'dragging' : drag.selectedId === `s${i}` ? 'selected' : 'idle'}
            label={noun.one}
            disabled={!interactive}
            offset={drag.draggingId === `s${i}` ? drag.offset : null}
            bind={(() => {
              const bind = drag.itemProps(`s${i}`);
              return { ...bind, onPointerDown: (e) => { onTouch?.(); bind.onPointerDown(e); } };
            })()}
          />
        ),
      )}
      {tray && createPortal(plateNode, tray)}
    </div>
  );
}
