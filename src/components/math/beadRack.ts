// Рахівниця на 20 (BRIEF §10 «liczydło», design BeadRack20 ще не намальовано): два дроти по 10 кульок, у кожному п'ять одного кольору й п'ять іншого (як рамка-десятка
// з опорою на 5). Кульки «відсунуто» ліворуч (пораховані) або вони лежать праворуч. Чиста логіка стану; малює BeadRack20.tsx.
export const RACK_ROWS = 2;
export const RACK_COLS = 10;
export const RACK_BEADS = RACK_ROWS * RACK_COLS;

export interface Bead {
  /** 0…19: за порядком лічби (перший дріт зліва направо, потім другий). */
  index: number;
  row: number;
  col: number;
  /** Колір у п'ятірці: перші п'ять кульок дроту — 'a', решта — 'b'. */
  tone: 'a' | 'b';
  /** Відсунуто ліворуч (пораховано). */
  moved: boolean;
}

/** Двадцять кульок; `moved` перших відсунуто ліворуч. */
export function rackBeads(moved: number): Bead[] {
  const m = Math.max(0, Math.min(RACK_BEADS, Math.trunc(moved)));
  return Array.from({ length: RACK_BEADS }, (_, index): Bead => {
    const row = Math.floor(index / RACK_COLS);
    const col = index % RACK_COLS;
    return { index, row, col, tone: col < RACK_COLS / 2 ? 'a' : 'b', moved: index < m };
  });
}

/** Скільки кульок відсунуто на кожному дроті: {0: 10, 1: 3} для 13. */
export function movedPerRow(moved: number): [number, number] {
  const m = Math.max(0, Math.min(RACK_BEADS, Math.trunc(moved)));
  return [Math.min(RACK_COLS, m), Math.max(0, m - RACK_COLS)];
}

/** Позиція центра кульки по дроту (design-px): відсунуті тісно ліворуч, решта тісно праворуч, між ними просвіт. `size` — діаметр кульки, `width` — довжина дроту. */
export function beadX(bead: Pick<Bead, 'col' | 'moved'>, width: number, size: number): number {
  return bead.moved ? size / 2 + bead.col * size : width - size / 2 - (RACK_COLS - 1 - bead.col) * size;
}
