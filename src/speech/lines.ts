// УСІ польські рядки сайту (CLAUDE.md): дослівно з docs/BRIEF.md; рядки, яких там немає, — з docs/POLISH_COPY.md §9.
// Українська й англійська — у speech/lang/ (див. «Інші мови» нижче); польські тексти тут від них не залежать.
// Числа в репліках — лише словами (numberWords.ts), узгодження — plural.ts + nouns.ts. Нові рядки додавай сюди,
// не в компоненти; нову фразу, якої немає в брифі, познач «[do sprawdzenia]» і спитай власника.
import type { SkillId } from '../curriculum/types';
import type { Animal, Noun, ObjectId, WorldKey } from './nouns';
import { DZIESIATKA, JEDNOSC } from './nouns';
import { DIGIT_INSTRUMENTAL, numberGenitive, numberWords } from './numberWords';
import { isAre, quantity, times } from './plural';

export const SITE_NAME = 'Klockowo';

// ---------- Інші мови (speech/language.ts) ----------
// Польські таблиці нижче — PL_*; експортовані імена (BUTTONS, LABELS…) — живі прив'язки ES-модуля на таблиці поточної мови, тож компоненти
// імпортують ті самі імена й не знають про мову. Шаблони з польськими словами на початку питають `templates`: null — польська (тіло функції).

/** Рядки таблиці: ключі — польської таблиці, значення — будь-який рядок (у кожній мові свій). */
type Strings<T> = { readonly [K in keyof T]: string };
/** Те саме для таблиць з об'єктами (кортеж зберігає довжину). */
type Each<T, V> = { readonly [K in keyof T]: V };

let templates: LineTemplates | null = null;

/** Інша мова підставляє свої шаблони; null — польські. Викликає лише speech/language.ts. */
export function setLineTemplates(next: LineTemplates | null): void {
  templates = next;
}

// ---------- Підписи без голосу ----------
/** Кнопки для дитини — лише іконки; це aria-label, який ще й озвучується при дотику (BRIEF §4). */
const PL_BUTTONS = {
  play: 'Graj!', next: 'Dalej', again: 'Jeszcze raz', listen: 'Posłuchaj', map: 'Mapa', stickers: 'Naklejki',
  done: 'Gotowe', help: 'Pomóż mi', same: 'Tyle samo', pour: 'Wsyp!', pack: 'Zapakuj', close: 'Zamknij',
} as const;

const PL_LABELS = {
  bones: 'kosteczki', // aria-label 6 слотів-кісточок (BRIEF §7)
  review: 'Do powtórki', // вузол-повторення на стежці світу
  badges: 'Odznaki',
  base: 'Baza Drużyny', // тло екрана Start
  abacus: 'liczydło', // рахівниця на 20 (BRIEF §10)
  placeTens: 'dziesiątki', // мат «dziesiątki | jedności»
  placeOnes: 'jedności',
  placeMat: 'mata dziesiątek i jedności', // «Paczki po dziesięć»: мат розрядів [do sprawdzenia]
  removeRod: 'Zdejmij dziesiątkę',
  removeCube: 'Zdejmij jedność',
  addTen: 'Dodaj dziesiątkę',
  addOne: 'Dodaj jedność',
  box: 'pudełko po dziesięć',
  chart: 'tablica stu', // «Tajemnicza tablica»: таблиця 100 [do sprawdzenia]
  chartRow: 'rząd tablicy',
  rowUp: 'Rząd wyżej',
  rowDown: 'Rząd niżej',
  leaf: 'listek',
  looseItems: 'rozsypane przedmioty',
  looseItem: 'przedmiot',
  loading: 'Ładowanie…', // aria-label смужки завантаження (design etap1/13)
  answers: 'Odpowiedzi', // aria-label лотка з плитками-відповідями (design etap2/00)
  dotCard: 'karta z kropkami', // «Błysk!»: картка з крапками (aria-label без числа, щоб не видати відповідь)
  plate: 'talerz', // «Nakarm zwierzaka»: тарілка
  train: 'Pociąg z brakującym wagonem', // «Zgubiony wagonik»: підпис сцени [do sprawdzenia]
  engine: 'lokomotywa',
  wagonGap: 'brakujący wagon',
  set: 'obrazek', // «Cyfra i obrazek»: картка-набір (без числа, щоб не видати відповідь) [do sprawdzenia]
  compare: 'Dwie kupki do porównania', // «Kto ma więcej?»: підпис сцени [do sprawdzenia]
  bus: 'autobus', // «Autobus dziesiątka»: автобус 2×5 місць [do sprawdzenia]
  seatFree: 'wolne miejsce',
  seatTaken: 'zajęte miejsce',
  seatHidden: 'zakryte miejsce',
  house: 'domek liczb', // «Domek liczb»: будиночок з блоків [do sprawdzenia]
  roof: 'dach',
  window: 'okienko',
  windowEmpty: 'puste okienko',
  yard: 'przedmioty pod domkiem',
  frame: 'ramka dziesiątki',
  frameAdd: 'Dołóż żeton', // «Zrób dziesiątkę»: pusta komórka ramki [do sprawdzenia]
  frameRemove: 'Zdejmij żeton',
  pond: 'Staw z liśćmi lilii', // «Skoki żabki»: підпис сцени [do sprawdzenia]
  spaceLine: 'Oś liczbowa od zera do stu', // ракета W7: пряма 0–100 [do sprawdzenia]
  rocket: 'rakieta',
  fly: 'Leć', // ракета: дотик = один етап польоту
  jump: 'Skocz', // жабка: дотик = один стрибок
  basket: 'koszyk', // «Ile razem?»: кошик [do sprawdzenia]
  basketLid: 'koszyk z przykrywką',
  basketMerged: 'wspólny koszyk',
  equation: 'działanie',
  storyFirst: 'pierwszy obrazek', // «Historyjki»: три кадри [do sprawdzenia]
  storySecond: 'drugi obrazek',
  storyQuestion: 'trzeci obrazek',
} as const;

/** aria-label купки-картки «Kto ma więcej?»: «miś — kupka» без числа, щоб не видати відповідь [do sprawdzenia]. */
export function pileLabel(animal: Animal): string {
  if (templates) return templates.pileLabel(animal);
  return `${animal.one} — kupka`;
}

/** aria-label вагона з номером: «wagon pięć» («Zgubiony wagonik»). */
export function wagonLabel(n: number): string {
  if (templates) return templates.wagonLabel(n);
  return `wagon ${numberWords(n)}`;
}

/** aria-label островів Mapy przygody (design etap1/17): «Kosmiczna Droga — zablokowane», «Ogród Cyfr — ukończone», «Wyspa Dodawania — tutaj jesteśmy». */
const PL_ISLAND_STATE_LABELS = { locked: 'zablokowane', completed: 'ukończone', current: 'tutaj jesteśmy' } as const;
export type IslandState = 'locked' | 'open' | 'current' | 'completed';

export function islandLabel(name: string, state: IslandState): string {
  return state === 'open' ? name : `${name} — ${ISLAND_STATE_LABELS[state]}`;
}

/** Аватар дитини на мапі: «Ola — zmień gracza»; без імені — «Profil bez imienia — zmień gracza». */
export function changePlayerLabel(name: string | null): string {
  if (templates) return templates.changePlayerLabel(name);
  return `${name ?? PROFILE_NO_NAME} — zmień gracza`;
}

/** Шестерня Strefa rodzica на екранах дитини: довге натискання, не клік (BRIEF §6.14). */
const PL_PARENT_GEAR_LABEL = 'Strefa rodzica — przytrzymaj 3 sekundy';

/** aria-label станів плитки й картки (design etap1/07): «siedem — dobrze», «osiem — spróbuj jeszcze raz», «zablokowane». */
const PL_TILE_STATE_LABELS = { correct: 'dobrze', retry: 'spróbuj jeszcze raz', locked: 'zablokowane' } as const;

/** Підпис плитки: число словами; для correct/retry — зі станом, для locked — лише «zablokowane». */
export function tileLabel(n: number, state?: string): string {
  if (state === 'locked') return TILE_STATE_LABELS.locked;
  const word = numberWords(n);
  if (state === 'correct') return `${word} — ${TILE_STATE_LABELS.correct}`;
  if (state === 'retry') return `${word} — ${TILE_STATE_LABELS.retry}`;
  return word;
}

/** aria-label ряду кісточок: «kosteczki: 3 z 6». */
export function bonesLabel(filled: number, total: number): string {
  if (templates) return templates.bonesLabel(filled, total);
  return `${LABELS.bones}: ${filled} z ${total}`;
}

/** AvatarButton (design etap1/10): профіль без імені; аватар на Mapa przygody веде до мапи. */
const PL_PROFILE_NO_NAME = 'Profil bez imienia';
export function profileMapLabel(name: string): string {
  if (templates) return templates.profileMapLabel(name);
  return `${name} — mapa`;
}

const PL_WORLD_NAMES: Readonly<Record<WorldKey | 'hub', string>> = {
  w1: 'Łąka Liczenia', w2: 'Ogród Cyfr', w3: 'Wyspa Dodawania', w4: 'Most Dwudziestki',
  w5: 'Las Dziesiątek', w6: 'Miasto Setki', w7: 'Kosmiczna Droga', hub: 'Plac Zabaw',
};

const PL_CHARACTER_NAMES = { kubik: 'Kubik', latka: 'Łatka', pufka: 'Pufka', tofik: 'Tofik', iskra: 'Iskra' } as const;

/** 14 міні-ігор (BRIEF §7) — назви для дорослого (aria, Strefa rodzica). */
const PL_GAME_TITLES = {
  policzIDotknij: 'Policz i dotknij', blysk: 'Błysk!', cyfraIObrazek: 'Cyfra i obrazek',
  zgubionyWagonik: 'Zgubiony wagonik', nakarmZwierzaka: 'Nakarm zwierzaka', ktoMaWiecej: 'Kto ma więcej?',
  autobusDziesiatka: 'Autobus dziesiątka', domekLiczb: 'Domek liczb', ileRazem: 'Ile razem?',
  skokiZabki: 'Skoki żabki', zrobDziesiatke: 'Zrób dziesiątkę', paczkiPoDziesiec: 'Paczki po dziesięć',
  tajemniczaTablica: 'Tajemnicza tablica', historyjki: 'Historyjki',
} as const;

/** 8 цуценят «Twój piesek» (порядок у пікері): порода і репліка при дотику. «Łaciaty» — Łatka, «rudy» — Iskra й Kubik,
 *  тому описи їх не повторюють. Репліки Pudel…Akita — POLISH_COPY §9 (Pudel змінено на «Piesek w loczkach!»). */
const PL_PUPS = [
  { id: 'pon', breed: 'Polski owczarek nizinny', line: 'Kudłaty piesek!' },
  { id: 'nowofundland', breed: 'Nowofundland', line: 'Czarny piesek!' },
  { id: 'pudel', breed: 'Pudel', line: 'Piesek w loczkach!' },
  { id: 'chart', breed: 'Chart polski', line: 'Szybki piesek!' },
  { id: 'papillon', breed: 'Papillon', line: 'Piesek z uszkami jak motylek!' },
  { id: 'shihtzu', breed: 'Shih tzu', line: 'Piesek z kokardką!' },
  { id: 'sharpei', breed: 'Shar-pei', line: 'Pomarszczony piesek!' },
  { id: 'akita', breed: 'Akita pręgowana', line: 'Piesek w paski!' },
] as const;

// ---------- Репліки голосу (статичні) ----------
const PL_START_LINES = {
  whoPlays: 'Kto dziś gra?', choosePup: 'Wybierz swojego pieska!', welcome: 'Witaj w drużynie!',
} as const;

const PL_MISSION_LINES = {
  slogan: 'Łapki w górę, liczymy!',
  showIdea: 'Patrz, pokażę ci.',
  ducklings: 'Kaczuszki się zgubiły! Pomożesz je policzyć?',
  fish: 'Rybki zgubiły drogę do domu! Pomożesz?', // W3, Pufka (§9)
} as const;

/** Похвала; «Liczysz dalej…» — шаблон `countOnPraise`. */
const PL_PRAISE = ['Brawo!', 'Świetnie!', 'Udało się!', 'Pięknie policzone!'] as const;

const PL_FEEDBACK_LINES = {
  retry: 'Spróbujmy jeszcze raz!', // 1-ша помилка
  almost: 'Prawie!', // замість retry — лише коли відповідь відрізняється на 1
  together: 'Pomogę ci. Zrobimy to razem.', // 2-га помилка
  show: 'Patrz, pokażę ci.', // «Pomóż mi»
} as const;

const PL_LEVEL_LINES = {
  missionDone: 'Misja wykonana! Ten poziom za nami!',
  newSticker: 'Masz nową naklejkę!',
  worldDone: 'Wszystkie misje w tym świecie wykonane!',
  diligence: 'Nie poddajesz się!', // значок за старанність
} as const;

/** aria-label вузлів «Ścieżka świata» (design etap2/14–16) і скрині світу (etap2/06). */
const PL_NODE_LABELS = {
  done: 'Poziom ukończony — zagraj jeszcze raz', next: 'Następny poziom', locked: 'Poziom zablokowany',
  star: 'Zadanie dodatkowe', starLocked: 'Zadanie dodatkowe — zablokowane', review: PL_LABELS.review,
} as const;
const PL_CHEST_LABELS = { locked: 'Skrzynia zamknięta', ready: 'Skrzynia gotowa', open: 'Skrzynia otwarta' } as const;

/** Вступ до світу (POLISH_COPY §3): звучить, коли дитина вперше заходить на стежку світу. */
const PL_WORLD_INTROS: Readonly<Record<WorldKey | 'hub', string>> = {
  w1: 'Witaj na Łące Liczenia! Tu liczymy biedronki i kwiatki.',
  w2: 'To Ogród Cyfr. Każda cyfra ma tu swoją grządkę.',
  w3: 'Płyniemy na Wyspę Dodawania! Sprawdzimy, ile jest razem.',
  w4: 'Przed nami Most Dwudziestki. Idziemy krok po kroku aż do dwudziestu!',
  w5: 'W Lesie Dziesiątek pakujemy wszystko po dziesięć.',
  w6: 'Witaj w Mieście Setki! Tu mieszkają liczby od jednego do stu.',
  w7: 'Trzy, dwa, jeden… start! Lecimy rakietą aż do stu!',
  hub: 'Plac Zabaw! Tu bawisz się tym, co już umiesz.',
};

const PL_SESSION_LINES = { breakTime: 'Czas na przerwę!', endOfDay: 'Koniec na dziś. Do zobaczenia!' } as const;
const PL_ERROR_LINES = { oops: 'Ups! Spróbujmy jeszcze raz.' } as const;

/** Незмінні репліки ігор (BRIEF §7). Ті, що містять числа чи іменники, — шаблони нижче. */
const PL_GAME_PROMPTS = {
  blink: 'Patrz uważnie! Ile kropek?',
  match: 'Połącz obrazki z liczbami.',
  matchEmpty: 'Tu nic nie ma.', // підказка: лічба порожнього набору (нуль) [do sprawdzenia]
  wagon: 'Jakiej liczby brakuje w pociągu?',
  wagonBack: 'Pociąg jedzie do tyłu. Czego brakuje?', // ★ лічба назад (POLISH_COPY §5)
  wagonNext: 'I co dalej?', // підказка: потяг прочитав вагони перед прогалиною (POLISH_COPY §5: «…{n−2}, {n−1}… i co dalej?»)
  wagonBefore: 'A co jest przed nimi?', // підказка, коли бракує першого вагона: перед ним нічого читати [do sprawdzenia]
  busFull: 'Ile zwierzątek jedzie autobusem?', // POLISH_COPY §5 (гра 7)
  busFree: 'Ile miejsc jest wolnych?',
  orSame: 'A może tyle samo?', // POLISH_COPY §5 (гра 6)
  busRow: 'Pełny rząd to pięć. Policz resztę.', // POLISH_COPY §6, підказка 3
  busCount: 'Policz zwierzątka.', // [do sprawdzenia]: підказка, коли в автобусі менше за п'ять
  makeTen: 'Dołóż tyle, żeby było dziesięć.', // POLISH_COPY §5 (гра 11)
  underLeaf: 'Co kryje się pod listkiem?', // POLISH_COPY §5 (гра 13)
  untilTen: 'Ile brakuje do pełnej dziesiątki?', // POLISH_COPY §6, підказка 4
  bridgeFirst: 'Najpierw zrób dziesiątkę.', // ★ через десяток (W4) [do sprawdzenia]
  hiddenNumber: 'Jaka liczba się schowała?', // W6 «Tajemnicza tablica» (§9)
  storyExample: 'Na gałęzi siedzą dwa ptaszki. Przylatują jeszcze trzy. Ile ptaszków jest teraz?', // приклад BRIEF §7.14
} as const;

/** Plac Zabaw (BRIEF §6 п.13): мішане повторення й вільна гра [do sprawdzenia] — підписи й aria-label; озвучуються лише числа лічби. */
const PL_PLAYGROUND = {
  title: 'Plac Zabaw',
  review: 'Powtórka',
  paint: 'Pomaluj tablicę',
  count: 'Liczymy do stu',
  ones: 'Po jednym',
  tens: 'Dziesiątkami',
  stop: 'Stop',
  clear: 'Wyczyść',
  colour: 'Kolor',
  empty: 'Zagraj najpierw kilka poziomów, a tu będzie powtórka!',
} as const;

/** Альбом наліпок і нагороди (BRIEF §6 п.9–10, M20) [do sprawdzenia]: підписи й aria-label. Голос називає лише наліпку при дотику. */
const PL_ALBUM = {
  title: 'Naklejki',
  page: 'Strona świata',
  scene: 'Scena',
  badges: 'Odznaki',
  clear: 'Wyczyść',
  empty: 'puste miejsce',
  next: 'Dalej',
  unlocked: 'Nowy świat!',
} as const;

/** Машинки гостей у альбомі й назви споруд світів. */
const PL_VEHICLE_NAMES = { balon: 'balon', zaglowka: 'żaglówka', pociag: 'pociąg', rakieta: 'rakieta' } as const;
const PL_BUILDING_NAMES: Readonly<Record<WorldKey, string>> = {
  w1: 'wiatrak', w2: 'oranżeria', w3: 'latarnia morska', w4: 'most z wieżą', w5: 'domek na drzewie', w6: 'wieżowiec', w7: 'wieża rakietowa',
};

/** Вправи для «Czas na przerwę!» (BRIEF §6.11). */
const PL_BREAK_EXERCISES = [
  { verb: 'Podskocz', n: 10 }, { verb: 'Klaśnij', n: 5 }, { verb: 'Tupnij', n: 8 },
] as const;

// ---------- Текст для дорослого (не озвучується) ----------
/** Назви навичок для «Mapa umiejętności» (Strefa rodzica, M22). [do sprawdzenia] — укладено разом із навчальною програмою M5,
 *  у BRIEF їх немає; польську перевірити й доповнити українським перекладом у M22. */
export const SKILL_NAMES: Readonly<Record<SkillId, string>> = {
  'count-line': 'Liczenie przedmiotów w rzędzie',
  'count-scatter': 'Liczenie rozsypanych przedmiotów',
  'subitize-5': 'Rozpoznawanie 1–5 jednym spojrzeniem',
  'give-n': 'Odliczanie podanej liczby',
  'digit-quantity': 'Cyfra i ilość',
  zero: 'Zero',
  'order-around': 'Przed i po',
  'compare-10': 'Więcej, mniej, tyle samo',
  'add-combine': 'Łączenie zbiorów',
  'plus-equals': 'Znaki + i =',
  'count-on': 'Liczenie dalej',
  'bonds-5-10': 'Skład liczby 5 i 10',
  doubles: 'Dodawanie takich samych liczb',
  teens: 'Liczby 11–20 jako 10 + n',
  'count-from-any': 'Liczenie od dowolnej liczby',
  'add-no-bridge-20': 'Dodawanie bez przekraczania dziesiątki',
  'bridge-ten': 'Dodawanie z przekraczaniem dziesiątki',
  'count-by-tens': 'Liczenie dziesiątkami',
  'bundle-ten': 'Pakowanie po dziesięć',
  'compose-2digit': 'Liczby dwucyfrowe',
  'count-on-100': 'Liczenie dalej do 100',
  neighbors: 'Sąsiedzi ±1 i ±10',
  'chart-patterns': 'Wzory w tablicy stu',
  'compare-2digit': 'Porównywanie liczb dwucyfrowych',
  'add-tens': 'Dodawanie dziesiątek',
  'plus-ten': 'Dodawanie 10 do dowolnej liczby',
  'add-2digit-1digit': 'Dodawanie liczby jednocyfrowej do dwucyfrowej',
  'add-with-bridge': 'Dodawanie z przekraczaniem dziesiątki (do 100)',
  'story-problems': 'Zadania tekstowe (historyjki)',
};

const PL_NO_VOICE_MESSAGE = 'Brak polskiego głosu w tej przeglądarce. Zobacz: Strefa rodzica → Ustawienia → Głos.';

export const PARENT = {
  title: 'Strefa rodzica',
  gate: { enter: 'Wejdź', wrong: 'Niepoprawny wynik. Spróbuj ponownie.' },
  language: { label: 'Język panelu', pl: 'Polski', uk: 'Українська' },
  summary: { title: 'Podsumowanie', lastSession: 'Ostatnia sesja' },
  skills: { title: 'Mapa umiejętności', new: 'Nowa', learning: 'W trakcie nauki', mastered: 'Opanowana', review: 'Do powtórki' },
  progress: { title: 'Postępy', firstTry: 'Poprawnie za pierwszym razem', hints: 'Użyte podpowiedzi', minutes: 'Minuty dziennie' },
  difficulties: { title: 'Trudności', countsAll: 'Liczy wszystko od początku, zamiast liczyć dalej' },
  settings: {
    title: 'Ustawienia', sessionLength: 'Długość sesji', voice: 'Głos', speechRate: 'Tempo mowy', volume: 'Głośność',
    speech: 'Mowa', effects: 'Efekty', music: 'Muzyka', reduceMotion: 'Mniej animacji', extraTasks: 'Zadania dodatkowe ★',
    unlockWorld: 'Odblokuj świat ręcznie', slower: 'Wolniej', faster: 'Szybciej', // кінці повзунка «Tempo mowy» (POLISH_COPY: «Wolniej lub szybciej»)
  },
  profiles: { title: 'Profile', add: 'Dodaj profil' },
  backup: {
    title: 'Kopia zapasowa', export: 'Eksportuj postępy', import: 'Importuj postępy', clear: 'Wyczyść postępy',
    cancel: 'Anuluj', confirmYes: 'Tak, usuń',
  },
} as const;

// ---------- Таблиці поточної мови ----------
export let BUTTONS: Strings<typeof PL_BUTTONS> = PL_BUTTONS;
export let LABELS: Strings<typeof PL_LABELS> = PL_LABELS;
export let ISLAND_STATE_LABELS: Strings<typeof PL_ISLAND_STATE_LABELS> = PL_ISLAND_STATE_LABELS;
export let PARENT_GEAR_LABEL: string = PL_PARENT_GEAR_LABEL;
export let TILE_STATE_LABELS: Strings<typeof PL_TILE_STATE_LABELS> = PL_TILE_STATE_LABELS;
export let PROFILE_NO_NAME: string = PL_PROFILE_NO_NAME;
export let WORLD_NAMES: Readonly<Record<WorldKey | 'hub', string>> = PL_WORLD_NAMES;
export let CHARACTER_NAMES: Strings<typeof PL_CHARACTER_NAMES> = PL_CHARACTER_NAMES;
export let GAME_TITLES: Strings<typeof PL_GAME_TITLES> = PL_GAME_TITLES;
/** Цуценя: id — однакові в усіх мовах, порода й репліка — мовою гри. */
export interface PupLine {
  readonly id: (typeof PL_PUPS)[number]['id'];
  readonly breed: string;
  readonly line: string;
}
export let PUPS: readonly PupLine[] = PL_PUPS;
export let START_LINES: Strings<typeof PL_START_LINES> = PL_START_LINES;
export let MISSION_LINES: Strings<typeof PL_MISSION_LINES> = PL_MISSION_LINES;
export let PRAISE: Strings<typeof PL_PRAISE> = PL_PRAISE;
export let FEEDBACK_LINES: Strings<typeof PL_FEEDBACK_LINES> = PL_FEEDBACK_LINES;
export let LEVEL_LINES: Strings<typeof PL_LEVEL_LINES> = PL_LEVEL_LINES;
export let NODE_LABELS: Strings<typeof PL_NODE_LABELS> = PL_NODE_LABELS;
export let CHEST_LABELS: Strings<typeof PL_CHEST_LABELS> = PL_CHEST_LABELS;
export let WORLD_INTROS: Readonly<Record<WorldKey | 'hub', string>> = PL_WORLD_INTROS;
export let SESSION_LINES: Strings<typeof PL_SESSION_LINES> = PL_SESSION_LINES;
export let ERROR_LINES: Strings<typeof PL_ERROR_LINES> = PL_ERROR_LINES;
export let GAME_PROMPTS: Strings<typeof PL_GAME_PROMPTS> = PL_GAME_PROMPTS;
export let PLAYGROUND: Strings<typeof PL_PLAYGROUND> = PL_PLAYGROUND;
export let ALBUM: Strings<typeof PL_ALBUM> = PL_ALBUM;
export let VEHICLE_NAMES: Strings<typeof PL_VEHICLE_NAMES> = PL_VEHICLE_NAMES;
export let BUILDING_NAMES: Readonly<Record<WorldKey, string>> = PL_BUILDING_NAMES;
/** Вправа перерви: дієслово мовою гри й кількість повторів. */
export interface BreakExercise {
  readonly verb: string;
  readonly n: number;
}
export let BREAK_EXERCISES: Each<typeof PL_BREAK_EXERCISES, BreakExercise> = PL_BREAK_EXERCISES;
export let NO_VOICE_MESSAGE: string = PL_NO_VOICE_MESSAGE;

/** Усі таблиці однієї мови: польська — PL_LINES, інші — speech/lang/*. */
export interface LineTables {
  BUTTONS: typeof BUTTONS;
  LABELS: typeof LABELS;
  ISLAND_STATE_LABELS: typeof ISLAND_STATE_LABELS;
  PARENT_GEAR_LABEL: string;
  TILE_STATE_LABELS: typeof TILE_STATE_LABELS;
  PROFILE_NO_NAME: string;
  WORLD_NAMES: typeof WORLD_NAMES;
  CHARACTER_NAMES: typeof CHARACTER_NAMES;
  GAME_TITLES: typeof GAME_TITLES;
  PUPS: typeof PUPS;
  START_LINES: typeof START_LINES;
  MISSION_LINES: typeof MISSION_LINES;
  PRAISE: typeof PRAISE;
  FEEDBACK_LINES: typeof FEEDBACK_LINES;
  LEVEL_LINES: typeof LEVEL_LINES;
  NODE_LABELS: typeof NODE_LABELS;
  CHEST_LABELS: typeof CHEST_LABELS;
  WORLD_INTROS: typeof WORLD_INTROS;
  SESSION_LINES: typeof SESSION_LINES;
  ERROR_LINES: typeof ERROR_LINES;
  GAME_PROMPTS: typeof GAME_PROMPTS;
  PLAYGROUND: typeof PLAYGROUND;
  ALBUM: typeof ALBUM;
  VEHICLE_NAMES: typeof VEHICLE_NAMES;
  BUILDING_NAMES: typeof BUILDING_NAMES;
  BREAK_EXERCISES: typeof BREAK_EXERCISES;
  NO_VOICE_MESSAGE: string;
}

export const PL_LINES: LineTables = {
  BUTTONS: PL_BUTTONS,
  LABELS: PL_LABELS,
  ISLAND_STATE_LABELS: PL_ISLAND_STATE_LABELS,
  PARENT_GEAR_LABEL: PL_PARENT_GEAR_LABEL,
  TILE_STATE_LABELS: PL_TILE_STATE_LABELS,
  PROFILE_NO_NAME: PL_PROFILE_NO_NAME,
  WORLD_NAMES: PL_WORLD_NAMES,
  CHARACTER_NAMES: PL_CHARACTER_NAMES,
  GAME_TITLES: PL_GAME_TITLES,
  PUPS: PL_PUPS,
  START_LINES: PL_START_LINES,
  MISSION_LINES: PL_MISSION_LINES,
  PRAISE: PL_PRAISE,
  FEEDBACK_LINES: PL_FEEDBACK_LINES,
  LEVEL_LINES: PL_LEVEL_LINES,
  NODE_LABELS: PL_NODE_LABELS,
  CHEST_LABELS: PL_CHEST_LABELS,
  WORLD_INTROS: PL_WORLD_INTROS,
  SESSION_LINES: PL_SESSION_LINES,
  ERROR_LINES: PL_ERROR_LINES,
  GAME_PROMPTS: PL_GAME_PROMPTS,
  PLAYGROUND: PL_PLAYGROUND,
  ALBUM: PL_ALBUM,
  VEHICLE_NAMES: PL_VEHICLE_NAMES,
  BUILDING_NAMES: PL_BUILDING_NAMES,
  BREAK_EXERCISES: PL_BREAK_EXERCISES,
  NO_VOICE_MESSAGE: PL_NO_VOICE_MESSAGE,
};

/** Перемикає живі прив'язки на таблиці мови. Викликає лише speech/language.ts. */
export function setLineTables(t: LineTables): void {
  ({
    BUTTONS, LABELS, ISLAND_STATE_LABELS, PARENT_GEAR_LABEL, TILE_STATE_LABELS, PROFILE_NO_NAME, WORLD_NAMES, CHARACTER_NAMES, GAME_TITLES, PUPS,
    START_LINES, MISSION_LINES, PRAISE, FEEDBACK_LINES, LEVEL_LINES, NODE_LABELS, CHEST_LABELS, WORLD_INTROS, SESSION_LINES, ERROR_LINES, GAME_PROMPTS,
    PLAYGROUND, ALBUM, VEHICLE_NAMES, BUILDING_NAMES, BREAK_EXERCISES, NO_VOICE_MESSAGE,
  } = t);
}

// ---------- Шаблони: число + іменник → фраза ----------
const cap = (s: string): string => s.charAt(0).toLocaleUpperCase('pl') + s.slice(1);

/** «Jest jedna biedronka!», «Są trzy biedronki!», «Jest siedem biedronek!», «Nie ma jabłek.» */
export function thereIs(n: number, noun: Noun): string {
  if (templates) return templates.thereIs(n, noun);
  return n === 0 ? `Nie ma ${noun.many}.` : `${isAre(n)} ${quantity(n, noun)}!`;
}

/** Місія рівня (Wprowadzenie): для kaczuszek і rybek — дослівно BRIEF §6.6 і POLISH_COPY §9; для решти предметів — шаблон
 *  «Biedronki czekają na ciebie! Pomożesz je policzyć?» [do sprawdzenia] (теперішній час, безособово щодо дитини). */
export function missionLine(id: ObjectId, noun: Noun): string {
  if (templates) return templates.missionLine(id, noun);
  if (id === 'kaczuszka') return MISSION_LINES.ducklings;
  if (id === 'rybka') return MISSION_LINES.fish;
  return `${cap(noun.few)} czekają na ciebie! Pomożesz je policzyć?`;
}

/** Підпис наліпки-тваринки для екранного диктора: «Naklejka — miś». */
export function stickerLabel(animal: Noun): string {
  if (templates) return templates.stickerLabel(animal);
  return `Naklejka — ${animal.one}`;
}

/** «Trzy i dwa to pięć.» — «Błysk!»: картка повертається з обведеними групами (POLISH_COPY §5: «{a} i {b} to {n}.»); одна група — просто «Jeden.» */
export function flashReveal(groups: readonly number[]): string {
  if (templates) return templates.flashReveal(groups);
  const [a, b] = groups;
  if (a === undefined) return '';
  if (b === undefined) return `${cap(numberWords(a))}.`;
  return `${cap(numberWords(a))} i ${numberWords(b)} to ${numberWords(a + b)}.`;
}

/** «Pięć jabłek.» — підсумок показу «разом» у «Nakarm zwierzaka». */
export function quantityLine(n: number, noun: Noun): string {
  if (templates) return templates.quantityLine(n, noun);
  return `${cap(quantity(n, noun))}.`;
}

/** «Brawo! Pięć jabłek.» — голос повторює відповідь (BRIEF §7 «Правильно»). */
export function praiseEcho(text: string, praise: string = PRAISE[0]): string {
  return `${praise} ${cap(text)}.`;
}
export function praiseCorrect(n: number, noun: Noun, praise?: string): string {
  if (templates) return templates.praiseCorrect(n, noun, praise);
  return praiseEcho(quantity(n, noun), praise);
}

/** «Liczysz dalej od pięciu — sprytnie!» — лише коли дитина торкалася предметів другого доданка. */
export function countOnPraise(from: number): string {
  if (templates) return templates.countOnPraise(from);
  return `Liczysz dalej od ${numberGenitive(from)} — sprytnie!`;
}

/** «Policz biedronki. Dotykaj po kolei. Ile jest biedronek?» */
export function countTouch(noun: Noun): string {
  if (templates) return templates.countTouch(noun);
  return `Policz ${noun.few}. Dotykaj po kolei. Ile jest ${noun.many}?`;
}

/** «Daj misiowi pięć jabłek.» */
export function feedAnimal(animal: Animal, n: number, noun: Noun): string {
  if (templates) return templates.feedAnimal(animal, n, noun);
  return `Daj ${animal.dat} ${quantity(n, noun, true)}.`;
}

/** «Kto ma więcej marchewek?» */
export function whoHasMore(noun: Noun): string {
  if (templates) return templates.whoHasMore(noun);
  return `Kto ma więcej ${noun.many}?`;
}

/** «Kto ma mniej marchewek?» (POLISH_COPY §5) */
export function whoHasLess(noun: Noun): string {
  if (templates) return templates.whoHasLess(noun);
  return `Kto ma mniej ${noun.many}?`;
}

/** «Miś ma siedem.» — підказка в режимі цифр: Kubik називає кількість у кожної тваринки [do sprawdzenia]. */
export function animalHas(animal: Animal, n: number): string {
  if (templates) return templates.animalHas(animal, n);
  return `${cap(animal.one)} ma ${numberWords(n)}.`;
}

/** Відповідь «Kto ma więcej?» без крапки: «miś ma więcej marchewek», «zajączek ma mniej jabłek», «tyle samo» — для похвали й показу «разом»
 *  (складено з шаблонів POLISH_COPY §5 [do sprawdzenia]). */
export function compareAnswer(winner: Animal | null, more: boolean, noun: Noun): string {
  if (templates) return templates.compareAnswer(winner, more, noun);
  return winner === null ? 'tyle samo' : `${winner.one} ma ${more ? 'więcej' : 'mniej'} ${noun.many}`;
}

/** «Siedem i trzy to dziesięć.» */
export function pairSum(a: number, b: number): string {
  if (templates) return templates.pairSum(a, b);
  return `${cap(numberWords(a))} i ${numberWords(b)} to ${numberWords(a + b)}.`;
}

/** W4 ★, через десяток: «Osiem i dwa to dziesięć. I jeszcze trzy — trzynaście.» (a < 10 < a + b; POLISH_COPY §9) */
export function bridgeTen(a: number, b: number): string {
  if (templates) return templates.bridgeTen(a, b);
  if (a >= 10 || a + b <= 10) throw new RangeError(`bridgeTen: expected a < 10 < a + b, got ${a} + ${b}`);
  const toTen = 10 - a;
  return `${pairSum(a, toTen)} I jeszcze ${numberWords(b - toTen)} — ${numberWords(a + b)}.`;
}

/** «Osiem to trzy i ile?» */
export function houseQuestion(whole: number, part: number): string {
  if (templates) return templates.houseQuestion(whole, part);
  return `${cap(numberWords(whole))} to ${numberWords(part)} i ile?`;
}

/** «Trzy jabłka i dwa jabłka. Ile razem?» */
export function twoGroups(a: number, b: number, noun: Noun): string {
  if (templates) return templates.twoGroups(a, b, noun);
  return `${cap(quantity(a, noun))} i ${quantity(b, noun)}. Ile razem?`;
}

/** «Ile to jest trzy dodać dwa?» — запитання про дії лише з символами (POLISH_COPY §8). */
export function sumQuestion(a: number, b: number): string {
  if (templates) return templates.sumQuestion(a, b);
  return `Ile to jest ${numberWords(a)} dodać ${numberWords(b)}?`;
}

/** Підказка 2 (POLISH_COPY §6): «Zacznij od trzech i licz dalej.» — лічба «від числа». */
export function startFrom(n: number): string {
  if (templates) return templates.startFrom(n);
  return `Zacznij od ${numberGenitive(n)} i licz dalej.`;
}

/** «Trzy dodać dwa równa się pięć.» — «dodać», не «plus» (POLISH_COPY §8). */
export function addSentence(a: number, b: number): string {
  if (templates) return templates.addSentence(a, b);
  return `${cap(numberWords(a))} dodać ${numberWords(b)} równa się ${numberWords(a + b)}.`;
}

/** aria-label листка латаття: «liść pięć» («Skoki żabki») [do sprawdzenia]. */
export function padLabel(n: number): string {
  if (templates) return templates.padLabel(n);
  return `liść ${numberWords(n)}`;
}

/** aria-label дуги стрибка: «skok trzy» (порядковий номер стрибка, не листка) [do sprawdzenia]. */
export function jumpLabel(n: number): string {
  if (templates) return templates.jumpLabel(n);
  return `skok ${numberWords(n)}`;
}

/** «Rakieta jest na liczbie trzydzieści cztery. Leci o dziesięć dalej. Gdzie wyląduje?» (POLISH_COPY §5, гра 10 — W7) */
export function rocketFlight(start: number, k: number): string {
  if (templates) return templates.rocketFlight(start, k);
  return `Rakieta jest na liczbie ${numberWords(start)}. Leci o ${numberWords(k)} dalej. Gdzie wyląduje?`;
}

/** «Żabka jest na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?» */
export function frogJump(start: number, jumps: number): string {
  if (templates) return templates.frogJump(start, jumps);
  return `Żabka jest na liczbie ${numberWords(start)}. Skacze ${times(jumps)}. Gdzie wyląduje?`;
}

/** «Ile brakuje do dziesięciu?» (10, 20 → «do dwudziestu», 100 → «do stu») */
export function howManyMissing(to: number): string {
  if (templates) return templates.howManyMissing(to);
  return `Ile brakuje do ${numberGenitive(to)}?`;
}

/** Лічба пакетами по 10 («Paczki po dziesięć»): 1 → «dziesięć», 2 → «dziesięć, dwadzieścia»… до 10 → «…, sto». */
export function countByTens(bundles: number): string {
  if (!Number.isInteger(bundles) || bundles < 1 || bundles > 10) throw new RangeError(`countByTens: expected 1–10, got ${bundles}`);
  return Array.from({ length: bundles }, (_, i) => numberWords((i + 1) * 10)).join(', ');
}

/** «Zapakuj jagody po dziesięć.» (POLISH_COPY §5, гра 12) */
export function packInstruction(noun: Noun): string {
  if (templates) return templates.packInstruction(noun);
  return `Zapakuj ${noun.few} po dziesięć.`;
}

/** «Ile jest jagód razem?» (POLISH_COPY §5) */
export function howManyTogether(noun: Noun): string {
  if (templates) return templates.howManyTogether(noun);
  return `Ile jest ${noun.many} razem?`;
}

/** «Zbuduj liczbę czterdzieści siedem.» — зворотний режим (POLISH_COPY §5) */
export function buildNumber(n: number): string {
  if (templates) return templates.buildNumber(n);
  return `Zbuduj liczbę ${numberWords(n)}.`;
}

/** «Pomaluj liczby z piątką na końcu.» (POLISH_COPY §5, гра 13) */
export function paintDigit(digit: number): string {
  if (templates) return templates.paintDigit(digit);
  return `Pomaluj liczby z ${DIGIT_INSTRUMENTAL[digit]} na końcu.`;
}

/** «Wszystkie liczby z piątką na końcu.» — підсумок розфарбування [do sprawdzenia] */
export function allWithDigit(digit: number): string {
  if (templates) return templates.allWithDigit(digit);
  return `Wszystkie liczby z ${DIGIT_INSTRUMENTAL[digit]} na końcu.`;
}

/** «Tu jest liczba trzydzieści cztery. Która liczba jest o dziesięć większa?» — і варіанти «o jeden», «mniejsza» [do sprawdzenia, крім «o dziesięć większa»] */
export function neighborQuestion(base: number, delta: number): string {
  if (templates) return templates.neighborQuestion(base, delta);
  const by = Math.abs(delta) === 10 ? 'dziesięć' : 'jeden';
  return `Tu jest liczba ${numberWords(base)}. Która liczba jest o ${by} ${delta > 0 ? 'większa' : 'mniejsza'}?`;
}

/** Відповідь на сусідів: «Trzydzieści cztery, o dziesięć więcej to czterdzieści cztery.» [do sprawdzenia] */
export function neighborAnswer(base: number, delta: number): string {
  if (templates) return templates.neighborAnswer(base, delta);
  const by = Math.abs(delta) === 10 ? 'dziesięć' : 'jeden';
  return `${cap(numberWords(base))}, o ${by} ${delta > 0 ? 'więcej' : 'mniej'} to ${numberWords(base + delta)}.`;
}

/** «Cztery dziesiątki i siedem jedności to czterdzieści siedem.» */
export function placeValue(n: number): string {
  if (templates) return templates.placeValue(n);
  const tens = Math.floor(n / 10);
  return `${cap(quantity(tens, DZIESIATKA))} i ${quantity(n % 10, JEDNOSC)} to ${numberWords(n)}.`;
}

/** «Znajdź liczbę czterdzieści siedem.» */
export function findNumber(n: number): string {
  if (templates) return templates.findNumber(n);
  return `Znajdź liczbę ${numberWords(n)}.`;
}

/** «Podskocz dziesięć razy!» */
export function breakLine(verb: string, n: number): string {
  if (templates) return templates.breakLine(verb, n);
  return `${verb} ${times(n)}!`;
}

/** Письмове питання батьківського бар'єра (без озвучення): «Wpisz wynik: siedem razy osiem». */
export function gateQuestion(a: number, b: number): string {
  return `Wpisz wynik: ${numberWords(a)} razy ${numberWords(b)}`;
}

export function confirmClear(name: string): string {
  return `Usunąć wszystkie postępy profilu „${name}”? Tego nie da się cofnąć.`;
}

export function confuses(a: number, b: number): string {
  return `Myli ${a} i ${b}`;
}

// ---------- Шаблони інших мов ----------
/** Шаблони з польськими словами: інша мова (speech/lang/*) задає їх по-своєму. Нейтральні (tileLabel, islandLabel, praiseEcho, countByTens)
 *  лише складають рядки таблиць і числа словами — вони працюють для всіх мов без заміни. */
export interface LineTemplates {
  pileLabel(animal: Animal): string;
  wagonLabel(n: number): string;
  changePlayerLabel(name: string | null): string;
  bonesLabel(filled: number, total: number): string;
  profileMapLabel(name: string): string;
  thereIs(n: number, noun: Noun): string;
  missionLine(id: ObjectId, noun: Noun): string;
  stickerLabel(animal: Noun): string;
  flashReveal(groups: readonly number[]): string;
  quantityLine(n: number, noun: Noun): string;
  praiseCorrect(n: number, noun: Noun, praise?: string): string;
  countOnPraise(from: number): string;
  countTouch(noun: Noun): string;
  feedAnimal(animal: Animal, n: number, noun: Noun): string;
  whoHasMore(noun: Noun): string;
  whoHasLess(noun: Noun): string;
  animalHas(animal: Animal, n: number): string;
  compareAnswer(winner: Animal | null, more: boolean, noun: Noun): string;
  pairSum(a: number, b: number): string;
  bridgeTen(a: number, b: number): string;
  houseQuestion(whole: number, part: number): string;
  twoGroups(a: number, b: number, noun: Noun): string;
  sumQuestion(a: number, b: number): string;
  startFrom(n: number): string;
  addSentence(a: number, b: number): string;
  padLabel(n: number): string;
  jumpLabel(n: number): string;
  rocketFlight(start: number, k: number): string;
  frogJump(start: number, jumps: number): string;
  howManyMissing(to: number): string;
  packInstruction(noun: Noun): string;
  howManyTogether(noun: Noun): string;
  buildNumber(n: number): string;
  paintDigit(digit: number): string;
  allWithDigit(digit: number): string;
  neighborQuestion(base: number, delta: number): string;
  neighborAnswer(base: number, delta: number): string;
  placeValue(n: number): string;
  findNumber(n: number): string;
  breakLine(verb: string, n: number): string;
}

// ---------- Усі статичні польські репліки голосу (для dev-сторінки прослуховування і тестів) ----------
export interface SpokenLine {
  group: string;
  key: string;
  text: string;
}

function entries(group: string, values: Readonly<Record<string, string>> | readonly string[]): SpokenLine[] {
  return Object.entries(values).map(([key, text]) => ({ group, key, text }));
}

export const SPOKEN_LINES: readonly SpokenLine[] = [
  ...entries('BUTTONS', PL_BUTTONS),
  ...entries('START', PL_START_LINES),
  ...entries('MISSION', PL_MISSION_LINES),
  ...entries('PRAISE', PL_PRAISE),
  ...entries('FEEDBACK', PL_FEEDBACK_LINES),
  ...entries('LEVEL', PL_LEVEL_LINES),
  ...entries('WORLD', PL_WORLD_INTROS),
  ...entries('SESSION', PL_SESSION_LINES),
  ...entries('ERROR', PL_ERROR_LINES),
  ...entries('GAME', PL_GAME_PROMPTS),
  ...PL_PUPS.map((p) => ({ group: 'PUPS', key: p.id, text: p.line })),
];

/** Репліки, яких немає в BRIEF, — затверджені в POLISH_COPY §9; власник слухає їх на /#/dev/speech. */
export const FROM_COPY_9: ReadonlySet<string> = new Set([
  PL_MISSION_LINES.fish,
  PL_GAME_PROMPTS.hiddenNumber,
  ...PL_PUPS.filter((p) => p.id !== 'pon' && p.id !== 'nowofundland').map((p) => p.line),
  bridgeTen(8, 5),
]);
