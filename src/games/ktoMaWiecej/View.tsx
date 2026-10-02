import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ObjectArt } from '../../components/math/ObjectArt';
import { animalUrl } from '../../components/math/art';
import { Digits } from '../../components/ui/Digits';
import { Icon } from '../../components/ui/Icon';
import { StateBadge } from '../../components/ui/StateBadge';
import { cx } from '../../components/ui/cx';
import { BUTTONS, LABELS, pileLabel } from '../../speech/lines';
import { ANIMALS } from '../../speech/nouns';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { createRng, hashSeed } from '../engine/rng';
import type { SceneProps } from '../engine/types';
import { LEFT, SAME, pairing, type CompareInstance } from './generate';
import { compareLayout } from './layout';
import styles from './View.module.css';

/** Підступ (sizeTrick): предмети на меншій купці більші (×1,35), на більшій — звичайні. */
export function sizeFactors(bigSide: CompareInstance['bigSide']): readonly [number, number] {
  if (bigSide === null) return [1, 1];
  return bigSide === 0 ? [1.35, 1] : [1, 1.35];
}

type ChoiceState = 'default' | 'selected' | 'retry' | 'correct' | 'highlighted';

/** Сцена «Kto ma więcej?»: дві картки-кнопки (тваринка + купка), «Tyle samo» — у лотку (портал). Дотик вибирає бік (повторний — знімає), «Gotowe» перевіряє.
 *  Хибний вибір отримує рамку-стрілку й вимикається (залишається на місці, предмети лишаються яскравими: їх треба перелічити). Підказки й правильна відповідь
 *  ставлять предмети парами: зайві світяться. У режимі цифр купок нема, поки Kubik їх не покаже. */
export function CompareScene({ instance, kind, area, reserved, assist, phase, celebrating, last, tray, onRespond, onTouch }: SceneProps<CompareInstance>) {
  const factors = sizeFactors(instance.bigSide);
  const layout = useMemo(
    () => compareLayout(area, reserved, instance.counts, factors, createRng(hashSeed('compare', instance.seed))),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, instance.counts, instance.seed, factors[0], factors[1], JSON.stringify(reserved)],
  );
  const [choice, setChoice] = useState(0);
  const [wrong, setWrong] = useState<readonly number[]>([]);
  const [solved, setSolved] = useState(false);
  const choiceRef = useRef(0);
  choiceRef.current = choice;
  const interactive = phase === 'play' && assist.mode === 'none';

  // «Gotowe» вмикається, коли щось вибрано
  useEffect(() => {
    if (phase === 'play') onRespond?.(choice > 0 ? choice : null);
  }, [choice, phase, onRespond]);

  // після хибної перевірки вибір стає «спробуй ще» (вимкнений) і знімається, щоб дитина вибрала знову
  useEffect(() => {
    if (last !== 'wrong1' && last !== 'wrong2') return;
    const c = choiceRef.current;
    if (c > 0) {
      setWrong((w) => (w.includes(c) ? w : [...w, c]));
      setChoice(0);
    }
  }, [last]);

  // після показу «разом» правильна відповідь лишається підсвіченою до кінця завдання
  useEffect(() => {
    if (assist.mode === 'together') setSolved(true);
  }, [assist.mode]);

  const helping = assist.mode === 'hint' || assist.mode === 'together';
  const step = helping ? assist.step : 0;
  const paired = celebrating || step >= 1;
  const glow = celebrating || step >= 2;
  const showItems = instance.show !== 'digits' || celebrating || assist.mode === 'together' || (assist.mode === 'hint' && (assist.level ?? 1) >= 2);
  const { richer, pairs } = pairing(instance.counts);

  const pick = (value: number) => {
    if (!interactive || wrong.includes(value)) return;
    onTouch?.();
    sfx.play('tap');
    const selecting = choice !== value;
    setChoice(selecting ? value : 0);
    if (selecting) void tts.speak(value === SAME ? BUTTONS.same : ANIMALS[instance.animals[value - LEFT as 0 | 1]].one, { interrupt: true });
  };

  const stateOf = (value: number): ChoiceState => {
    if (celebrating && instance.correct === value) return 'correct';
    if (wrong.includes(value)) return 'retry';
    if (solved && instance.correct === value) return 'highlighted';
    return choice === value ? 'selected' : 'default';
  };

  const zones = ([0, 1] as const).map((side) => {
    const card = layout.cards[side];
    const animal = layout.animals[side];
    const region = layout.regions[side];
    const value = LEFT + side;
    const state = stateOf(value);
    const winner = celebrating && instance.correct === value;
    return (
      <div key={side}>
        <button
          type="button"
          className={cx('kl-block', styles.card)}
          data-state={state}
          aria-label={pileLabel(ANIMALS[instance.animals[side]])}
          aria-pressed={state === 'default' || state === 'selected' ? state === 'selected' : undefined}
          disabled={!interactive || state === 'retry'}
          style={{ left: card.x, top: card.y, width: card.w, height: card.h }}
          onClick={() => pick(value)}
        >
          {state === 'correct' && <StateBadge kind="ok" />}
          {state === 'retry' && <StateBadge kind="retry" />}
        </button>
        <img
          className={styles.animal}
          src={animalUrl(instance.animals[side], celebrating && (winner || instance.correct === SAME))}
          alt=""
          draggable={false}
          style={{ left: animal.x, top: animal.y, width: animal.w, height: animal.h }}
        />
        {instance.show === 'digits' && (
          <span
            className={styles.numeral}
            data-visible={!showItems}
            style={{ left: region.x, top: region.y, width: region.w, height: region.h }}
          >
            <Digits value={instance.counts[side]} style={{ height: Math.min(region.h * 0.7, 120) }} />
          </span>
        )}
      </div>
    );
  });

  const items = ([0, 1] as const).flatMap((side) =>
    Array.from({ length: instance.counts[side] }, (_, i) => {
      const at = paired ? layout.paired[side][i]! : layout.piles[side][i]!;
      const size = paired ? layout.pairSize : layout.sizes[side];
      const extra = glow && richer === side && i >= pairs;
      return (
        <span
          key={`${side}-${i}`}
          className={styles.item}
          data-visible={showItems}
          data-extra={extra}
          data-celebrate={celebrating}
          style={{ left: at.x, top: at.y, width: size, height: size }}
        >
          <ObjectArt object={instance.item} size={size} style={{ width: '100%', height: '100%' }} />
        </span>
      );
    }),
  );

  const sameState = stateOf(SAME);
  const sameButton = (
    <button
      type="button"
      className={cx('kl-block', styles.same)}
      data-state={sameState}
      aria-label={BUTTONS.same}
      aria-pressed={sameState === 'default' || sameState === 'selected' ? sameState === 'selected' : undefined}
      disabled={!interactive || sameState === 'retry'}
      onClick={() => pick(SAME)}
    >
      <Icon name="equal" className={styles.sameIcon} />
      {sameState === 'correct' && <StateBadge kind="ok" />}
      {sameState === 'retry' && <StateBadge kind="retry" />}
    </button>
  );

  return (
    <div className={styles.scene} data-kind={kind} style={{ width: area.w, height: area.h }} aria-label={LABELS.compare}>
      {zones}
      {items}
      {instance.equalPossible && tray && createPortal(sameButton, tray)}
    </div>
  );
}
