// Реєстр ігор: GameId → гра-модуль. Нову гру (M9–M19) додають одним рядком; ігри без модуля рушій показує заглушкою.
import type { GameId } from '../curriculum/types';
import type { GameResolver } from './engine/levelPlan';
import type { GameDef } from './engine/types';
import { policzIDotknij } from './policzIDotknij';

/** Типи конкретних ігор стираємо до GameDef: рушій працює з інстансами через сам модуль, а не через їхню форму. */
const GAMES: Partial<Record<GameId, GameDef>> = {
  policzIDotknij: policzIDotknij as unknown as GameDef,
};

export const resolveGame: GameResolver = (game) => GAMES[game];

/** Які ігри вже реалізовано (для тестів і dev-сторінки). */
export function implementedGames(): GameId[] {
  return Object.keys(GAMES) as GameId[];
}
