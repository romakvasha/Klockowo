import { BlockCube } from './BlockCube';
import { BlockRod } from './BlockRod';

export interface PlaceBlocksProps {
  tens: number;
  ones: number;
  /** Ділянка, у яку мають влізти стовпчики й кубики, px. */
  w: number;
  h: number;
}

const GAP = 3;
const COLS = 3;

/** Найбільша клітинка (4…20 px), при якій стовпчики й кубики вміщуються в ділянку w × h: стовпчик — 10 клітинок заввишки, кубики — сітка 3 × 3 праворуч. */
export function blockCell(tens: number, w: number, h: number): number {
  for (let cell = 20; cell >= 4; cell--) {
    const width = tens * (cell + GAP) + 14 + COLS * (cell + GAP);
    if (width <= w && 10 * cell <= h) return cell;
  }
  return 4;
}

/** Число як стовпчики-десятки й кубики-одиниці без мату (кадри «Historyjki» понад 20, купки «Kto ma więcej?»): стовпчики ліворуч, кубики 3 в ряд праворуч; блоки стоять на низу ділянки. */
export function PlaceBlocks({ tens, ones, w, h }: PlaceBlocksProps) {
  const cell = blockCell(tens, w, h);
  const rodsW = tens * (cell + GAP);
  const cubesW = COLS * (cell + GAP);
  const total = rodsW + (tens > 0 && ones > 0 ? 14 : 0) + (ones > 0 ? cubesW : 0);
  const x0 = (w - total) / 2;
  const rows = Math.ceil(ones / COLS);
  return (
    <div style={{ position: 'relative', width: w, height: h }} aria-hidden="true">
      {Array.from({ length: tens }, (_, i) => (
        <BlockRod key={`r${i}`} cell={cell} style={{ position: 'absolute', left: x0 + i * (cell + GAP), top: h - 10 * cell }} />
      ))}
      {Array.from({ length: ones }, (_, i) => (
        <BlockCube
          key={`c${i}`}
          size={cell}
          tone="ones"
          style={{
            position: 'absolute',
            left: x0 + rodsW + (tens > 0 ? 14 : 0) + (i % COLS) * (cell + GAP),
            top: h - rows * (cell + GAP) + Math.floor(i / COLS) * (cell + GAP),
          }}
        />
      ))}
    </div>
  );
}
