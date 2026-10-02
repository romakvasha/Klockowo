import { describe, expect, it } from 'vitest';
import { BUILDINGS, BUILDING_H, BUILDING_W, buildingCells } from '../components/map/worldBuildings';
import { ANIMAL_IDS } from '../speech/nouns';
import { levelsOfWorld } from './levels';
import { albumCount, albumSlots, isAlbumEmpty, sceneStickers, vehicleOfWorld, type RewardsProgress } from './rewards';
import { celebrateWorld } from '../store/progress';
import { emptyProgress } from '../store/defaults';
import { WORLD_KEYS } from './worlds';

const done = (ids: readonly string[]): Record<string, unknown> => Object.fromEntries(ids.map((id) => [id, {}]));
const rewards = (levels: Record<string, unknown> = {}, celebrated: RewardsProgress['celebrated'] = []): RewardsProgress => ({ levels, celebrated });

describe('albumSlots', () => {
  it('сторінка W1: 12 тваринок + машинка + споруда = 14 слотів; жодного не має, поки нічого не пройдено', () => {
    const slots = albumSlots('w1', rewards());
    expect(slots).toHaveLength(14);
    expect(slots.filter((s) => s.kind === 'animal')).toHaveLength(12);
    expect(slots.slice(-2).map((s) => s.kind)).toEqual(['vehicle', 'building']);
    expect(slots.every((s) => !s.owned)).toBe(true);
  });

  it('W3 — 15 рівнів, W4 і W7 — ще 4 ★-рівні (позначені star): слотів рівно рівнів + 2', () => {
    for (const w of WORLD_KEYS) expect(albumSlots(w, rewards())).toHaveLength(levelsOfWorld(w).length + 2);
    expect(albumSlots('w4', rewards()).filter((s) => s.kind === 'animal' && s.star)).toHaveLength(4);
    expect(albumSlots('w1', rewards()).filter((s) => s.kind === 'animal' && s.star)).toHaveLength(0);
  });

  it('тваринка слота — та сама, що на Koniec poziomu за номером рівня; наліпка є лише за пройдений рівень', () => {
    const slots = albumSlots('w1', rewards(done(['w1-1', 'w1-3'])));
    const animals = slots.filter((s) => s.kind === 'animal');
    expect(animals.map((s) => s.owned)).toEqual([true, false, true, ...Array(9).fill(false)]);
    for (const s of animals) expect(ANIMAL_IDS).toContain(s.animal);
  });

  it('машинка й споруда з’являються лише після свята світу', () => {
    const before = albumSlots('w2', rewards(done(levelsOfWorld('w2').map((l) => l.id))));
    expect(before.slice(-2).every((s) => !s.owned)).toBe(true);
    const after = albumSlots('w2', rewards(done(levelsOfWorld('w2').map((l) => l.id)), ['w2']));
    expect(after.slice(-2).every((s) => s.owned)).toBe(true);
    // свято іншого світу не відкриває цей
    expect(albumSlots('w2', rewards({}, ['w1'])).slice(-2).every((s) => !s.owned)).toBe(true);
  });

  it('albumCount: скільки є / усього', () => {
    expect(albumCount('w1', rewards())).toEqual({ owned: 0, total: 14 });
    expect(albumCount('w1', rewards(done(['w1-1', 'w1-2']), ['w1']))).toEqual({ owned: 4, total: 14 });
  });
});

describe('vehicleOfWorld', () => {
  it('транспорт гостя світу: W1–W2 — куля, W3 — вітрильник, W4–W6 — паровозик, W7 — ракета', () => {
    expect(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'].map((w) => vehicleOfWorld(w as never))).toEqual(['balon', 'balon', 'zaglowka', 'pociag', 'pociag', 'pociag', 'rakieta']);
  });
});

describe('sceneStickers і isAlbumEmpty', () => {
  it('різні тваринки з пройдених рівнів, без повторів; нічого не пройдено — порожньо', () => {
    expect(sceneStickers(rewards())).toEqual([]);
    const some = sceneStickers(rewards(done(levelsOfWorld('w1').map((l) => l.id))));
    expect(new Set(some).size).toBe(some.length);
    expect(some.length).toBeLessThanOrEqual(ANIMAL_IDS.length);
    expect(some.length).toBeGreaterThan(0);
  });

  it('isAlbumEmpty: порожньо лише без рівнів і без святкувань', () => {
    expect(isAlbumEmpty(rewards())).toBe(true);
    expect(isAlbumEmpty(rewards(done(['w1-1'])))).toBe(false);
    expect(isAlbumEmpty(rewards({}, ['w1']))).toBe(false);
  });
});

describe('celebrateWorld', () => {
  it('додає світ один раз і не чіпає решту прогресу', () => {
    const p = emptyProgress();
    const once = celebrateWorld(p, 'w3');
    expect(once.celebrated).toEqual(['w3']);
    expect(celebrateWorld(once, 'w3')).toBe(once);
    expect(celebrateWorld(once, 'w5').celebrated).toEqual(['w3', 'w5']);
    expect(p.celebrated).toEqual([]);
  });
});

describe('споруди світів', () => {
  it('для кожного світу є споруда: решітка 9 × 8, лише відомі символи, є двері, дах чи верхівка', () => {
    for (const w of WORLD_KEYS) {
      const rows = BUILDINGS[w];
      expect(rows, w).toHaveLength(BUILDING_H);
      for (const row of rows) {
        expect(row, w).toHaveLength(BUILDING_W);
        expect(row, w).toMatch(/^[.WDRwkf]+$/);
      }
      expect(rows.join(''), w).toContain('k');
      expect(buildingCells(w), w).toHaveLength(BUILDING_H);
    }
  });

  it('усі сім споруд різні; нижній ряд — суцільна основа з дверима', () => {
    expect(new Set(WORLD_KEYS.map((w) => BUILDINGS[w].join('|'))).size).toBe(7);
    for (const w of WORLD_KEYS) {
      const base = BUILDINGS[w][BUILDING_H - 1]!;
      expect(base, w).toContain('k');
      expect(base.replace(/\./g, '').length, w).toBeGreaterThanOrEqual(5);
    }
  });
});
