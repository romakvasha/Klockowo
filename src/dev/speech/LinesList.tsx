import { useRef } from 'react';
import {
  BREAK_EXERCISES, FROM_COPY_9, SPOKEN_LINES,
  addSentence, breakLine, bridgeTen, countByTens, countOnPraise, countTouch, feedAnimal, findNumber, frogJump, gateQuestion,
  houseQuestion, howManyMissing, missionLine, pairSum, placeValue, praiseCorrect, thereIs, twoGroups, whoHasMore,
} from '../../speech/lines';
import { ANIMALS, OBJECTS } from '../../speech/nouns';
import { tts } from '../../speech/tts';
import { PhraseRow } from './PhraseRow';
import { sleep } from './log';
import styles from './Speech.module.css';

const GROUPS = [...new Set(SPOKEN_LINES.map((l) => l.group))];

/** Приклади шаблонів — дослівно ті, що наведені в BRIEF (власник перевіряє їх на слух). */
const TEMPLATE_EXAMPLES: readonly { label: string; text: string }[] = [
  { label: 'BRIEF §4 · 1', text: thereIs(1, OBJECTS.biedronka) },
  { label: 'BRIEF §4 · 3', text: thereIs(3, OBJECTS.biedronka) },
  { label: 'BRIEF §4 · 7', text: thereIs(7, OBJECTS.biedronka) },
  { label: 'BRIEF §4 · 0', text: thereIs(0, OBJECTS.jablko) },
  { label: 'BRIEF §4 · лічба далі', text: countOnPraise(5) },
  { label: 'BRIEF §7 · правильно', text: praiseCorrect(5, OBJECTS.jablko) },
  { label: 'BRIEF §7 · гра 1', text: countTouch(OBJECTS.biedronka) },
  { label: 'BRIEF §7 · гра 5', text: feedAnimal(ANIMALS.mis, 5, OBJECTS.jablko) },
  { label: 'BRIEF §7 · гра 6', text: whoHasMore(OBJECTS.marchewka) },
  { label: 'BRIEF §7 · гра 7', text: pairSum(7, 3) },
  { label: 'BRIEF §7 · гра 8', text: houseQuestion(8, 3) },
  { label: 'BRIEF §7 · гра 9', text: twoGroups(3, 2, OBJECTS.jablko) },
  { label: 'BRIEF §7 · гра 9', text: addSentence(3, 2) },
  { label: 'BRIEF §7 · гра 10', text: frogJump(4, 3) },
  { label: 'BRIEF §7 · гра 11', text: howManyMissing(10) },
  { label: 'BRIEF §7 · гра 12', text: countByTens(2) },
  { label: 'BRIEF §7 · гра 12', text: placeValue(47) },
  { label: 'BRIEF §7 · гра 13', text: findNumber(47) },
  { label: 'BRIEF §6.11 · перерва', text: breakLine(BREAK_EXERCISES[0].verb, BREAK_EXERCISES[0].n) },
  { label: 'BRIEF §6.11 · перерва', text: breakLine(BREAK_EXERCISES[1].verb, BREAK_EXERCISES[1].n) },
  { label: 'BRIEF §6.11 · перерва', text: breakLine(BREAK_EXERCISES[2].verb, BREAK_EXERCISES[2].n) },
  { label: 'BRIEF §6.14 · бар’єр (без озвучення)', text: gateQuestion(7, 8) },
  { label: 'POLISH_COPY §9 · W4 ★', text: bridgeTen(8, 5) },
  { label: 'POLISH_COPY §8 · до двадцяти', text: howManyMissing(20) },
  { label: 'M7 · місія [do sprawdzenia]', text: missionLine('biedronka', OBJECTS.biedronka) },
  { label: 'M7 · місія [do sprawdzenia]', text: missionLine('jablko', OBJECTS.jablko) },
  { label: 'M7 · місія [do sprawdzenia]', text: missionLine('rakieta', OBJECTS.rakieta) },
];

/** Усі статичні репліки з lines.ts за групами + приклади шаблонів. Рядки з POLISH_COPY §9 позначено. */
export function LinesList() {
  const run = useRef(0);

  async function playSection9(): Promise<void> {
    const id = ++run.current;
    tts.cancel();
    for (const text of FROM_COPY_9) {
      if (run.current !== id) return;
      if ((await tts.speak(text)) !== 'spoken') return;
      await sleep(500);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="lines-h">
      <h2 id="lines-h" className={styles.h2}>Репліки з lines.ts</h2>
      <div className={styles.controls}>
        <button type="button" className={styles.btn} onClick={() => void playSection9()}>
          ▶ Усі рядки §9 по черзі ({FROM_COPY_9.size})
        </button>
        <button type="button" className={styles.btnGhost} onClick={() => { run.current++; tts.cancel(); }}>■ Стоп</button>
      </div>
      <p className={styles.meta}>
        Позначка «§9» — рядки, яких немає в BRIEF (затверджені Claude у POLISH_COPY §9; остаточно — за власником, на слух).
        Праворуч сірим — ім’я файла-заміни в public/audio/ (додайте його в manifest.json).
      </p>

      {GROUPS.map((group) => (
        <div key={group}>
          <h3 className={styles.h3}>{group}</h3>
          <ul className={styles.rows}>
            {SPOKEN_LINES.filter((l) => l.group === group).map((l) => (
              <PhraseRow key={`${group}.${l.key}`} text={l.text} label={l.key} mark={FROM_COPY_9.has(l.text) ? '§9' : undefined} />
            ))}
          </ul>
        </div>
      ))}

      <h3 className={styles.h3}>Шаблони: приклади з BRIEF</h3>
      <ul className={styles.rows}>
        {TEMPLATE_EXAMPLES.map((e) => (
          <PhraseRow key={e.label + e.text} text={e.text} label={e.label} mark={FROM_COPY_9.has(e.text) ? '§9' : undefined} />
        ))}
      </ul>
    </section>
  );
}
