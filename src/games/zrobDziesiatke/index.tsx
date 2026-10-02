import { Digits } from '../../components/ui/Digits';
import { Operator } from '../../components/ui/Operator';
import { GAME_PROMPTS, howManyMissing, pairSum } from '../../speech/lines';
import type { GameDef } from '../engine/types';
import { hintTen, togetherTen } from './assist';
import { TEN, checkTen, generateFromSpec, missing, type TenInstance } from './generate';
import { TenScene } from './View';
import styles from './View.module.css';

/** «Ile brakuje do dziesięciu? Dołóż tyle, żeby było dziesięć.» (POLISH_COPY §5, гра 11) */
const promptOf = (): string => `${howManyMissing(TEN)} ${GAME_PROMPTS.makeTen}`;

/** «Zrób dziesiątkę» (BRIEF §7 гра 11): рамка-десятка → дитина докладає фішки → «Gotowe» → «Brawo! Siedem i trzy to dziesięć.» */
export const zrobDziesiatke: GameDef<TenInstance> = {
  id: 'zrobDziesiatke',
  kind: 'build',
  generate: generateFromSpec,
  prompt: promptOf,
  // бульбашка Kubika: «n + ? = 10» — лише цифри й знаки
  bubble: (i) => (
    <span className={styles.ask}>
      <Digits value={i.known} style={{ height: 30 }} />
      <Operator kind="plus" style={{ height: 26 }} />
      <b>?</b>
      <Operator kind="equals" style={{ height: 26 }} />
      <Digits value={TEN} style={{ height: 30 }} />
    </span>
  ),
  sceneLabel: promptOf,
  tiles: () => [],
  answer: missing,
  check: checkTen,
  // «Brawo! Siedem i trzy to dziesięć.»
  praise: (i, praise) => `${praise} ${pairSum(i.known, missing(i))}`,
  hint: hintTen,
  together: togetherTen,
  Scene: TenScene,
};
