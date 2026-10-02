// Годинник сесії (BRIEF §6 п.11–12, §3 «Session»): скільки дитина грає без довгої паузи. Тривалість — з налаштувань (10/15/20 хв). Перерва «Czas na przerwę!» — приблизно в середині
// сесії (лише для 15 і 20 хв), лише між рівнями; «Koniec na dziś» — коли час вичерпано, лише після завершення поточного рівня; наступний урок сам не запускається. Ознака втоми
// (M12 `fatigueSignal`) наближає перерву. Чиста логіка з вбудованим сховищем: стан живе в sessionStorage, тож перезавантаження вкладки сесію не обнуляє.
export const IDLE_RESET_MS = 30 * 60_000;
/** Раніше за цю хвилину сесії перерву через втому не пропонуємо — інакше вона не мала б сенсу. */
export const FATIGUE_BREAK_AFTER_MIN = 3;
/** Сесії, довші за цей поріг, мають перерву; 10-хвилинна — ні (BRIEF §6.11). */
export const BREAK_MIN_SESSION = 15;

export interface SessionState {
  /** Початок сесії, мс. */
  startedAt: number;
  /** Остання активність (початок або кінець завдання), мс. */
  lastActive: number;
  breakTaken: boolean;
  fatigue: boolean;
}

export type NextStep = 'continue' | 'break' | 'end';

/** Нова сесія з моменту `now`. */
export const freshSession = (now: number): SessionState => ({ startedAt: now, lastActive: now, breakTaken: false, fatigue: false });

/** Скільки хвилин триває сесія. */
export const elapsedMinutes = (state: SessionState, now: number): number => Math.max(0, (now - state.startedAt) / 60_000);

/** Активність: стара сесія (довга пауза) закривається й починається нова; інакше лише оновлюється `lastActive`. */
export function touch(state: SessionState | null, now: number): SessionState {
  if (!state || now - state.lastActive > IDLE_RESET_MS) return freshSession(now);
  return { ...state, lastActive: now };
}

/** Що далі між рівнями: «end» — час вичерпано; «break» — середина сесії (15/20 хв) чи втома, якщо перерви ще не було; інакше «continue». */
export function decideNext(state: SessionState | null, sessionMinutes: number, now: number): NextStep {
  if (!state) return 'continue';
  const elapsed = elapsedMinutes(state, now);
  if (elapsed >= sessionMinutes) return 'end';
  if (sessionMinutes >= BREAK_MIN_SESSION && !state.breakTaken) {
    if (elapsed >= sessionMinutes / 2) return 'break';
    if (state.fatigue && elapsed >= FATIGUE_BREAK_AFTER_MIN) return 'break';
  }
  return 'continue';
}

const KEY = 'klockowo.session';

interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function parse(raw: string | null): SessionState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<SessionState>;
    const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
    if (!ok(v.startedAt) || !ok(v.lastActive)) return null;
    return { startedAt: v.startedAt, lastActive: v.lastActive, breakTaken: v.breakTaken === true, fatigue: v.fatigue === true };
  } catch {
    return null;
  }
}

/** Годинник над сховищем (sessionStorage; недоступне — працює в пам'яті). */
export function createSessionClock(store: Store | null, now: () => number = Date.now) {
  let memory: SessionState | null = null;
  const read = (): SessionState | null => {
    try {
      return store ? parse(store.getItem(KEY)) : memory;
    } catch {
      return memory;
    }
  };
  const write = (state: SessionState | null): void => {
    memory = state;
    try {
      if (!store) return;
      if (state) store.setItem(KEY, JSON.stringify(state));
      else store.removeItem(KEY);
    } catch {
      // сховище недоступне — лишається пам'ять
    }
  };
  return {
    /** Дитина щось робить (початок рівня, відповідь на завдання). */
    touch(): SessionState {
      const state = touch(read(), now());
      write(state);
      return state;
    },
    /** Перерва відбулась (чи пропонувалась): другої в цій сесії не буде. */
    markBreak(): void {
      const state = read();
      if (state) write({ ...state, breakTaken: true });
    },
    /** Ознака втоми в рівні (3 помилки поспіль, випадкові дотики, довга бездіяльність). */
    markFatigue(): void {
      const state = read();
      if (state) write({ ...state, fatigue: true });
    },
    /** Що далі між рівнями за налаштуванням `sessionMinutes`. */
    decide(sessionMinutes: number): NextStep {
      return decideNext(read(), sessionMinutes, now());
    },
    /** «Koniec na dziś» показано: сесію закрито, наступний рівень почне нову. */
    reset(): void {
      write(null);
    },
    state: read,
  };
}

function browserStore(): Store | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export const sessionClock = createSessionClock(browserStore());
