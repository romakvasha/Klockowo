import { cx } from './cx';
import styles from './Cubes.module.css';

/** Ізометричний кубик із дизайну (etap1/13): верхня грань світліша, права темніша, контур ink. */
export function Cube({ x = 0, y = 0, size, color, className }: { x?: number; y?: number; size: number; color: string; className?: string }) {
  const d = size / 4;
  const top = `M0 0 L${d} ${-d} L${size + d} ${-d} L${size} 0 Z`;
  const side = `M${size} 0 L${size + d} ${-d} L${size + d} ${size - d} L${size} ${size} Z`;
  const outline = `M0 0 L${d} ${-d} L${size + d} ${-d} L${size + d} ${size - d} L${size} ${size} L0 ${size} Z M0 0 L${size} 0 L${size} ${size} M${size} 0 L${size + d} ${-d}`;
  return (
    <g transform={`translate(${x} ${y})`} fill={color} className={className}>
      <path d={top} />
      <path d={top} className={styles.light} />
      <path d={side} />
      <path d={side} className={styles.shade} />
      <rect width={size} height={size} />
      <rect className={styles.shine} x={size * 0.125} y={size * 0.125} width={size * 0.54} height={size * 0.107} rx={size * 0.054} />
      <path className={styles.edge} d={outline} strokeWidth={size >= 50 ? 3.5 : 3} />
    </g>
  );
}

/** Кольори кубиків смужки завантаження: світи W1–W7, далі жовтий (хаб), primary, success. */
export const STRIP_COLORS = ['#7BCB5A', '#FF9F43', '#3FA9F5', '#FF6B6B', '#2FA58B', '#D46BD8', '#6C63FF', '#FFC21A', '#FF8A3D', '#3CBF6B'] as const;

export interface CubeStripProps {
  filled: number;
  total?: number;
  /** aria-label: «Ładowanie…». */
  label: string;
  className?: string;
}

/** Смужка завантаження з кубиків (BRIEF §6.1): заповнені — кольорові, порожні — пунктирні; щойно з'явлений «вискакує». */
export function CubeStrip({ filled, total = 10, label, className }: CubeStripProps) {
  const pitch = 50;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={filled} className={cx(styles.strip, className)}>
      <svg viewBox={`-3 -12 ${(total - 1) * pitch + 36 + 8} 60`} aria-hidden="true" focusable="false">
        {Array.from({ length: total }, (_, i) =>
          i < filled ? (
            <g key={i} transform={`translate(${i * pitch} 8)`}>
              <g className={i === filled - 1 ? styles.pop : undefined}>
                <Cube size={36} color={STRIP_COLORS[i % STRIP_COLORS.length] ?? '#7BCB5A'} />
              </g>
            </g>
          ) : (
            <rect key={i} className={styles.empty} x={i * pitch} y={8} width={36} height={36} rx={6} />
          ),
        )}
      </svg>
    </div>
  );
}

/** Вежа з трьох кубиків, яку складає Kubik на екрані завантаження. */
export function CubeTower({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-4 -18 80 250" aria-hidden="true" focusable="false">
      <Cube size={56} x={0} y={168} color="#7BCB5A" />
      <Cube size={56} x={0} y={112} color="#3FA9F5" />
      <Cube size={56} x={0} y={56} color="#FF6B6B" />
    </svg>
  );
}
