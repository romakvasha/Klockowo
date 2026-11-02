import { describe, expect, it } from 'vitest';
import { WORLD_OBJECT_IDS } from '../../speech/nouns';
import { brickDigitUrl, drawnItemIds, handUrl, itemUrl } from './art';

describe('картинки v2 для лічби (D6)', () => {
  const objects = Object.values(WORLD_OBJECT_IDS).flat();

  it('кожен предмет W1–W7 має картинку, зайвих немає', () => {
    expect(objects).toHaveLength(28);
    for (const id of objects) expect(itemUrl(id)).toMatch(/item-[a-z]+.*\.webp/);
    expect([...drawnItemIds()].sort()).toEqual([...objects].sort());
  });

  it('руки 0–5 і цеглинкові цифри 0–9', () => {
    for (let n = 0; n <= 5; n++) expect(handUrl(n)).toMatch(/hand-\d.*\.webp/);
    expect(() => handUrl(6)).toThrow('Hand art not found');
    for (let d = 0; d <= 9; d++) expect(brickDigitUrl(d)).toMatch(/digit-\d.*\.webp/);
    expect(() => brickDigitUrl(10)).toThrow('Brick digit not found');
  });
});
