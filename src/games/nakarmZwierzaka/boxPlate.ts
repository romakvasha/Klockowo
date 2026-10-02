// Тарілка «Nakarm zwierzaka» з коробками по 10 (W5): скільки коробок і предметів поштучно на ній лежить. Чисті функції — сцена лише показує результат.
// Як у «Paczki po dziesięć» (режим «Zbuduj»): десятий предмет поштучно разом із дев'ятьма іншими стає коробкою, тож на тарілці завжди «десятки + одиниці».

export interface BoxPlate {
  tens: number;
  ones: number;
}

export const EMPTY_PLATE: BoxPlate = { tens: 0, ones: 0 };

/** Більше коробок на тарілку не стане: тваринки просять до 59 (5 десятків), дві зайві — на помилку; стільки вміщає й таця телефона (88 × 220). */
export const MAX_TENS_ON_PLATE = 7;

export const plateTotal = (p: BoxPlate): number => p.tens * 10 + p.ones;

/** Дотик до стосу коробок: +10. null — тарілка повна, нічого не змінилось. */
export function addTen(p: BoxPlate): BoxPlate | null {
  return p.tens >= MAX_TENS_ON_PLATE ? null : { tens: p.tens + 1, ones: p.ones };
}

/** Дотик до купки їжі: +1; десятий предмет із дев'ятьма іншими стає коробкою (`merged`). null — більше не вміститься. */
export function addOne(p: BoxPlate): { plate: BoxPlate; merged: boolean } | null {
  if (p.ones < 9) return { plate: { tens: p.tens, ones: p.ones + 1 }, merged: false };
  if (p.tens >= MAX_TENS_ON_PLATE) return null;
  return { plate: { tens: p.tens + 1, ones: 0 }, merged: true };
}

/** Дотик до тарілки: знімає предмет поштучно, а коли їх нема — коробку. null — тарілка порожня. */
export function removeOne(p: BoxPlate): BoxPlate | null {
  if (p.ones > 0) return { tens: p.tens, ones: p.ones - 1 };
  if (p.tens > 0) return { tens: p.tens - 1, ones: 0 };
  return null;
}
