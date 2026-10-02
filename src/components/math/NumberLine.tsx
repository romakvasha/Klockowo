import type { ReactNode } from 'react';
import type { WorldKey } from '../../curriculum/types';
import { padLabel } from '../../speech/lines';
import { Digits } from '../ui/Digits';
import { cssVars } from '../ui/cx';
import type { PadLayout } from './padLayout';
import { PAD } from './padLayout';
import styles from './NumberLine.module.css';

export interface NumberLineProps {
  layout: PadLayout;
  world: WorldKey;
  /** Які листки мають цифру (решта — порожні, дитина лічить сама). */
  labelled: ReadonlySet<number>;
  /** Листок приземлення світиться (правильна відповідь). */
  glow?: number | null;
  /** Дуги, жабка тощо — у тій самій системі координат (design-px). */
  children?: ReactNode;
}

/** Листки латаття 0…max у кілька рядів («Skoki żabki», design-px); номер листка — позиція на прямій. Дуги й жабку кладуть як `children`. */
export function NumberLine({ layout, world, labelled, glow = null, children }: NumberLineProps) {
  return (
    <div
      className={styles.root}
      style={{ width: layout.width, height: layout.height, ...cssVars({ '--nl-100': `var(--kl-${world}-100)`, '--nl-500': `var(--kl-${world}-500)`, '--nl-700': `var(--kl-${world}-700)` }) }}
    >
      {layout.pads.map((p, i) => (
        <span
          key={i}
          className={styles.pad}
          data-glow={glow === i}
          role="img"
          aria-label={padLabel(i)}
          style={{ left: p.x - PAD / 2, top: p.y - PAD / 2, width: PAD, height: PAD }}
        >
          {labelled.has(i) && <Digits value={i} style={{ height: i >= 10 ? 20 : 24 }} />}
        </span>
      ))}
      {children}
    </div>
  );
}
