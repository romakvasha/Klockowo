import type { ReactNode } from 'react';
import { BUTTONS } from '../../speech/lines';
import type { WorldKey } from '../../speech/nouns';
import { cssVars, cx } from './cx';
import { IconButton } from './IconButton';
import { ProgressBones } from './ProgressBones';
import styles from './HUD.module.css';

export interface HudProps {
  /** Світ задає тло панелі (--kl-wN-50; у бічній смузі — 100). */
  world: WorldKey | 'hub';
  /** Тло панелі: 'world' — колір світу (вітрина, борд etap1/08); 'page' — кремове тло сторінки, як у ігровому шаблоні (design etap2/00–05). */
  tone?: 'world' | 'page';
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

/** Верхня панель гри (BRIEF §7): «Mapa» ліворуч, кісточки по центру, «Posłuchaj» праворуч. Висота 104 (телефон 112).
 *  У 844×390 — бічна смуга 128 px ліворуч із трьома кнопками; кісточки тоді стають рядом 28 px угорі сцени (вона має бути
 *  справа від смуги в гнучкому контейнері-рядку). Відступи від країв ≥ 24 px. */
export function HUD({ world, tone = 'world', filled, total, arriving, onMap, onListen, listenPulse, stripExtra, className }: HudProps) {
  return (
    <header
      className={cx(styles.hud, className)}
      style={cssVars({ '--hud-bg': tone === 'page' ? 'var(--kl-bg)' : `var(--kl-${world}-50)`, '--hud-strip-bg': `var(--kl-${world}-100)` })}
    >
      <IconButton className={styles.map} icon="home" label={BUTTONS.map} onClick={onMap} />
      <ProgressBones className={styles.bones} filled={filled} total={total} arriving={arriving} />
      <IconButton className={styles.listen} icon="speaker" label={BUTTONS.listen} variant="secondary" pulse={listenPulse} onClick={onListen} />
      <div className={styles.extra}>{stripExtra}</div>
    </header>
  );
}
