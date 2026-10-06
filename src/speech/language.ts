// Мова гри: польська (оригінал, за замовчуванням), українська, англійська. Перемикає живі прив'язки рядків (lines.ts), іменників (nouns.ts), чисел
// (numberWords.ts), історій (stories.ts) і шаблонів, мову голосу (tts) та `<html lang>`. Компоненти імпортують ті самі імена й мови не знають;
// після перемикання App перемонтовує екрани (useLanguage), тож усе перечитується вже новою мовою. Польські тексти від інших мов не залежать.
import { useSyncExternalStore } from 'react';
import { LANG_BCP47, LANGS, type Lang } from './langCode';
import { EN_PACK } from './lang/en';
import { UK_PACK } from './lang/uk';
import { PL_LINES, setLineTables, setLineTemplates, type LineTables, type LineTemplates } from './lines';
import { PL_NOUNS, setNounTables, type NounTables } from './nouns';
import { setNumberWords, type Gender } from './numberWords';
import { setStoryTemplates, type StoryTemplates } from './stories';
import { tts } from './tts';

/** Усе, що мова підставляє замість польського. null — польська функція (для польської — усе null). */
export interface LanguagePack {
  lines: LineTables;
  templates: LineTemplates | null;
  nouns: NounTables;
  numberWords: ((n: number, gender: Gender) => string) | null;
  stories: StoryTemplates | null;
}

const PL_PACK: LanguagePack = { lines: PL_LINES, templates: null, nouns: PL_NOUNS, numberWords: null, stories: null };

/** Мови, для яких є повний пакет; інших у перемикачі немає. */
const PACKS: Partial<Record<Lang, LanguagePack>> = { pl: PL_PACK, uk: UK_PACK, en: EN_PACK };

let current: Lang = 'pl';
const listeners = new Set<() => void>();

export const getLanguage = (): Lang => current;

/** Мови з повним перекладом — у порядку перемикача. */
export function availableLanguages(): Lang[] {
  return LANGS.filter((lang) => PACKS[lang] !== undefined);
}

/** Перемикає мову гри. Невідома чи ще не перекладена — польська. */
export function setLanguage(lang: Lang): void {
  const next: Lang = PACKS[lang] ? lang : 'pl';
  if (next === current) return;
  const pack = PACKS[next] ?? PL_PACK;
  current = next;
  setLineTables(pack.lines);
  setLineTemplates(pack.templates);
  setNounTables(pack.nouns);
  setNumberWords(pack.numberWords);
  setStoryTemplates(pack.stories);
  tts.setLanguage(next);
  if (typeof document !== 'undefined') document.documentElement.lang = LANG_BCP47[next];
  for (const listener of [...listeners]) listener();
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Поточна мова для React: компонент перерендериться, коли мову вже перемкнуто (таблиці — нові). */
export function useLanguage(): Lang {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}
