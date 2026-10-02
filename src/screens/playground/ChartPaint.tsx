import { useState } from 'react';
import { PAINT_COLORS, type ChartCell } from '../../components/math/ChartGrid';
import { IconButton } from '../../components/ui/IconButton';
import { PLAYGROUND } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { ChartStage } from './ChartStage';
import styles from './Playground.module.css';

/** Вільна гра: розфарбовування таблиці 100 (PEDAGOGY §1, BRIEF §10 «розфарбована (4 кольори)»). Вибираєш колір, торкаєшся клітинок лупи — число озвучується; повторний дотик тим самим кольором стирає.
 *  Рядок перемикають кнопки «вгору/вниз». Нічого не зберігається — це малювання, не завдання. */
export function ChartPaint() {
  const [row, setRow] = useState(0);
  const [color, setColor] = useState(0);
  const [cells, setCells] = useState<Readonly<Record<number, number>>>({});

  const press = (n: number) => {
    sfx.play('pop');
    void tts.speak(numberWords(n), { interrupt: true });
    setCells((prev) => {
      const next = { ...prev };
      if (next[n] === color) delete next[n];
      else next[n] = color;
      return next;
    });
  };
  const state = (n: number): ChartCell => (cells[n] === undefined ? 'normal' : 'painted');

  return (
    <div className={styles.activity}>
      <ChartStage world="w6" row={row} onRow={(r) => setRow(Math.max(0, Math.min(9, r)))} state={state} paint={(n) => cells[n] ?? 0} onPress={press} />
      <div className={styles.palette} role="radiogroup" aria-label={PLAYGROUND.colour}>
        {PAINT_COLORS.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === i}
            aria-label={`${PLAYGROUND.colour} ${numberWords(i + 1)}`}
            className={`kl-block ${styles.swatch}`}
            data-active={color === i}
            style={{ background: c }}
            onClick={() => setColor(i)}
          />
        ))}
        <IconButton icon="retry" label={PLAYGROUND.clear} variant="retry" size={72} onClick={() => setCells({})} />
      </div>
    </div>
  );
}
