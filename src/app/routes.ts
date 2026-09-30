// Таблиця екранів BRIEF §6 (чисті дані). Компоненти підставляє AppRoutes.tsx.
// `name` і `note` — службові підписи для заглушок і /#/dev, не репліки дитини (ті живуть у speech/lines.ts).
// Параметри шляху (:worldId, :levelId) — попередні; формат ідентифікаторів визначить M5.

export const SCREEN_IDS = [
  'loading',
  'start',
  'pup-choice',
  'map',
  'world-path',
  'mission',
  'game',
  'level-complete',
  'world-complete',
  'album',
  'badges',
  'break',
  'end-of-day',
  'playground',
  'parent-gate',
  'parent-zone',
  'error',
  'no-voice',
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];

export interface ScreenMeta {
  id: ScreenId;
  path: string;
  /** приклад конкретної адреси для шаблонів із параметрами */
  example?: string;
  name: string;
  /** етап PLAN.md, у якому екран реалізують */
  stage: string;
  /** розділ BRIEF */
  brief: string;
}

export const SCREENS: readonly ScreenMeta[] = [
  { id: 'loading', path: '/loading', name: 'Ładowanie', stage: 'M6', brief: '§6 п.1' },
  { id: 'start', path: '/start', name: 'Start', stage: 'M6', brief: '§6 п.2' },
  { id: 'pup-choice', path: '/pup', name: 'Twój piesek', stage: 'M6', brief: '§6 п.3' },
  { id: 'map', path: '/map', name: 'Mapa przygody', stage: 'M6', brief: '§6 п.4' },
  { id: 'world-path', path: '/world/:worldId', example: '/world/w1', name: 'Ścieżka świata', stage: 'M7', brief: '§6 п.5' },
  { id: 'mission', path: '/mission/:levelId', example: '/mission/w1-1', name: 'Wprowadzenie', stage: 'M7', brief: '§6 п.6' },
  { id: 'game', path: '/play/:levelId', example: '/play/w1-1', name: 'Ekran gry', stage: 'M8', brief: '§6 п.7, §7' },
  { id: 'level-complete', path: '/done/:levelId', example: '/done/w1-1', name: 'Koniec poziomu', stage: 'M7', brief: '§6 п.8' },
  { id: 'world-complete', path: '/world-done/:worldId', example: '/world-done/w1', name: 'Świat ukończony', stage: 'M20', brief: '§6 п.9' },
  { id: 'album', path: '/album', name: 'Album z naklejkami', stage: 'M20', brief: '§6 п.10' },
  { id: 'badges', path: '/badges', name: 'Odznaki', stage: 'M20', brief: '§6 п.10' },
  { id: 'break', path: '/break', name: 'Czas na przerwę!', stage: 'M21', brief: '§6 п.11' },
  { id: 'end-of-day', path: '/end', name: 'Koniec na dziś', stage: 'M21', brief: '§6 п.12' },
  { id: 'playground', path: '/playground', name: 'Plac Zabaw', stage: 'M19', brief: '§6 п.13' },
  { id: 'parent-gate', path: '/parent-gate', name: 'Bramka rodzica', stage: 'M22', brief: '§6 п.14' },
  { id: 'parent-zone', path: '/parent', name: 'Strefa rodzica', stage: 'M22', brief: '§6 п.15' },
  { id: 'error', path: '/error', name: 'Błąd', stage: 'M21', brief: '§6 п.16' },
  { id: 'no-voice', path: '/no-voice', name: 'Brak polskiego głosu', stage: 'M21', brief: '§6 п.16' },
];

/** Перший екран після запуску. Коли M6 зробить «Ładowanie», стане '/loading'. */
export const HOME_PATH = '/start';

export function screenById(id: ScreenId): ScreenMeta {
  const meta = SCREENS.find((s) => s.id === id);
  if (!meta) throw new Error(`Unknown screen: ${id}`);
  return meta;
}
