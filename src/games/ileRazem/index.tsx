import { Digits } from '../../components/ui/Digits';
import { Operator } from '../../components/ui/Operator';
import { addSentence, sumQuestion, twoGroups } from '../../speech/lines';
import { OBJECTS } from '../../speech/nouns';
import type { GameDef } from '../engine/types';
import { hintSum, togetherSum } from './assist';
import { checkSum, generateFromSpec, sumAnswer, type SumInstance } from './generate';
import { SumScene } from './View';
import styles from './View.module.css';

/** Репліка-запитання: з предметами — «Trzy jabłka i dwa jabłka. Ile razem?», лише з символами — «Ile to jest trzy dodać dwa?» (POLISH_COPY §8). */
const promptOf = (i: SumInstance): string => (i.symbols ? sumQuestion(i.a, i.b) : twoGroups(i.a, i.b, OBJECTS[i.object]));

/** «Ile razem?» (BRIEF §7 гра 9): два кошики над «3 + 2 = ?» → «Wsyp!» → вибір із 3 плиток → «Gotowe» → «Trzy dodać dwa równa się pięć.» */
export const ileRazem: GameDef<SumInstance> = {
  id: 'ileRazem',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: promptOf,
  // бульбашка Kubika: «a + b» і «?» — лише цифри й знаки
  bubble: (i) => (
    <span className={styles.ask}>
      <Digits value={i.a} style={{ height: 30 }} />
      <Operator kind="plus" style={{ height: 26 }} />
      <Digits value={i.b} style={{ height: 30 }} />
    </span>
  ),
  sceneLabel: promptOf,
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' ? undefined : value })),
  answer: sumAnswer,
  check: checkSum,
  // «Brawo! Trzy dodać dwa równa się pięć.»
  praise: (i, praise) => `${praise} ${addSentence(i.a, i.b)}`,
  hint: hintSum,
  together: togetherSum,
  Scene: SumScene,
};
