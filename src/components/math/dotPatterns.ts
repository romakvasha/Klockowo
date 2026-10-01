// Розкладка крапок на картці «Błysk!» (PEDAGOGY §2 п.2, design etap2/07 DotCard): «dice» — канонічні візерунки 1–6 у рядах (зручні для впізнавання
// «одразу» й розкладання на групи: 5 = 3 + 2), «random» — випадкові з рівними проміжками, «tenFrame» — рамка-десятка 2×5. Чиста геометрія в одиничному
// квадраті [0, 1]²; групи (індекси крапок) — те, що обводиться, коли картка повертається з відповіддю: «trzy i dwa to pięć».
import type { Rng } from '../../games/engine/rng';

export type DotPattern = 'dice' | 'random' | 'tenFrame';

export interface Dot {
  x: number;
  y: number;
}

export interface DotLayout {
  /** Позиції крапок у [0, 1]² (центри). */
  dots: Dot[];
  /** Групи — індекси крапок: одна (ціле) або дві (a + b); перша завжди не менша за другу чи рівна їй за порядком читання. */
  groups: number[][];
  /** Рамка-десятка: комірки 5×2 замість голої картки. */
  frame: boolean;
}

const DICE: Record<number, readonly (readonly [number, number])[]> = {
  1: [[0.5, 0.5]],
  2: [[0.3, 0.5], [0.7, 0.5]],
  3: [[0.5, 0.3], [0.3, 0.7], [0.7, 0.7]],
  4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
  5: [[0.2, 0.3], [0.5, 0.3], [0.8, 0.3], [0.35, 0.7], [0.65, 0.7]],
  6: [[0.2, 0.3], [0.5, 0.3], [0.8, 0.3], [0.2, 0.7], [0.5, 0.7], [0.8, 0.7]],
};

/** Групи кубика: рядок за рядком (3 + 2, 3 + 3), пара над парою (2 + 2), вершина й основа трикутника (1 + 2). */
const DICE_GROUPS: Record<number, number[][]> = {
  1: [[0]],
  2: [[0], [1]],
  3: [[0], [1, 2]],
  4: [[0, 1], [2, 3]],
  5: [[0, 1, 2], [3, 4]],
  6: [[0, 1, 2], [3, 4, 5]],
};

function dice(count: number): DotLayout {
  const dots = (DICE[count] ?? []).map(([x, y]) => ({ x, y }));
  return { dots, groups: DICE_GROUPS[count] ?? [dots.map((_, i) => i)], frame: false };
}

/** Рамка-десятка: перший ряд заповнюється зліва направо (п'ять), решта — другий ряд; групи «п'ять і решта» (як на борді etap2/08). */
function tenFrame(count: number): DotLayout {
  const n = Math.max(1, Math.min(10, count));
  const dots = Array.from({ length: n }, (_, i): Dot => ({ x: ((i % 5) + 0.5) / 5, y: i < 5 ? 0.4 : 0.6 }));
  const first = Array.from({ length: Math.min(5, n) }, (_, i) => i);
  const rest = Array.from({ length: Math.max(0, n - 5) }, (_, i) => i + 5);
  return { dots, groups: rest.length ? [first, rest] : [first], frame: true };
}

/** Випадкові крапки: картка ділиться (вертикально чи горизонтально — навмання) на дві половини з просвітом посередині, в кожній — своя група крапок
 *  у випадкових місцях з рівними проміжками. Так обведення двох груп ніколи не перекриваються, а візерунок лишається випадковим. */
function random(count: number, rng: Rng): DotLayout {
  const n = Math.max(1, Math.min(10, count));
  const margin = 0.16;
  const gap = 0.2;
  let minDist = n <= 5 ? 0.26 : 0.2;

  const sample = (k: number, region: { x0: number; x1: number; y0: number; y1: number }, existing: Dot[]): Dot[] => {
    const out: Dot[] = [];
    let dist = minDist;
    for (let attempt = 0; attempt < 600 && out.length < k; attempt++) {
      const p: Dot = { x: region.x0 + rng.next() * (region.x1 - region.x0), y: region.y0 + rng.next() * (region.y1 - region.y0) };
      if ([...existing, ...out].every((d) => Math.hypot(d.x - p.x, d.y - p.y) >= dist)) out.push(p);
      if (attempt % 60 === 59 && out.length < k) dist *= 0.92; // тісно — трохи зменшуємо проміжок
    }
    // край: не вмістилось — розкладаємо решту по сітці області
    for (let i = 0; out.length < k; i++) {
      out.push({ x: region.x0 + ((i % 3) / 2) * (region.x1 - region.x0), y: region.y0 + (Math.floor(i / 3) / 2) * (region.y1 - region.y0) });
    }
    return out;
  };

  if (n === 1) return { dots: sample(1, { x0: margin, x1: 1 - margin, y0: margin, y1: 1 - margin }, []), groups: [[0]], frame: false };

  const bigFirst = rng.next() < 0.5;
  const sizeA = bigFirst ? Math.ceil(n / 2) : Math.floor(n / 2);
  const sizeB = n - sizeA;
  const vertical = rng.next() < 0.5; // вертикальна межа: групи ліворуч і праворуч; інакше — згори й знизу
  const half = (1 - gap) / 2 - margin;
  const regionA = vertical ? { x0: margin, x1: margin + half, y0: margin, y1: 1 - margin } : { x0: margin, x1: 1 - margin, y0: margin, y1: margin + half };
  const regionB = vertical ? { x0: 1 - margin - half, x1: 1 - margin, y0: margin, y1: 1 - margin } : { x0: margin, x1: 1 - margin, y0: 1 - margin - half, y1: 1 - margin };
  minDist = Math.min(minDist, 0.3);
  const dotsA = sample(sizeA, regionA, []);
  const dotsB = sample(sizeB, regionB, []);
  return {
    dots: [...dotsA, ...dotsB],
    groups: [Array.from({ length: sizeA }, (_, i) => i), Array.from({ length: sizeB }, (_, i) => i + sizeA)],
    frame: false,
  };
}

/** Крапки й групи картки. Кубик підтримує 1–6; для більших чисел «dice» замінюється випадковою розкладкою, рамка-десятка — 1–10. */
export function dotLayout(pattern: DotPattern, count: number, rng: Rng): DotLayout {
  if (pattern === 'tenFrame') return tenFrame(count);
  if (pattern === 'dice' && count >= 1 && count <= 6) return dice(count);
  return random(count, rng);
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Прямокутники навколо кожної групи (в одиничному квадраті, з запасом `pad` навколо крапок радіусом `r`) — це те, що «обводиться». */
export function groupBoxes(dots: readonly Dot[], groups: readonly (readonly number[])[], r: number, pad: number): Box[] {
  return groups.map((group) => {
    const xs = group.map((i) => (dots[i] as Dot).x);
    const ys = group.map((i) => (dots[i] as Dot).y);
    const x = Math.min(...xs) - r - pad;
    const y = Math.min(...ys) - r - pad;
    return { x, y, w: Math.max(...xs) + r + pad - x, h: Math.max(...ys) + r + pad - y };
  });
}

/** Розмір груп для репліки «{a} i {b} to {n}»: для однієї групи — [n]. */
export function groupSizes(layout: Pick<DotLayout, 'groups'>): number[] {
  return layout.groups.map((g) => g.length);
}
