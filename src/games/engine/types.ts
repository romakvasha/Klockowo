// Типи ігрового рушія (M8): завдання, гра-модуль, допомога. Лише типи — без коду, щоб їх можна було імпортувати звідусіль.
import type { ComponentType, ReactNode } from 'react';
import type { GameId, Level, SkillId, TaskSpec, WorldKey } from '../../curriculum/types';
import type { ScriptApi } from '../../speech/script';
import type { Rng } from './rng';

/** Спільна частина будь-якого згенерованого завдання. */
export interface TaskBase {
  game: GameId;
  skill: SkillId;
  /** Спіральне повторення раніше вивченого (TaskSpec.review). */
  review: boolean;
}

/** Що знає генератор про місце завдання в рівні. */
export interface GenContext {
  level: Level;
  world: WorldKey;
  /** Номер завдання в рівні, 0…5. */
  index: number;
  /** Власний потік випадковості цього завдання (стабільний для зерна забігу й номера). */
  rng: Rng;
  /** Правильні відповіді попередніх завдань рівня — щоб не повторювати те саме число підряд. */
  previous: readonly number[];
}

/** Вердикт перевірки відповіді. `almost` — відповідь відрізняється на 1: замість «Spróbujmy jeszcze raz!» звучить «Prawie!». */
export type Verdict = { ok: true } | { ok: false; almost: boolean };

/** Плитка лотка: число й (у W1) кількість крапок під ним. */
export interface TileSpec {
  value: number;
  dots?: number;
}

/** Допомога Kubika, яку показує сцена: hint — підказка «Pomóż mi» («Patrz, pokażę ci.»), together — повний розв'язок після другої помилки,
 *  intro — вступний показ гри після інструкції (напр., спалах картки в «Błysk!»). `step` — скільки кроків показано (сенс залежить від гри),
 *  `level` — номер підказки (1-ша, 2-га…): гра може підсилювати допомогу, `focus` — про яку саме річ (набір, вагон…) зараз мова. */
export type AssistMode = 'none' | 'hint' | 'together' | 'intro';
export interface Assist {
  mode: AssistMode;
  step: number;
  level?: number;
  focus?: number;
}
export const NO_ASSIST: Assist = { mode: 'none', step: 0 };

/** Сценарій допомоги: голос і паузи з ScriptApi плюс зміна стану допомоги, який бачить сцена. */
export interface AssistContext extends ScriptApi {
  setAssist(assist: Assist): void;
}

/** play — дитина діє; feedback — звучить відгук, дотики вимкнено; done — завдання розв'язано. */
export type TaskPhase = 'play' | 'feedback' | 'done';

/** Що знає гра про хід завдання, коли Kubik допомагає: номер підказки й остання відповідь дитини (у іграх-конструкторах — те, що зібрано). */
export interface HelpInfo {
  /** 1 — перша підказка, 2 — друга…; для показу «разом» — кількість підказок, що вже були. */
  nth: number;
  response: number | null;
}

/** Вигляд екрана: wide (альбом), portrait, phone (телефон в альбомі) — для сцен, що змінюють розкладку. */
export type SceneKind = 'wide' | 'portrait' | 'phone';

/** Область сцени: розмір, ділянки під Kubika (предмети туди не ставимо) і стан завдання. */
export interface SceneProps<I extends TaskBase> {
  instance: I;
  world: WorldKey;
  kind: SceneKind;
  area: { w: number; h: number };
  reserved: readonly { x: number; y: number; w: number; h: number }[];
  assist: Assist;
  phase: TaskPhase;
  /** Правильну відповідь щойно дано: предмети радіють. */
  celebrating: boolean;
  /** Що сталося останнім (для сцен, які реагують на помилку: прибрати хибні зв'язки): wrong1 / wrong2 — щойно перевірено хибно. */
  last: 'none' | 'correct' | 'wrong1' | 'wrong2' | 'hint';
  /** Сцена повідомляє про свою активність (дотик до предмета): рушій знімає «Posłuchaj» і гасить зайвий голос. */
  onTouch?: () => void;
  /** Лише для ігор-конструкторів (`kind: 'build'`): що зараз зібрано (число); null — нічого. Рушій вмикає «Gotowe», коли воно є.
   *  `ready = false` — зібрано лише частину: «Gotowe» лишається вимкненою, але значення потрапляє в підказки (HelpInfo.response). */
  onRespond?: (value: number | null, ready?: boolean) => void;
  /** Лоток: DOM-вузол, у який конструктор виносить місця для предметів (тарілку) через портал; у іграх із плитками — null. */
  tray: HTMLElement | null;
}

/** Гра-модуль: усе, що рушій має знати про одну з 14 ігор. choice — відповідь із плиток лотка + «Gotowe»; build — дитина щось збирає на сцені
 *  (кладе їжу на тарілку), сцена повідомляє результат через onRespond, лоток — місце для зон (портал), а «Gotowe» перевіряє зібране. */
export interface GameDef<I extends TaskBase = TaskBase> {
  id: GameId;
  kind: 'choice' | 'build';
  /** false — відповідь не є числом, яке можна порівнювати (з'єднання пар): в історію відповідей не пишемо answer і wrong. */
  recordsAnswer?: boolean;
  generate(spec: TaskSpec, ctx: GenContext): I;
  /** Репліка-інструкція (BRIEF §7). */
  prompt(instance: I): string;
  /** Вміст бульбашки Kubika: лише іконки чи цифри (предмет + «?»). */
  bubble(instance: I): ReactNode;
  /** Підпис області сцени для екранного диктора («Policz biedronki»). */
  sceneLabel(instance: I): string;
  tiles(instance: I): readonly TileSpec[];
  /** Правильна відповідь: її підсвічує показ «разом». */
  answer(instance: I): number;
  check(instance: I, value: number): Verdict;
  /** Репліка після правильної відповіді; `praise` — слово похвали («Brawo!»). */
  praise(instance: I, praise: string): string;
  /** Вступний показ після інструкції (необов'язково): напр., спалах картки. Керує сценою через ctx.setAssist({ mode: 'intro', … }). */
  intro?(instance: I, ctx: AssistContext): Promise<void>;
  /** Підказка «Pomóż mi»: перший крок допомоги (з номером підказки в `info.nth` гра може підсилювати її), відповідь дитина дає сама. */
  hint(instance: I, ctx: AssistContext, info: HelpInfo): Promise<void>;
  /** Повний розв'язок після другої помилки. */
  together(instance: I, ctx: AssistContext, info: HelpInfo): Promise<void>;
  Scene: ComponentType<SceneProps<I>>;
}
