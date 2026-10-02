// Польські тексти «Historyjki» (BRIEF §7 гра 14, POLISH_COPY §5): продовження lines.ts, винесене окремо через розмір. Усі форми — лише через plural.ts + nouns.ts
// (відмінювання числівника й дієслова за Intl.PluralRules). Сцени W3 — за предметами світу (rybka, muszelka, rozgwiazda, łódka); нові сцени — тут.
// Шаблони, яких немає в BRIEF/POLISH_COPY дослівно, позначено [do sprawdzenia]; спільне з BRIEF: «Posłuchaj historyjki.», «Przylatują jeszcze trzy.», «Ile … jest teraz?».
import { countForm, quantity } from './plural';
import { OBJECTS, type Noun, type ObjectId } from './nouns';
import { numberWords } from './numberWords';

const cap = (s: string): string => s.charAt(0).toLocaleUpperCase('pl') + s.slice(1);

/** «Posłuchaj historyjki.» — вступ перед історією (POLISH_COPY §5). */
export const STORY_INTRO = 'Posłuchaj historyjki.';

/** Як у сцені «приходять» нові: дієслово в однині (1, 5+) і множині (2–4) — «Przypływa jeszcze pięć.» / «Przypływają jeszcze dwie.»; або сталий підмет: «Fala przynosi jeszcze trzy.». */
type Arrival = { verb: readonly [sg: string, pl: string] } | { fixed: string };

interface Scene {
  /** Де це відбувається: «w stawie», «na plaży». */
  place: string;
  /** Дієслово «є тут» в однині й множині: «pływa» / «pływają». */
  setup: readonly [sg: string, pl: string];
  arrival: Arrival;
}

/** Сцени — за предметом. Усі предмети W3 жіночого роду (знахідний числівника 1 — «jedną»). */
const SCENES: Partial<Record<ObjectId, Scene>> = {
  rybka: { place: 'w stawie', setup: ['pływa', 'pływają'], arrival: { verb: ['Przypływa', 'Przypływają'] } },
  muszelka: { place: 'na plaży', setup: ['leży', 'leżą'], arrival: { fixed: 'Fala przynosi' } },
  rozgwiazda: { place: 'na skale', setup: ['siedzi', 'siedzą'], arrival: { verb: ['Przypełza', 'Przypełzają'] } },
  lodka: { place: 'przy brzegu', setup: ['stoi', 'stoją'], arrival: { verb: ['Podpływa', 'Podpływają'] } },
};

/** Предмети, для яких є сцена. */
export const STORY_OBJECTS = Object.keys(SCENES) as ObjectId[];

const agree = (n: number, forms: readonly [string, string]): string => (countForm(n) === 'few' ? forms[1] : forms[0]);

/** Число для «jeszcze …» без іменника: називний («Przypływają jeszcze dwie») або знахідний («Fala przynosi jeszcze jedną»). */
const bare = (n: number, accusative: boolean): string => (n === 1 && accusative ? 'jedną' : numberWords(n, 'f'));

const sceneOf = (object: ObjectId): { scene: Scene; noun: Noun } => {
  const scene = SCENES[object];
  if (!scene) throw new RangeError(`storyJoin: no story scene for ${object}`);
  return { scene, noun: OBJECTS[object] };
};

export interface JoinStory {
  setup: string;
  arrival: string;
  question: string;
  /** Усе, що читає голос: «Posłuchaj historyjki. W stawie pływają dwie rybki. Przypływają jeszcze trzy. Ile rybek jest teraz w stawie?» */
  full: string;
}

/** Історія «додали»: спершу `a`, потім приходять ще `b`. */
export function storyJoin(object: ObjectId, a: number, b: number): JoinStory {
  const { scene, noun } = sceneOf(object);
  const setup = `${cap(scene.place)} ${agree(a, scene.setup)} ${quantity(a, noun)}.`;
  const arrival =
    'verb' in scene.arrival
      ? `${agree(b, scene.arrival.verb)} jeszcze ${bare(b, false)}.`
      : `${scene.arrival.fixed} jeszcze ${bare(b, true)}.`;
  const question = `Ile ${noun.many} jest teraz ${scene.place}?`;
  return { setup, arrival, question, full: `${STORY_INTRO} ${setup} ${arrival} ${question}` };
}

/** Історія «разом»: два набори різних предметів на картинці [do sprawdzenia]. */
export function storyCombine(first: ObjectId, second: ObjectId, a: number, b: number): string {
  const x = sceneOf(first).noun;
  const y = sceneOf(second).noun;
  return `${STORY_INTRO} Na obrazku są ${quantity(a, x)} i ${quantity(b, y)}. Ile jest razem?`;
}
