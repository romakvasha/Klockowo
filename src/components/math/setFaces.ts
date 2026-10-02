// Грані набору-картинки «Cyfra i obrazek» (BRIEF §7 гра 3, PEDAGOGY §2 п.3): кількість показано предметами, крапками, пальцями рук чи рамкою-десяткою.
// Чиста геометрія й вибір розкладки; малює SetCard.tsx (файл зветься інакше: Windows не розрізняє регістр імен).
import { createRng } from '../../games/engine/rng';
import { dotLayout, type DotLayout } from './dotPatterns';

/** Як показано кількість на картці. Усе, крім предметів, — до десяти (крапки, пальці, рамка-десятка); 0 — порожня картка / кулак / порожня рамка. */
export type SetKind = 'objects' | 'dots' | 'fingers' | 'tenFrame';

export const SET_KINDS: readonly SetKind[] = ['objects', 'dots', 'fingers', 'tenFrame'];
export const MAX_STRUCTURED = 10;

/** Чи можна показати `count` цим способом: предмети — будь-яку кількість до 20, решта — до 10. */
export function kindAllowed(kind: SetKind, count: number): boolean {
  return kind === 'objects' ? count >= 0 && count <= 20 : count >= 0 && count <= MAX_STRUCTURED;
}

/** Крапки картки: 1–6 — канонічний «кубик», 7–10 — випадкові з рівними проміжками (зерно картки), 0 — порожня картка; рамка-десятка — комірки 5×2. */
export function dotsFor(kind: 'dots' | 'tenFrame', count: number, seed: number): DotLayout {
  if (count <= 0) return { dots: [], groups: [[]], frame: kind === 'tenFrame' };
  return dotLayout(kind === 'tenFrame' ? 'tenFrame' : count <= 6 ? 'dice' : 'random', count, createRng(seed));
}

/** Які руки показують `count` пальців: 0–5 — одна; 6–10 — дві (п'ять і решта). */
export function handsFor(count: number): number[] {
  if (count < 0 || count > MAX_STRUCTURED) throw new RangeError(`handsFor: 0–10 expected, got ${count}`);
  return count <= 5 ? [count] : [5, count - 5];
}

export interface GridItem {
  x: number;
  y: number;
}

/** Скільки предметів у ряду: чим їх більше, тим ширший ряд — але предмети лишаються якомога більшими. 1–4 — по два в ряду (як кубик), 5–6 — по три,
 *  7–8 — по чотири, 9 — квадрат 3×3, від 10 — по п'ять (як рамка-десятка: «п'ять і п'ять»). */
export const OBJECT_COLS = 5;
export function objectCols(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  if (count <= 8) return 4;
  return count === 9 ? 3 : OBJECT_COLS;
}

export const OBJECT_GAP = 0.14;

/** Предмети рядами зліва направо, неповний останній ряд по центру; блок по центру квадрата `inner`.
 *  Розмір предмета — найбільший, що вміщує сітку, але не більше 46 % сторони (єдиний предмет не заповнює всю картку). */
export function objectGrid(count: number, inner: number): { size: number; items: GridItem[] } {
  if (count <= 0) return { size: 0, items: [] };
  const cols = objectCols(count);
  const rows = Math.ceil(count / cols);
  const unit = 1 + OBJECT_GAP;
  const size = Math.floor(Math.min(inner * 0.46, inner / (cols * unit), inner / (rows * unit)));
  const step = size * unit;
  const y0 = (inner - (rows * step - size * OBJECT_GAP)) / 2;
  const items = Array.from({ length: count }, (_, i): GridItem => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, count - row * cols);
    const x0 = (inner - (inRow * step - size * OBJECT_GAP)) / 2;
    return { x: Math.round(x0 + (i - row * cols) * step), y: Math.round(y0 + row * step) };
  });
  return { size, items };
}
