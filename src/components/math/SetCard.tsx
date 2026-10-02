import { useMemo } from 'react';
import type { WorldKey } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import { Digits } from '../ui/Digits';
import { StateBadge } from '../ui/StateBadge';
import { cx, cssVars } from '../ui/cx';
import { handUrl } from './art';
import { DotCard } from './DotCard';
import { ObjectArt } from './ObjectArt';
import { PAIR_COLORS, PairMark } from './PairMark';
import { dotsFor, handsFor, objectGrid, type SetKind } from './setFaces';
import styles from './SetCard.module.css';

/** idle · selected (перший дотик із двох) · retry (хибна пара: фіолетова рамка + стрілка, картинка лишається яскравою — її треба перелічити) · correct. */
export type SetCardState = 'idle' | 'selected' | 'retry' | 'correct';

export interface SetCardProps {
  kind: SetKind;
  count: number;
  /** Предмет для kind 'objects'. */
  object: ObjectId;
  /** Зерно випадкових крапок (картка за тим самим зерном виглядає однаково). */
  seed: number;
  /** Сторона картки, px. */
  size: number;
  world: WorldKey;
  /** Номер набору 0–3: за ним позначка пари (форма + колір). */
  pair: number;
  /** З'єднано з цифрою: край картки набуває кольору пари. */
  linked?: boolean;
  state?: SetCardState;
  /** Допомога Kubika вказує на цей набір: золота рамка. */
  focus?: boolean;
  /** Лічильник підказки в куті картки (1, 2, 3…; 0 — порожньо); null — його нема. */
  counted?: number | null;
  /** Усі картки підстрибують разом — правильна відповідь. */
  celebrate?: boolean;
  disabled?: boolean;
  /** Підпис для екранного диктора (без числа, щоб не видати відповідь). */
  label: string;
  onPress: () => void;
}

const PAD = 0.1;

/** Що намальовано на картці: предмети рядами по п'ять, крапки (кубик чи випадкові), пальці однієї чи двох рук, рамка-десятка; нуль — порожньо / кулак / порожня рамка. */
function Face({ kind, count, object, seed, inner, world }: Pick<SetCardProps, 'kind' | 'count' | 'object' | 'seed' | 'world'> & { inner: number }) {
  const dots = useMemo(() => (kind === 'dots' || kind === 'tenFrame' ? dotsFor(kind, count, seed) : null), [kind, count, seed]);
  // нуль: пунктирне порожнє коло («тут було б щось, але нічого нема»), щоб порожня картка не виглядала помилкою малювання
  if (count === 0 && (kind === 'objects' || kind === 'dots')) return <span className={styles.empty} style={{ width: inner * 0.46, height: inner * 0.46 }} />;
  if (kind === 'objects') {
    const grid = objectGrid(count, inner);
    return (
      <>
        {grid.items.map((item, i) => (
          <ObjectArt key={i} object={object} size={grid.size} className={styles.object} style={{ left: item.x, top: item.y }} />
        ))}
      </>
    );
  }
  if (kind === 'fingers') {
    return (
      <span className={styles.hands}>
        {handsFor(count).map((fingers, i) => (
          <img key={i} className={styles.hand} data-mirror={i === 1} src={handUrl(fingers)} alt="" draggable={false} />
        ))}
      </span>
    );
  }
  return dots ? <DotCard layout={dots} face="front" size={inner} world={world} label="" bare className={styles.dots} /> : null;
}

/** Набір-картинка «Cyfra i obrazek»: кнопка з білою карткою; у лівому куті позначка пари, внизу праворуч лічильник підказки. Нічого не залежить від hover. */
export function SetCard({ kind, count, object, seed, size, world, pair, linked = false, state = 'idle', focus = false, counted = null, celebrate = false, disabled = false, label, onPress }: SetCardProps) {
  const color = PAIR_COLORS[((pair % PAIR_COLORS.length) + PAIR_COLORS.length) % PAIR_COLORS.length]!;
  const pad = Math.round(size * PAD);
  const inner = size - 6 - 2 * pad;
  const mark = Math.max(28, Math.min(40, Math.round(size * 0.2)));
  const badge = Math.max(30, Math.round(size * 0.26));
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={state === 'idle' || state === 'selected' ? state === 'selected' : undefined}
      className={cx('kl-block', styles.card)}
      data-state={state}
      data-linked={linked}
      data-focus={focus}
      disabled={disabled}
      style={cssVars({ '--size': `${size}px`, '--pair-edge': color.edge })}
      onClick={onPress}
    >
      <span className={styles.face} data-celebrate={celebrate} style={{ left: pad, top: pad, width: inner, height: inner }}>
        <Face kind={kind} count={count} object={object} seed={seed} inner={inner} world={world} />
      </span>
      <PairMark pair={pair} size={mark} className={styles.mark} />
      {counted !== null && (
        <span className={styles.counter} style={{ width: badge, height: badge }} aria-hidden="true">
          <Digits value={counted} style={{ height: Math.round(badge * (counted >= 10 ? 0.5 : 0.6)) }} />
        </span>
      )}
      {state === 'correct' && <StateBadge kind="ok" />}
      {state === 'retry' && <StateBadge kind="retry" />}
    </button>
  );
}
