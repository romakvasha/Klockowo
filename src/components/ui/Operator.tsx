import type { SVGProps } from 'react';

export interface OperatorProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'ref' | 'children'> {
  kind: 'plus' | 'equals';
}

/** Знак «+» або «=» у стилі SVG-цифр (товста кругла лінія, `currentColor`). Розмір задає CSS (`height`); декоративний — дію читає голос («dodać», «równa się»). */
export function Operator({ kind, style, ...rest }: OperatorProps) {
  return (
    <svg
      viewBox="0 0 60 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={15}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ aspectRatio: '60 / 100', ...style }}
      {...rest}
    >
      {kind === 'plus' ? (
        <path d="M30 28V72M8 50H52" />
      ) : (
        <path d="M10 36H50M10 64H50" />
      )}
    </svg>
  );
}
