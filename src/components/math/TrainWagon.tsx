import { DIGIT_H, layoutDigits } from '../ui/digitLayout';
import { Digits } from '../ui/Digits';
import { cx } from '../ui/cx';
import styles from './TrainWagon.module.css';

/** idle — вагон стоїть; reading — Kubik читає його номер (золота рамка, підйом); gap — порожнє місце «?»; gapHint — «?» пульсує золотом (підказка вказує сюди);
 *  arriving — загублений вагончик заїжджає на місце (падає зверху й «підстрибує», колеса крутяться). */
export type WagonState = 'idle' | 'reading' | 'gap' | 'gapHint' | 'arriving';

/** Кольори блоків-вагонів (за колом): синій, пісочний, коралловий, бірюзовий — без жовтого й фіолетового, що мають свій сенс (підказка, «спробуй ще»). */
const TONES = [
  { fill: '#4FB3F6', edge: '#1F76CC' },
  { fill: '#F3D9A0', edge: '#BFA05C' },
  { fill: '#FF6B6B', edge: '#C63E42' },
  { fill: '#2FA58B', edge: '#007E67' },
] as const;

/** Ширина вагона у viewBox. Паровозик — 150 (ENGINE_UNITS у trainLayout.ts). */
export const WAGON_VIEW = { w: 120, h: 104 } as const;
const ENGINE_VIEW_W = 150;

export interface TrainWagonProps {
  /** Номер на вагоні; null — місце порожнє («?»). */
  value: number | null;
  state?: WagonState;
  /** Індекс кольору: сусідні вагони мають різний. */
  tone?: number;
  /** Ширина, px: висота — за пропорцією viewBox. */
  size: number;
  /** Підпис для екранного диктора. */
  label: string;
  className?: string;
}

/** Колесо з маточиною й спицею — крутиться під час заїзду. */
function Wheel({ cx: x, r = 11 }: { cx: number; r?: number }) {
  return (
    <g className={styles.wheel}>
      <circle cx={x} cy={92} r={r} fill="#2D2A4A" />
      <circle cx={x} cy={92} r={r * 0.4} fill="#FFFFFF" />
      <rect x={x - 1.6} y={92 - r + 2} width={3.2} height={r - 2.5} rx={1.6} fill="#FFFFFF" />
    </g>
  );
}

/** Табличка з номером: біла, з рамкою кольору вагона; число — SVG-цифри (до трьох розрядів вміщаються за шириною). */
function Plate({ value, edge }: { value: number; edge: string }) {
  const layout = layoutDigits(value);
  const h = Math.min(44, (88 - 10) / (layout.width / DIGIT_H));
  const w = (layout.width / DIGIT_H) * h;
  return (
    <>
      <rect x={16} y={15} width={88} height={56} rx={10} fill="#FFFFFF" stroke={edge} strokeWidth={3} />
      <Digits value={value} x={60 - w / 2} y={43 - h / 2} width={w} height={h} style={{ color: '#2D2A4A' }} />
    </>
  );
}

/** TrainWagon (BRIEF §8; design: Етап 4 ще не намальовано — зібрано з блоків за описом): вагон із табличкою-номером або порожнє місце «?» на потязі. */
export function TrainWagon({ value, state = 'idle', tone = 0, size, label, className }: TrainWagonProps) {
  const { fill, edge } = TONES[((tone % TONES.length) + TONES.length) % TONES.length]!;
  const gap = value === null;
  return (
    <div
      className={cx(styles.wagon, className)}
      data-state={state}
      role="img"
      aria-label={label}
      style={{ width: size, height: (size * WAGON_VIEW.h) / WAGON_VIEW.w }}
    >
      <svg viewBox={`0 0 ${WAGON_VIEW.w} ${WAGON_VIEW.h}`} width="100%" height="100%" aria-hidden="true" focusable="false">
        {gap ? (
          <>
            <rect className={styles.slot} x={8} y={10} width={104} height={70} rx={12} />
            <rect x={16} y={15} width={88} height={56} rx={10} fill="rgba(255,255,255,.7)" />
            <text className={styles.question} x={60} y={56} textAnchor="middle">?</text>
          </>
        ) : (
          <>
            <rect className={styles.glow} x={4} y={6} width={112} height={78} rx={16} />
            <rect x={0} y={52} width={120} height={8} rx={3} fill="#5E5A80" />
            <rect x={8} y={16} width={104} height={68} rx={12} fill={edge} />
            <rect x={8} y={10} width={104} height={68} rx={12} fill={fill} />
            <rect x={14} y={13} width={92} height={5} rx={2.5} fill="rgba(255,255,255,.4)" />
            <Plate value={value} edge={edge} />
            <Wheel cx={34} />
            <Wheel cx={86} />
          </>
        )}
      </svg>
    </div>
  );
}

export interface TrainEngineProps {
  size: number;
  label: string;
  className?: string;
}

/** Паровозик: стоїть попереду, дивиться ліворуч; номерів не має. Ширина = size × 1,25 (150 : 120). */
export function TrainEngine({ size, label, className }: TrainEngineProps) {
  const w = (size * ENGINE_VIEW_W) / WAGON_VIEW.w;
  return (
    <div className={cx(styles.wagon, styles.engine, className)} role="img" aria-label={label} style={{ width: w, height: (size * WAGON_VIEW.h) / WAGON_VIEW.w }}>
      <svg viewBox={`0 0 ${ENGINE_VIEW_W} ${WAGON_VIEW.h}`} width="100%" height="100%" aria-hidden="true" focusable="false">
        <g fill="#E6E2F2">
          <circle cx={24} cy={8} r={6} />
          <circle cx={16} cy={2} r={4} />
        </g>
        <rect x={14} y={14} width={22} height={20} rx={4} fill="#2D2A4A" />
        <rect x={10} y={10} width={30} height={9} rx={4} fill="#5E5A80" />
        <rect x={6} y={36} width={92} height={54} rx={12} fill="#D9661C" />
        <rect x={6} y={30} width={92} height={54} rx={12} fill="#FF8A3D" />
        <rect x={12} y={33} width={80} height={5} rx={2.5} fill="rgba(255,255,255,.4)" />
        <circle cx={16} cy={58} r={7} fill="#FFC21A" stroke="#D99A00" strokeWidth={2} />
        <rect x={98} y={14} width={46} height={70} rx={10} fill="#1F76CC" />
        <rect x={98} y={8} width={46} height={70} rx={10} fill="#3AA0FF" />
        <rect x={92} y={2} width={58} height={11} rx={5} fill="#2D2A4A" />
        <rect x={108} y={20} width={26} height={26} rx={6} fill="#D9F1FF" stroke="#1F76CC" strokeWidth={3} />
        <rect x={0} y={60} width={12} height={8} rx={3} fill="#5E5A80" />
        <rect x={138} y={52} width={12} height={8} rx={3} fill="#5E5A80" />
        <Wheel cx={30} />
        <Wheel cx={64} />
        <Wheel cx={118} />
      </svg>
    </div>
  );
}
