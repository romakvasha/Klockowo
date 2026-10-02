// Дозвіл на Strefa rodzica після бар'єра: пам'ятається в sessionStorage лише на кілька хвилин, щоб дитина, яка знайшла адресу /#/parent, не потрапила в панель повз бар'єр,
// а дорослий не вводив відповідь щоразу, коли перемикає розділи й повертається. Чиста логіка з вбудованим сховищем.
export const PARENT_TTL_MS = 15 * 60_000;
const KEY = 'klockowo.parentAccess';

interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Чи дозвіл ще діє: видано не раніше ніж `ttl` тому й не з майбутнього. */
export function isGrantValid(grantedAt: number | null, now: number, ttl: number = PARENT_TTL_MS): boolean {
  return grantedAt !== null && Number.isFinite(grantedAt) && now >= grantedAt && now - grantedAt < ttl;
}

export function createParentAccess(store: Store | null, now: () => number = Date.now) {
  let memory: number | null = null;
  const read = (): number | null => {
    try {
      const raw = store?.getItem(KEY);
      return store ? (raw ? Number(raw) : null) : memory;
    } catch {
      return memory;
    }
  };
  return {
    /** Бар'єр пройдено. */
    grant(): void {
      memory = now();
      try {
        store?.setItem(KEY, String(memory));
      } catch {
        // без сховища дозвіл живе в пам'яті
      }
    },
    isGranted: (): boolean => isGrantValid(read(), now()),
    /** Вихід із панелі (чи кінець часу): наступний вхід знову через бар'єр. */
    revoke(): void {
      memory = null;
      try {
        store?.removeItem(KEY);
      } catch {
        // нічого
      }
    },
  };
}

function browserStore(): Store | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export const parentAccess = createParentAccess(browserStore());
