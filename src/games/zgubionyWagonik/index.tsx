import { TrainWagon } from '../../components/math/TrainWagon';
import { GAME_PROMPTS, LABELS, praiseEcho } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { GameDef } from '../engine/types';
import { hintTrain, togetherTrain } from './assist';
import { checkTrain, generateFromSpec, type TrainInstance } from './generate';
import { TrainScene } from './View';
import styles from './View.module.css';

/** «Zgubiony wagonik» (BRIEF §7 гра 4): «Jakiej liczby brakuje w pociągu?» → вибір із 3 плиток → «Gotowe» → вагончик заїжджає на місце. */
export const zgubionyWagonik: GameDef<TrainInstance> = {
  id: 'zgubionyWagonik',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: (i) => (i.backwards ? GAME_PROMPTS.wagonBack : GAME_PROMPTS.wagon),
  // бульбашка Kubika: порожнє місце «?» у вагоні
  bubble: () => (
    <span className={styles.ask}>
      <TrainWagon value={null} size={84} label={LABELS.wagonGap} />
    </span>
  ),
  sceneLabel: () => LABELS.train,
  // крапки під цифрою лише для малих чисел (W1 — до десяти): для десятків їх було б забагато
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' || value > 10 ? undefined : value })),
  answer: (i) => i.missing,
  check: checkTrain,
  // «Brawo! Pięć.» — голос повторює відповідь
  praise: (i, praise) => praiseEcho(numberWords(i.missing), praise),
  hint: hintTrain,
  together: togetherTrain,
  Scene: TrainScene,
};
