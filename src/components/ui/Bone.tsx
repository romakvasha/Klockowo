import type { CSSProperties } from 'react';
import { cx } from './cx';
import { iconArt } from './icons';
import styles from './Bone.module.css';

const BONE = iconArt('bone');

export interface BoneProps {
  /** Порожня (пунктирний контур) — слот, з якого кісточку вже забрано. */
  empty?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Окрема кісточка-нагорода (design etap1/08, ProgressBones): reward-заливка, контур ink, світла смужка. Літає в миску на Koniec poziomu. */
export function Bone({ empty = false, className, style }: BoneProps) {
  return (
    <svg viewBox={BONE.viewBox} className={cx(styles.bone, className)} style={style} aria-hidden="true" focusable="false" data-empty={empty}>
      <g className={styles.shape} dangerouslySetInnerHTML={{ __html: BONE.inner }} />
      {!empty && <path className={styles.shine} d="M14 22.6 H30" />}
    </svg>
  );
}
