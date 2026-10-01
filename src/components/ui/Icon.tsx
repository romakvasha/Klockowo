import type { SVGProps } from 'react';
import { iconArt, type IconName } from './icons';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'viewBox' | 'ref' | 'children' | 'dangerouslySetInnerHTML'> {
  name: IconName;
  /** Розмір, px або CSS-значення; без нього розмір задає клас (1em за замовчуванням). */
  size?: number | string;
}

/** Заповнена іконка дизайну (BRIEF §8). Колір — `currentColor`; завжди декоративна: підпис дає кнопка (aria-label). */
export function Icon({ name, size = '1em', ...rest }: IconProps) {
  const art = iconArt(name);
  return (
    <svg
      viewBox={art.viewBox}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: art.inner }}
      {...rest}
    />
  );
}
