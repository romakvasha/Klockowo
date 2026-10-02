import { useEffect, useMemo, useState } from 'react';
import { JumpArc } from '../../components/math/JumpArc';
import { NumberLine } from '../../components/math/NumberLine';
import { animalUrl } from '../../components/math/art';
import { FROG_H, FROG_W, arcBetween, colOptions, frogAnchor, labelledPads, padLayout, type PadLayout } from '../../components/math/padLayout';
import { LABELS } from '../../speech/lines';
import { ANIMALS } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { placeContent, type Placed } from '../engine/placeContent';
import type { SceneProps } from '../engine/types';
import { assistJumped, frogPad } from './assist';
import { landing, type JumpInstance } from './generate';
import styles from './View.module.css';

/** Кнопка-жабка: 80 px у координатах сцени (не масштабується разом зі ставком). */
export const FROG_HIT = 80;
const MAX_SCALE = 1.5;

/** Розкладка листків (скільки в ряду) вибирається за областю: де масштаб більший, там і ставимо (широкий екран — 11 в ряд, вузький — коротші ряди). */
export function pickPond(max: number, area: { w: number; h: number }, reserved: SceneProps<JumpInstance>['reserved']): { layout: PadLayout; place: Placed } {
  let best: { layout: PadLayout; place: Placed } | null = null;
  for (const cols of colOptions(max)) {
    const layout = padLayout(max, cols);
    const place = placeContent(area, reserved, { w: layout.width, h: layout.height }, { maxScale: MAX_SCALE });
    if (best === null || place.scale > best.place.scale + 1e-9) best = { layout, place };
  }
  return best!;
}

/** Сцена «Skoki żabki»: листки латаття з номерами (або лише з віхами), жабка на стартовому. Дотик по жабці — один стрибок (дуга з номером СТРИБКА, не листка; лічимо стрибки, а не листки,
 *  стартовий листок не рахується). Підказка 1 програє стрибки по одному, підказка 2 малює весь маршрут пунктиром — дитина торкається дуг сама. Правильна відповідь переносить жабку на листок приземлення. */
export function PondScene({ instance, world, area, reserved, assist, phase, celebrating, onTouch }: SceneProps<JumpInstance>) {
  const { layout, place } = useMemo(
    () => pickPond(instance.max, area, reserved),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instance.max, area.w, area.h, JSON.stringify(reserved)],
  );
  const [jumped, setJumped] = useState(0);
  const [ghost, setGhost] = useState(false);
  const [helped, setHelped] = useState(false);

  // допомога Kubika веде жабку (підказка 1 і «разом»); підказка 2 — починає з нуля й лишає маршрут видимим
  useEffect(() => {
    const j = assistJumped(assist);
    if (j !== null) setJumped(j);
    if (assist.mode === 'hint') {
      setHelped(true);
      if ((assist.level ?? 1) >= 2) setGhost(true);
    }
  }, [assist.mode, assist.step, assist.level]);

  const { start, jumps } = instance;
  const target = landing(instance);
  const interactive = phase === 'play' && assist.mode === 'none';
  const canJump = interactive && (instance.tapJumps || helped);
  const pad = celebrating ? target : frogPad(instance, jumped);
  const shown = celebrating ? 0 : Math.min(jumped, jumps);

  const jump = () => {
    if (!canJump) return;
    onTouch?.();
    if (jumped >= jumps) {
      // усі стрибки зроблено: ще дотик — жабка повертається на старт
      sfx.play('tap');
      setJumped(0);
      return;
    }
    const n = jumped + 1;
    sfx.play('pop');
    void tts.speak(numberWords(n), { interrupt: true });
    setJumped(n);
  };

  const arcCount = ghost && !celebrating ? jumps : shown;
  const labelled = labelledPads(instance.max, instance.pads, start, celebrating ? [target] : []);
  const anchor = frogAnchor(layout, pad);
  const hit = {
    x: Math.round(place.x + anchor.x * place.scale),
    y: Math.round(place.y + (anchor.y - FROG_H / 2) * place.scale),
  };

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }} role="group" aria-label={LABELS.pond}>
      <div className={styles.stage} style={{ left: place.x, top: place.y, width: layout.width, height: layout.height, transform: `scale(${place.scale})` }}>
        <NumberLine layout={layout} world={world} labelled={labelled} glow={celebrating ? target : null}>
          {Array.from({ length: arcCount }, (_, k) => {
            const n = k + 1;
            const done = n <= shown;
            return (
              <JumpArc
                key={n}
                arc={arcBetween(layout, start + k, start + n)}
                n={n}
                width={layout.width}
                height={layout.height}
                ghost={!done}
                next={!done && n === shown + 1}
                onPress={!done && n === shown + 1 && canJump ? jump : undefined}
              />
            );
          })}
          <span className={styles.frog} style={{ left: anchor.x - FROG_W / 2, top: anchor.y - FROG_H, width: FROG_W, height: FROG_H }}>
            <img
              key={`${pad}-${celebrating}`}
              className={styles.frogImg}
              src={animalUrl('zabka', celebrating)}
              alt={ANIMALS.zabka.one}
              draggable={false}
              data-leap={pad !== start || celebrating}
            />
          </span>
        </NumberLine>
      </div>
      {canJump && (
        <button
          type="button"
          className={styles.hit}
          aria-label={LABELS.jump}
          style={{ left: hit.x - FROG_HIT / 2, top: hit.y - FROG_HIT / 2, width: FROG_HIT, height: FROG_HIT }}
          onClick={jump}
        />
      )}
    </div>
  );
}
