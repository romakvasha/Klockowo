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

/** Як розкладено предмети: рядок → коло → розсип (PEDAGOGY §2 п.1). */
export type Arrangement = 'line' | 'circle' | 'scatter';

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
  /** Скільки тваринок їде (0…10). */
  count: Range;
  /** full — «Ile zwierzątek jedzie autobusem?»; empty — «Ile miejsc jest wolnych?»; mixed — навмання. */
  ask: 'full' | 'empty' | 'mixed';
  /** 0 — автобус видно весь час; інакше — видно стільки мс, потім місця закриваються (вступний показ). */
  exposureMs: number;
  answers: AnswerStyle;
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
  answers: AnswerStyle;
}

/** Ігри, чиї параметри опишуть етапи M14–M19: поки лише гра й навичка. */
export interface PendingTask extends TaskBase {
  game: Exclude<
    GameId,
    'policzIDotknij' | 'blysk' | 'nakarmZwierzaka' | 'cyfraIObrazek' | 'zgubionyWagonik' | 'ktoMaWiecej' | 'autobusDziesiatka' | 'domekLiczb' | 'ileRazem'
  >;
}

export type TaskSpec = CountTask | FlashTask | FeedTask | MatchTask | TrainTask | CompareTask | BusTask | HouseTask | SumTask | PendingTask;

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
