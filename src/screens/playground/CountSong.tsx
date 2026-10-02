import { useEffect, useRef, useState } from 'react';
import { COUNT_GAP_MS, countSequence, type CountMode } from '../../curriculum/countSong';
import { IconButton } from '../../components/ui/IconButton';
import type { ChartCell } from '../../components/math/ChartGrid';
import { rowOf } from '../../components/math/chartLayout';
import { PLAYGROUND } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { tts } from '../../speech/tts';
import { ChartStage } from './ChartStage';
import styles from './Playground.module.css';

/** «Liczymy do stu» (PEDAGOGY §1: лічба до 100 вигукується раніше, ніж розуміється — і це нормально): Kubik лічить голосом по одному чи десятками, на таблиці світиться поточне число,
 *  а лупа йде за ним. Зупинити можна будь-коли; голос завжди договорює число. */
export function CountSong() {
  const [row, setRow] = useState(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [mode, setMode] = useState<CountMode | null>(null);
  const token = useRef(0);

  const stop = () => {
    token.current += 1;
    tts.cancel();
    setMode(null);
  };
  useEffect(() => () => {
    token.current += 1;
    tts.cancel();
  }, []);

  const play = async (m: CountMode) => {
    const mine = ++token.current;
    setMode(m);
    for (const n of countSequence(m)) {
      if (token.current !== mine) return;
      setCurrent(n);
      setRow(rowOf(n));
      const result = await tts.speak(numberWords(n), { interrupt: true });
      // без голосу (немає польського голосу чи дотику) число світиться трохи довше, щоб його можна було прочитати
      await new Promise((resolve) => window.setTimeout(resolve, COUNT_GAP_MS[m] + (result === 'skipped' ? 450 : 0)));
    }
    if (token.current === mine) setMode(null);
  };

  const state = (n: number): ChartCell => (n === current ? 'hl' : 'normal');
  return (
    <div className={styles.activity}>
      <ChartStage world="w6" row={row} onRow={(r) => setRow(Math.max(0, Math.min(9, r)))} state={state} />
      <div className={styles.palette}>
        <button type="button" className={`kl-block ${styles.song}`} data-active={mode === 'ones'} disabled={mode !== null} aria-label={PLAYGROUND.ones} onClick={() => void play('ones')}>
          <span aria-hidden="true">1 2 3</span>
        </button>
        <button type="button" className={`kl-block ${styles.song}`} data-active={mode === 'tens'} disabled={mode !== null} aria-label={PLAYGROUND.tens} onClick={() => void play('tens')}>
          <span aria-hidden="true">10 20 30</span>
        </button>
        <IconButton icon="close" label={PLAYGROUND.stop} variant="neutral" size={72} disabled={mode === null} onClick={stop} />
      </div>
    </div>
  );
}
