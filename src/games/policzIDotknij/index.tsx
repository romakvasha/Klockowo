import { ObjectArt } from '../../components/math/ObjectArt';
import { countLabel, countTouch, thereIs } from '../../speech/lines';
import { OBJECTS } from '../../speech/nouns';
import type { GameDef } from '../engine/types';
import { hintCount, togetherCount } from './assist';
import { checkCount } from './check';
import { generateFromSpec, type CountInstance } from './generate';
import { CountScene } from './View';
import styles from './View.module.css';

/** «Policz i dotknij» (BRIEF §7 гра 1): «Policz biedronki. Dotykaj po kolei. Ile jest biedronek?» → вибір із 3 плиток → «Gotowe». */
export const policzIDotknij: GameDef<CountInstance> = {
  id: 'policzIDotknij',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: (i) => countTouch(OBJECTS[i.object]),
  bubble: (i) => (
    <span className={styles.ask}>
      <ObjectArt object={i.object} size={56} />
      <b>?</b>
    </span>
  ),
  sceneLabel: (i) => countLabel(OBJECTS[i.object]),
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' ? undefined : value })),
  answer: (i) => i.count,
  check: checkCount,
  // «Brawo! Jest siedem biedronek!» — слово похвали + речення з шаблону BRIEF §4 (PEDAGOGY: «Jest siedem biedronek!»)
  praise: (i, praise) => `${praise} ${thereIs(i.count, OBJECTS[i.object])}`,
  hint: hintCount,
  together: togetherCount,
  Scene: CountScene,
};

