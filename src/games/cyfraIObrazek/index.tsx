import { ObjectArt } from '../../components/math/ObjectArt';
import { GAME_PROMPTS, praiseEcho } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { GameDef } from '../engine/types';
import { hintMatch, togetherMatch } from './assist';
import { generateFromSpec, type MatchInstance } from './generate';
import { checkMatch, encodeLinks } from './match';
import { MatchScene } from './View';
import styles from './View.module.css';

/** «Cyfra i obrazek» (BRIEF §7 гра 3): «Połącz obrazki z liczbami.» → дитина торкається набору й цифри, поки в усіх наборів не буде пари → «Gotowe». */
export const cyfraIObrazek: GameDef<MatchInstance> = {
  id: 'cyfraIObrazek',
  kind: 'build',
  // відповідь — кодування пар, а не число для порівняння: в історію (answer/wrong) воно не йде
  recordsAnswer: false,
  generate: generateFromSpec,
  prompt: () => GAME_PROMPTS.match,
  // бульбашка Kubika: картинка й «?»
  bubble: (i) => (
    <span className={styles.ask}>
      <ObjectArt object={i.sets[0]!.object} size={56} />
      <b>?</b>
    </span>
  ),
  sceneLabel: () => GAME_PROMPTS.match,
  tiles: () => [],
  answer: (i) => encodeLinks(i.correct),
  check: (i, value) => checkMatch(i.correct, value),
  // «Brawo! Trzy, jeden, dwa.» — голос читає числа наборів за порядком
  praise: (i, praise) => praiseEcho(i.sets.map((s) => numberWords(s.count)).join(', '), praise),
  hint: hintMatch,
  together: togetherMatch,
  Scene: MatchScene,
};
