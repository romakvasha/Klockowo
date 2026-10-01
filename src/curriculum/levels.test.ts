import { describe, expect, it } from 'vitest';
import { LEVELS, findLevel, levelById, levelsOfWorld } from './levels';
import { W1_LEVELS } from './levels/w1';
import { skillInfo } from './skills';
import { WORLD_KEYS, parseLevelId, worldById } from './worlds';

describe('усі рівні програми', () => {
  it('87 основних + 8 ★ = 95 рівнів, унікальні id, кожен id розбирається у власні світ/вид/номер', () => {
    expect(LEVELS).toHaveLength(95);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(95);
    expect(LEVELS.filter((l) => l.kind === 'main')).toHaveLength(87);
    expect(LEVELS.filter((l) => l.kind === 'star')).toHaveLength(8);
    for (const l of LEVELS) expect(parseLevelId(l.id), l.id).toEqual({ world: l.world, kind: l.kind, index: l.index });
  });

  it('levelsOfWorld: основні за порядком, потім ★', () => {
    expect(levelsOfWorld('w4').map((l) => l.id)).toEqual([
      ...Array.from({ length: 12 }, (_, i) => `w4-${i + 1}`),
      'w4-s1', 'w4-s2', 'w4-s3', 'w4-s4',
    ]);
    expect(levelsOfWorld('w3')).toHaveLength(15);
  });

  it('levelById / findLevel: невідомий id — помилка чи undefined', () => {
    expect(levelById('w2-5').world).toBe('w2');
    expect(findLevel('w9-1')).toBeUndefined();
    expect(() => levelById('w1-13')).toThrow('Unknown level');
  });

  it('W2–W7 — заготовки (draft, без завдань); W1 — описано повністю', () => {
    for (const l of LEVELS) {
      if (l.world === 'w1') expect(l.draft, l.id).toBe(false);
      else {
        expect(l.draft, l.id).toBe(true);
        expect(l.tasks, l.id).toEqual([]);
      }
    }
  });
});

describe('W1 «Łąka Liczenia» — 12 рівнів по 6 завдань', () => {
  const w1 = worldById('w1');

  it('12 рівнів, кожен — місія з 6 завдань', () => {
    expect(W1_LEVELS).toHaveLength(12);
    W1_LEVELS.forEach((l, i) => {
      expect(l.index, l.id).toBe(i + 1);
      expect(l.tasks, l.id).toHaveLength(6);
    });
  });

  it('рівень 1 (для M8): шість завдань «Policz i dotknij» 1–3 в рядку, без повторення', () => {
    const [first] = W1_LEVELS;
    expect(first?.tasks.every((t) => t.game === 'policzIDotknij' && !t.review)).toBe(true);
    for (const t of first?.tasks ?? []) {
      if (t.game === 'policzIDotknij') {
        expect(t.count).toEqual([1, 3]);
        expect(t.arrangement).toBe('line');
      }
    }
  });

  it('спіральне повторення: рівень 1 — 0, решта — рівно 2 з 6 (≈ 30 %)', () => {
    W1_LEVELS.forEach((l, i) => {
      expect(l.tasks.filter((t) => t.review).length, l.id).toBe(i === 0 ? 0 : 2);
    });
  });

  it('ігри, навички й діапазони — лише W1: 1–10, цифра з крапками на плитках', () => {
    for (const l of W1_LEVELS) {
      for (const t of l.tasks) {
        expect(w1.games, `${l.id} ${t.game}`).toContain(t.game);
        expect(skillInfo(t.skill).world, `${l.id} ${t.skill}`).toBe('w1');
        if (t.game === 'policzIDotknij' || t.game === 'blysk' || t.game === 'nakarmZwierzaka') {
          expect(t.count[0], l.id).toBeGreaterThanOrEqual(1);
          expect(t.count[1], l.id).toBeLessThanOrEqual(10);
          expect(t.count[0], l.id).toBeLessThanOrEqual(t.count[1]);
        }
        if (t.game === 'policzIDotknij' || t.game === 'blysk') expect(t.answers, l.id).toBe('digitDots');
      }
    }
  });

  it('навички нових завдань входять у skills рівня', () => {
    for (const l of W1_LEVELS) {
      for (const t of l.tasks.filter((x) => !x.review)) expect(l.skills, `${l.id} ${t.skill}`).toContain(t.skill);
    }
  });

  it('нові ідеї: лічба (1), «Błysk!» (3), дати N (4), розсип (6); решта — без «Patrz, pokażę ci.»', () => {
    expect(W1_LEVELS.filter((l) => l.newIdea).map((l) => l.index)).toEqual([1, 3, 4, 6]);
  });

  it('складність росте: експозиція «Błysk!» не збільшується (2 с → 1 с); розсип і числа не зменшуються', () => {
    const exposures = W1_LEVELS.flatMap((l) => l.tasks.flatMap((t) => (t.game === 'blysk' ? [t.exposureMs] : [])));
    expect(exposures.length).toBeGreaterThan(0);
    expect(Math.max(...exposures)).toBe(2000);
    expect(Math.min(...exposures)).toBe(1000);
    exposures.forEach((ms, i) => {
      if (i > 0) expect(ms, `exposure #${i}`).toBeLessThanOrEqual(exposures[i - 1] ?? Infinity);
    });
  });

  it('підсумковий рівень 12 (скриня): розсип до 10, дати 6–10 і «Błysk!»', () => {
    const last = W1_LEVELS[11];
    expect(last).toBeDefined();
    const games = new Set(last?.tasks.map((t) => t.game));
    expect(games).toEqual(new Set(['policzIDotknij', 'nakarmZwierzaka', 'blysk']));
    expect(last?.skills).toEqual(['count-scatter', 'give-n', 'subitize-5']);
  });
});

describe('світи без ★ чи з ★', () => {
  it('кількість заготовок збігається з описом світів', () => {
    for (const w of WORLD_KEYS) {
      const levels = levelsOfWorld(w);
      expect(levels.filter((l) => l.kind === 'main')).toHaveLength(worldById(w).mainLevels);
      expect(levels.filter((l) => l.kind === 'star')).toHaveLength(worldById(w).starLevels);
    }
  });
});
