import type { WorldKey } from '../../curriculum/types';
import { LABELS } from '../../speech/lines';
import { Digits } from '../ui/Digits';
import { cssVars } from '../ui/cx';
import styles from './NumberHouse.module.css';

/** Розмір будиночка в «дизайнових» пікселях: сцена масштабує його цілим (transform), тож усередині все рахується в цих одиницях. */
export const HOUSE_W = 440;
export const HOUSE_H = 300;

/** number — у віконці число; empty — порожнє (його шукає дитина); answer — відповідь щойно з'явилась у віконці (показ «разом», правильно). */
export type HouseWindow = { kind: 'number'; value: number } | { kind: 'empty' } | { kind: 'answer'; value: number };

export interface NumberHouseProps {
  whole: number;
  left: HouseWindow;
  right: HouseWindow;
  world: WorldKey;
  /** Віконця радіють (правильна відповідь). */
  celebrate?: boolean;
  /** Підпис для екранного диктора. */
  label?: string;
}

function Window({ win, celebrate }: { win: HouseWindow; celebrate: boolean }) {
  return (
    <span className={styles.window} data-kind={win.kind} data-celebrate={celebrate && win.kind === 'answer'} aria-hidden="true">
      {win.kind !== 'empty' && <Digits value={win.value} style={{ height: 84 }} />}
    </span>
  );
}

/** NumberHouse (BRIEF §7 гра 8; design ще не намальовано — зібрано з блоків за описом): дах кольору світу з цілим, під ним два віконця — частини.
 *  Порожнє віконце — пунктир на теплому тлі, без числа (сигнал — наповнення, не лише колір). */
export function NumberHouse({ whole, left, right, world, celebrate = false, label = LABELS.house }: NumberHouseProps) {
  return (
    <div
      className={styles.house}
      role="img"
      aria-label={label}
      style={cssVars({ '--nh-500': `var(--kl-${world}-500)`, '--nh-100': `var(--kl-${world}-100)`, '--nh-700': `var(--kl-${world}-700)` }, { width: HOUSE_W, height: HOUSE_H })}
    >
      <svg className={styles.roof} viewBox="0 0 440 110" aria-hidden="true" focusable="false">
        <polygon points="10,104 220,8 430,104" />
      </svg>
      <span className={styles.tag} aria-hidden="true">
        <Digits value={whole} style={{ height: 46 }} />
      </span>
      <div className={styles.body}>
        <Window win={left} celebrate={celebrate} />
        <Window win={right} celebrate={celebrate} />
      </div>
    </div>
  );
}
