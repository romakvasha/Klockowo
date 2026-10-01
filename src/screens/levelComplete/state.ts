// Що гра повідомляє Koniec poziomu через навігацію: чи це перше проходження (наліпка нова) і чи розв'язували разом із Kubikom (значок).
// Адресу екрана можна відкрити й напряму (оновлення сторінки): тоді показуємо «спокійну» версію без нової наліпки й значка.

export interface LevelCompleteState {
  /** Рівень пройдено вперше цим проходженням: наліпка нова, конфеті, можливе «Świat ukończony». */
  firstTime: boolean;
  /** У цьому проходженні хоч раз розв'язували разом із Kubikom: значок «Nie poddajesz się!». */
  together: boolean;
}

export const QUIET_STATE: LevelCompleteState = { firstTime: false, together: false };

/** Читає недовірений `location.state`: лише два булеві поля, усе інше ігнорується. */
export function readCompleteState(raw: unknown): LevelCompleteState {
  if (typeof raw !== 'object' || raw === null) return QUIET_STATE;
  const r = raw as Record<string, unknown>;
  return { firstTime: r.firstTime === true, together: r.together === true };
}

/** Для розробки: /#/done/w1-1?first=1&together=1 відтворює екран без гри. У збірці для дитини (production) параметри ігноруються. */
export function readDevState(search: string, dev: boolean): LevelCompleteState | null {
  if (!dev) return null;
  const params = new URLSearchParams(search);
  if (!params.has('first') && !params.has('together')) return null;
  return { firstTime: params.get('first') === '1', together: params.get('together') === '1' };
}
