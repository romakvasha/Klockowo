import { Digits } from '../../components/ui/Digits';
import { Operator } from '../../components/ui/Operator';
import { houseQuestion, pairSum } from '../../speech/lines';
import type { GameDef } from '../engine/types';
import { hintHouse, togetherHouse } from './assist';
import { checkHouse, generateFromSpec, houseAnswer, type HouseInstance } from './generate';
import { HouseScene } from './View';
import styles from './View.module.css';

/** «Domek liczb» (BRIEF §7 гра 8): «Osiem to trzy i ile?» → вибір із 3 плиток → «Gotowe» → «Trzy i pięć to osiem.» */
export const domekLiczb: GameDef<HouseInstance> = {
  id: 'domekLiczb',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: (i) => houseQuestion(i.whole, i.known),
  // бульбашка Kubika: ціле = частини, порожнє місце — «?» (в порядку віконець)
  bubble: (i) => {
    const part = <Digits value={i.known} style={{ height: 30 }} />;
    const unknown = <b>?</b>;
    return (
      <span className={styles.ask}>
        <Digits value={i.whole} style={{ height: 30 }} />
        <Operator kind="equals" style={{ height: 26 }} />
        {i.missing === 'left' ? unknown : part}
        <Operator kind="plus" style={{ height: 26 }} />
        {i.missing === 'left' ? part : unknown}
      </span>
    );
  },
  sceneLabel: (i) => houseQuestion(i.whole, i.known),
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' ? undefined : value })),
  answer: houseAnswer,
  check: checkHouse,
  // «Brawo! Trzy i pięć to osiem.»
  praise: (i, praise) => `${praise} ${pairSum(i.known, houseAnswer(i))}`,
  hint: hintHouse,
  together: togetherHouse,
  Scene: HouseScene,
};
