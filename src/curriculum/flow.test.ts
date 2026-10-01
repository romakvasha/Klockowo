import { describe, expect, it } from 'vitest';
import { ANIMAL_IDS, WORLD_OBJECT_IDS } from '../speech/nouns';
import { afterLevel, missionObject, rescuedAnimal } from './flow';
import { LEVELS } from './levels';
import type { ProgressSnapshot } from './progression';
import { levelId, mainLevelIds } from './worlds';

const doneProgress = (ids: readonly string[]): ProgressSnapshot => ({ levels: Object.fromEntries(ids.map((id) => [id, {}])), manualUnlocks: [] });

describe('предмет місії', () => {
  it('W1 починає з kaczuszki (приклад BRIEF), W3 — з rybki (борд етапу 2)', () => {
    expect(missionObject({ world: 'w1', index: 1, kind: 'main' })).toBe('kaczuszka');
    expect(missionObject({ world: 'w3', index: 1, kind: 'main' })).toBe('rybka');
  });

  it('предмети світу чергуються по колу', () => {
    const w1 = Array.from({ length: 5 }, (_, i) => missionObject({ world: 'w1', index: i + 1, kind: 'main' }));
    expect(w1).toEqual(['kaczuszka', 'biedronka', 'motyl', 'kwiatek', 'kaczuszka']);
  });

  it('кожен рівень програми дає предмет зі свого світу', () => {
    for (const level of LEVELS) {
      expect(WORLD_OBJECT_IDS[level.world] as readonly string[], level.id).toContain(missionObject(level));
    }
  });

  it('★-рівень не збігається з предметом основного рівня того ж номера', () => {
    expect(missionObject({ world: 'w4', index: 1, kind: 'star' })).not.toBe(missionObject({ world: 'w4', index: 1, kind: 'main' }));
  });
});

describe('врятована тваринка', () => {
  it('8 тваринок чергуються: рівні 1–8 — усі різні, 9-й повторює 1-шу', () => {
    const first = Array.from({ length: 9 }, (_, i) => rescuedAnimal(levelId('w1', i + 1)));
    expect(new Set(first.slice(0, 8)).size).toBe(8);
    expect(first[8]).toBe(first[0]);
  });

  it('усі рівні програми мають тваринку з каталогу', () => {
    for (const level of LEVELS) expect(ANIMAL_IDS as readonly string[]).toContain(rescuedAnimal(level.id));
  });
});

describe('куди веде «Dalej»', () => {
  const w1 = mainLevelIds('w1');

  it('після звичайного рівня — на стежку світу', () => {
    expect(afterLevel(doneProgress(['w1-1']), 'w1-1', true)).toEqual({ screen: 'world-path', world: 'w1' });
  });

  it('після останнього основного рівня, що закрив світ вперше, — «Świat ukończony»', () => {
    expect(afterLevel(doneProgress(w1), 'w1-12', true)).toEqual({ screen: 'world-complete', world: 'w1' });
  });

  it('переграш останнього рівня чи невідомість «вперше» — на стежку (свято лише раз)', () => {
    expect(afterLevel(doneProgress(w1), 'w1-12', false)).toEqual({ screen: 'world-path', world: 'w1' });
  });

  it('★-рівень не закриває світ', () => {
    expect(afterLevel(doneProgress([...mainLevelIds('w4'), 'w4-s4']), 'w4-s4', true).screen).toBe('world-path');
  });

  it('якщо світ не пройдено повністю — стежка, навіть для останнього номера', () => {
    expect(afterLevel(doneProgress(['w1-12']), 'w1-12', true).screen).toBe('world-path');
  });
});
