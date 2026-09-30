// Вибір польського голосу Web Speech API (чиста логіка, без доступу до браузера).

export interface VoiceLike {
  name: string;
  lang: string;
  voiceURI: string;
  localService?: boolean;
  default?: boolean;
}

/** «pl-PL», «pl_PL» (Android), «pl», «pol-POL». Не чіпає «pt-PT», «plt» тощо. */
export function isPolishVoice(v: VoiceLike): boolean {
  return /^(pl|pol)([-_]|$)/i.test(v.lang);
}

// Підказки за іменем: нейронні/«природні» голоси і жіночі польські імена звучать для дитини приємніше.
const NATURAL = /natural|neural|online/i;
const FRIENDLY = /zofia|zosia|paulina|ewa|agnieszka|maja|google polski/i;

function score(v: VoiceLike, preferredURI: string | null | undefined): number {
  let s = 0;
  if (preferredURI && v.voiceURI === preferredURI) s += 1000;
  if (/^pl[-_]pl$/i.test(v.lang)) s += 20;
  if (v.localService) s += 10;
  if (NATURAL.test(v.name)) s += 6;
  if (FRIENDLY.test(v.name)) s += 5;
  if (v.default) s += 1;
  return s;
}

/** Лише польські голоси; найкращі (за оцінкою) — першими, порядок рівних зберігається. */
export function polishVoices<V extends VoiceLike>(all: readonly V[], preferredURI?: string | null): V[] {
  return all
    .filter(isPolishVoice)
    .map((v, i) => ({ v, i, s: score(v, preferredURI) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.v);
}

/** Голос для озвучення: вибраний батьками (`preferredURI`), інакше найкращий польський. Без польського — undefined. */
export function pickVoice<V extends VoiceLike>(all: readonly V[], preferredURI?: string | null): V | undefined {
  return polishVoices(all, preferredURI)[0];
}
