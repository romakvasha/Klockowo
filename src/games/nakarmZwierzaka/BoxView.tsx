import { useCallback, useEffect, useMemo, useState, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { CountableObject } from '../../components/math/CountableObject';
import { DropZone, type DropZoneState } from '../../components/math/DropZone';
import { ObjectArt } from '../../components/math/ObjectArt';
import { animalUrl } from '../../components/math/art';
import { Digits } from '../../components/ui/Digits';
import { SpeechBubble } from '../../components/ui/SpeechBubble';
import { cx } from '../../components/ui/cx';
import { LABELS } from '../../speech/lines';
import { ANIMALS, OBJECTS, type ObjectId } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { createRng, hashSeed } from '../engine/rng';
import type { SceneKind, SceneProps } from '../engine/types';
import { useDragTap } from '../engine/useDragTap';
import { boxCounts } from './assistBoxes';
import type { FeedInstance } from './generate';
import { feedLayout } from './layout';
import styles from './BoxView.module.css';
import viewStyles from './View.module.css';

/** Лоток із тарілкою (режим boxes — прямокутна таця): розміри за виглядом; фішка коробки й предмет поштучно (design etap2/00–05 + власний розклад для W5). */
export function trayBox(kind: SceneKind): { width: number; height: number; box: number; single: number } {
  if (kind === 'phone') return { width: 88, height: 220, box: 30, single: 20 };
  if (kind === 'portrait') return { width: 312, height: 96, box: 36, single: 26 };
  return { width: 360, height: 108, box: 42, single: 28 };
}

type Entry = { kind: 'box' | 'one'; index: number };

/** Коробка на десять: рамка кольору десятків, усередині 5 × 2 предметів (як у «Paczki po dziesięć»). Кнопка, що тягнеться чи вибирається, як предмет запасу. */
function SupplyBox({
  object, size, x, y, state, label, disabled, bind, offset,
}: {
  object: ObjectId; size: number; x: number; y: number; state: 'idle' | 'selected' | 'dragging' | 'highlighted'; label: string; disabled: boolean;
  bind: ButtonHTMLAttributes<HTMLButtonElement>; offset: { x: number; y: number } | null;
}) {
  const item = Math.max(8, Math.floor((size - 20) / 5));
  return (
    <button
      type="button"
      aria-label={label}
      {...bind}
      className={styles.box}
      data-state={state}
      disabled={disabled}
      style={{
        ...bind.style,
        left: x,
        top: y,
        width: size,
        height: size,
        ...(offset ? { transform: `translate(${offset.x}px, ${offset.y}px)`, zIndex: 5, transition: 'none' } : {}),
      } as CSSProperties}
    >
      <span className={styles.boxItems} style={{ gridTemplateColumns: `repeat(5, ${item}px)` }}>
        {Array.from({ length: 10 }, (_, i) => (
          <ObjectArt key={i} object={object} size={item} />
        ))}
      </span>
    </button>
  );
}

/** Сцена «Nakarm zwierzaka» W5: тваринка просить, скажімо, 34 — у запасі коробки по 10 і предмети поштучно. Дотик по коробці кладе на тарілку «десять», по предмету — «один»;
 *  кожне додавання озвучує число на тарілці («dziesięć, dwadzieścia, dwadzieścia jeden…»). Дотик по тарілці (без вибраного предмета) знімає останнє покладене.
 *  Перетягування завжди з заміною двома дотиками (BRIEF §7). Відповідь для «Gotowe» — число на тарілці. */
export function BoxFeedScene({ instance, kind, area, reserved, assist, phase, celebrating, tray, onRespond, onTouch }: SceneProps<FeedInstance>) {
  const noun = OBJECTS[instance.food];
  const layout = useMemo(
    () => feedLayout(area, instance.supply, reserved, createRng(hashSeed('feed-boxes', instance.seed)), instance.supplyBoxes),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instance.supply, instance.supplyBoxes, instance.seed, area.w, area.h, JSON.stringify(reserved)],
  );
  const [plate, setPlate] = useState<Entry[]>([]); // що лежить на тарілці — за порядком кладання
  const [showNeed, setShowNeed] = useState(false); // 2-га підказка: потрібне в запасі світиться до кінця завдання
  const interactive = phase === 'play';
  const tens = Math.floor(instance.n / 10);
  const ones = instance.n % 10;

  const total = (entries: readonly Entry[]) => entries.reduce((sum, e) => sum + (e.kind === 'box' ? 10 : 1), 0);
  const speakTotal = (n: number) => {
    if (n > 0) void tts.speak(numberWords(n), { interrupt: true });
  };

  const add = useCallback(
    (entry: Entry) => {
      if (!interactive) return;
      setPlate((prev) => {
        if (prev.some((e) => e.kind === entry.kind && e.index === entry.index)) return prev;
        sfx.play('pop');
        speakTotal(total(prev) + (entry.kind === 'box' ? 10 : 1));
        return [...prev, entry];
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
      const next = prev.slice(0, -1);
      speakTotal(total(next));
      return next;
    });
  };

  const drag = useDragTap<string>({
    onDrop: (id) => add({ kind: id.startsWith('b') ? 'box' : 'one', index: Number(id.slice(1)) }),
    disabled: !interactive,
  });
  const zone = drag.zoneProps('plate');

  const sum = total(plate);
  useEffect(() => {
    onRespond?.(plate.length > 0 ? sum : null);
  }, [plate.length, sum, onRespond]);

  // допомога Kubika: показ «разом» кладе коробки, потім предмети; 2-га підказка підсвічує потрібне в запасі
  useEffect(() => {
    if (assist.mode === 'together' && assist.step >= 1) {
      const c = boxCounts(assist.step, tens, ones);
      setPlate([
        ...Array.from({ length: c.boxes }, (_, index): Entry => ({ kind: 'box', index })),
        ...Array.from({ length: c.ones }, (_, index): Entry => ({ kind: 'one', index })),
      ]);
    }
    if (assist.mode === 'hint' && (assist.level ?? 1) >= 2) setShowNeed(true);
  }, [assist.mode, assist.step, assist.level, tens, ones]);

  const tray_ = trayBox(kind);
  const onPlate = (entry: Entry) => plate.some((e) => e.kind === entry.kind && e.index === entry.index);
  const boxesOnPlate = plate.filter((e) => e.kind === 'box').length;
  const onesOnPlate = plate.length - boxesOnPlate;
  const hintTargets = showNeed;
  // підказка 2: світяться перші потрібні коробки й предмети, яких ще нема на тарілці
  const needBoxes = new Set(hintTargets ? Array.from({ length: layout.boxes.length }, (_, i) => i).filter((i) => !onPlate({ kind: 'box', index: i })).slice(0, Math.max(0, tens - boxesOnPlate)) : []);
  const needOnes = new Set(hintTargets ? Array.from({ length: layout.supply.length }, (_, i) => i).filter((i) => !onPlate({ kind: 'one', index: i })).slice(0, Math.max(0, ones - onesOnPlate)) : []);
  const stepHl = assist.mode === 'hint' && (assist.level ?? 1) === 1 ? assist.step - 1 : -1;

  const zoneState: DropZoneState = celebrating ? 'correct' : drag.overZone === 'plate' || drag.selectedId !== null ? 'target' : plate.length > 0 ? 'filled' : 'empty';
  // на тарілці спершу фішки-десятки, потім предмети; підсвітка лічби йде в тому ж порядку
  const shown = [...plate.filter((e) => e.kind === 'box'), ...plate.filter((e) => e.kind === 'one')];
  const itemStyle = (size: number): CSSProperties => ({ width: size, height: size });

  const plateNode = (
    <DropZone
      label={LABELS.plate}
      shape="box"
      state={zoneState}
      zoneRef={zone.ref}
      className={viewStyles.plate}
      style={{ width: tray_.width, height: tray_.height }}
      onPress={() => (drag.selectedId !== null ? zone.onClick() : removeLast())}
    >
      <span className={styles.plateItems} style={{ gap: kind === 'phone' ? 2 : 4, margin: kind === 'phone' ? '0 -8px' : undefined }}>
        {shown.map((e, i) =>
          e.kind === 'box' ? (
            <span key={`b${e.index}`} className={cx(styles.chip)} data-hl={i === stepHl} data-celebrate={celebrating} style={itemStyle(tray_.box)}>
              <Digits value={10} style={{ height: Math.round(tray_.box * 0.42) }} />
            </span>
          ) : (
            <span key={`o${e.index}`} className={viewStyles.platedItem} data-hl={i === stepHl} data-celebrate={celebrating}>
              <ObjectArt object={instance.food} size={tray_.single} />
            </span>
          ),
        )}
      </span>
    </DropZone>
  );

  const bindFor = (id: string): ButtonHTMLAttributes<HTMLButtonElement> => {
    const bind = drag.itemProps(id);
    return { ...bind, onPointerDown: (e) => { onTouch?.(); bind.onPointerDown(e); } };
  };
  const stateOf = (id: string, highlighted: boolean) => (drag.draggingId === id ? 'dragging' : drag.selectedId === id ? 'selected' : highlighted ? 'highlighted' : 'idle');

  return (
    <div className={viewStyles.scene} style={{ width: area.w, height: area.h }}>
      <img
        className={viewStyles.animal} src={animalUrl(instance.animal, celebrating)} alt={ANIMALS[instance.animal].one} draggable={false}
        style={{ left: layout.animal.x, top: layout.animal.y, width: layout.animal.w, height: layout.animal.h }}
      />
      <div className={viewStyles.bubble} style={{ left: layout.bubble.x, top: layout.bubble.y, width: layout.bubble.w }}>
        <SpeechBubble tail="left" label={numberWords(instance.n)} className={layout.bubble.h < 104 ? styles.compactBubble : undefined}>
          <span className={viewStyles.want}>
            <Digits value={instance.n} style={{ height: Math.max(28, Math.min(56, layout.bubble.h - 30)) }} />
          </span>
        </SpeechBubble>
      </div>

      {layout.boxes.map((p, i) =>
        onPlate({ kind: 'box', index: i }) ? null : (
          <SupplyBox
            key={`b${i}`}
            object={instance.food}
            size={layout.boxSize}
            x={p.x}
            y={p.y}
            state={stateOf(`b${i}`, needBoxes.has(i))}
            label={LABELS.box}
            disabled={!interactive}
            offset={drag.draggingId === `b${i}` ? drag.offset : null}
            bind={bindFor(`b${i}`)}
          />
        ),
      )}
      {layout.supply.map((p, i) =>
        onPlate({ kind: 'one', index: i }) ? null : (
          <CountableObject
            key={`o${i}`}
            object={instance.food}
            size={layout.size}
            x={p.x}
            y={p.y}
            state={stateOf(`o${i}`, needOnes.has(i))}
            label={noun.one}
            disabled={!interactive}
            offset={drag.draggingId === `o${i}` ? drag.offset : null}
            bind={bindFor(`o${i}`)}
          />
        ),
      )}
      {tray && createPortal(plateNode, tray)}
    </div>
  );
}
