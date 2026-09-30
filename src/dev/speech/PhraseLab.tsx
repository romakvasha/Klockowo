import { useState } from 'react';
import {
  WORLD_NAMES, addSentence, bridgeTen, countOnPraise, countTouch, feedAnimal, findNumber, frogJump, placeValue,
  praiseCorrect, thereIs, twoGroups, whoHasMore,
} from '../../speech/lines';
import {
  ANIMALS, ANIMAL_IDS, OBJECTS, WORLD_OBJECT_IDS, type AnimalId, type Noun, type ObjectId, type WorldKey,
} from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';
import { quantity } from '../../speech/plural';
import { PhraseRow } from './PhraseRow';
import { say } from './log';
import styles from './Speech.module.css';

const WORLDS = Object.keys(WORLD_OBJECT_IDS) as WorldKey[];
const TABLE_NUMBERS = [0, 1, 2, 3, 5, 12, 21, 22, 25, 100] as const;

function resolveNoun(key: string): Noun {
  const [kind, id] = key.split(':');
  return kind === 'ani' ? ANIMALS[id as AnimalId] : OBJECTS[id as ObjectId];
}

const clampCount = (n: number): number => Math.min(100, Math.max(0, Number.isFinite(n) ? Math.trunc(n) : 0));

/** «Число + предмет → фраза → озвучення»: усі шаблони lines.ts для обраного числа й іменника. */
export function PhraseLab() {
  const [n, setN] = useState(5);
  const [nounKey, setNounKey] = useState('obj:jablko');
  const [animalId, setAnimalId] = useState<AnimalId>('mis');
  const noun = resolveNoun(nounKey);
  const animal = ANIMALS[animalId];

  return (
    <section className={styles.panel} aria-labelledby="lab-h">
      <h2 id="lab-h" className={styles.h2}>Число + предмет → фраза</h2>

      <div className={styles.controls}>
        <button type="button" className={styles.btnGhost} aria-label="Мінус один" onClick={() => setN(clampCount(n - 1))}>−</button>
        <input
          className={styles.num} type="number" inputMode="numeric" min={0} max={100} value={n}
          aria-label="Число" onChange={(e) => setN(clampCount(e.target.valueAsNumber))}
        />
        <button type="button" className={styles.btnGhost} aria-label="Плюс один" onClick={() => setN(clampCount(n + 1))}>+</button>
        <input
          className={styles.slider} type="range" min={0} max={100} value={n}
          aria-label="Число (повзунок)" onChange={(e) => setN(Number(e.target.value))}
        />
      </div>

      <div className={styles.controls}>
        <label className={styles.field}>
          <span>Предмет</span>
          <select value={nounKey} onChange={(e) => setNounKey(e.target.value)}>
            {WORLDS.map((w) => (
              <optgroup key={w} label={`${w.toUpperCase()} · ${WORLD_NAMES[w]}`}>
                {WORLD_OBJECT_IDS[w].map((id) => (
                  <option key={id} value={`obj:${id}`}>{OBJECTS[id].one} ({OBJECTS[id].g})</option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Тваринки">
              {ANIMAL_IDS.map((id) => (
                <option key={id} value={`ani:${id}`}>{ANIMALS[id].one} ({ANIMALS[id].g})</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className={styles.field}>
          <span>Тваринка (для «Daj …»)</span>
          <select value={animalId} onChange={(e) => setAnimalId(e.target.value as AnimalId)}>
            {ANIMAL_IDS.map((id) => (
              <option key={id} value={id}>{ANIMALS[id].one} → {ANIMALS[id].dat}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className={styles.rows}>
        <PhraseRow text={numberWords(n)} label="число словами" />
        <PhraseRow text={quantity(n, noun)} label="число + предмет" />
        <PhraseRow text={quantity(n, noun, true)} label="знахідний (Daj / Policz)" />
        <PhraseRow text={thereIs(n, noun)} label="Jest / Są" />
        <PhraseRow text={praiseCorrect(n, noun)} label="похвала" />
        <PhraseRow text={countTouch(noun)} label="Policz i dotknij" />
        <PhraseRow text={feedAnimal(animal, n, noun)} label="Nakarm zwierzaka (давальний)" />
        <PhraseRow text={whoHasMore(noun)} label="Kto ma więcej?" />
        <PhraseRow text={twoGroups(n, 2, noun)} label="Ile razem? (n і 2)" />
        <PhraseRow text={findNumber(n)} label="Tajemnicza tablica" />
        <PhraseRow text={placeValue(n)} label="розряди" />
        <PhraseRow text={frogJump(n, 3)} label="Skoki żabki (3 стрибки)" />
        <PhraseRow text={countOnPraise(n)} label="лічба далі (родовий)" />
        {n + 2 <= 100 && <PhraseRow text={addSentence(n, 2)} label="додавання (n + 2)" />}
        {n >= 1 && n <= 9 && <PhraseRow text={bridgeTen(n, 13 - n)} label="W4 ★ через десяток" mark="§9" />}
      </ul>

      <h3 className={styles.h3}>Таблиця узгодження для «{noun.one}»</h3>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr><th>n</th><th>m</th><th>f</th><th>n</th><th>число + «{noun.one}»</th></tr>
          </thead>
          <tbody>
            {TABLE_NUMBERS.map((k) => (
              <tr key={k}>
                <td>{k}</td>
                <td lang="pl">{numberWords(k, 'm')}</td>
                <td lang="pl">{numberWords(k, 'f')}</td>
                <td lang="pl">{numberWords(k, 'n')}</td>
                <td>
                  <button type="button" className={styles.cell} lang="pl" onClick={() => void say(quantity(k, noun))}>
                    ▶ {quantity(k, noun)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
