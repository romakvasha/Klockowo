// Конфеті (BRIEF §11): до 40 маленьких кольорових кубиків, до 1,5 с, лише наприкінці рівня чи світу. Чиста генерація шматочків за зерном —
// детермінована (тест, повторюваний вигляд); малює Confetti.tsx.

export const CONFETTI_MAX = 40;
/** Загальна межа: затримка + падіння кожного шматочка ≤ 1,5 с (--kl-dur-confetti). */
export const CONFETTI_MAX_MS = 1500;

/** Кольори блоків: primary, secondary, success, reward, світи W4, W6, W7. */
export const CONFETTI_COLORS = ['#FF8A3D', '#3AA0FF', '#3CBF6B', '#FFC21A', '#FF6B6B', '#D46BD8', '#6C63FF'] as const;

export interface ConfettiPiece {
  id: number;
  /** Початкова позиція по горизонталі, % ширини екрана. */
  x: number;
  /** Затримка старту, мс (0…300). */
  delay: number;
  /** Тривалість падіння, мс (900…1150). */
  duration: number;
  /** Сторона кубика, px (10…18). */
  size: number;
  color: string;
  /** Повний оберт-обертання за падіння, градуси (±360…±720). */
  spin: number;
  /** Зсув убік за падіння, % ширини (−12…12). */
  drift: number;
}

/** mulberry32: маленький детермінований ГПСЧ. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` шматочків (не більше CONFETTI_MAX), рівномірно по ширині екрана, з різними кольорами, затримками й обертанням. */
export function confettiPieces(count: number, seed = 1): ConfettiPiece[] {
  const n = Math.max(0, Math.min(CONFETTI_MAX, Math.floor(count)));
  const next = rng(seed);
  return Array.from({ length: n }, (_, id) => {
    const slot = (id + next() * 0.8 + 0.1) / n; // по одному шматочку в кожній вертикальній смузі — без «купок»
    return {
      id,
      x: Math.round(slot * 1000) / 10,
      delay: Math.round(next() * 300),
      duration: Math.round(900 + next() * 250),
      size: Math.round(10 + next() * 8),
      color: CONFETTI_COLORS[Math.floor(next() * CONFETTI_COLORS.length)] ?? CONFETTI_COLORS[0],
      spin: Math.round((360 + next() * 360) * (next() < 0.5 ? -1 : 1)),
      drift: Math.round((next() * 24 - 12) * 10) / 10,
    };
  });
}
