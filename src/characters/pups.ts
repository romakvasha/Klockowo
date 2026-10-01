import { PUPS } from '../speech/lines';
import type { WorldKey } from '../speech/nouns';

/** 8 цуценят «Twój piesek» у порядку пікера (design etap1/10): id збігається з іменем SVG і з PUPS у lines.ts. */
export const PUP_IDS = PUPS.map((p) => p.id);
export type PupId = (typeof PUPS)[number]['id'];

/** Пастель картки / аватара кожного цуценяти — тло 50 різних світів, щоб сусідні не зливалися (design etap1/10). */
export const PUP_TINTS: Readonly<Record<PupId, WorldKey | 'hub'>> = {
  pon: 'w1',
  nowofundland: 'w3',
  pudel: 'hub',
  chart: 'w2',
  papillon: 'w6',
  shihtzu: 'w4',
  sharpei: 'w7',
  akita: 'w5',
};

/** aria-label картки цуценяти: голосова репліка без знака оклику («Kudłaty piesek»). */
export function pupLabel(id: PupId): string {
  const pup = PUPS.find((p) => p.id === id);
  if (!pup) throw new Error(`Unknown pup: ${id}`);
  return pup.line.replace(/!$/, '');
}
