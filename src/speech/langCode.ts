// Коди мов гри. Окремий модуль без залежностей: його імпортують і store, і голос (voices.ts, tts.ts), і пакети мов.

/** pl — польська (оригінал, за замовчуванням); uk — українська; en — англійська. */
export type Lang = 'pl' | 'uk' | 'en';

/** Порядок у перемикачі на Start: польська, англійська, українська. */
export const LANGS: readonly Lang[] = ['pl', 'en', 'uk'];

export const isLang = (value: unknown): value is Lang => value === 'pl' || value === 'uk' || value === 'en';

/** Назва мови її ж мовою — підпис перемикача й те, що вимовляє голос після вибору. */
export const LANG_NATIVE_NAMES: Readonly<Record<Lang, string>> = { pl: 'Polski', uk: 'Українська', en: 'English' };

/** Короткий код на кнопці перемикача. */
export const LANG_CODES: Readonly<Record<Lang, string>> = { pl: 'PL', uk: 'UA', en: 'EN' };

/** BCP 47 — для `<html lang>` і `lang` у підписах. */
export const LANG_BCP47: Readonly<Record<Lang, string>> = { pl: 'pl', uk: 'uk', en: 'en' };
