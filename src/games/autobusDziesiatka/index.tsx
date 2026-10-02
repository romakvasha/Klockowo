import { animalUrl } from '../../components/math/art';
import { GAME_PROMPTS, LABELS, pairSum } from '../../speech/lines';
import type { GameDef } from '../engine/types';
import { hintBus, introBus, togetherBus } from './assist';
import { BUS_CAPACITY, busAnswer, checkBus, generateFromSpec, type BusInstance } from './generate';
import { BusScene } from './View';
import styles from './View.module.css';

/** «Autobus dziesiątka» (BRIEF §7 гра 7): «Ile miejsc jest wolnych?» → вибір із 3 плиток → «Gotowe» → «Siedem i trzy to dziesięć.» */
export const autobusDziesiatka: GameDef<BusInstance> = {
  id: 'autobusDziesiatka',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: (i) => (i.ask === 'full' ? GAME_PROMPTS.busFull : GAME_PROMPTS.busFree),
  // бульбашка Kubika: тваринка з автобуса й «?»
  bubble: (i) => (
    <span className={styles.ask}>
      <img className={styles.askAnimal} src={animalUrl(i.mascot)} alt="" draggable={false} />
      <b>?</b>
    </span>
  ),
  sceneLabel: () => LABELS.bus,
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' ? undefined : value })),
  answer: (i) => busAnswer(i.passengers, i.ask),
  check: checkBus,
  // «Brawo! Siedem i trzy to dziesięć.»
  praise: (i, praise) => `${praise} ${pairSum(i.passengers, BUS_CAPACITY - i.passengers)}`,
  intro: introBus,
  hint: hintBus,
  together: togetherBus,
  Scene: BusScene,
};
