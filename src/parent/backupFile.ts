// Резервна копія як файл (BRIEF §6 п.15, «Kopia zapasowa»): ім'я файла для завантаження й читання вибраного файла. Чиста частина — ім'я; браузерна — завантаження/читання (перевіряється вручну).
import type { Profile } from '../store/types';

/** `klockowo-Ola-2026-10-03.json`: ім'я профілю очищується до літер, цифр і дефісів (польські літери лишаються), порожнє ім'я — «profil». */
export function backupFileName(profile: Pick<Profile, 'name'>, day: string): string {
  const base = (profile.name ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return `klockowo-${base || 'profil'}-${day}.json`;
}

/** Завантаження тексту як файла (Blob + <a download>): без мережі, лише локально. */
export function downloadText(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Текст вибраного файла (до 5 МБ — копія прогресу значно менша; більше — це не копія). */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export async function readFileText(file: File): Promise<string | null> {
  if (file.size > MAX_BACKUP_BYTES) return null;
  return file.text();
}
