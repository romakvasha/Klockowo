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

/** Допомога Kubika, яку показує сцена: hint — перший крок («Patrz, pokażę ci.»), together — повний розв'язок після другої помилки.
 *  `step` — скільки кроків показано (сенс залежить від гри). */
export type AssistMode = 'none' | 'hint' | 'together';
export interface Assist {
  mode: AssistMode;
  step: number;
}
export const NO_ASSIST: Assist = { mode: 'none', step: 0 };

/** Сценарій допомоги: голос і паузи з ScriptApi плюс зміна стану допомоги, який бачить сцена. */
export interface AssistContext extends ScriptApi {
  setAssist(assist: Assist): void;
}

/** play — дитина діє; feedback — звучить відгук, дотики вимкнено; done — завдання розв'язано. */
export type TaskPhase = 'play' | 'feedback' | 'done';

/** Область сцени: розмір, ділянки під Kubika (предмети туди не ставимо) і стан завдання. */
export interface SceneProps<I extends TaskBase> {
  instance: I;
  world: WorldKey;
  area: { w: number; h: number };
  reserved: readonly { x: number; y: number; w: number; h: number }[];
  assist: Assist;
  phase: TaskPhase;
  /** Правильну відповідь щойно дано: предмети радіють. */
  celebrating: boolean;
  /** Сцена повідомляє про свою активність (дотик до предмета): рушій знімає «Posłuchaj» і гасить зайвий голос. */
  onTouch?: () => void;
}

/** Гра-модуль: усе, що рушій має знати про одну з 14 ігор. M8 — «choice» (відповідь із плиток лотка + «Gotowe»). */
export interface GameDef<I extends TaskBase = TaskBase> {
  id: GameId;
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
  /** Перший крок допомоги: лише початок, відповідь дитина дає сама. */
  hint(instance: I, ctx: AssistContext): Promise<void>;
  /** Повний розв'язок після другої помилки. */
  together(instance: I, ctx: AssistContext): Promise<void>;
  Scene: ComponentType<SceneProps<I>>;
}
