// Тексти Strefa rodzica (BRIEF §6 п.14–15): панель двомовна — «Język panelu: Polski / Українська». Польські рядки — з BRIEF дослівно; українські — переклад для батьків (власник).
// Мова панелі не стосується дитячого інтерфейсу: гра завжди польською.
import type { SkillId } from '../curriculum/types';
import { SKILL_NAMES, gateQuestion } from '../speech/lines';
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
    sessionLength: string; minutesUnit: string; voice: string; voiceAuto: string; voiceNone: string; speechRate: string; slower: string; faster: string;
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
    sessionLength: 'Długość sesji', minutesUnit: 'min', voice: 'Głos', voiceAuto: 'Automatycznie (polski)', voiceNone: 'Brak polskiego głosu w tej przeglądarce', speechRate: 'Tempo mowy',
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
  summary: { player: 'Гравець', levels: 'Пройдені рівні', worlds: 'Пройдені світи', stickers: 'Наліпки', badges: 'Значки «Nie poddajesz się!»', minutes: 'Усього хвилин' },
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
    sessionLength: 'Тривалість сесії', minutesUnit: 'хв', voice: 'Голос', voiceAuto: 'Автоматично (польський)', voiceNone: 'У цьому браузері немає польського голосу', speechRate: 'Темп мовлення',
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

export const PANEL_TEXT: Readonly<Record<PanelLanguage, PanelText>> = { pl: PL, uk: UK };

export const panelText = (lang: PanelLanguage): PanelText => PANEL_TEXT[lang] ?? PL;

/** Назва навички для панелі: польська (SKILL_NAMES) чи українська. */
export const skillName = (id: SkillId, lang: PanelLanguage): string => (lang === 'uk' ? SKILL_NAMES_UK[id] : SKILL_NAMES[id]);

/** Польські цифри-слова для перевірки гейта в тестах. */
export const gateDigitWord = (n: number): string => digitWord(PL_DIGITS, n);
