import { Vehicle } from '../../characters/Vehicle';
import { animalUrl } from '../../components/math/art';
import { Digits } from '../../components/ui/Digits';
import { Operator } from '../../components/ui/Operator';
import { addSentence, frogJump, pairSum, rocketFlight } from '../../speech/lines';
import { ANIMALS } from '../../speech/nouns';
import type { GameDef } from '../engine/types';
import { hintJump, togetherJump } from './assist';
import { checkJump, generateFromSpec, landing, type JumpInstance } from './generate';
import { hintRocket, togetherRocket } from './rocketAssist';
import { JumpScene } from './Scene';
import styles from './View.module.css';

/** Репліка: жабка — «Żabka jest na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?»; ракета (W7) — «Rakieta jest na liczbie trzydzieści cztery. Leci o dziesięć dalej. Gdzie wyląduje?» (POLISH_COPY §5). */
const promptOf = (i: JumpInstance): string => (i.vehicle === 'rocket' ? rocketFlight(i.start, i.jumps) : frogJump(i.start, i.jumps));

/** «Skoki żabki» (BRIEF §7 гра 10): жабка на листках (W3–W4) чи ракета на прямій 0–100 (W7) → вибір із 3 плиток → «Gotowe» → «Cztery i trzy to siedem.» */
export const skokiZabki: GameDef<JumpInstance> = {
  id: 'skokiZabki',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: promptOf,
  // бульбашка Kubika: жабка (чи ракета), старт «+» кількість — лише картинка й цифри
  bubble: (i) => (
    <span className={styles.ask}>
      {i.vehicle === 'rocket' ? <Vehicle kind="rakieta" scale={0.35} /> : <img src={animalUrl('zabka')} alt={ANIMALS.zabka.one} draggable={false} />}
      <Digits value={i.start} style={{ height: 30 }} />
      <Operator kind="plus" style={{ height: 26 }} />
      <Digits value={i.jumps} style={{ height: 30 }} />
    </span>
  ),
  sceneLabel: promptOf,
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' ? undefined : value })),
  answer: landing,
  check: checkJump,
  // «Brawo! Cztery i trzy to siedem.» · ракета: «Brawo! Trzydzieści cztery dodać dziesięć równa się czterdzieści cztery.»
  praise: (i, praise) => `${praise} ${i.vehicle === 'rocket' ? addSentence(i.start, i.jumps) : pairSum(i.start, i.jumps)}`,
  hint: (i, ctx, info) => (i.vehicle === 'rocket' ? hintRocket(i, ctx, info) : hintJump(i, ctx, info)),
  together: (i, ctx) => (i.vehicle === 'rocket' ? togetherRocket(i, ctx) : togetherJump(i, ctx)),
  Scene: JumpScene,
};
