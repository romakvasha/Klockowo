import type { ReactNode } from 'react';
import { BUTTONS } from '../../speech/lines';
import type { WorldKey } from '../../speech/nouns';
import { cssVars, cx } from './cx';
import { IconButton } from './IconButton';
import { ProgressBones } from './ProgressBones';
import styles from './HUD.module.css';

export interface HudProps {
  /** Світ задає тло бічної смуги 844×390 (--kl-wN-100). Верхня панель прозора: HUD лежить на тлі сцени (полотно D1). */
  world: WorldKey | 'hub';
  /** Скільки з 6 кісточок заповнено (разом із тією, що долітає). */
  filled: number;
  total?: number;
  arriving?: number | null;
  onMap?: () => void;
  onListen?: () => void;
  /** «Posłuchaj» пульсує один раз, коли голос договорив нову інструкцію. */
  listenPulse?: boolean;
  /** Кнопки лише для бічної смуги 844×390 («Pomóż mi» стоїть під «Posłuchaj»); в інших розкладках не показуються. */
  stripExtra?: ReactNode;
  className?: string;
}

/** Верхня панель гри (BRIEF §7, полотно D1): помаранчева «Mapa» ліворуч, кісточки на білій картці по центру, синя «Posłuchaj» праворуч.
 *  Висота 104 (телефон 112). У 844×390 — бічна смуга 128 px ліворуч із трьома кнопками; кісточки тоді стають рядом 26 px угорі сцени
 *  (вона має бути справа від смуги в гнучкому контейнері-рядку). Відступи від країв ≥ 24 px. */
export function HUD({ world, filled, total, arriving, onMap, onListen, listenPulse, stripExtra, className }: HudProps) {
  return (
    <header className={cx(styles.hud, className)} style={cssVars({ '--hud-strip-bg': `var(--kl-${world}-100)` })}>
      <IconButton className={styles.map} icon="home" label={BUTTONS.map} onClick={onMap} />
      <ProgressBones className={styles.bones} filled={filled} total={total} arriving={arriving} />
      <IconButton className={styles.listen} icon="speaker" label={BUTTONS.listen} pulse={listenPulse} onClick={onListen} />
      <div className={styles.extra}>{stripExtra}</div>
    </header>
  );
}
