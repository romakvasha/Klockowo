// Реєстр ігор: GameId → гра-модуль. Нову гру (M10–M19) додають одним рядком; ігри без модуля рушій показує заглушкою.
import type { GameId } from '../curriculum/types';
import { autobusDziesiatka } from './autobusDziesiatka';
import { blysk } from './blysk';
import { cyfraIObrazek } from './cyfraIObrazek';
import { domekLiczb } from './domekLiczb';
import type { GameResolver } from './engine/levelPlan';
import type { GameDef } from './engine/types';
import { historyjki } from './historyjki';
import { ileRazem } from './ileRazem';
import { ktoMaWiecej } from './ktoMaWiecej';
import { nakarmZwierzaka } from './nakarmZwierzaka';
import { policzIDotknij } from './policzIDotknij';
import { skokiZabki } from './skokiZabki';
import { zgubionyWagonik } from './zgubionyWagonik';
import { zrobDziesiatke } from './zrobDziesiatke';

/** Типи конкретних ігор стираємо до GameDef: рушій працює з інстансами через сам модуль, а не через їхню форму. */
const GAMES: Partial<Record<GameId, GameDef>> = {
  policzIDotknij: policzIDotknij as unknown as GameDef,
  blysk: blysk as unknown as GameDef,
  nakarmZwierzaka: nakarmZwierzaka as unknown as GameDef,
  zgubionyWagonik: zgubionyWagonik as unknown as GameDef,
  cyfraIObrazek: cyfraIObrazek as unknown as GameDef,
  ktoMaWiecej: ktoMaWiecej as unknown as GameDef,
  autobusDziesiatka: autobusDziesiatka as unknown as GameDef,
  domekLiczb: domekLiczb as unknown as GameDef,
  ileRazem: ileRazem as unknown as GameDef,
  skokiZabki: skokiZabki as unknown as GameDef,
  zrobDziesiatke: zrobDziesiatke as unknown as GameDef,
  historyjki: historyjki as unknown as GameDef,
};

export const resolveGame: GameResolver = (game) => GAMES[game];

/** Які ігри вже реалізовано (для тестів і dev-сторінки). */
export function implementedGames(): GameId[] {
  return Object.keys(GAMES) as GameId[];
}
