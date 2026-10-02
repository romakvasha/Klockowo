import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useViewport } from '../../app/useViewport';
import { PAIR_SHAPES, PairMark } from '../../components/math/PairMark';
import { SetCard, type SetCardState } from '../../components/math/SetCard';
import { digitTileSize, setsLayout } from '../../components/math/matchLayout';
import { AnswerTile } from '../../components/ui/AnswerTile';
import type { TileState } from '../../components/ui/TileButton';
import { LABELS } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import type { Assist, SceneProps } from '../engine/types';
import type { MatchInstance } from './generate';
import { encodeLinks, isComplete, keepCorrect, linkPair, mistakenSets, setOfDigit, unlinkDigit, unlinkSet, type Links } from './match';
import styles from './View.module.css';

/** Що вибрано першим дотиком: набір чи цифра. Другий дотик до протилежного боку створює пару. */
interface Selection {
  side: 'set' | 'digit';
  index: number;
}

/** Що Kubik показує зараз: який набір у фокусі, скільки він уже пораховав і чи вже з'єднав його з цифрою (step > кількість). */
export function helpFocus(instance: Pick<MatchInstance, 'sets'>, assist: Assist): { focus: number | null; counted: number | null; linked: boolean } {
  if ((assist.mode !== 'hint' && assist.mode !== 'together') || assist.focus === undefined) return { focus: null, counted: null, linked: false };
  const count = instance.sets[assist.focus]?.count ?? 0;
  return { focus: assist.focus, counted: Math.min(assist.step, count), linked: assist.mode === 'together' && assist.step > count };
}

/** Зв'язки, які бачить дитина під час показу «разом»: Kubik з'єднав набори до фокусного включно (фокусний — лише після лічби). */
export function togetherLinks(instance: Pick<MatchInstance, 'correct'>, focus: number, linked: boolean): (number | null)[] {
  return instance.correct.map((c, i) => (i < focus || (i === focus && linked) ? c : null));
}

/** Сцена «Cyfra i obrazek»: набори-картинки на сцені, цифри — плитками в лотку (портал). Дитина торкається набору й цифри (у будь-якому порядку) — вони стають парою:
 *  однакова позначка (форма й колір) з'являється на картці й на плитці. Торкнутись з'єднаного — розірвати пару. «Gotowe» вмикається, коли в усіх наборів є пара.
 *  Після хибної перевірки неправильні пари підсвічуються й зникають, правильні лишаються; показ «разом» сам лічить і з'єднує. */
export function MatchScene({ instance, world, kind, area, reserved, assist, phase, celebrating, last, tray, onRespond, onTouch }: SceneProps<MatchInstance>) {
  const k = instance.sets.length;
  const viewport = useViewport();
  const [links, setLinks] = useState<(number | null)[]>(() => Array.from({ length: k }, () => null));
  const [selection, setSelection] = useState<Selection | null>(null);
  const layout = useMemo(
    () => setsLayout(area, reserved, k),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, k, JSON.stringify(reserved)],
  );
  // стандартна плитка лотка (responsive.css); коли k плиток у ній не вміщаються, звужуємо
  const cssTile = useMemo(
    () => (tray ? parseFloat(getComputedStyle(tray).getPropertyValue('--kl-tile')) || 120 : 120),
    // розмір плитки змінюється з в'юпортом
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tray, viewport.width, viewport.height],
  );
  const tile = digitTileSize(kind, { w: viewport.width, h: viewport.height }, k, cssTile);

  const help = helpFocus(instance, assist);
  const kubik = assist.mode === 'hint' || assist.mode === 'together';
  const interactive = phase === 'play' && assist.mode === 'none';
  const retrying = !kubik && phase === 'feedback' && (last === 'wrong1' || last === 'wrong2');
  const shown: Links = assist.mode === 'together' && help.focus !== null ? togetherLinks(instance, help.focus, help.linked) : links;
  const wrong = useMemo(() => new Set(retrying ? mistakenSets(instance.correct, shown) : []), [retrying, instance.correct, shown]);

  // що зібрано: «Gotowe» вмикається, коли пари є в усіх наборів; часткове значення потрапляє в підказки
  useEffect(() => {
    if (phase !== 'play') return;
    onRespond?.(encodeLinks(links), isComplete(links));
  }, [links, phase, onRespond]);

  // після хибної перевірки: щойно відгук закінчився, хибні пари зникають, правильні лишаються
  const hadWrong = useRef(false);
  const wasPhase = useRef(phase);
  useEffect(() => {
    if (retrying) hadWrong.current = true;
    if (wasPhase.current === 'feedback' && phase === 'play' && hadWrong.current) {
      hadWrong.current = false;
      setLinks((prev) => keepCorrect(instance.correct, prev));
      setSelection(null);
    }
    wasPhase.current = phase;
  }, [phase, retrying, instance.correct]);

  // показ «разом»: Kubik з'єднав набір — фіксуємо пару (хибні пари дитини перекриваються по черзі й зникають)
  useEffect(() => {
    if (assist.mode === 'together' && help.focus !== null && help.linked) {
      const focus = help.focus;
      setLinks((prev) => linkPair(prev, focus, instance.correct[focus]!));
      setSelection(null);
    }
  }, [assist.mode, help.focus, help.linked, instance.correct]);

  const speakDigit = (j: number) => void tts.speak(numberWords(instance.digits[j]!), { interrupt: true });

  /** Дотик до набору (side 'set') чи плитки (side 'digit'): вибір → пара; повторний дотик знімає вибір; дотик до з'єднаного розриває пару й вибирає картку. */
  const pick = useCallback(
    (side: Selection['side'], index: number) => {
      if (!interactive) return;
      onTouch?.();
      if (side === 'digit') speakDigit(index);
      if (selection && selection.side === side && selection.index === index) {
        sfx.play('tap');
        setSelection(null);
        return;
      }
      if (selection && selection.side !== side) {
        const set = side === 'set' ? index : selection.index;
        const digit = side === 'digit' ? index : selection.index;
        sfx.play('pop');
        setLinks((prev) => linkPair(prev, set, digit));
        setSelection(null);
        return;
      }
      sfx.play('tap');
      const linked = side === 'set' ? links[index] !== null : setOfDigit(links, index) !== null;
      if (linked && !selection) setLinks((prev) => (side === 'set' ? unlinkSet(prev, index) : unlinkDigit(prev, index)));
      setSelection({ side, index });
    },
    // speakDigit зависить лише від instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [interactive, selection, links, onTouch, instance],
  );

  const setState = (i: number): SetCardState => {
    if (celebrating) return 'correct';
    if (wrong.has(i)) return 'retry';
    return selection?.side === 'set' && selection.index === i ? 'selected' : 'idle';
  };
  const tileState = (j: number): TileState => {
    if (celebrating) return 'correct';
    const owner = setOfDigit(shown, j);
    if (owner !== null && wrong.has(owner)) return 'retry';
    if (help.focus !== null && help.linked && j === instance.correct[help.focus]) return 'highlighted';
    return selection?.side === 'digit' && selection.index === j ? 'selected' : 'default';
  };

  const mark = Math.max(26, Math.round(tile * 0.3));
  const tiles = instance.digits.map((value, j) => {
    const owner = setOfDigit(shown, j);
    return (
      <span key={j} className={styles.tileWrap}>
        <AnswerTile value={value} size={tile} digit={Math.max(44, Math.round(tile * 0.6))} state={tileState(j)} onClick={() => pick('digit', j)} />
        {owner !== null && <PairMark key={owner} pair={owner} size={mark} className={styles.tileMark} />}
      </span>
    );
  });

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }} data-pairs={PAIR_SHAPES.length}>
      {instance.sets.map((set, i) => {
        const r = layout.rects[i]!;
        return (
          <div key={i} className={styles.slot} style={{ left: r.x, top: r.y }}>
            <SetCard
              kind={set.kind}
              count={set.count}
              object={set.object}
              seed={set.seed}
              size={layout.size}
              world={world}
              pair={i}
              linked={shown[i] !== null}
              state={setState(i)}
              focus={help.focus === i}
              counted={help.focus === i ? help.counted : null}
              celebrate={celebrating}
              disabled={!interactive}
              label={`${LABELS.set} ${numberWords(i + 1)}`}
              onPress={() => pick('set', i)}
            />
          </div>
        );
      })}
      {tray && createPortal(<>{tiles}</>, tray)}
    </div>
  );
}
