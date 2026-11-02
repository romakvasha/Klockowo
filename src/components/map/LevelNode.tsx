import { memo } from 'react';
import type { NodeState } from '../../curriculum/progression';
import type { LevelId } from '../../curriculum/types';
import { NODE_LABELS } from '../../speech/lines';
import type { BrickColor } from '../ui/brick';
import { cx } from '../ui/cx';
import { Icon } from '../ui/Icon';
import { StateBadge } from '../ui/StateBadge';
import { pressHandler } from '../ui/tick';
import { NODE_H, NODE_W } from './pathTypes';
import styles from './LevelNode.module.css';

/** Стани видимого вузла: ★-вузол, прихований налаштуванням, на стежку не потрапляє. */
export type VisibleNodeState = Exclude<NodeState, 'hidden'>;

/** aria-label за станом (дослівно з бордів дизайну): дитина не читає, але чує слово й діє диктор. */
export function nodeLabel(state: VisibleNodeState, star: boolean): string {
  switch (state) {
    case 'next': return NODE_LABELS.next;
    case 'done': return NODE_LABELS.done;
    case 'review': return NODE_LABELS.review;
    case 'star': return NODE_LABELS.star;
    case 'locked': return star ? NODE_LABELS.starLocked : NODE_LABELS.locked;
  }
}

/** Колір цеглинки за станом (полотно D1, «Ścieżka świata»): пройдені зелені, наступний і відкритий ★ — жовті, закриті — сірі. */
export const NODE_BRICK: Readonly<Record<VisibleNodeState, BrickColor>> = { done: 'green', review: 'green', next: 'yellow', star: 'yellow', locked: 'grey' };

/** Номер рівня з id ('w1-5' → '5'); у ★-вузла номера немає. */
export function nodeNumber(id: LevelId): string | null {
  const m = /-(\d+)$/.exec(id);
  return m ? m[1]! : null;
}

export interface LevelNodeProps {
  id: LevelId;
  /** Лівий верхній кут коробки 96×104 у координатах сцени (цеглинка 96×88 унизу, над нею — пупирці). */
  x: number;
  y: number;
  state: VisibleNodeState;
  star: boolean;
  /** Заблокований вузол хитається ±6 px: екран виставляє це на 300 мс після дотику. */
  shaking?: boolean;
  /** Вузол щойно відкрито — «замок відкривається» (500 мс). */
  fresh?: boolean;
  onPress: (id: LevelId) => void;
}

/** Вузол стежки — глянцева цеглинка (D5, полотно D1): номер рівня, ★, замок; пройдений — зі значком-галочкою, «Do powtórki» — з круговою стрілкою
 *  (сигнал ніколи не лише кольором). Дитина може натиснути все, крім замка: той лише хитається (BRIEF §6.5). */
export const LevelNode = memo(function LevelNode({ id, x, y, state, star, shaking = false, fresh = false, onPress }: LevelNodeProps) {
  const number = star ? null : nodeNumber(id);
  const glyph = state === 'locked' ? 'lock' : number === null ? 'star' : null;
  return (
    <div className={styles.box} style={{ left: x, top: y, width: NODE_W, height: NODE_H }}>
      {state === 'next' && <span className={styles.glow} aria-hidden="true" />}
      <button
        type="button"
        aria-label={nodeLabel(state, star)}
        className={cx('kl-brick', 'kl-studs', styles.node)}
        data-brick={NODE_BRICK[state]}
        data-state={state}
        data-level={id}
        data-shake={shaking}
        data-fresh={fresh}
        onPointerDown={pressHandler(state === 'locked', false)}
        onClick={() => onPress(id)}
      >
        {glyph ? <Icon name={glyph} className={cx('kl-glyph', styles.icon)} /> : <span className={cx('kl-glyph', styles.num)}>{number}</span>}
        {state === 'done' && <StateBadge kind="ok" className={styles.badge} />}
        {state === 'review' && <StateBadge kind="retry" className={styles.badge} />}
        {state === 'locked' && star && (
          <span className={styles.starChip} aria-hidden="true">
            <Icon name="star" />
          </span>
        )}
      </button>
    </div>
  );
});
