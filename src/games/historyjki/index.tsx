import { ObjectArt } from '../../components/math/ObjectArt';
import { addSentence } from '../../speech/lines';
import { storyCombine, storyJoin } from '../../speech/stories';
import type { GameDef } from '../engine/types';
import { hintStory, togetherStory } from './assist';
import { checkStory, generateFromSpec, storyAnswer, type StoryInstance } from './generate';
import { StoryScene } from './View';
import styles from './View.module.css';

/** Усе, що читає голос: «Posłuchaj historyjki. W stawie pływają dwie rybki. Przypływają jeszcze trzy. Ile rybek jest teraz w stawie?» (або «Na obrazku są …»). */
const promptOf = (i: StoryInstance): string => (i.kind === 'join' ? storyJoin(i.object, i.a, i.b).full : storyCombine(i.object, i.other, i.a, i.b));

/** «Historyjki» (BRIEF §7 гра 14): історія на 3 кадри → вибір із 3 плиток → «Gotowe» → «Brawo! Dwa dodać trzy równa się pięć.» і картка з прикладом. */
export const historyjki: GameDef<StoryInstance> = {
  id: 'historyjki',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: promptOf,
  // бульбашка Kubika: предмет(и) історії й «?»
  bubble: (i) => (
    <span className={styles.ask}>
      <ObjectArt object={i.object} size={52} />
      {i.kind === 'combine' && <ObjectArt object={i.other} size={52} />}
      <b>?</b>
    </span>
  ),
  sceneLabel: promptOf,
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' ? undefined : value })),
  answer: storyAnswer,
  check: checkStory,
  praise: (i, praise) => `${praise} ${addSentence(i.a, i.b)}`,
  hint: hintStory,
  together: togetherStory,
  Scene: StoryScene,
};
