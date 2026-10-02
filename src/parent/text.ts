// Тексти Strefa rodzica (BRIEF §6 п.14–15): панель тримовна — «Język panelu: Polski / Українська / English». Польські рядки — з BRIEF дослівно; українські — переклад для батьків (власник);
// англійські — додано разом з англійською мовою гри. Мова панелі окрема від мови гри (її обирають на Start), але при виборі мови гри панель перемикається на неї ж.
import type { SkillId } from '../curriculum/types';
import { SKILL_NAMES, gateQuestion } from '../speech/lines';
import type { Lang } from '../speech/langCode';
import type { PanelLanguage } from '../store/types';

export type SkillStateKey = 'new' | 'learning' | 'mastered' | 'review';

export interface PanelText {
  gateInstruction: (a: number, b: number) => string;
  gateEnter: string;
  gateWrong: string;
  gateBack: string;
  gateBackspace: string;
  title: string;
  language: string;
  exit: string;
  sections: { summary: string; lastSession: string; skills: string; progress: string; difficulties: string; settings: string; profiles: string; backup: string };
  summary: { player: string; levels: string; worlds: string; stickers: string; badges: string; minutes: string };
  lastSession: { none: string; day: string; minutes: string; levels: string };
  skillStates: Record<SkillStateKey, string>;
  skillStar: string;
  progress: { firstTry: string; hints: string; minutesPerDay: string; noData: string };
  difficulties: { none: string; confuses: (a: number, b: number) => string; countsAll: string; flagged: string };
  settings: {
    /** voiceAuto / voiceNone — про голос мови гри (`game`), а не панелі. */
    sessionLength: string; minutesUnit: string; voice: string; voiceAuto: (game: Lang) => string; voiceNone: (game: Lang) => string; speechRate: string; slower: string; faster: string;
    volume: string; speech: string; effects: string; music: string; reduceMotion: string; extraTasks: string; unlockWorld: string; unlockNote: string;
  };
  profiles: { name: string; namePlaceholder: string; pup: string; add: string; full: string; remove: string; active: string };
  backup: { export: string; import: string; clear: string; importNew: string; importReplace: string; pasteHere: string; done: string; errors: Record<string, string>; confirm: (name: string) => string; cancel: string; confirmYes: string };
}

/** Українські назви навичок (SKILL_NAMES — польські) для панелі батьків. */
export const SKILL_NAMES_UK: Readonly<Record<SkillId, string>> = {
  'count-line': 'Лічба предметів у ряду',
  'count-scatter': 'Лічба розсипаних предметів',
  'subitize-5': 'Впізнавання 1–5 одним поглядом',
  'give-n': 'Відлічування заданої кількості',
  'digit-quantity': 'Цифра й кількість',
  zero: 'Нуль',
  'order-around': 'Перед і після',
  'compare-10': 'Більше, менше, порівну',
  'add-combine': "Об'єднання наборів",
  'plus-equals': 'Знаки «+» і «=»',
  'count-on': 'Лічба далі від числа',
  'bonds-5-10': 'Склад чисел 5 і 10',
  doubles: 'Подвоєння',
  teens: 'Числа 11–20: десять і ще кілька',
  'count-from-any': 'Лічба з будь-якого числа',
  'add-no-bridge-20': 'Додавання без переходу через десяток',
  'bridge-ten': 'Додавання з переходом через десяток',
  'count-by-tens': 'Лічба десятками',
  'bundle-ten': "Об'єднання десяти в пучок",
  'compose-2digit': 'Складання двоцифрового числа',
  'count-on-100': 'Лічба до 100 з будь-якого числа',
  neighbors: 'Сусіди числа: ±1 і ±10',
  'chart-patterns': 'Закономірності на таблиці 100',
  'compare-2digit': 'Порівняння двоцифрових чисел',
  'add-tens': 'Додавання десятків',
  'plus-ten': '+10 від будь-якого числа',
  'add-2digit-1digit': 'Двоцифрове й одноцифрове без переходу',
  'add-with-bridge': 'Додавання з переходом через десяток (до 100)',
  'story-problems': 'Задачі-історії',
};

const UK_DIGITS = ['нуль', 'один', 'два', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять", 'десять'] as const;
const EN_DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const;
/** Мова гри в підписі голосу: «Automatycznie (polski)», «Brak polskiego głosu…». */
const PL_LANG_ADJ: Readonly<Record<Lang, string>> = { pl: 'polski', uk: 'ukraiński', en: 'angielski' };
const PL_LANG_GEN: Readonly<Record<Lang, string>> = { pl: 'polskiego', uk: 'ukraińskiego', en: 'angielskiego' };
const UK_LANG_ADJ: Readonly<Record<Lang, string>> = { pl: 'польський', uk: 'український', en: 'англійський' };
const UK_LANG_GEN: Readonly<Record<Lang, string>> = { pl: 'польського', uk: 'українського', en: 'англійського' };
const EN_LANG_NAME: Readonly<Record<Lang, string>> = { pl: 'Polish', uk: 'Ukrainian', en: 'English' };
const PL_DIGITS = ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć'] as const;
const digitWord = (words: readonly string[], n: number): string => words[n] ?? String(n);

const PL: PanelText = {
  gateInstruction: (a, b) => gateQuestion(a, b),
  gateEnter: 'Wejdź',
  gateWrong: 'Niepoprawny wynik. Spróbuj ponownie.',
  gateBack: 'Wróć do dziecka',
  gateBackspace: 'Cofnij',
  title: 'Strefa rodzica',
  language: 'Język panelu',
  exit: 'Wyjdź',
  sections: {
    summary: 'Podsumowanie', lastSession: 'Ostatnia sesja', skills: 'Mapa umiejętności', progress: 'Postępy', difficulties: 'Trudności', settings: 'Ustawienia',
    profiles: 'Profile', backup: 'Kopia zapasowa',
  },
  summary: { player: 'Gracz', levels: 'Ukończone poziomy', worlds: 'Ukończone światy', stickers: 'Naklejki', badges: 'Odznaki „Nie poddajesz się!”', minutes: 'Łącznie minut' },
  lastSession: { none: 'Jeszcze nie było sesji.', day: 'Dzień', minutes: 'Minuty', levels: 'Ukończone poziomy' },
  skillStates: { new: 'Nowa', learning: 'W trakcie nauki', mastered: 'Opanowana', review: 'Do powtórki' },
  skillStar: 'dodatkowa ★',
  progress: { firstTry: 'Poprawnie za pierwszym razem', hints: 'Użyte podpowiedzi', minutesPerDay: 'Minuty dziennie', noData: 'Brak danych' },
  difficulties: {
    none: 'Na razie nic nie niepokoi.',
    confuses: (a, b) => `Myli ${a} i ${b}`,
    countsAll: 'Liczy wszystko od początku, zamiast liczyć dalej',
    flagged: 'Umiejętność nie idzie nawet z największą pomocą',
  },
  settings: {
    sessionLength: 'Długość sesji', minutesUnit: 'min', voice: 'Głos', voiceAuto: (game) => `Automatycznie (${PL_LANG_ADJ[game]})`,
    voiceNone: (game) => `Brak ${PL_LANG_GEN[game]} głosu w tej przeglądarce`, speechRate: 'Tempo mowy',
    slower: 'Wolniej', faster: 'Szybciej', volume: 'Głośność', speech: 'Mowa', effects: 'Efekty', music: 'Muzyka', reduceMotion: 'Mniej animacji',
    extraTasks: 'Zadania dodatkowe ★', unlockWorld: 'Odblokuj świat ręcznie', unlockNote: 'Dziecko może wejść do światu bez ukończenia poprzedniego.',
  },
  profiles: { name: 'Imię', namePlaceholder: 'Bez imienia', pup: 'Piesek', add: 'Dodaj profil', full: 'Jest już 4 profile', remove: 'Usuń profil', active: 'gra teraz' },
  backup: {
    export: 'Eksportuj postępy', import: 'Importuj postępy', clear: 'Wyczyść postępy', importNew: 'Jako nowy profil', importReplace: 'Zamiast postępów tego profilu', pasteHere: 'Wklej tu zawartość pliku kopii',
    done: 'Gotowe', cancel: 'Anuluj', confirmYes: 'Tak, usuń',
    errors: {
      'not-json': 'To nie jest plik JSON.', 'not-klockowo': 'To nie jest plik Klockowo.', 'unsupported-version': 'Plik pochodzi z nowszej wersji aplikacji.', invalid: 'Plik jest uszkodzony.',
      'too-many-profiles': 'Jest już 4 profile.', 'no-profile': 'Brak profilu do zastąpienia.',
    },
    confirm: (name) => `Usunąć wszystkie postępy profilu „${name}”? Tego nie da się cofnąć.`,
  },
};

const UK: PanelText = {
  gateInstruction: (a, b) => `Введіть результат: ${digitWord(UK_DIGITS, a)} помножити на ${digitWord(UK_DIGITS, b)}`,
  gateEnter: 'Увійти',
  gateWrong: 'Неправильний результат. Спробуйте ще раз.',
  gateBack: 'Повернутися до дитини',
  gateBackspace: 'Стерти',
  title: 'Зона для дорослих',
  language: 'Мова панелі',
  exit: 'Вийти',
  sections: {
    summary: 'Підсумок', lastSession: 'Остання сесія', skills: 'Карта навичок', progress: 'Прогрес', difficulties: 'Труднощі', settings: 'Налаштування',
    profiles: 'Профілі', backup: 'Резервна копія',
  },
  summary: { player: 'Гравець', levels: 'Пройдені рівні', worlds: 'Пройдені світи', stickers: 'Наліпки', badges: 'Значки за старанність', minutes: 'Усього хвилин' },
  lastSession: { none: 'Сесій ще не було.', day: 'День', minutes: 'Хвилини', levels: 'Пройдені рівні' },
  skillStates: { new: 'Нова', learning: 'У процесі', mastered: 'Засвоєна', review: 'До повторення' },
  skillStar: 'додаткова ★',
  progress: { firstTry: 'Правильно з першого разу', hints: 'Використані підказки', minutesPerDay: 'Хвилини за день', noData: 'Немає даних' },
  difficulties: {
    none: 'Поки що нічого не турбує.',
    confuses: (a, b) => `Плутає ${a} і ${b}`,
    countsAll: 'Рахує все спочатку, замість лічити далі',
    flagged: 'Навичка не йде навіть із найбільшою допомогою',
  },
  settings: {
    sessionLength: 'Тривалість сесії', minutesUnit: 'хв', voice: 'Голос', voiceAuto: (game) => `Автоматично (${UK_LANG_ADJ[game]})`,
    voiceNone: (game) => `У цьому браузері немає ${UK_LANG_GEN[game]} голосу`, speechRate: 'Темп мовлення',
    slower: 'Повільніше', faster: 'Швидше', volume: 'Гучність', speech: 'Мовлення', effects: 'Ефекти', music: 'Музика', reduceMotion: 'Менше анімацій',
    extraTasks: 'Додаткові завдання ★', unlockWorld: 'Відкрити світ вручну', unlockNote: 'Дитина зможе зайти у світ, не пройшовши попередній.',
  },
  profiles: { name: "Ім'я", namePlaceholder: "Без імені", pup: 'Цуценя', add: 'Додати профіль', full: 'Уже 4 профілі', remove: 'Видалити профіль', active: 'грає зараз' },
  backup: {
    export: 'Експортувати прогрес', import: 'Імпортувати прогрес', clear: 'Очистити прогрес', importNew: 'Як новий профіль', importReplace: 'Замість прогресу цього профілю', pasteHere: 'Вставте сюди вміст файлу копії',
    done: 'Готово', cancel: 'Скасувати', confirmYes: 'Так, видалити',
    errors: {
      'not-json': 'Це не файл JSON.', 'not-klockowo': 'Це не файл Klockowo.', 'unsupported-version': 'Файл зроблено новішою версією застосунку.', invalid: 'Файл пошкоджено.',
      'too-many-profiles': 'Уже 4 профілі.', 'no-profile': 'Немає профілю, який можна замінити.',
    },
    confirm: (name) => `Видалити весь прогрес профілю «${name}»? Цю дію не можна скасувати.`,
  },
};

const EN: PanelText = {
  gateInstruction: (a, b) => `Type the answer: ${digitWord(EN_DIGITS, a)} times ${digitWord(EN_DIGITS, b)}`,
  gateEnter: 'Enter',
  gateWrong: 'Wrong answer. Please try again.',
  gateBack: 'Back to the child',
  gateBackspace: 'Delete',
  title: 'Parent zone',
  language: 'Panel language',
  exit: 'Exit',
  sections: {
    summary: 'Summary', lastSession: 'Last session', skills: 'Skill map', progress: 'Progress', difficulties: 'Difficulties', settings: 'Settings',
    profiles: 'Profiles', backup: 'Backup',
  },
  summary: { player: 'Player', levels: 'Levels completed', worlds: 'Worlds completed', stickers: 'Stickers', badges: 'Persistence badges', minutes: 'Total minutes' },
  lastSession: { none: 'No sessions yet.', day: 'Day', minutes: 'Minutes', levels: 'Levels completed' },
  skillStates: { new: 'New', learning: 'Learning', mastered: 'Mastered', review: 'To review' },
  skillStar: 'extra ★',
  progress: { firstTry: 'Correct on the first try', hints: 'Hints used', minutesPerDay: 'Minutes per day', noData: 'No data' },
  difficulties: {
    none: 'Nothing to worry about so far.',
    confuses: (a, b) => `Mixes up ${a} and ${b}`,
    countsAll: 'Counts everything from the start instead of counting on',
    flagged: 'This skill is not going well even with the most help',
  },
  settings: {
    sessionLength: 'Session length', minutesUnit: 'min', voice: 'Voice', voiceAuto: (game) => `Automatic (${EN_LANG_NAME[game]})`,
    voiceNone: (game) => `No ${EN_LANG_NAME[game]} voice in this browser`, speechRate: 'Speech rate',
    slower: 'Slower', faster: 'Faster', volume: 'Volume', speech: 'Speech', effects: 'Effects', music: 'Music', reduceMotion: 'Less animation',
    extraTasks: 'Extra tasks ★', unlockWorld: 'Unlock a world manually', unlockNote: 'The child can enter the world without finishing the previous one.',
  },
  profiles: { name: 'Name', namePlaceholder: 'No name', pup: 'Puppy', add: 'Add profile', full: 'There are already 4 profiles', remove: 'Delete profile', active: 'playing now' },
  backup: {
    export: 'Export progress', import: 'Import progress', clear: 'Clear progress', importNew: 'As a new profile', importReplace: 'Instead of this profile’s progress',
    pasteHere: 'Paste the backup file contents here', done: 'Done', cancel: 'Cancel', confirmYes: 'Yes, delete',
    errors: {
      'not-json': 'This is not a JSON file.', 'not-klockowo': 'This is not a Klockowo file.', 'unsupported-version': 'The file comes from a newer version of the app.', invalid: 'The file is damaged.',
      'too-many-profiles': 'There are already 4 profiles.', 'no-profile': 'There is no profile to replace.',
    },
    confirm: (name) => `Delete all progress of the profile “${name}”? This cannot be undone.`,
  },
};

/** Англійські назви навичок для панелі батьків. */
export const SKILL_NAMES_EN: Readonly<Record<SkillId, string>> = {
  'count-line': 'Counting objects in a row',
  'count-scatter': 'Counting scattered objects',
  'subitize-5': 'Seeing 1–5 at a glance',
  'give-n': 'Giving a set number',
  'digit-quantity': 'Digit and quantity',
  zero: 'Zero',
  'order-around': 'Before and after',
  'compare-10': 'More, fewer, the same',
  'add-combine': 'Putting groups together',
  'plus-equals': 'The + and = signs',
  'count-on': 'Counting on',
  'bonds-5-10': 'Number bonds to 5 and 10',
  doubles: 'Doubles',
  teens: 'Numbers 11–20 as 10 + n',
  'count-from-any': 'Counting from any number',
  'add-no-bridge-20': 'Adding without crossing ten',
  'bridge-ten': 'Adding across ten',
  'count-by-tens': 'Counting in tens',
  'bundle-ten': 'Bundling in tens',
  'compose-2digit': 'Two-digit numbers',
  'count-on-100': 'Counting on to 100',
  neighbors: 'Neighbours ±1 and ±10',
  'chart-patterns': 'Patterns on the hundred chart',
  'compare-2digit': 'Comparing two-digit numbers',
  'add-tens': 'Adding tens',
  'plus-ten': 'Adding 10 to any number',
  'add-2digit-1digit': 'Two-digit plus one-digit',
  'add-with-bridge': 'Adding across ten (to 100)',
  'story-problems': 'Story problems',
};

export const PANEL_TEXT: Readonly<Record<PanelLanguage, PanelText>> = { pl: PL, uk: UK, en: EN };

export const panelText = (lang: PanelLanguage): PanelText => PANEL_TEXT[lang] ?? PL;

/** Назва навички для панелі: польська (SKILL_NAMES), українська чи англійська. */
export const skillName = (id: SkillId, lang: PanelLanguage): string => (lang === 'uk' ? SKILL_NAMES_UK[id] : lang === 'en' ? SKILL_NAMES_EN[id] : SKILL_NAMES[id]);

/** Польські цифри-слова для перевірки гейта в тестах. */
export const gateDigitWord = (n: number): string => digitWord(PL_DIGITS, n);
