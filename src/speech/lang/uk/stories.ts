// Українські «Історійки» (гра 14): ті самі сцени W3, що й польські (speech/stories.ts), — рибки в ставку, мушлі на пляжі, морські зірки на камені, човники біля берега.
// Дієслово: однина для 1, 21… («плаває одна рибка»), множина для решти («плавають дві рибки», «плавають п'ять рибок»).
import type { ObjectId } from '../../nouns';
import type { JoinStory, StoryTemplates } from '../../stories';
import { UK_NOUNS } from './nouns';
import { and, cap, countForm, numberWords, quantity } from './numbers';

const INTRO = 'Послухай історію.';

type Arrival = { verb: readonly [sg: string, pl: string] } | { fixed: string };

interface Scene {
  /** Де це відбувається: «у ставку», «на пляжі». */
  place: string;
  /** Дієслово «є тут» в однині й множині: «плаває» / «плавають». */
  setup: readonly [sg: string, pl: string];
  arrival: Arrival;
}

const SCENES: Partial<Record<ObjectId, Scene>> = {
  rybka: { place: 'у ставку', setup: ['плаває', 'плавають'], arrival: { verb: ['Припливає', 'Припливають'] } },
  muszelka: { place: 'на пляжі', setup: ['лежить', 'лежать'], arrival: { fixed: 'Хвиля приносить' } },
  rozgwiazda: { place: 'на камені', setup: ['сидить', 'сидять'], arrival: { verb: ['Приповзає', 'Приповзають'] } },
  lodka: { place: 'біля берега', setup: ['стоїть', 'стоять'], arrival: { verb: ['Підпливає', 'Підпливають'] } },
};

const agree = (n: number, forms: readonly [string, string]): string => (countForm(n) === 'one' ? forms[0] : forms[1]);

function sceneOf(object: ObjectId) {
  const scene = SCENES[object];
  if (!scene) throw new RangeError(`storyJoin: no story scene for ${object}`);
  return { scene, noun: UK_NOUNS.OBJECTS[object] };
}

export const UK_STORIES: StoryTemplates = {
  intro: INTRO,
  storyJoin(object: ObjectId, a: number, b: number): JoinStory {
    const { scene, noun } = sceneOf(object);
    const setup = `${cap(scene.place)} ${agree(a, scene.setup)} ${quantity(a, noun)}.`;
    // «ще три» без іменника: рід — від предмета; після «приносить» — знахідний («ще одну»)
    const arrival =
      'verb' in scene.arrival
        ? `${agree(b, scene.arrival.verb)} ще ${numberWords(b, noun.g)}.`
        : `${scene.arrival.fixed} ще ${noun.g === 'f' ? numberWords(b, 'f').replace(/одна$/, 'одну') : numberWords(b, noun.g)}.`;
    const question = `Скільки ${noun.many} тепер ${scene.place}?`;
    return { setup, arrival, question, full: `${INTRO} ${setup} ${arrival} ${question}` };
  },
  storyCombine(first: ObjectId, second: ObjectId, a: number, b: number): string {
    const x = sceneOf(first).noun;
    const y = sceneOf(second).noun;
    return `${INTRO} На малюнку ${and(quantity(a, x), quantity(b, y))}. Скільки всього?`;
  },
};
