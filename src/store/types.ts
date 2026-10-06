// Дані, що зберігаються в localStorage (BRIEF §6.15, PEDAGOGY §3). Усе серіалізується в JSON; дати — рядки (ISO або YYYY-MM-DD).
import type { PupId } from '../characters/pups';
import type { Struggle } from '../curriculum/adaptivity';
import type { RetryItem, Swap } from '../curriculum/review';
import type { GameId, LevelId, SkillId, WorldId, WorldKey } from '../curriculum/types';
import type { Lang } from '../speech/langCode';

export type { RetryItem, Struggle, Swap };

export const MAX_PROFILES = 4;
export const MAX_NAME_LENGTH = 24;

export type PanelLanguage = 'pl' | 'uk' | 'en';
export type SessionMinutes = 10 | 15 | 20;

export interface Profile {
  id: string;
  /** Ім'я вводить лише дорослий (Strefa rodzica → Profile); дитина його не бачить і не читає. */
  name: string | null;
  pup: PupId;
  createdAt: string;
}

/** Налаштування пристрою (Strefa rodzica → Ustawienia). */
export interface Settings {
  sessionMinutes: SessionMinutes;
  /** voiceURI голосу, обраного дорослим; null — автовибір польського. */
  voiceURI: string | null;
  /** Темп мови: 0,7 (Wolniej) … 1,2 (Szybciej). */
  speechRate: number;
  /** Повзунки «Mowa», «Efekty», «Muzyka»: 0…1. */
  volumes: { speech: number; effects: number; music: number };
  /** «Mniej animacji». Додатково діє системне prefers-reduced-motion. */
  reduceMotion: boolean;
  /** «Zadania dodatkowe ★»: показувати бічні ★-гілки. */
  extraTasks: boolean;
  panelLanguage: PanelLanguage;
  /** Мова гри (голос і підписи дитини): польська за замовчуванням; вибір — на Start. */
  language: Lang;
}

/** Як розв'язано завдання: first — з першого разу; retry — після однієї помилки; together — разом із Kubikom (2-га помилка). */
export type TaskOutcome = 'first' | 'retry' | 'together';

/** Розпочатий, але не завершений рівень: «Mapa» у грі лишає виконані завдання, рівень продовжується з того самого місця. */
export interface LevelRun {
  /** Зерно генератора: ті самі завдання при поверненні в рівень. */
  seed: number;
  /** Результати розв'язаних завдань; їх кількість = заповнені слоти-кісточки. */
  results: TaskOutcome[];
  startedAt: string;
  /** Слоти-повторення, заповнені з черги на початку забігу (M12): ті самі завдання при поверненні в рівень. */
  swaps: Swap[];
  /** Перший рівень дня: завдання з черги йдуть першими (розминка). */
  warmup: boolean;
}

export interface LevelRecord {
  /** Коли рівень пройдено вперше. */
  completedAt: string;
  /** Скільки разів рівень завершено (переграші теж). */
  plays: number;
  /** Хоч раз розв'язували разом із Kubikom → значок «Nie poddajesz się!». */
  togetherUsed: boolean;
  /** Скільки завдань було з першого разу в останньому проходженні. */
  firstTry: number;
}

/** Один розв'язаний елемент — рядок історії відповідей (для адаптивності, повторень і панелі батьків). */
export interface AnswerEntry {
  /** Епоха, мс. */
  t: number;
  /** Місцевий день, YYYY-MM-DD. */
  day: string;
  skill: SkillId;
  game: GameId;
  /** null — Plac Zabaw чи розминка поза рівнем. */
  level: LevelId | null;
  firstTry: boolean;
  /** Спроб до правильної відповіді: 1, 2 або 3 (разом із Kubikom). */
  attempts: number;
  /** Використано підказок («Pomóż mi»). */
  hints: number;
  together: boolean;
  /** Час до відповіді, мс (0 — не вимірювали). */
  ms: number;
  /** Правильне число й хибні вибори — для автовиявлення плутанини 13↔30, 26↔62. */
  answer?: number;
  wrong?: number[];
  /** Рахував усе спочатку замість лічби далі (Trudności). */
  countedAll?: boolean;
}

export interface RecentAnswer {
  /** З першого разу. */
  ok: boolean;
  day: string;
}

export interface SkillRecord {
  attempts: number;
  firstTry: number;
  /** Останні 10 відповідей — вікно опанування (≥ 80 % за ≥ 2 різні дні). */
  recent: RecentAnswer[];
  /** Дні, коли навичку тренували (останні 30). */
  days: string[];
  /** Повторення не вдалося → «Do powtórki». */
  needsReview: boolean;
  /** Крок складності −2…2 (curriculum/adaptivity.ts): 0 — як у рівні, < 0 — більше опори. */
  step: number;
  /** Відповідей з останньої зміни кроку. */
  sinceStep: number;
  /** Поспіль з першого разу. */
  streak: number;
  /** Труднощі на найнижчому кроці: 1 — інша гра, 2 — і там не виходить. */
  struggle: Struggle;
  /** Прапорець для батьків («Trudności»): навичка не йде навіть із найбільшою опорою; знімається опануванням. */
  flagged: boolean;
  /** Ступінь інтервалу повторення 0…5 → 1/3/7/14/30 днів (0 — ще не в розкладі). */
  stage: number;
  /** День наступного повторення (YYYY-MM-DD) або null. */
  due: string | null;
}

export interface LastSession {
  day: string;
  minutes: number;
  levels: LevelId[];
}

export interface ProfileProgress {
  /** Пройдені рівні: ключ — LevelId. */
  levels: Record<string, LevelRecord>;
  /** Розпочаті, не завершені рівні. */
  runs: Record<string, LevelRun>;
  skills: Partial<Record<SkillId, SkillRecord>>;
  /** Історія відповідей, обмежена останніми MAX_HISTORY. */
  history: AnswerEntry[];
  /** Хвилини гри за днями (YYYY-MM-DD). */
  minutesByDay: Record<string, number>;
  /** Світи, відкриті дорослим вручну («Odblokuj świat ręcznie»). */
  manualUnlocks: WorldId[];
  /** Світи, чию «Świat ukończony» уже відсвяткували: скриня на стежці стає відкритою, на мапі стоїть нова споруда (M20). */
  celebrated: WorldKey[];
  /** Завдання, розв'язані «разом» із Kubikom: схожі повернуться в наступних рівнях (M12). */
  retry: RetryItem[];
  lastSession: LastSession | null;
}

/** Усе, що пишемо в localStorage. */
export interface AppData {
  profiles: Profile[];
  activeProfileId: string | null;
  settings: Settings;
  /** Прогрес за id профілю. */
  progress: Record<string, ProfileProgress>;
}
