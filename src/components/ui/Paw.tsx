import type { SVGProps } from 'react';

/** Лапка (вміст бульбашки Kubika «Wybierz swojego pieska!», design etap1/08): заповнена, колір — currentColor. */
export function Paw(props: Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'children'>) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <ellipse cx="24" cy="31" rx="10" ry="8.5" />
      <ellipse cx="11.5" cy="20" rx="4.2" ry="5.2" />
      <ellipse cx="19" cy="12.5" rx="4.2" ry="5.4" />
      <ellipse cx="29" cy="12.5" rx="4.2" ry="5.4" />
      <ellipse cx="36.5" cy="20" rx="4.2" ry="5.2" />
    </svg>
  );
}
