// УСІ польські рядки сайту (CLAUDE.md): дослівно з docs/BRIEF.md; рядки, яких там немає, — з docs/POLISH_COPY.md §9.
// Числа в репліках — лише словами (numberWords.ts), узгодження — plural.ts + nouns.ts. Нові рядки додавай сюди,
// не в компоненти; нову фразу, якої немає в брифі, познач «[do sprawdzenia]» і спитай власника.
import type { SkillId } from '../curriculum/types';
import type { Animal, Noun, ObjectId, WorldKey } from './nouns';
import { DZIESIATKA, JEDNOSC } from './nouns';
import { numberGenitive, numberWords } from './numberWords';
import { isAre, quantity, times } from './plural';

export const SITE_NAME = 'Klockowo';

// ---------- Підписи без голосу ----------
/** Кнопки для дитини — лише іконки; це aria-label, який ще й озвучується при дотику (BRIEF §4). */
export const BUTTONS = {
  play: 'Graj!', next: 'Dalej', again: 'Jeszcze raz', listen: 'Posłuchaj', map: 'Mapa', stickers: 'Naklejki',
  done: 'Gotowe', help: 'Pomóż mi', same: 'Tyle samo', pour: 'Wsyp!', pack: 'Zapakuj', close: 'Zamknij',
} as const;

export const LABELS = {
  bones: 'kosteczki', // aria-label 6 слотів-кісточок (BRIEF §7)
  review: 'Do powtórki', // вузол-повторення на стежці світу
  badges: 'Odznaki',
  base: 'Baza Drużyny', // тло екрана Start
  abacus: 'liczydło', // рахівниця на 20 (BRIEF §10)
  placeTens: 'dziesiątki', // мат «dziesiątki | jedności»
  placeOnes: 'jedności',
  loading: 'Ładowanie…', // aria-label смужки завантаження (design etap1/13)
  answers: 'Odpowiedzi', // aria-label лотка з плитками-відповідями (design etap2/00)
  dotCard: 'karta z kropkami', // «Błysk!»: картка з крапками (aria-label без числа, щоб не видати відповідь)
  plate: 'talerz', // «Nakarm zwierzaka»: тарілка
} as const;

/** aria-label островів Mapy przygody (design etap1/17): «Kosmiczna Droga — zablokowane», «Ogród Cyfr — ukończone», «Wyspa Dodawania — tutaj jesteśmy». */
export const ISLAND_STATE_LABELS = { locked: 'zablokowane', completed: 'ukończone', current: 'tutaj jesteśmy' } as const;
export type IslandState = 'locked' | 'open' | 'current' | 'completed';

export function islandLabel(name: string, state: IslandState): string {
  return state === 'open' ? name : `${name} — ${ISLAND_STATE_LABELS[state]}`;
}

/** Аватар дитини на мапі: «Ola — zmień gracza»; без імені — «Profil bez imienia — zmień gracza». */
export function changePlayerLabel(name: string | null): string {
  return `${name ?? PROFILE_NO_NAME} — zmień gracza`;
}

/** Шестерня Strefa rodzica на екранах дитини: довге натискання, не клік (BRIEF §6.14). */
export const PARENT_GEAR_LABEL = 'Strefa rodzica — przytrzymaj 3 sekundy';

/** aria-label станів плитки й картки (design etap1/07): «siedem — dobrze», «osiem — spróbuj jeszcze raz», «zablokowane». */
export const TILE_STATE_LABELS = { correct: 'dobrze', retry: 'spróbuj jeszcze raz', locked: 'zablokowane' } as const;

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
  return `${LABELS.bones}: ${filled} z ${total}`;
}

/** AvatarButton (design etap1/10): профіль без імені; аватар на Mapa przygody веде до мапи. */
export const PROFILE_NO_NAME = 'Profil bez imienia';
export function profileMapLabel(name: string): string {
  return `${name} — mapa`;
}

export const WORLD_NAMES: Readonly<Record<WorldKey | 'hub', string>> = {
  w1: 'Łąka Liczenia', w2: 'Ogród Cyfr', w3: 'Wyspa Dodawania', w4: 'Most Dwudziestki',
  w5: 'Las Dziesiątek', w6: 'Miasto Setki', w7: 'Kosmiczna Droga', hub: 'Plac Zabaw',
};

export const CHARACTER_NAMES = { kubik: 'Kubik', latka: 'Łatka', pufka: 'Pufka', tofik: 'Tofik', iskra: 'Iskra' } as const;

/** 14 міні-ігор (BRIEF §7) — назви для дорослого (aria, Strefa rodzica). */
export const GAME_TITLES = {
  policzIDotknij: 'Policz i dotknij', blysk: 'Błysk!', cyfraIObrazek: 'Cyfra i obrazek',
  zgubionyWagonik: 'Zgubiony wagonik', nakarmZwierzaka: 'Nakarm zwierzaka', ktoMaWiecej: 'Kto ma więcej?',
  autobusDziesiatka: 'Autobus dziesiątka', domekLiczb: 'Domek liczb', ileRazem: 'Ile razem?',
  skokiZabki: 'Skoki żabki', zrobDziesiatke: 'Zrób dziesiątkę', paczkiPoDziesiec: 'Paczki po dziesięć',
  tajemniczaTablica: 'Tajemnicza tablica', historyjki: 'Historyjki',
} as const;

/** 8 цуценят «Twój piesek» (порядок у пікері): порода і репліка при дотику. «Łaciaty» — Łatka, «rudy» — Iskra й Kubik,
 *  тому описи їх не повторюють. Репліки Pudel…Akita — POLISH_COPY §9 (Pudel змінено на «Piesek w loczkach!»). */
export const PUPS = [
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
export const START_LINES = {
  whoPlays: 'Kto dziś gra?', choosePup: 'Wybierz swojego pieska!', welcome: 'Witaj w drużynie!',
} as const;

export const MISSION_LINES = {
  slogan: 'Łapki w górę, liczymy!',
  showIdea: 'Patrz, pokażę ci.',
  ducklings: 'Kaczuszki się zgubiły! Pomożesz je policzyć?',
  fish: 'Rybki zgubiły drogę do domu! Pomożesz?', // W3, Pufka (§9)
} as const;

/** Похвала; «Liczysz dalej…» — шаблон `countOnPraise`. */
export const PRAISE = ['Brawo!', 'Świetnie!', 'Udało się!', 'Pięknie policzone!'] as const;

export const FEEDBACK_LINES = {
  retry: 'Spróbujmy jeszcze raz!', // 1-ша помилка
  almost: 'Prawie!', // замість retry — лише коли відповідь відрізняється на 1
  together: 'Pomogę ci. Zrobimy to razem.', // 2-га помилка
  show: 'Patrz, pokażę ci.', // «Pomóż mi»
} as const;

export const LEVEL_LINES = {
  missionDone: 'Misja wykonana! Ten poziom za nami!',
  newSticker: 'Masz nową naklejkę!',
  worldDone: 'Wszystkie misje w tym świecie wykonane!',
  diligence: 'Nie poddajesz się!', // значок за старанність
} as const;

/** aria-label вузлів «Ścieżka świata» (design etap2/14–16) і скрині світу (etap2/06). */
export const NODE_LABELS = {
  done: 'Poziom ukończony — zagraj jeszcze raz', next: 'Następny poziom', locked: 'Poziom zablokowany',
  star: 'Zadanie dodatkowe', starLocked: 'Zadanie dodatkowe — zablokowane', review: LABELS.review,
} as const;
export const CHEST_LABELS = { locked: 'Skrzynia zamknięta', ready: 'Skrzynia gotowa', open: 'Skrzynia otwarta' } as const;

/** Вступ до світу (POLISH_COPY §3): звучить, коли дитина вперше заходить на стежку світу. */
export const WORLD_INTROS: Readonly<Record<WorldKey | 'hub', string>> = {
  w1: 'Witaj na Łące Liczenia! Tu liczymy biedronki i kwiatki.',
  w2: 'To Ogród Cyfr. Każda cyfra ma tu swoją grządkę.',
  w3: 'Płyniemy na Wyspę Dodawania! Sprawdzimy, ile jest razem.',
  w4: 'Przed nami Most Dwudziestki. Idziemy krok po kroku aż do dwudziestu!',
  w5: 'W Lesie Dziesiątek pakujemy wszystko po dziesięć.',
  w6: 'Witaj w Mieście Setki! Tu mieszkają liczby od jednego do stu.',
  w7: 'Trzy, dwa, jeden… start! Lecimy rakietą aż do stu!',
  hub: 'Plac Zabaw! Tu bawisz się tym, co już umiesz.',
};

export const SESSION_LINES = { breakTime: 'Czas na przerwę!', endOfDay: 'Koniec na dziś. Do zobaczenia!' } as const;
export const ERROR_LINES = { oops: 'Ups! Spróbujmy jeszcze raz.' } as const;

/** Незмінні репліки ігор (BRIEF §7). Ті, що містять числа чи іменники, — шаблони нижче. */
export const GAME_PROMPTS = {
  blink: 'Patrz uważnie! Ile kropek?',
  match: 'Połącz obrazki z liczbami.',
  wagon: 'Jakiej liczby brakuje w pociągu?',
  busFree: 'Ile miejsc jest wolnych?',
  hiddenNumber: 'Jaka liczba się schowała?', // W6 «Tajemnicza tablica» (§9)
  storyExample: 'Na gałęzi siedzą dwa ptaszki. Przylatują jeszcze trzy. Ile ptaszków jest teraz?', // приклад BRIEF §7.14
} as const;

/** Вправи для «Czas na przerwę!» (BRIEF §6.11). */
export const BREAK_EXERCISES = [
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

export const NO_VOICE_MESSAGE = 'Brak polskiego głosu w tej przeglądarce. Zobacz: Strefa rodzica → Ustawienia → Głos.';

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

// ---------- Шаблони: число + іменник → фраза ----------
const cap = (s: string): string => s.charAt(0).toLocaleUpperCase('pl') + s.slice(1);

/** «Jest jedna biedronka!», «Są trzy biedronki!», «Jest siedem biedronek!», «Nie ma jabłek.» */
export function thereIs(n: number, noun: Noun): string {
  return n === 0 ? `Nie ma ${noun.many}.` : `${isAre(n)} ${quantity(n, noun)}!`;
}

/** Місія рівня (Wprowadzenie): для kaczuszek і rybek — дослівно BRIEF §6.6 і POLISH_COPY §9; для решти предметів — шаблон
 *  «Biedronki czekają na ciebie! Pomożesz je policzyć?» [do sprawdzenia] (теперішній час, безособово щодо дитини). */
export function missionLine(id: ObjectId, noun: Noun): string {
  if (id === 'kaczuszka') return MISSION_LINES.ducklings;
  if (id === 'rybka') return MISSION_LINES.fish;
  return `${cap(noun.few)} czekają na ciebie! Pomożesz je policzyć?`;
}

/** Підпис наліпки-тваринки для екранного диктора: «Naklejka — miś». */
export function stickerLabel(animal: Noun): string {
  return `Naklejka — ${animal.one}`;
}

/** «Trzy i dwa to pięć.» — «Błysk!»: картка повертається з обведеними групами (POLISH_COPY §5: «{a} i {b} to {n}.»); одна група — просто «Jeden.» */
export function flashReveal(groups: readonly number[]): string {
  const [a, b] = groups;
  if (a === undefined) return '';
  if (b === undefined) return `${cap(numberWords(a))}.`;
  return `${cap(numberWords(a))} i ${numberWords(b)} to ${numberWords(a + b)}.`;
}

/** «Pięć jabłek.» — підсумок показу «разом» у «Nakarm zwierzaka». */
export function quantityLine(n: number, noun: Noun): string {
  return `${cap(quantity(n, noun))}.`;
}

/** «Brawo! Pięć jabłek.» — голос повторює відповідь (BRIEF §7 «Правильно»). */
export function praiseEcho(text: string, praise: string = PRAISE[0]): string {
  return `${praise} ${cap(text)}.`;
}
export function praiseCorrect(n: number, noun: Noun, praise?: string): string {
  return praiseEcho(quantity(n, noun), praise);
}

/** «Liczysz dalej od pięciu — sprytnie!» — лише коли дитина торкалася предметів другого доданка. */
export function countOnPraise(from: number): string {
  return `Liczysz dalej od ${numberGenitive(from)} — sprytnie!`;
}

/** «Policz biedronki. Dotykaj po kolei. Ile jest biedronek?» */
export function countTouch(noun: Noun): string {
  return `Policz ${noun.few}. Dotykaj po kolei. Ile jest ${noun.many}?`;
}

/** «Daj misiowi pięć jabłek.» */
export function feedAnimal(animal: Animal, n: number, noun: Noun): string {
  return `Daj ${animal.dat} ${quantity(n, noun, true)}.`;
}

/** «Kto ma więcej marchewek?» */
export function whoHasMore(noun: Noun): string {
  return `Kto ma więcej ${noun.many}?`;
}

/** «Siedem i trzy to dziesięć.» */
export function pairSum(a: number, b: number): string {
  return `${cap(numberWords(a))} i ${numberWords(b)} to ${numberWords(a + b)}.`;
}

/** W4 ★, через десяток: «Osiem i dwa to dziesięć. I jeszcze trzy — trzynaście.» (a < 10 < a + b; POLISH_COPY §9) */
export function bridgeTen(a: number, b: number): string {
  if (a >= 10 || a + b <= 10) throw new RangeError(`bridgeTen: expected a < 10 < a + b, got ${a} + ${b}`);
  const toTen = 10 - a;
  return `${pairSum(a, toTen)} I jeszcze ${numberWords(b - toTen)} — ${numberWords(a + b)}.`;
}

/** «Osiem to trzy i ile?» */
export function houseQuestion(whole: number, part: number): string {
  return `${cap(numberWords(whole))} to ${numberWords(part)} i ile?`;
}

/** «Trzy jabłka i dwa jabłka. Ile razem?» */
export function twoGroups(a: number, b: number, noun: Noun): string {
  return `${cap(quantity(a, noun))} i ${quantity(b, noun)}. Ile razem?`;
}

/** «Trzy dodać dwa równa się pięć.» — «dodać», не «plus» (POLISH_COPY §8). */
export function addSentence(a: number, b: number): string {
  return `${cap(numberWords(a))} dodać ${numberWords(b)} równa się ${numberWords(a + b)}.`;
}

/** «Żabka jest na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?» */
export function frogJump(start: number, jumps: number): string {
  return `Żabka jest na liczbie ${numberWords(start)}. Skacze ${times(jumps)}. Gdzie wyląduje?`;
}

/** «Ile brakuje do dziesięciu?» (10, 20 → «do dwudziestu», 100 → «do stu») */
export function howManyMissing(to: number): string {
  return `Ile brakuje do ${numberGenitive(to)}?`;
}

/** Лічба пакетами по 10 («Paczki po dziesięć»): 1 → «dziesięć», 2 → «dziesięć, dwadzieścia»… до 10 → «…, sto». */
export function countByTens(bundles: number): string {
  if (!Number.isInteger(bundles) || bundles < 1 || bundles > 10) throw new RangeError(`countByTens: expected 1–10, got ${bundles}`);
  return Array.from({ length: bundles }, (_, i) => numberWords((i + 1) * 10)).join(', ');
}

/** «Cztery dziesiątki i siedem jedności to czterdzieści siedem.» */
export function placeValue(n: number): string {
  const tens = Math.floor(n / 10);
  return `${cap(quantity(tens, DZIESIATKA))} i ${quantity(n % 10, JEDNOSC)} to ${numberWords(n)}.`;
}

/** «Znajdź liczbę czterdzieści siedem.» */
export function findNumber(n: number): string {
  return `Znajdź liczbę ${numberWords(n)}.`;
}

/** «Podskocz dziesięć razy!» */
export function breakLine(verb: string, n: number): string {
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

// ---------- Усі статичні репліки голосу (для dev-сторінки прослуховування і тестів) ----------
export interface SpokenLine {
  group: string;
  key: string;
  text: string;
}

function entries(group: string, values: Readonly<Record<string, string>> | readonly string[]): SpokenLine[] {
  return Object.entries(values).map(([key, text]) => ({ group, key, text }));
}

export const SPOKEN_LINES: readonly SpokenLine[] = [
  ...entries('BUTTONS', BUTTONS),
  ...entries('START', START_LINES),
  ...entries('MISSION', MISSION_LINES),
  ...entries('PRAISE', PRAISE),
  ...entries('FEEDBACK', FEEDBACK_LINES),
  ...entries('LEVEL', LEVEL_LINES),
  ...entries('WORLD', WORLD_INTROS),
  ...entries('SESSION', SESSION_LINES),
  ...entries('ERROR', ERROR_LINES),
  ...entries('GAME', GAME_PROMPTS),
  ...PUPS.map((p) => ({ group: 'PUPS', key: p.id, text: p.line })),
];

/** Репліки, яких немає в BRIEF, — затверджені в POLISH_COPY §9; власник слухає їх на /#/dev/speech. */
export const FROM_COPY_9: ReadonlySet<string> = new Set([
  MISSION_LINES.fish,
  GAME_PROMPTS.hiddenNumber,
  ...PUPS.filter((p) => p.id !== 'pon' && p.id !== 'nowofundland').map((p) => p.line),
  bridgeTen(8, 5),
]);
