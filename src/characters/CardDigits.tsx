import type { CSSProperties } from 'react';
import { digitArt } from '../components/ui/digitArt';
import { layoutDigits } from '../components/ui/digitLayout';

export interface CardDigitsProps {
  /** 0–99 */
  value: number;
  className?: string;
  style?: CSSProperties;
}

/** Число на картці в лапах Kubika: шкільні цифри ink по центру поля; двоцифрові — дрібніше. Декоративне (число каже голос). */
export function CardDigits({ value, className, style }: CardDigitsProps) {
  const layout = layoutDigits(value);
  const scale = layout.glyphs.length > 1 ? 0.75 : 1;
  const inner = layout.glyphs.map((g) => `<g transform="translate(${g.x} 0)">${digitArt(g.digit).inner}</g>`).join('');
  // поле в одиницях цифр: висота цифри / scale — так двоцифрове число стоїть на 3/4 висоти картки
  const h = layout.height / scale;
  const w = Math.max(layout.width, h * 1.5);
  return (
    <svg
      className={className}
      style={style}
      viewBox={`${(layout.width - w) / 2} ${(layout.height - h) / 2} ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="#2D2A4A"
      strokeWidth={15}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
