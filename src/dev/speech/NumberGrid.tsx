import { useEffect, useRef, useState } from 'react';
import { numberWords } from '../../speech/numberWords';
import { tts } from '../../speech/tts';
import { say, sleep } from './log';
import styles from './Speech.module.css';

const NUMBERS = Array.from({ length: 101 }, (_, i) => i);
// Легко сплутати на слух (POLISH_COPY §8): говоримо повільніше (≈0,85) і з паузою
const CONFUSING: readonly (readonly [number, number])[] = [[13, 30], [14, 40], [15, 50], [16, 60], [17, 70], [18, 80], [19, 90]];
const PAIR_RATE = 0.85 / 0.9;

/** Усі числа 0–100: кожне озвучується окремо або послідовно — для перевірки вимови обраного голосу. */
export function NumberGrid() {
  const run = useRef(0);
  const [current, setCurrent] = useState<number | null>(null);

  const stop = (): void => {
    run.current++;
    tts.cancel();
    setCurrent(null);
  };
  useEffect(
    () => () => {
      run.current++;
      tts.cancel();
    },
    [],
  );

  async function playRange(from: number, to: number): Promise<void> {
    const id = ++run.current;
    tts.cancel();
    for (let n = from; n <= to; n++) {
      if (run.current !== id) return;
      setCurrent(n);
      const result = await tts.speak(numberWords(n));
      if (result !== 'spoken' || run.current !== id) break;
      await sleep(350);
    }
    if (run.current === id) setCurrent(null);
  }

  async function playPair([a, b]: readonly [number, number]): Promise<void> {
    const id = ++run.current;
    tts.cancel();
    setCurrent(null);
    if ((await tts.speak(numberWords(a), { rate: PAIR_RATE })) !== 'spoken' || run.current !== id) return;
    await sleep(500);
    if (run.current !== id) return;
    await tts.speak(numberWords(b), { rate: PAIR_RATE });
  }

  return (
    <section className={styles.panel} aria-labelledby="grid-h">
      <h2 id="grid-h" className={styles.h2}>Усі числа 0–100</h2>
      <div className={styles.controls}>
        <button type="button" className={styles.btn} onClick={() => void playRange(0, 100)}>▶ 0–100 по черзі</button>
        <button type="button" className={styles.btnGhost} onClick={() => void playRange(0, 20)}>▶ 0–20</button>
        <button type="button" className={styles.btnGhost} onClick={stop}>■ Стоп</button>
        {current !== null && <span className={styles.ok} role="status">зараз: {current}</span>}
      </div>

      <h3 className={styles.h3}>Легко сплутати (повільніше, з паузою)</h3>
      <div className={styles.controls}>
        {CONFUSING.map((pair) => (
          <button key={pair.join('-')} type="button" className={styles.btnGhost} onClick={() => void playPair(pair)}>
            {pair[0]} ↔ {pair[1]}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {NUMBERS.map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.numCell} ${current === n ? styles.numActive : ''}`}
            onClick={() => {
              run.current++;
              setCurrent(null);
              void say(numberWords(n));
            }}
          >
            <span className={styles.numDigit}>{n}</span>
            <span className={styles.numWord} lang="pl">{numberWords(n)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
