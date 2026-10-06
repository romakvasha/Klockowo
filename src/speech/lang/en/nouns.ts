// Англійські іменники для лічби — ті самі id, що й польські (nouns.ts). Однина (`one`) і множина (`many`; `few` — та сама), з числом 1 — «one apple».
// Тваринки — з означеним артиклем у `dat` («Give the bear five apples.», «The bear has seven.»). Британська англійська (ladybird).
import type { Animal, AnimalId, Noun, NounTables, ObjectId } from '../../nouns';

const noun = (one: string, many: string): Noun => ({ g: 'n', one, acc: one, acc1: `one ${one}`, few: many, many });
const animal = (one: string, many: string): Animal => ({ ...noun(one, many), acc: `the ${one}`, dat: `the ${one}` });

const OBJECTS: Record<ObjectId, Noun> = {
  // W1 Counting Meadow
  biedronka: noun('ladybird', 'ladybirds'),
  motyl: noun('butterfly', 'butterflies'),
  kwiatek: noun('flower', 'flowers'),
  kaczuszka: noun('duckling', 'ducklings'),
  // W2 Digit Garden — їжа для «Feed the animal»
  jablko: noun('apple', 'apples'),
  gruszka: noun('pear', 'pears'),
  truskawka: noun('strawberry', 'strawberries'),
  marchewka: noun('carrot', 'carrots'),
  // W3 Adding Island
  rybka: noun('fish', 'fish'),
  muszelka: noun('shell', 'shells'),
  rozgwiazda: noun('starfish', 'starfish'),
  lodka: noun('boat', 'boats'),
  // W4 Twenty Bridge
  auto: noun('car', 'cars'),
  rower: noun('bike', 'bikes'),
  balonik: noun('balloon', 'balloons'),
  jajko: noun('egg', 'eggs'),
  // W5 Forest of Tens
  jagoda: noun('berry', 'berries'),
  szyszka: noun('pine cone', 'pine cones'),
  grzybek: noun('mushroom', 'mushrooms'),
  patyczek: noun('stick', 'sticks'),
  // W6 Hundred City
  parasolka: noun('umbrella', 'umbrellas'),
  tramwaj: noun('tram', 'trams'),
  pilka: noun('ball', 'balls'),
  lizak: noun('lollipop', 'lollipops'),
  // W7 Space Road
  gwiazdka: noun('star', 'stars'),
  planeta: noun('planet', 'planets'),
  rakieta: noun('rocket', 'rockets'),
  kometa: noun('comet', 'comets'),
};

const ANIMALS: Record<AnimalId, Animal> = {
  mis: animal('bear', 'bears'),
  jezyk: animal('hedgehog', 'hedgehogs'),
  kotek: animal('kitten', 'kittens'),
  lisek: animal('fox', 'foxes'),
  zajaczek: animal('bunny', 'bunnies'),
  zabka: animal('frog', 'frogs'),
  sowa: animal('owl', 'owls'),
  myszka: animal('mouse', 'mice'),
};

/** Розряди: «Four tens and seven ones make forty-seven.» */
export const EN_NOUNS: NounTables = { OBJECTS, ANIMALS, DZIESIATKA: noun('ten', 'tens'), JEDNOSC: noun('one', 'ones') };
