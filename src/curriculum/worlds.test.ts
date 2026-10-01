import { describe, expect, it } from 'vitest';
import { GAME_TITLES, WORLD_NAMES } from '../speech/lines';
import tokensCss from '../styles/tokens.css?raw';
import { WORLD_OBJECT_IDS } from '../speech/nouns';
import { SKILLS, SKILL_IDS, isSkillId, skillInfo, skillsOfWorld } from './skills';
import type { GameId } from './types';
import { WORLDS, WORLD_IDS, WORLD_KEYS, isWorldId, levelId, mainLevelIds, parseLevelId, starLevelIds, worldById, worldsWithGame } from './worlds';

describe('світи (BRIEF §5)', () => {
  it('7 світів і хаб у порядку мапи, назви є в lines.ts', () => {
    expect(WORLD_IDS).toEqual(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'hub']);
    expect(WORLD_KEYS).toHaveLength(7);
    WORLDS.forEach((w, i) => expect(w.order, w.id).toBe(i + 1));
    for (const w of WORLDS) expect(WORLD_NAMES[w.id], w.id).toBeTruthy();
  });

  it('кольори світів збігаються з --kl-wN-500 у tokens.css', () => {
    for (const w of WORLDS) {
      const m = new RegExp(`--kl-${w.id}-500:\\s*(#[0-9A-Fa-f]{6})`).exec(tokensCss);
      expect(m?.[1]?.toUpperCase(), w.id).toBe(w.color.toUpperCase());
    }
  });

  it('рівнів: 12 (у W3 — 15); ★-гілка по 4 лише у W4 і W7 і відкривається посередині шляху', () => {
    expect(WORLD_KEYS.map((w) => worldById(w).mainLevels)).toEqual([12, 12, 15, 12, 12, 12, 12]);
    expect(worldById('hub').mainLevels).toBe(0);
    for (const w of WORLD_KEYS) {
      const world = worldById(w);
      const star = w === 'w4' || w === 'w7';
      expect(world.starLevels, w).toBe(star ? 4 : 0);
      if (star) {
        expect(world.starBranchAfter, w).not.toBeNull();
        expect(world.starBranchAfter, w).toBeGreaterThan(0);
        expect(world.starBranchAfter, w).toBeLessThan(world.mainLevels);
      } else {
        expect(world.starBranchAfter, w).toBeNull();
      }
    }
  });

  it('гості місій: Łatka W1–W2, Pufka W3, Tofik W4–W5, усі разом W6, Iskra W7', () => {
    expect(WORLD_KEYS.map((w) => worldById(w).guest)).toEqual(['latka', 'latka', 'pufka', 'tofik', 'tofik', 'all', 'iskra']);
    expect(worldById('hub').guest).toBeNull();
  });

  it('предмети світів — із BRIEF §10', () => {
    for (const w of WORLD_KEYS) expect(worldById(w).objects, w).toEqual(WORLD_OBJECT_IDS[w]);
  });

  it('ігри світів збігаються з каталогом PEDAGOGY §2 (у яких світах кожна гра)', () => {
    const catalog: Record<GameId, string[]> = {
      policzIDotknij: ['w1', 'w2', 'w4'],
      blysk: ['w1', 'w2', 'w3'],
      cyfraIObrazek: ['w2', 'w4'],
      zgubionyWagonik: ['w2', 'w4', 'w5', 'w6'],
      nakarmZwierzaka: ['w1', 'w2', 'w5'],
      ktoMaWiecej: ['w2', 'w4', 'w6'],
      autobusDziesiatka: ['w2', 'w3', 'w4'], // W4 — двоповерховий на 20
      domekLiczb: ['w3', 'w4'],
      ileRazem: ['w3', 'w4'],
      skokiZabki: ['w3', 'w4', 'w7'],
      zrobDziesiatke: ['w3', 'w4', 'w7'], // W4★ і W7★
      paczkiPoDziesiec: ['w5', 'w6'],
      tajemniczaTablica: ['w6', 'w7', 'hub'],
      historyjki: ['w3', 'w4', 'w7'],
    };
    for (const game of Object.keys(GAME_TITLES) as GameId[]) expect(worldsWithGame(game), game).toEqual(catalog[game]);
  });

  it('isWorldId / worldById', () => {
    expect(isWorldId('w3')).toBe(true);
    expect(isWorldId('hub')).toBe(true);
    expect(isWorldId('w8')).toBe(false);
    expect(isWorldId(3)).toBe(false);
    expect(() => worldById('w8' as never)).toThrow('Unknown world');
  });
});

describe('ідентифікатори рівнів', () => {
  it('levelId і parseLevelId — взаємно обернені', () => {
    expect(levelId('w1', 3)).toBe('w1-3');
    expect(levelId('w4', 2, 'star')).toBe('w4-s2');
    expect(parseLevelId('w1-12')).toEqual({ world: 'w1', kind: 'main', index: 12 });
    expect(parseLevelId('w4-s4')).toEqual({ world: 'w4', kind: 'star', index: 4 });
  });

  it('адресний рядок недовірений: усе зайве — null', () => {
    for (const bad of ['', 'w8-1', 'w0-1', 'w1-0', 'w1-01', 'w1-123', 'w1-s', 'w1-s0', 'W1-1', 'hub-1', 'w1-1 ', '../w1-1', 'w1-1/x']) {
      expect(parseLevelId(bad), bad).toBeNull();
    }
  });

  it('mainLevelIds / starLevelIds', () => {
    expect(mainLevelIds('w3')).toHaveLength(15);
    expect(mainLevelIds('w1')[0]).toBe('w1-1');
    expect(mainLevelIds('w1')[11]).toBe('w1-12');
    expect(starLevelIds('w4')).toEqual(['w4-s1', 'w4-s2', 'w4-s3', 'w4-s4']);
    expect(starLevelIds('w1')).toEqual([]);
  });
});

describe('навички', () => {
  it('29 унікальних навичок за світами: 4, 4, 5, 4, 3, 4, 5; ★-навички — bridge-ten (W4) і add-with-bridge (W7)', () => {
    expect(SKILLS).toHaveLength(29);
    expect(new Set(SKILL_IDS).size).toBe(29);
    expect(WORLD_KEYS.map((w) => skillsOfWorld(w).length)).toEqual([4, 4, 5, 4, 3, 4, 5]);
    expect(SKILLS.filter((s) => s.star).map((s) => s.id)).toEqual(['bridge-ten', 'add-with-bridge']);
  });

  it('isSkillId / skillInfo', () => {
    expect(isSkillId('count-line')).toBe(true);
    expect(isSkillId('nope')).toBe(false);
    expect(skillInfo('teens').world).toBe('w4');
    expect(() => skillInfo('nope' as never)).toThrow('Unknown skill');
  });
});
