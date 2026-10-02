// Типи навчальної програми (BRIEF §5, §7; PEDAGOGY §1–§2). Програма вже визначена — тут лише її форма.
import type { TeamMember } from '../characters/poses';
import type { GAME_TITLES } from '../speech/lines';
import type { ObjectId, WorldKey } from '../speech/nouns';

export type { WorldKey };

/** Сім світів і хаб «Plac Zabaw». */
export type WorldId = WorldKey | 'hub';

/** Ідентифікатор рівня: `w1-1` … `w1-12` (основний шлях), `w4-s1` … `w4-s4` (★-гілка). Параметр маршрутів /play/:levelId тощо. */
export type LevelId = `${WorldKey}-${number}` | `${WorldKey}-s${number}`;

/** 14 міні-ігор (BRIEF §7) — ключі збігаються з GAME_TITLES у speech/lines.ts. */
export type GameId = keyof typeof GAME_TITLES;

/** Навичка — одиниця карти навичок для батьків, адаптивності й інтервальних повторень (PEDAGOGY §1, §3). */
export type SkillId =
  | 'count-line' | 'count-scatter' | 'subitize-5' | 'give-n' // W1
  | 'digit-quantity' | 'zero' | 'order-around' | 'compare-10' // W2
  | 'add-combine' | 'plus-equals' | 'count-on' | 'bonds-5-10' | 'doubles' // W3
  | 'teens' | 'count-from-any' | 'add-no-bridge-20' | 'bridge-ten' // W4 (bridge-ten — ★)
  | 'count-by-tens' | 'bundle-ten' | 'compose-2digit' // W5
  | 'count-on-100' | 'neighbors' | 'chart-patterns' | 'compare-2digit' // W6
  | 'add-tens' | 'plus-ten' | 'add-2digit-1digit' | 'add-with-bridge' | 'story-problems'; // W7 (add-with-bridge — ★)

/** [мін, макс] — число для завдання вибирає генератор у цьому діапазоні. */
export type Range = readonly [min: number, max: number];

/** Як розкладено предмети: рядок → коло → розсип (PEDAGOGY §2 п.1); tens — «десять і ще n»: перша десятка блоком 5×2, решта поруч (W4: 13 = 10 + 3). */
export type Arrangement = 'line' | 'circle' | 'scatter' | 'tens';

/** Що на плитках-відповідях: у W1 — цифра разом із крапками (BRIEF §7), далі — лише цифри. */
export type AnswerStyle = 'digitDots' | 'digit' | 'dots';

interface TaskBase {
  skill: SkillId;
  /** Завдання повторює раніше вивчене (спіральне повторення: ≈ 30 % кожного рівня, PEDAGOGY §1). */
  review?: boolean;
}

/** «Policz i dotknij» — лічба 3–20 предметів, вибір із 3 плиток. */
export interface CountTask extends TaskBase {
  game: 'policzIDotknij';
  count: Range;
  arrangement: Arrangement;
  /** distinct — предмети різні на вигляд; similar — схожі (важче не збитись). */
  look: 'distinct' | 'similar';
  answers: AnswerStyle;
}

/** «Błysk!» — картка з крапками на мить, вибір із 3. */
export interface FlashTask extends TaskBase {
  game: 'blysk';
  count: Range;
  /** dice — як на кубику; random — довільні; tenFrame — рамка-десятка 6–10. */
  pattern: 'dice' | 'random' | 'tenFrame';
  /** Скільки мс картка видима: 2000 → 800 (складніше). */
  exposureMs: number;
  answers: AnswerStyle;
}

/** «Nakarm zwierzaka» — покласти N їжі на тарілку, «Gotowe». */
export interface FeedTask extends TaskBase {
  game: 'nakarmZwierzaka';
  count: Range;
  /** Слоти рамки-десятки на тарілці видно одразу (інакше — лише як 2-га підказка). */
  slots: boolean;
}

/** Як показано кількість у наборі «Cyfra i obrazek»: предмети, крапки, пальці рук, рамка-десятка; mixed — різні способи в одному завданні. */
export type SetStyle = 'objects' | 'dots' | 'fingers' | 'tenFrame' | 'mixed';

/** «Cyfra i obrazek» — з'єднати 2–4 набори-картинки з цифрами (дотик по набору, дотик по цифрі). */
export interface MatchTask extends TaskBase {
  game: 'cyfraIObrazek';
  /** Скільки пар (2–4). */
  pairs: number;
  /** З яких чисел набори (у W2 разом із 0). */
  numbers: Range;
  set: SetStyle;
}

/** Де в потязі бракує вагона: end — останнього, middle — посередині, start — першого, any — навмання. */
export type TrainGap = 'end' | 'middle' | 'start' | 'any';

/** «Zgubiony wagonik» — потяг із номерами на вагонах, одного бракує; вибір із 3 плиток. */
export interface TrainTask extends TaskBase {
  game: 'zgubionyWagonik';
  /** Межі чисел, які бувають на вагонах. */
  range: Range;
  /** Скільки вагонів у потязі (разом із тим, якого бракує): 5–7. */
  length: number;
  gap: TrainGap;
  /** Крок між вагонами: 1 або 10. */
  step: 1 | 10;
  /** Лічба назад (★): номери вагонів спадають. */
  backwards?: boolean;
  answers: AnswerStyle;
}

/** Як показано купки в «Kto ma więcej?»: objects — предмети; sizeTrick — підступ: на меншій купці предмети більші; digits — спершу лише цифри (купки з'являються як підказка). */
export type CompareShow = 'objects' | 'sizeTrick' | 'digits';

/** «Kto ma więcej?» — дві тваринки з купками; більша купка («więcej»), менша («mniej») або «Tyle samo». */
export interface CompareTask extends TaskBase {
  game: 'ktoMaWiecej';
  /** Скільки в кожній купці: межі (у W2 разом із 0). */
  count: Range;
  /** Різниця між купками, коли вони не рівні (≥ 1): велика → 1. */
  diff: Range;
  /** Ймовірність «Tyle samo» (0…1); 0 — купки завжди різні, і кнопки «Tyle samo» у лотку нема. */
  equal?: number;
  ask: 'more' | 'less' | 'mixed';
  show: CompareShow;
}

/** «Autobus dziesiątka» — автобус 2×5 місць із тваринками: скільки їде чи скільки місць вільних; вибір із 3 плиток. */
export interface BusTask extends TaskBase {
  game: 'autobusDziesiatka';
  /** Скільки тваринок їде (0…10, у двоповерховому 0…20). */
  count: Range;
  /** full — «Ile zwierzątek jedzie autobusem?»; empty — «Ile miejsc jest wolnych?»; mixed — навмання. */
  ask: 'full' | 'empty' | 'mixed';
  /** 0 — автобус видно весь час; інакше — видно стільки мс, потім місця закриваються (вступний показ). */
  exposureMs: number;
  answers: AnswerStyle;
  /** Поверхів: 1 — 10 місць (за замовчуванням), 2 — двоповерховий на 20 (W4). */
  floors?: 1 | 2;
}

/** «Domek liczb» — будиночок із блоків: на даху ціле, одне з двох віконець порожнє («Osiem to trzy i ile?»); вибір із 3 плиток. */
export interface HouseTask extends TaskBase {
  game: 'domekLiczb';
  /** Ціле (дах): 3–20. */
  whole: Range;
  /** Яке віконце порожнє: left, right або навмання. */
  missing: 'left' | 'right' | 'any';
  /** pictures — під будиночком одразу лежать предмети цілого; digits — лише цифри (предмети з'являються як підказка). */
  show: 'pictures' | 'digits';
  answers: AnswerStyle;
}

/** «Ile razem?» — два кошики над «3 + 2 = ?»; «Wsyp!» зсипає їх в один; вибір із 3 плиток. */
export interface SumTask extends TaskBase {
  game: 'ileRazem';
  /** Межі суми (2–20). */
  sum: Range;
  /** Перший кошик закритий кришкою з числом: предметів не видно, дитина рахує далі від числа (лічба «від числа»). */
  lid: boolean;
  /** Який доданок першим: більший, менший чи навмання (при `doubles` ігнорується). */
  order: 'any' | 'bigFirst' | 'smallFirst';
  /** Лише подвоєння (3 + 3): доданки рівні, сума парна. */
  doubles: boolean;
  /** Лише символи: «3 + 2 = ?» без кошиків (кошики з'являються як підказка). */
  symbols: boolean;
  /** W4: перший доданок — «-надцять» (≥ 11), сума до 20, десяток не переходимо (13 + 4): доданки розкладає генератор, `order` і `doubles` ігноруються. */
  noBridge?: boolean;
  answers: AnswerStyle;
}

/** «Skoki żabki» — жабка на листках латаття 0–10/0–20, «Skacze trzy razy. Gdzie wyląduje?»; вибір із 3 плиток. (Ракета на прямій 0–100 — W7, M19.) */
export interface JumpTask extends TaskBase {
  game: 'skokiZabki';
  /** Скільки листків: 10 → 0–10, 20 → 0–20. */
  max: 10 | 20;
  /** Листок, з якого стартує жабка (межі; зменшуються, щоб жабка не вистрибнула за край). */
  start: Range;
  /** Скільки стрибків (межі). */
  jumps: Range;
  /** numbered — на всіх листках цифри; landmarks — лише на 0, 5, 10 (…) і на стартовому: решту дитина відлічує сама. */
  pads: 'numbered' | 'landmarks';
  /** true — жабка стрибає від дотику дитини (конкретна дія); false — дитина спершу передбачає, а стрибки з'являються лише як підказка. */
  tapJumps: boolean;
  answers: AnswerStyle;
}

/** «Zrób dziesiątkę» — доповнити рамку-десятку фішками («Ile brakuje do dziesięciu?»); «Gotowe» перевіряє, скільки докладено. (Перехід через десяток 8 + 5 — W4★, M16.) */
export interface TenTask extends TaskBase {
  game: 'zrobDziesiatke';
  /** Скільки фішок уже лежить у рамці (1–9; бракує 10 − це). */
  known: Range;
  /** frame — відомі фішки видно, дитина докладає решту; digit — рамка порожня, є лише цифра: дитина сама вираховує, скільки докласти. */
  show: 'frame' | 'digit';
  /** ★ через десяток (W4): дві рамки, відомі фішки видно, дитина докладає `add` фішок (8 + 5): спершу добиває першу рамку до десяти, решта лягає в другу. */
  bridge?: boolean;
  /** Скільки докласти в режимі `bridge` (межі; сума з відомими — 11…20 і понад десяток). */
  add?: Range;
}

/** Тип задачі «Historyjki»: join — було `a`, прийшло ще `b`; combine — два набори різних предметів («Na obrazku są…»); mixed — навмання. (Порівняння «о 2 більше» — W4/W7.) */
export type StoryKind = 'join' | 'combine' | 'mixed';

/** «Historyjki» — історія на 3 кадри («було», «прийшло ще», «?»), вибір відповіді з 3 плиток, потім картка з прикладом «3 + 2 = 5». */
export interface StoryTask extends TaskBase {
  game: 'historyjki';
  /** Межі суми (2–10 у W3; 11–20 у W4). */
  sum: Range;
  kind: StoryKind;
  /** W4: перший доданок ≥ 11, сума до 20 — десяток не переходимо (13 + 4). */
  noBridge?: boolean;
  answers: AnswerStyle;
}

/** «Paczki po dziesięć»: loose — розсипані предмети, дитина пакує їх по 10 («Zapakuj»), лічить десятками й далі поштучно; packed — уже в коробках і поштучно, лише порахувати;
 *  build — зворотний режим: «Zbuduj liczbę czterdzieści siedem.» кнопками «+10» і «+1» на мату «dziesiątki | jedności». */
export type PackMode = 'loose' | 'packed' | 'build';

/** «Paczki po dziesięć» (W5, W6) — розряди: десятки й одиниці. Вибір із 3 плиток (loose, packed) чи збирання числа (build). */
export interface PackTask extends TaskBase {
  game: 'paczkiPoDziesiec';
  /** Скільки всього (11–99; у loose — до 59: розсипані предмети мусять уміститись на сцені). */
  total: Range;
  mode: PackMode;
  /** Серед плиток — число з переставленими цифрами (26 ↔ 62); у build не діє. */
  contrast: boolean;
  answers: AnswerStyle;
}

/** Ігри, чиї параметри опишуть етапи M18–M19: поки лише гра й навичка. */
export interface PendingTask extends TaskBase {
  game: Exclude<
    GameId,
    | 'policzIDotknij' | 'blysk' | 'nakarmZwierzaka' | 'cyfraIObrazek' | 'zgubionyWagonik' | 'ktoMaWiecej' | 'autobusDziesiatka' | 'domekLiczb' | 'ileRazem'
    | 'skokiZabki' | 'zrobDziesiatke' | 'historyjki' | 'paczkiPoDziesiec'
  >;
}

export type TaskSpec =
  | CountTask | FlashTask | FeedTask | MatchTask | TrainTask | CompareTask | BusTask | HouseTask | SumTask | JumpTask | TenTask | StoryTask | PackTask | PendingTask;

export type LevelKind = 'main' | 'star';

export interface Level {
  id: LevelId;
  world: WorldKey;
  /** Номер у межах свого виду: основні 1…12, ★-гілка 1…4. */
  index: number;
  kind: LevelKind;
  /** Рівень вводить нову ідею: Kubik коротко показує її у Wprowadzenie («Patrz, pokażę ci.», до 20 с). */
  newIdea: boolean;
  /** Навички, які рівень вводить чи тренує (карта навичок, повторення). */
  skills: readonly SkillId[];
  /** Місія з 6 завдань (2–3 хв). Порожньо для заготовок. */
  tasks: readonly TaskSpec[];
  /** true — заготовка: структура світу є, завдання опише етап зі PLAN. */
  draft: boolean;
}

export interface World {
  id: WorldId;
  /** Порядок на мапі: W1 = 1 … W7 = 7, хаб = 8. */
  order: number;
  /** Колір світу (#…500, BRIEF §5); шкала 50/100/500/700 — токени --kl-wN-* у tokens.css. */
  color: string;
  /** Гість місій: команда (BRIEF §9); у W6 — усі разом; у хабі гостя немає. */
  guest: TeamMember | 'all' | null;
  /** Діапазон чисел світу, напр. [1, 10]. */
  range: Range;
  /** Рівнів на основному шляху (12; у W3 — 15). */
  mainLevels: number;
  /** Рівнів у ★-гілці (4 у W4 і W7). */
  starLevels: number;
  /** Після якого основного рівня відкривається ★-гілка (null — гілки немає). */
  starBranchAfter: number | null;
  /** Ігри світу за каталогом PEDAGOGY §2. */
  games: readonly GameId[];
  /** 4 предмети для лічби (BRIEF §10). */
  objects: readonly ObjectId[];
}
