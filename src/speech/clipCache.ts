// Записаний голос офлайн (V5): mp3 не входять у перше завантаження сайту (десятки МБ). Service worker (vite.config.ts) кладе в кеш
// кожен запис, що прозвучав, а найчутніші (manifest.core) гра тихо докачує після старту — по одному, з паузами.
// Без service worker (npm run dev, перший візит до його запуску) нічого не робимо: браузер і так кешує сам.

function controlled(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;
}

/** Запис, що звучить, — у кеш: сам <audio> просить шматки (Range), а кеш бере лише повний файл. Уже в кеші — відповідь миттєва. */
export function cacheClip(url: string): void {
  if (controlled()) fetch(url).catch(() => undefined);
}

/** Тихо докачує записи (найчутніші першими) через `delayMs` після старту; не на «економії трафіку». Повертає «зупинити» (зміна мови). */
export function warmClips(urls: readonly string[], delayMs = 8000, gapMs = 150): () => void {
  const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true;
  if (!controlled() || saveData || urls.length === 0) return () => undefined;
  let stopped = false;
  const run = async () => {
    for (const url of urls) {
      if (stopped) return;
      try {
        await fetch(url);
      } catch {
        return; // немає мережі — докачаємо наступного разу
      }
      await new Promise((r) => setTimeout(r, gapMs));
    }
  };
  const timer = setTimeout(() => void run(), delayMs);
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
