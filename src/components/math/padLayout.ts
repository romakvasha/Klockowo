// Геометрія «Skoki żabki» (design-px): листки латаття 0…max у кілька рядків (як рядки тексту), дуги стрибків між сусідніми листками.
// Чисті функції: рядів стільки, скільки треба, щоб n+1 листків влізло по `cols` у ряд; на вузькому екрані беруть менше колонок (більше рядів).
export const PAD = 48; // діаметр листка
export const PITCH = 56; // крок листків у ряду
export const ROW_H = 132; // висота ряду: місце для жабки й дуг над листками (76) + листок
export const ARC_ROOM = 76;
export const FROG_W = 64;
export const FROG_H = 73;

export interface PadPoint {
  /** Центр листка. */
  x: number;
  y: number;
  row: number;
  col: number;
}

export interface PadLayout {
  max: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
  pads: readonly PadPoint[];
}

/** Листки 0…max: в один ряд — `cols` штук, далі наступний ряд (зліва направо в кожному). */
export function padLayout(max: number, cols: number): PadLayout {
  if (!Number.isInteger(max) || max < 1) throw new RangeError(`padLayout: bad max ${max}`);
  const c = Math.max(2, Math.min(cols, max + 1));
  const rows = Math.ceil((max + 1) / c);
  const pads: PadPoint[] = Array.from({ length: max + 1 }, (_, i) => {
    const row = Math.floor(i / c);
    const col = i % c;
    return { x: PAD / 2 + col * PITCH, y: row * ROW_H + ARC_ROOM + PAD / 2, row, col };
  });
  return { max, cols: c, rows, width: (c - 1) * PITCH + PAD, height: rows * ROW_H, pads };
}

/** Скільки колонок пробувати: широкий екран — усе в 11 (0–10 в одному ряду, 0–20 у двох), вузький — коротші ряди. */
export function colOptions(max: number): readonly number[] {
  return max <= 10 ? [11, 6] : [11, 7];
}

export interface Arc {
  /** SVG-контур дуги (квадратична крива). */
  d: string;
  /** Де лежить бейдж із номером стрибка. */
  mid: { x: number; y: number };
}

/** Дуга між листками `from` → `to`: у межах ряду — підстрибок над листками, між рядами — похила лінія в проміжку (вона не перетинає листки). */
export function arcBetween(layout: PadLayout, from: number, to: number): Arc {
  const a = layout.pads[from];
  const b = layout.pads[to];
  if (!a || !b) throw new RangeError(`arcBetween: pads ${from} → ${to} outside 0…${layout.max}`);
  if (a.row !== b.row) {
    const sx = a.x;
    const sy = a.y + PAD / 2;
    const ex = b.x;
    const ey = b.y - PAD / 2;
    return { d: `M${sx} ${sy} L${ex} ${ey}`, mid: { x: (sx + ex) / 2, y: (sy + ey) / 2 } };
  }
  const sx = a.x;
  const ex = b.x;
  const y = a.y - PAD / 4;
  const span = Math.abs(ex - sx);
  const lift = Math.min(ARC_ROOM - 12, 26 + span * 0.18);
  const cx = (sx + ex) / 2;
  const cy = y - lift * 2; // контрольна точка: вершина квадратичної кривої — на половині висоти
  return { d: `M${sx} ${y} Q${cx} ${cy} ${ex} ${y}`, mid: { x: cx, y: y - lift } };
}

/** Де стоїть жабка на листку `i`: центр низу картинки — біля верхнього краю листка, щоб цифра на листку лишалась видимою. */
export function frogAnchor(layout: PadLayout, i: number): { x: number; y: number } {
  const p = layout.pads[i];
  if (!p) throw new RangeError(`frogAnchor: pad ${i} outside 0…${layout.max}`);
  return { x: p.x, y: p.y - PAD / 2 + 10 };
}

/** Які листки мають цифру: усі (numbered) або лише віхи 0, 5, 10… і стартовий (landmarks); `reveal` — додатково показати ще один (посадка). */
export function labelledPads(max: number, mode: 'numbered' | 'landmarks', start: number, reveal: readonly number[] = []): ReadonlySet<number> {
  const set = new Set<number>();
  for (let i = 0; i <= max; i++) if (mode === 'numbered' || i % 5 === 0) set.add(i);
  set.add(start);
  for (const r of reveal) set.add(r);
  return set;
}
