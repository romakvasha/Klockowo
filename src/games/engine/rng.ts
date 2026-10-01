// Детермінований генератор випадкових чисел для завдань: те саме зерно → ті самі завдання. На цьому тримається продовження рівня
// після «Mapa» (BRIEF §6): збережено лише зерно й результати, а завдання відновлюються. Без Math.random у логіці завдань.

export interface Rng {
  /** Число в [0, 1). */
  next(): number;
  /** Ціле в [min, max] включно. */
  int(min: number, max: number): number;
  pick<T>(list: readonly T[]): T;
  /** Нова перестановка (Fisher–Yates); вхідний масив не змінюється. */
  shuffle<T>(list: readonly T[]): T[];
  /** Незалежний потік за «сіллю» (номер завдання, призначення): його значення не залежать від того, скільки взяли з батьківського. */
  fork(salt: string | number): Rng;
}

/** FNV-1a: зерно з рядків і чисел (id рівня + зерно забігу + номер завдання). */
export function hashSeed(...parts: readonly (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const ch of parts.join('\u0001')) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) throw new RangeError(`rng.int(${min}, ${max})`);
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(list) {
      const item = list[Math.floor(next() * list.length)];
      if (item === undefined) throw new RangeError('rng.pick: empty list');
      return item;
    },
    shuffle(list) {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = out[i] as (typeof out)[number];
        out[i] = out[j] as (typeof out)[number];
        out[j] = tmp;
      }
      return out;
    },
    fork(salt) {
      return createRng(hashSeed(seed, salt));
    },
  };
  return rng;
}

/** Нове зерно забігу рівня: з годинника, один раз при старті рівня (далі зерно зберігається в LevelRun). */
export function freshSeed(now: number = Date.now()): number {
  return hashSeed('run', now, Math.floor(Math.random() * 1e9));
}
