import { useState } from 'react';
import { AnswerTile, CheckButton, Digits, HUD, IconButton, SpeechBubble, type TileState } from '../../components/ui';
import { BUTTONS } from '../../speech/lines';
import styles from './Ui.module.css';

const OPTIONS = [6, 7, 8] as const;

/** /#/dev/ui-frame — мініатюрна сцена для галереї в'юпортів: HUD + бульбашка + лоток із трьох плиток + «Gotowe».
 *  Лише перевірка адаптивності компонентів; справжній шаблон гри — етап M8. */
export function FramePage() {
  const [chosen, setChosen] = useState<number>(7);
  const stateOf = (n: number): TileState => (n === 8 ? 'retry' : n === chosen ? 'selected' : 'default');
  return (
    <div className={styles.scene}>
      <HUD world="w1" filled={3} arriving={2} stripExtra={<IconButton icon="bulb" label={BUTTONS.help} variant="hint" />} />
      <main className={styles.sceneStage}>
        <SpeechBubble variant="talking">
          <Digits value={7} style={{ height: 56 }} />
        </SpeechBubble>
        <div className={styles.tray}>
          {OPTIONS.map((n) => (
            <AnswerTile key={n} value={n} dots={n} state={stateOf(n)} onClick={() => setChosen(n)} />
          ))}
        </div>
        <CheckButton />
      </main>
    </div>
  );
}
