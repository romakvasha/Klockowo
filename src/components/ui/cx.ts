import type { CSSProperties } from 'react';

/** Склеює CSS-класи, пропускаючи порожні значення. */
export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Типізований набір CSS custom properties для style={…}: React не знає ключів `--x`. */
export type CssVars = { readonly [name: `--${string}`]: string | number | undefined };

/** Змішує змінні зі звичайним style; style користувача має пріоритет. */
export function cssVars(vars: CssVars, style?: CSSProperties): CSSProperties {
  return { ...vars, ...style } as CSSProperties;
}
