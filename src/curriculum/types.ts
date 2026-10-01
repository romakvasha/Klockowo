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

/** Ігри, чиї параметри опишуть етапи M10–M19: поки лише гра й навичка. */
export interface PendingTask extends TaskBase {
  game: Exclude<GameId, 'policzIDotknij' | 'blysk' | 'nakarmZwierzaka'>;
}

export type TaskSpec = CountTask | FlashTask | FeedTask | PendingTask;

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
