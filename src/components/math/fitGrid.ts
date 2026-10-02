// Сітка квадратів: скільки колонок і який розмір клітинки, щоб `count` предметів найбільшого розміру вмістилося в прямокутник w × h
// (предмети в кошику, під будиночком). Чиста геометрія.
export interface GridFit {
  cols: number;
  rows: number;
  /** Сторона клітинки, px (ціле). */
  size: number;
  gap: number;
}

export function fitGrid(count: number, w: number, h: number, gap = 4, maxSize = Number.POSITIVE_INFINITY): GridFit {
  if (count <= 0 || w <= 0 || h <= 0) return { cols: 0, rows: 0, size: 0, gap };
  let best: GridFit = { cols: 1, rows: count, size: 0, gap };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const size = Math.max(0, Math.min(Math.floor((w - (cols - 1) * gap) / cols), Math.floor((h - (rows - 1) * gap) / rows), maxSize));
    // при однаковому розмірі беремо ширшу сітку (менше рядів)
    if (size >= best.size) best = { cols, rows, size, gap };
  }
  return best;
}

/** Позиція i-ї клітинки в сітці, вирівняної по центру прямокутника w × h; останній ряд центрується. */
export function gridCell(fit: GridFit, index: number, count: number, w: number, h: number): { x: number; y: number } {
  const row = Math.floor(index / fit.cols);
  const inRow = row === fit.rows - 1 ? count - row * fit.cols : fit.cols;
  const col = index - row * fit.cols;
  const rowW = inRow * fit.size + (inRow - 1) * fit.gap;
  const totalH = fit.rows * fit.size + (fit.rows - 1) * fit.gap;
  return {
    x: Math.round((w - rowW) / 2 + col * (fit.size + fit.gap)),
    y: Math.round((h - totalH) / 2 + row * (fit.size + fit.gap)),
  };
}
