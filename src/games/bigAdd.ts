// Додавання в межах 100 (W7, PEDAGOGY §1): 30 + 20 (десятки), 34 + 10 (+10 від будь-якого числа), 42 + 5 (двоцифрове й одноцифрове без переходу), ★ 38 + 5 (з переходом через десяток).
// Спільне для ракети («Skoki żabki») і історій («Historyjki»): які пари доданків можливі й як ракета «летить» етапами (десятки, потім одиниці). Чиста логіка.
import type { Range } from '../curriculum/types';
import type { Rng } from './engine/rng';

/** Вид додавання: tens — 30 + 20; ten — 34 + 10; ones — 42 + 5 (без переходу); bridge — 38 + 5 (через десяток, ★). */
export type Addend = 'tens' | 'ten' | 'ones' | 'bridge';

export const BIG_MAX = 100;

/** Пара (a, b) для виду додавання; `range` обмежує перший доданок (за замовчуванням 11…99). Сума завжди ≤ 100. */
export function pickBigPair(addend: Addend, rng: Rng, range: Range = [11, 99]): [number, number] {
  const lo = Math.max(11, range[0]);
  const hi = Math.max(lo, Math.min(99, range[1]));
  switch (addend) {
    case 'tens': {
      // 10…80 і 10…(100 − a): обидва кратні десяти
      const upper = Math.max(1, Math.min(8, Math.floor(hi / 10)));
      const a = rng.int(Math.min(upper, Math.max(1, Math.ceil(lo / 10))), upper) * 10;
      const b = rng.int(1, (BIG_MAX - a) / 10) * 10;
      return [a, b];
    }
    case 'ten': {
      // +10 від будь-якого числа, але не «круглого» (30 + 10 — це вже десятки): остання цифра не нуль
      const candidates: number[] = [];
      for (let a = lo; a <= Math.min(hi, BIG_MAX - 10); a++) if (a % 10 !== 0) candidates.push(a);
      return [rng.pick(candidates.length > 0 ? candidates : [34]), 10];
    }
    case 'ones': {
      // без переходу: одиниці першого доданка + b ≤ 9; тому остання цифра a ≤ 8
      const candidates: number[] = [];
      for (let a = Math.max(lo, 21); a <= hi; a++) if (a % 10 <= 8) candidates.push(a);
      const a = rng.pick(candidates.length > 0 ? candidates : [21]);
      return [a, rng.int(1, 9 - (a % 10))];
    }
    case 'bridge': {
      // через десяток: одиниці a + b ≥ 10 і сума ≤ 99; тому остання цифра a ≥ 2
      const candidates: number[] = [];
      for (let a = Math.max(lo, 21); a <= hi; a++) if (a % 10 >= 2 && a % 10 <= 9 && a + 10 - (a % 10) <= 99) candidates.push(a);
      const a = rng.pick(candidates.length > 0 ? candidates : [28]);
      const toTen = 10 - (a % 10);
      return [a, rng.int(toTen, Math.min(9, 99 - a))];
    }
  }
}

/** Яким видом додавання є пара (для підказок і перевірки): десятки, +10, одиниці без переходу, через десяток; null — не підходить жоден. */
export function addendOf(a: number, b: number): Addend | null {
  if (a + b > BIG_MAX || a < 1 || b < 1) return null;
  if (a % 10 === 0 && b % 10 === 0) return 'tens';
  if (b === 10 && a % 10 !== 0) return 'ten';
  if (b < 10 && (a % 10) + b <= 9) return 'ones';
  if (b < 10 && (a % 10) + b >= 10) return 'bridge';
  return null;
}

/** Зупинки ракети (числа, на яких вона лягає по дорозі від `start` на `k` вперед): спершу десятки по +10; потім одиниці; якщо одиниці переходять десяток —
 *  спершу до найближчого десятка. 34 + 10 → [44]; 30 + 20 → [40, 50]; 42 + 5 → [43, 44, 45, 46, 47]; 38 + 5 → [40, 41, 42, 43]. */
export function landings(start: number, k: number): number[] {
  const stops: number[] = [];
  let pos = start;
  let rest = k;
  for (let i = 0; i < Math.floor(k / 10); i++) {
    pos += 10;
    stops.push(pos);
    rest -= 10;
  }
  if (rest > 0 && (pos % 10) + rest > 10) {
    const toTen = 10 - (pos % 10);
    pos += toTen;
    stops.push(pos);
    rest -= toTen;
  }
  while (rest > 0) {
    pos += 1;
    stops.push(pos);
    rest -= 1;
  }
  return stops;
}
