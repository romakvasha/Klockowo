// Яка музика на якому екрані (чисті дані): гра → сцена 'game' (тихіше), решта → 'menu'; світ — за параметром маршруту.
// Формат id світу/рівня остаточно визначить M5; тут терпимо: `w1`, `w1-3`… → світ W1, усе інше → хаб.
import type { MusicWorld, Scene } from '../speech/musicTheory';

export interface MusicRoute {
  scene: Scene;
  world: MusicWorld;
  /** Dev-сторінки (/dev/…) керують музикою вручну і не запускають її самі. */
  dev: boolean;
}

const WORLD_PARAM = /^w([1-7])(?!\d)/i;

export function musicRoute(pathname: string): MusicRoute {
  const [screen, param] = pathname.split('/').filter(Boolean);
  const match = param ? WORLD_PARAM.exec(param) : null;
  return {
    scene: screen === 'play' ? 'game' : 'menu',
    world: match ? (`w${match[1]}` as MusicRoute['world']) : 'hub',
    dev: screen === 'dev',
  };
}
