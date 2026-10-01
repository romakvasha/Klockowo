import { memo, useMemo } from 'react';
import type { NodeState } from '../../curriculum/progression';
import type { LevelId } from '../../curriculum/types';
import { NODE_LABELS } from '../../speech/lines';
import { pressHandler } from '../ui/tick';
import { NODE_VIEWBOX, nodeMarkup } from './nodeArt';
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

export interface LevelNodeProps {
  id: LevelId;
  /** Лівий верхній кут коробки 96×104 у координатах сцени. */
  x: number;
  y: number;
  state: VisibleNodeState;
  /** Колір світу #RRGGBB (WORLDS[].color). */
  color: string;
  star: boolean;
  /** Заблокований вузол хитається ±6 px: екран виставляє це на 300 мс після дотику. */
  shaking?: boolean;
  /** Вузол щойно відкрито — «замок відкривається» (500 мс). */
  fresh?: boolean;
  onPress: (id: LevelId) => void;
}

/** Вузол-платформа стежки (design etap2/14–16, 96×104): замок, світиться, галочка з наліпкою, ★, «Do powtórki».
 *  Дитина може натиснути все, крім замка: той лише хитається (BRIEF §6.5). */
export const LevelNode = memo(function LevelNode({ id, x, y, state, color, star, shaking = false, fresh = false, onPress }: LevelNodeProps) {
  const art = useMemo(() => nodeMarkup(state, color, { star }), [state, color, star]);
  return (
    <button
      type="button"
      aria-label={nodeLabel(state, star)}
      className={styles.node}
      data-state={state}
      data-level={id}
      data-shake={shaking}
      data-fresh={fresh}
      style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
      onPointerDown={pressHandler(state === 'locked', false)}
      onClick={() => onPress(id)}
    >
      {state === 'next' && <span className={styles.glow} aria-hidden="true" />}
      <svg viewBox={NODE_VIEWBOX} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: art }} />
    </button>
  );
});
