import type { ReactNode } from 'react';
import { cx } from '../components/ui/cx';
import { Icon } from '../components/ui/Icon';
import { SpeechBubble } from '../components/ui/SpeechBubble';
import type { WorldKey } from '../speech/nouns';
import { Kubik } from './Kubik';
import { mascotPose, type MascotState, type PointingDirection } from './poses';
import styles from './MascotStage.module.css';

export interface MascotStageProps {
  /** idle — чекає; talking — інструкція (рот A/O/E); pointing — на лоток чи предмет; hint — «Patrz, pokażę ci.» (лампочка);
   *  retry — «Spróbujmy jeszcze raz!» / «Prawie!» (стрілка); together — «Pomogę ci. Zrobimy to razem.»; correct — радіє. */
  state?: MascotState;
  /** Аксесуар світу (W1…W7). */
  world?: WorldKey | null;
  pointing?: PointingDirection;
  /** Вміст бульбашки: лише іконки або цифри (предмет + «?», число). hint і retry мають власні значки. */
  bubble?: ReactNode;
  /** Kubik говорить зараз (зазвичай `useTts().speaking`); за замовчуванням — лише в стані talking. */
  speaking?: boolean;
  /** Число на картці в стані together. */
  card?: number;
  className?: string;
}

function StageBubble({ state, bubble }: Pick<MascotStageProps, 'state' | 'bubble'>) {
  if (state === 'hint') {
    return (
      <SpeechBubble variant="hint" className={styles.bubble}>
        <Icon name="bulb" className={styles.bubbleIcon} />
      </SpeechBubble>
    );
  }
  if (state === 'retry') {
    return (
      <SpeechBubble variant="retry" className={styles.bubble}>
        <Icon name="retry" className={cx(styles.bubbleIcon, styles.retryIcon)} />
      </SpeechBubble>
    );
  }
  return bubble ? <SpeechBubble className={styles.bubble}>{bubble}</SpeechBubble> : null;
}

/** Kubik + бульбашка в нижньому лівому куті сцени (BRIEF §7, design etap2/06): ПК 184 px, планшет 150/120, телефон 100;
 *  у 844×390 прихований і виїжджає знизу (300 мс) лише для hint і together. Кубик — єдиний «зайвий» рух під час завдання. */
export function MascotStage({ state = 'idle', world = null, pointing = 'down', bubble, speaking, card, className }: MascotStageProps) {
  return (
    <div className={cx(styles.stage, className)} data-state={state}>
      <Kubik pose={mascotPose(state, pointing)} accessory={world} card={card} talking={speaking ?? state === 'talking'} />
      <StageBubble state={state} bubble={bubble} />
    </div>
  );
}
