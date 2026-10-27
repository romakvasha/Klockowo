// Записаний голос (ElevenLabs, tools/voice/generate.mjs): по одному mp3 на речення в public/audio/<мова>/ і manifest.json там же:
//   { "voice": "…", "model": "…", "complete": false, "clips": { "<ключ речення>": "<файл без .mp3>" } }
// Висловлювання звучить записом, лише якщо записано КОЖНЕ його речення; інакше все висловлювання каже браузерний голос
// (щоб в одній фразі не змішувались два голоси). Ключ — речення без регістру й без крапки чи знака оклику в кінці: «Siedem.» і «siedem» — один файл.

/** Речення висловлювання: «Brawo! Pięć jabłek.» → [«Brawo!», «Pięć jabłek.»]. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ключ запису речення: малі літери, один пробіл, без «.», «!», «…» у кінці (знак питання лишається — інша інтонація). */
export function clipKey(sentence: string): string {
  return sentence
    .normalize('NFC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!…]+$/u, '')
    .trim();
}

export interface ClipManifest {
  voice?: string;
  model?: string;
  /** Записано все, що гра може сказати цією мовою. */
  complete?: boolean;
  /** Найчутніші записи (файли) — гра докачує їх для офлайну першими (clipCache.ts). */
  core?: readonly string[];
  clips: Readonly<Record<string, string>>;
}

/** Файли записів для висловлювання (по одному на речення) або null, якщо хоч одного речення не записано. */
export function clipsFor(manifest: ClipManifest | null | undefined, text: string): string[] | null {
  if (!manifest) return null;
  const files: string[] = [];
  for (const sentence of splitSentences(text)) {
    const file = manifest.clips[clipKey(sentence)];
    if (!file) return null;
    files.push(file);
  }
  return files.length > 0 ? files : null;
}

function isManifest(data: unknown): data is ClipManifest {
  if (typeof data !== 'object' || data === null) return false;
  const clips = (data as { clips?: unknown }).clips;
  return typeof clips === 'object' && clips !== null && Object.values(clips).every((v) => typeof v === 'string');
}

/** Читає public/audio/<мова>/manifest.json. Немає файлу чи він зіпсований — null (усе каже браузерний голос). */
export async function loadClipManifest(baseUrl: string, lang: string): Promise<ClipManifest | null> {
  try {
    const res = await fetch(`${baseUrl}audio/${lang}/manifest.json`);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return isManifest(data) ? data : null;
  } catch {
    return null;
  }
}

export function clipUrl(baseUrl: string, lang: string, file: string): string {
  return `${baseUrl}audio/${lang}/${file}.mp3`;
}
