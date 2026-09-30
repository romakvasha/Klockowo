// Заміна окремих фраз на записані mp3 (public/audio/). Якщо синтезований голос вимовляє якесь слово чи число
// неправильно, записуємо його голосом людини й кладемо файл у public/audio/<slug>.mp3 та slug у public/audio/manifest.json.
// Slug — це текст фрази латиницею: «Brawo! Pięć jabłek.» → brawo-piec-jablek; «trzynaście» → trzynascie.

/** Латинський slug для імені файлу: без діакритики, малі літери, розділювач «-». */
export function clipSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l') // «ł» не розкладається через NFD
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Читає public/audio/manifest.json (масив slug'ів). Немає файлу чи він зіпсований — порожній список. */
export async function loadClipManifest(baseUrl: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}audio/manifest.json`);
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function clipUrl(baseUrl: string, slug: string): string {
  return `${baseUrl}audio/${slug}.mp3`;
}
