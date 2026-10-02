import { ObjectArt } from '../../components/math/ObjectArt';
import { feedAnimal, praiseCorrect } from '../../speech/lines';
import { ANIMALS, OBJECTS } from '../../speech/nouns';
import type { GameDef, SceneProps } from '../engine/types';
import { hintFeed, togetherFeed } from './assist';
import { checkFeed, generateFromSpec, type FeedInstance } from './generate';
import { BoxFeedScene } from './BoxView';
import { FeedScene } from './View';
import styles from './View.module.css';

/** W5 — запас із коробками по 10 (`boxes`), інакше — предмети поштучно. */
const FeedOrBoxes = (props: SceneProps<FeedInstance>) => (props.instance.boxes ? <BoxFeedScene {...props} /> : <FeedScene {...props} />);

/** «Nakarm zwierzaka» (BRIEF §7 гра 5): «Daj misiowi pięć jabłek.» → дитина кладе їжу на тарілку → «Gotowe». Дотик до тарілки знімає один предмет. */
export const nakarmZwierzaka: GameDef<FeedInstance> = {
  id: 'nakarmZwierzaka',
  kind: 'build',
  generate: generateFromSpec,
  prompt: (i) => feedAnimal(ANIMALS[i.animal], i.n, OBJECTS[i.food]),
  // бульбашка Kubika: їжа, яку несемо тваринці
  bubble: (i) => (
    <span className={styles.ask}>
      <ObjectArt object={i.food} size={64} />
    </span>
  ),
  sceneLabel: (i) => feedAnimal(ANIMALS[i.animal], i.n, OBJECTS[i.food]),
  tiles: () => [],
  answer: (i) => i.n,
  check: checkFeed,
  // «Brawo! Pięć jabłek.» (BRIEF §7 «Правильно»)
  praise: (i, praise) => praiseCorrect(i.n, OBJECTS[i.food], praise),
  hint: hintFeed,
  together: togetherFeed,
  Scene: FeedOrBoxes,
};
