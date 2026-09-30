import { useState } from 'react';
import { PARENT } from '../../speech/lines';
import { RECIPES, sfx, type SfxName } from '../../speech/sfx';
import { sleep } from './log';
import styles from './Speech.module.css';

const LABELS: Record<SfxName, string> = {
  tap: 'tap — дотик',
  correct: 'correct — правильно',
  retry: 'retry — спробуй ще',
  pop: 'pop — предмет підстрибнув',
  whoosh: 'whoosh — проліт / перехід',
};

/** Звукові ефекти (синтез Web Audio): слухаємо кожен окремо, лічбу вгору й повзунок «Efekty». */
export function SfxPanel() {
  const [volume, setVolume] = useState(sfx.getVolume());

  async function countUp(): Promise<void> {
    for (let i = 0; i < 5; i++) {
      sfx.play('pop', { pitch: i * 2 });
      await sleep(280);
    }
    sfx.play('correct');
  }

  return (
    <section className={styles.panel} aria-labelledby="sfx-h">
      <h2 id="sfx-h" className={styles.h2}>Звукові ефекти</h2>
      <div className={styles.controls}>
        {(Object.keys(RECIPES) as SfxName[]).map((name) => (
          <button key={name} type="button" className={styles.btnGhost} onClick={() => sfx.play(name)}>
            ▶ {LABELS[name]}
          </button>
        ))}
        <button type="button" className={styles.btn} onClick={() => void countUp()}>▶ Лічба: 5 × pop вгору + correct</button>
      </div>
      <label className={styles.field}>
        <span>Гучність ефектів (<span lang="pl">{PARENT.settings.effects}</span>): {Math.round(volume * 100)} %</span>
        <input
          type="range" min={0} max={1} step={0.05} value={volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            sfx.setVolume(v);
          }}
        />
      </label>
      <p className={styles.meta}>
        Ефекти вмикаються першим дотиком і мають бути короткими та м’якими. Claude їх не чує, тож смак оцінює власник.
      </p>
    </section>
  );
}
