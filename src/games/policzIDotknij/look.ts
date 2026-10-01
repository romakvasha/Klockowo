import { createRng, hashSeed } from '../engine/rng';
import type { CountInstance } from './generate';

/** Дрібні відмінності вигляду предмета (look: distinct): віддзеркалення, нахил до ±6°, масштаб 94–106 %. Для look: similar — жодних. */
export function variation(instance: Pick<CountInstance, 'look' | 'seed'>, i: number): { flip: boolean; tilt: number; scale: number } {
  if (instance.look === 'similar') return { flip: false, tilt: 0, scale: 1 };
  const rng = createRng(hashSeed('look', instance.seed, i));
  return { flip: rng.next() < 0.5, tilt: Math.round((rng.next() - 0.5) * 12), scale: Math.round((0.94 + rng.next() * 0.12) * 100) / 100 };
}
