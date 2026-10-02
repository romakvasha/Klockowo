// Споруди світів (BRIEF §6 п.9: «на мапі з'являється нова споруда з блоків») — малюнки з кубиків (design Етапу 5 ще не зроблено): кожна — решітка 9 × 8 клітинок.
// W — стіна кольору світу (500), D — темніша стіна (700), R — дах (золотий), w — вікно, k — двері, f — прапорець, . — порожньо. Чиста дані + розбір.
import type { WorldKey } from '../../curriculum/types';

export const BUILDING_W = 9;
export const BUILDING_H = 8;

/** Вітряк, оранжерея, маяк, міст із вежею, будинок на дереві, хмарочос, ракетна вежа. */
export const BUILDINGS: Readonly<Record<WorldKey, readonly string[]>> = {
  w1: [
    '....f....',
    '...RRR...',
    '..RRRRR..',
    '.RRRRRRR.',
    '.WWWWWWW.',
    '.WwWWWwW.',
    '.WWWkWWW.',
    'DDDDkDDDD',
  ],
  w2: [
    '.........',
    '.WWWWWWW.',
    '.WwWwWwW.',
    '.WWWWWWW.',
    '.WwWwWwW.',
    '.WWWWWWW.',
    '.WWWkWWW.',
    'DDDDkDDDD',
  ],
  w3: [
    '....f....',
    '...RRR...',
    '...WWW...',
    '...WwW...',
    '..DDDDD..',
    '..WWWWW..',
    '..WWkWW..',
    '.DDDkDDD.',
  ],
  w4: [
    'f.......f',
    'WW.....WW',
    'WwRRRRRwW',
    'WWWWWWWWW',
    'W.......W',
    'W.......W',
    'WW.....WW',
    'DDDkkkDDD',
  ],
  w5: [
    '..RRRRR..',
    '.RRRRRRR.',
    '..RRRRR..',
    '....D....',
    '..WWWWW..',
    '..WwWwW..',
    '..WWkWW..',
    '.DDDkDDD.',
  ],
  w6: [
    '....f....',
    '..WWWWW..',
    '..WwWwW..',
    '..WWWWW..',
    '..WwWwW..',
    '..WWWWW..',
    '..WWkWW..',
    'DDDDkDDDD',
  ],
  w7: [
    '....f....',
    '....R....',
    '...RRR...',
    '...WwW...',
    '...WWW...',
    '..DWWWD..',
    '.DDWkWDD.',
    'DDDDkDDDD',
  ],
};

export type BuildingCell = '.' | 'W' | 'D' | 'R' | 'w' | 'k' | 'f';

/** Клітинки споруди: рядок за рядком. */
export function buildingCells(world: WorldKey): BuildingCell[][] {
  return BUILDINGS[world].map((row) => [...row] as BuildingCell[]);
}
