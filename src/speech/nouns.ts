// Словник іменників для лічби (BRIEF §10, POLISH_COPY §8). id збігаються з іменами SVG у design/extracted/svg.
// Форми: one — називний одн.; acc1 — «jedną gruszkę» (знахідний для 1, з числівником);
// few — 2–4, 22–24…; many — 0, 5–21, 25–31… (він же родовий множини: «Ile jest gruszek?»).
import type { Gender } from './numberWords';

export interface Noun {
  g: Gender;
  one: string;
  acc1: string;
  few: string;
  many: string;
}

/** Тваринка: додатково знахідний (`acc`) і давальний (`dat`, для «Daj misiowi…») однини. */
export interface Animal extends Noun {
  acc: string;
  dat: string;
}

export type WorldKey = 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6' | 'w7';

/** 4 предмети кожного світу — у порядку з BRIEF §10. */
export const WORLD_OBJECT_IDS = {
  w1: ['biedronka', 'motyl', 'kwiatek', 'kaczuszka'],
  w2: ['jablko', 'gruszka', 'truskawka', 'marchewka'],
  w3: ['rybka', 'muszelka', 'rozgwiazda', 'lodka'],
  w4: ['auto', 'rower', 'balonik', 'jajko'],
  w5: ['jagoda', 'szyszka', 'grzybek', 'patyczek'],
  w6: ['parasolka', 'tramwaj', 'pilka', 'lizak'],
  w7: ['gwiazdka', 'planeta', 'rakieta', 'kometa'],
} as const satisfies Record<WorldKey, readonly string[]>;

export type ObjectId = (typeof WORLD_OBJECT_IDS)[WorldKey][number];

export const OBJECTS: Record<ObjectId, Noun> = {
  // W1 «Łąka Liczenia»
  biedronka: { g: 'f', one: 'biedronka', acc1: 'jedną biedronkę', few: 'biedronki', many: 'biedronek' },
  motyl: { g: 'm', one: 'motyl', acc1: 'jednego motyla', few: 'motyle', many: 'motyli' },
  kwiatek: { g: 'm', one: 'kwiatek', acc1: 'jeden kwiatek', few: 'kwiatki', many: 'kwiatków' },
  kaczuszka: { g: 'f', one: 'kaczuszka', acc1: 'jedną kaczuszkę', few: 'kaczuszki', many: 'kaczuszek' },
  // W2 «Ogród Cyfr»
  jablko: { g: 'n', one: 'jabłko', acc1: 'jedno jabłko', few: 'jabłka', many: 'jabłek' },
  gruszka: { g: 'f', one: 'gruszka', acc1: 'jedną gruszkę', few: 'gruszki', many: 'gruszek' },
  truskawka: { g: 'f', one: 'truskawka', acc1: 'jedną truskawkę', few: 'truskawki', many: 'truskawek' },
  marchewka: { g: 'f', one: 'marchewka', acc1: 'jedną marchewkę', few: 'marchewki', many: 'marchewek' },
  // W3 «Wyspa Dodawania»
  rybka: { g: 'f', one: 'rybka', acc1: 'jedną rybkę', few: 'rybki', many: 'rybek' },
  muszelka: { g: 'f', one: 'muszelka', acc1: 'jedną muszelkę', few: 'muszelki', many: 'muszelek' },
  rozgwiazda: { g: 'f', one: 'rozgwiazda', acc1: 'jedną rozgwiazdę', few: 'rozgwiazdy', many: 'rozgwiazd' },
  lodka: { g: 'f', one: 'łódka', acc1: 'jedną łódkę', few: 'łódki', many: 'łódek' },
  // W4 «Most Dwudziestki»
  auto: { g: 'n', one: 'auto', acc1: 'jedno auto', few: 'auta', many: 'aut' },
  rower: { g: 'm', one: 'rower', acc1: 'jeden rower', few: 'rowery', many: 'rowerów' },
  balonik: { g: 'm', one: 'balonik', acc1: 'jeden balonik', few: 'baloniki', many: 'baloników' },
  jajko: { g: 'n', one: 'jajko', acc1: 'jedno jajko', few: 'jajka', many: 'jajek' },
  // W5 «Las Dziesiątek»
  jagoda: { g: 'f', one: 'jagoda', acc1: 'jedną jagodę', few: 'jagody', many: 'jagód' },
  szyszka: { g: 'f', one: 'szyszka', acc1: 'jedną szyszkę', few: 'szyszki', many: 'szyszek' },
  grzybek: { g: 'm', one: 'grzybek', acc1: 'jeden grzybek', few: 'grzybki', many: 'grzybków' },
  patyczek: { g: 'm', one: 'patyczek', acc1: 'jeden patyczek', few: 'patyczki', many: 'patyczków' },
  // W6 «Miasto Setki»
  parasolka: { g: 'f', one: 'parasolka', acc1: 'jedną parasolkę', few: 'parasolki', many: 'parasolek' },
  tramwaj: { g: 'm', one: 'tramwaj', acc1: 'jeden tramwaj', few: 'tramwaje', many: 'tramwajów' },
  pilka: { g: 'f', one: 'piłka', acc1: 'jedną piłkę', few: 'piłki', many: 'piłek' },
  lizak: { g: 'm', one: 'lizak', acc1: 'jeden lizak', few: 'lizaki', many: 'lizaków' },
  // W7 «Kosmiczna Droga»
  gwiazdka: { g: 'f', one: 'gwiazdka', acc1: 'jedną gwiazdkę', few: 'gwiazdki', many: 'gwiazdek' },
  planeta: { g: 'f', one: 'planeta', acc1: 'jedną planetę', few: 'planety', many: 'planet' },
  rakieta: { g: 'f', one: 'rakieta', acc1: 'jedną rakietę', few: 'rakiety', many: 'rakiet' },
  kometa: { g: 'f', one: 'kometa', acc1: 'jedną kometę', few: 'komety', many: 'komet' },
};

export const ANIMAL_IDS = ['mis', 'jezyk', 'kotek', 'lisek', 'zajaczek', 'zabka', 'sowa', 'myszka'] as const;
export type AnimalId = (typeof ANIMAL_IDS)[number];

/** 8 тваринок (BRIEF §10). Давальні — POLISH_COPY §8: misiowi, jeżykowi, kotkowi, liskowi, zajączkowi, żabce, sowie, myszce. */
export const ANIMALS: Record<AnimalId, Animal> = {
  mis: { g: 'm', one: 'miś', acc1: 'jednego misia', few: 'misie', many: 'misiów', acc: 'misia', dat: 'misiowi' },
  jezyk: { g: 'm', one: 'jeżyk', acc1: 'jednego jeżyka', few: 'jeżyki', many: 'jeżyków', acc: 'jeżyka', dat: 'jeżykowi' },
  kotek: { g: 'm', one: 'kotek', acc1: 'jednego kotka', few: 'kotki', many: 'kotków', acc: 'kotka', dat: 'kotkowi' },
  lisek: { g: 'm', one: 'lisek', acc1: 'jednego liska', few: 'liski', many: 'lisków', acc: 'liska', dat: 'liskowi' },
  zajaczek: { g: 'm', one: 'zajączek', acc1: 'jednego zajączka', few: 'zajączki', many: 'zajączków', acc: 'zajączka', dat: 'zajączkowi' },
  zabka: { g: 'f', one: 'żabka', acc1: 'jedną żabkę', few: 'żabki', many: 'żabek', acc: 'żabkę', dat: 'żabce' },
  sowa: { g: 'f', one: 'sowa', acc1: 'jedną sowę', few: 'sowy', many: 'sów', acc: 'sowę', dat: 'sowie' },
  myszka: { g: 'f', one: 'myszka', acc1: 'jedną myszkę', few: 'myszki', many: 'myszek', acc: 'myszkę', dat: 'myszce' },
};

/** Розряди для «Cztery dziesiątki i siedem jedności» (POLISH_COPY §8, «Other words that change with the number»). */
export const DZIESIATKA: Noun = { g: 'f', one: 'dziesiątka', acc1: 'jedną dziesiątkę', few: 'dziesiątki', many: 'dziesiątek' };
export const JEDNOSC: Noun = { g: 'f', one: 'jedność', acc1: 'jedną jedność', few: 'jedności', many: 'jedności' };

export function worldObjects(world: WorldKey): readonly ObjectId[] {
  return WORLD_OBJECT_IDS[world];
}
