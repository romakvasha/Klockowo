import type { ReactNode } from 'react';
import { Digits } from '../ui/Digits';
import { SPACE_H, SPACE_LINE_Y, SPACE_W, lineX, ticks } from './spaceGeometry';
import styles from './SpaceLine.module.css';

export interface SpaceLineProps {
  /** Числа, на яких ракета вже побувала (зупинки): крапка на лінії. */
  visited?: readonly number[];
  /** Зупинки маршруту-підказки (ще не пролетіли): порожні кільця на лінії. */
  ghosts?: readonly number[];
  /** Число підписується під лінією, навіть коли воно не десяток (старт і посадка). */
  marked?: readonly number[];
  /** Золоте сяйво на числі (посадка, правильна відповідь). */
  glow?: number | null;
  label: string;
  /** Ракета й інше — у тій самій системі координат (design-px). */
  children?: ReactNode;
}

/** Пряма 0–100 (design-px, 1000 × 230): позначки через одиницю, довші п'ятірки й підписані десятки (BRIEF §10, §12 — дитина не торкається поділок: лише ракети й плиток-відповідей). */
export function SpaceLine({ visited = [], ghosts = [], marked = [], glow = null, label, children }: SpaceLineProps) {
  return (
    <div className={styles.root} role="img" aria-label={label} style={{ width: SPACE_W, height: SPACE_H }}>
      <svg className={styles.svg} width={SPACE_W} height={SPACE_H} viewBox={`0 0 ${SPACE_W} ${SPACE_H}`} aria-hidden="true">
        <line className={styles.axis} x1={lineX(0)} y1={SPACE_LINE_Y} x2={lineX(100)} y2={SPACE_LINE_Y} />
        {ticks().map((t) => (
          <line key={t.n} className={styles.tick} data-major={t.labelled} x1={lineX(t.n)} y1={SPACE_LINE_Y} x2={lineX(t.n)} y2={SPACE_LINE_Y + t.h} />
        ))}
        {ghosts.map((n) => (
          <circle key={`g${n}`} className={styles.ghost} cx={lineX(n)} cy={SPACE_LINE_Y} r={7} />
        ))}
        {visited.map((n) => (
          <circle key={`v${n}`} className={styles.visited} cx={lineX(n)} cy={SPACE_LINE_Y} r={7} />
        ))}
        {glow !== null && <circle className={styles.glow} cx={lineX(glow)} cy={SPACE_LINE_Y} r={13} />}
      </svg>
      {ticks()
        .filter((t) => t.labelled)
        .map((t) => (
          <span key={t.n} className={styles.label} style={{ left: lineX(t.n), top: SPACE_LINE_Y + 32 }}>
            <Digits value={t.n} style={{ height: 24 }} />
          </span>
        ))}
      {marked
        .filter((n) => n % 10 !== 0)
        .map((n) => (
          <span key={`m${n}`} className={styles.mark} style={{ left: lineX(n), top: SPACE_LINE_Y + 64 }}>
            <Digits value={n} style={{ height: 26 }} />
          </span>
        ))}
      {children}
    </div>
  );
}
