import { animalUrl } from '../../components/math/art';
import { Digits } from '../../components/ui/Digits';
import { Operator } from '../../components/ui/Operator';
import { frogJump, pairSum } from '../../speech/lines';
import { ANIMALS } from '../../speech/nouns';
import type { GameDef } from '../engine/types';
import { hintJump, togetherJump } from './assist';
import { checkJump, generateFromSpec, landing, type JumpInstance } from './generate';
import { PondScene } from './View';
import styles from './View.module.css';

/** «Skoki żabki» (BRIEF §7 гра 10): «Żabka jest na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?» → вибір із 3 плиток → «Gotowe» → «Cztery i trzy to siedem.» */
export const skokiZabki: GameDef<JumpInstance> = {
  id: 'skokiZabki',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: (i) => frogJump(i.start, i.jumps),
  // бульбашка Kubika: жабка, старт «+» кількість стрибків — лише картинка й цифри
  bubble: (i) => (
    <span className={styles.ask}>
      <img src={animalUrl('zabka')} alt={ANIMALS.zabka.one} draggable={false} />
      <Digits value={i.start} style={{ height: 30 }} />
      <Operator kind="plus" style={{ height: 26 }} />
      <Digits value={i.jumps} style={{ height: 30 }} />
    </span>
  ),
  sceneLabel: (i) => frogJump(i.start, i.jumps),
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' ? undefined : value })),
  answer: landing,
  check: checkJump,
  // «Brawo! Cztery i trzy to siedem.»
  praise: (i, praise) => `${praise} ${pairSum(i.start, i.jumps)}`,
  hint: hintJump,
  together: togetherJump,
  Scene: PondScene,
};
