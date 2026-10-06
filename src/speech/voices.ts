// Вибір голосу Web Speech API за мовою гри (чиста логіка, без доступу до браузера). Польська — як і раніше; українська й англійська — за тими самими правилами.
import type { Lang } from './langCode';

export interface VoiceLike {
  name: string;
  lang: string;
  voiceURI: string;
  localService?: boolean;
  default?: boolean;
}

/** Код мови голосу: «pl-PL», «pl_PL» (Android), «pl», «pol-POL»; «uk-UA», «ukr»; «en-US», «en-GB»… Не чіпає «pt-PT», «plt», «ug» тощо. */
const LANG_TAG: Readonly<Record<Lang, RegExp>> = {
  pl: /^(pl|pol)([-_]|$)/i,
  uk: /^(uk|ukr)([-_]|$)/i,
  en: /^(en|eng)([-_]|$)/i,
};

/** Основний варіант мови отримує перевагу: pl-PL, uk-UA; англійська — британська чи американська. */
const MAIN_TAG: Readonly<Record<Lang, RegExp>> = {
  pl: /^pl[-_]pl$/i,
  uk: /^uk[-_]ua$/i,
  en: /^en[-_](gb|us)$/i,
};

// Підказки за іменем: нейронні/«природні» голоси і жіночі імена звучать для дитини приємніше.
const NATURAL = /natural|neural|online/i;
const FRIENDLY: Readonly<Record<Lang, RegExp>> = {
  pl: /zofia|zosia|paulina|ewa|agnieszka|maja|google polski/i,
  uk: /lesya|polina|natalia|olena|google українська|google ukrainian/i,
  en: /sonia|libby|jenny|aria|zira|hazel|susan|samantha|karen|moira|google uk english female|google us english/i,
};

export function isVoiceFor(v: VoiceLike, lang: Lang): boolean {
  return LANG_TAG[lang].test(v.lang);
}

/** «pl-PL», «pl_PL» (Android), «pl», «pol-POL». Не чіпає «pt-PT», «plt» тощо. */
export function isPolishVoice(v: VoiceLike): boolean {
  return isVoiceFor(v, 'pl');
}

function score(v: VoiceLike, lang: Lang, preferredURI: string | null | undefined): number {
  let s = 0;
  if (preferredURI && v.voiceURI === preferredURI) s += 1000;
  if (MAIN_TAG[lang].test(v.lang)) s += 20;
  if (v.localService) s += 10;
  if (NATURAL.test(v.name)) s += 6;
  if (FRIENDLY[lang].test(v.name)) s += 5;
  if (v.default) s += 1;
  return s;
}

/** Лише голоси мови `lang`; найкращі (за оцінкою) — першими, порядок рівних зберігається. */
export function voicesFor<V extends VoiceLike>(all: readonly V[], lang: Lang, preferredURI?: string | null): V[] {
  return all
    .filter((v) => isVoiceFor(v, lang))
    .map((v, i) => ({ v, i, s: score(v, lang, preferredURI) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.v);
}

/** Голос мови `lang`: вибраний батьками (`preferredURI`), інакше найкращий. Немає голосу цієї мови — undefined. */
export function pickVoiceFor<V extends VoiceLike>(all: readonly V[], lang: Lang, preferredURI?: string | null): V | undefined {
  return voicesFor(all, lang, preferredURI)[0];
}

/** Лише польські голоси; найкращі (за оцінкою) — першими, порядок рівних зберігається. */
export function polishVoices<V extends VoiceLike>(all: readonly V[], preferredURI?: string | null): V[] {
  return voicesFor(all, 'pl', preferredURI);
}

/** Голос для озвучення: вибраний батьками (`preferredURI`), інакше найкращий польський. Без польського — undefined. */
export function pickVoice<V extends VoiceLike>(all: readonly V[], preferredURI?: string | null): V | undefined {
  return pickVoiceFor(all, 'pl', preferredURI);
}
