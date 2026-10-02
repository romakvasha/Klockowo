import { useEffect, useMemo, useState } from 'react';
import { Vehicle } from '../../characters/Vehicle';
import { SpaceLine } from '../../components/math/SpaceLine';
import { ROCKET_H, ROCKET_W, SPACE_H, SPACE_W, rocketAnchor } from '../../components/math/spaceGeometry';
import { LABELS } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { landings } from '../bigAdd';
import { placeContent } from '../engine/placeContent';
import type { SceneProps } from '../engine/types';
import { assistJumped } from './assist';
import { landing, type JumpInstance } from './generate';
import styles from './View.module.css';

const ROCKET_HIT = 80;

/** Де ракета після `legs` зупинок: старт, або зупинка з номером legs (не далі за посадку). */
export function rocketPos(instance: Pick<JumpInstance, 'start' | 'jumps'>, legs: number): number {
  const stops = landings(instance.start, instance.jumps);
  return legs <= 0 ? instance.start : (stops[Math.min(legs, stops.length) - 1] ?? instance.start);
}

/** Сцена «Skoki żabki» з ракетою (W7): пряма 0–100 з позначками десятків; ракета на стартовому числі. Дотик по ракеті — одна зупинка (десятки по +10, потім одиниці; через десяток — спершу до
 *  десятка). Дитина не торкається поділок — лише ракети й плиток-відповідей (BRIEF §12). Підказка 1 програє зупинки, підказка 2 показує маршрут порожніми кільцями. */
export function RocketScene({ instance, area, reserved, assist, phase, celebrating, onTouch }: SceneProps<JumpInstance>) {
  const place = useMemo(
    () => placeContent(area, reserved, { w: SPACE_W, h: SPACE_H }, { maxScale: 1.3 }),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, JSON.stringify(reserved)],
  );
  const stops = useMemo(() => landings(instance.start, instance.jumps), [instance.start, instance.jumps]);
  const [legs, setLegs] = useState(0);
  const [ghost, setGhost] = useState(false);
  const [helped, setHelped] = useState(false);

  useEffect(() => {
    const j = assistJumped(assist);
    if (j !== null) setLegs(j);
    if (assist.mode === 'hint') {
      setHelped(true);
      if ((assist.level ?? 1) >= 2) setGhost(true);
    }
  }, [assist.mode, assist.step, assist.level]);

  const target = landing(instance);
  const interactive = phase === 'play' && assist.mode === 'none';
  const canFly = interactive && (instance.tapJumps || helped);
  const done = celebrating ? stops.length : Math.min(legs, stops.length);
  const pos = celebrating ? target : rocketPos(instance, legs);
  const anchor = rocketAnchor(pos);

  const fly = () => {
    if (!canFly) return;
    onTouch?.();
    if (legs >= stops.length) {
      sfx.play('tap');
      setLegs(0);
      return;
    }
    const n = legs + 1;
    sfx.play('pop');
    void tts.speak(numberWords(stops[n - 1]!), { interrupt: true });
    setLegs(n);
  };
  const hit = {
    x: Math.round(place.x + anchor.x * place.scale),
    y: Math.round(place.y + (anchor.y - ROCKET_H / 2) * place.scale),
  };

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }} role="group" aria-label={LABELS.spaceLine}>
      <div className={styles.stage} style={{ left: place.x, top: place.y, width: SPACE_W, height: SPACE_H, transform: `scale(${place.scale})` }}>
        <SpaceLine
          label={LABELS.spaceLine}
          visited={stops.slice(0, done)}
          ghosts={ghost && !celebrating ? stops.slice(done) : []}
          marked={[instance.start, ...(celebrating ? [target] : [])]}
          glow={celebrating ? target : null}
        >
          <span className={styles.frog} style={{ left: anchor.x - ROCKET_W / 2, top: anchor.y - ROCKET_H, width: ROCKET_W, height: ROCKET_H }}>
            <span key={`${pos}-${celebrating}`} className={styles.frogImg} data-leap={pos !== instance.start || celebrating}>
              <Vehicle kind="rakieta" scale={ROCKET_W / 91} />
            </span>
          </span>
        </SpaceLine>
      </div>
      {canFly && (
        <button
          type="button"
          className={styles.hit}
          aria-label={LABELS.fly}
          style={{ left: hit.x - ROCKET_HIT / 2, top: hit.y - ROCKET_HIT / 2, width: ROCKET_HIT, height: ROCKET_HIT }}
          onClick={fly}
        />
      )}
    </div>
  );
}
