// Англійські «Little stories» (гра 14): ті самі сцени W3, що й польські (speech/stories.ts) — fish in the pond, shells on the beach, starfish on the rock, boats by the shore.
import type { ObjectId } from '../../nouns';
import type { JoinStory, StoryTemplates } from '../../stories';
import { EN_NOUNS } from './nouns';
import { cap, isOne, numberWords, quantity } from './numbers';

const INTRO = 'Listen to the story.';

type Arrival = { verb: readonly [sg: string, pl: string] } | { fixed: string };

interface Scene {
  place: string;
  /** «is swimming» / «are swimming». */
  setup: readonly [sg: string, pl: string];
  arrival: Arrival;
}

const SCENES: Partial<Record<ObjectId, Scene>> = {
  rybka: { place: 'in the pond', setup: ['is swimming', 'are swimming'], arrival: { verb: ['swims up', 'swim up'] } },
  muszelka: { place: 'on the beach', setup: ['is lying', 'are lying'], arrival: { fixed: 'A wave brings' } },
  rozgwiazda: { place: 'on the rock', setup: ['is sitting', 'are sitting'], arrival: { verb: ['crawls up', 'crawl up'] } },
  lodka: { place: 'by the shore', setup: ['is waiting', 'are waiting'], arrival: { verb: ['sails up', 'sail up'] } },
};

const agree = (n: number, forms: readonly [string, string]): string => (isOne(n) ? forms[0] : forms[1]);

function sceneOf(object: ObjectId) {
  const scene = SCENES[object];
  if (!scene) throw new RangeError(`storyJoin: no story scene for ${object}`);
  return { scene, noun: EN_NOUNS.OBJECTS[object] };
}

export const EN_STORIES: StoryTemplates = {
  intro: INTRO,
  storyJoin(object: ObjectId, a: number, b: number): JoinStory {
    const { scene, noun } = sceneOf(object);
    const setup = `${cap(quantity(a, noun))} ${agree(a, scene.setup)} ${scene.place}.`;
    const arrival =
      'verb' in scene.arrival ? `${cap(numberWords(b))} more ${agree(b, scene.arrival.verb)}.` : `${scene.arrival.fixed} ${numberWords(b)} more.`;
    const question = `How many ${noun.many} are ${scene.place} now?`;
    return { setup, arrival, question, full: `${INTRO} ${setup} ${arrival} ${question}` };
  },
  storyCombine(first: ObjectId, second: ObjectId, a: number, b: number): string {
    const x = sceneOf(first).noun;
    const y = sceneOf(second).noun;
    return `${INTRO} In the picture you can see ${quantity(a, x)} and ${quantity(b, y)}. How many are there altogether?`;
  },
};
