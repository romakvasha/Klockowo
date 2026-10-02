import { describe, expect, it } from 'vitest';
import { MIGRATIONS, SCHEMA_VERSION, migratePersisted, type Migration } from './migrate';

const profile = { id: 'a', name: 'Ola', pup: 'pudel', createdAt: '2026-10-01T10:00:00.000Z' };

describe('міграції схеми', () => {
  it('поточна версія — 3; є кроки 1 → 2 (M12, адаптивність) і 2 → 3 (M20, нагороди)', () => {
    expect(SCHEMA_VERSION).toBe(3);
    expect(Object.keys(MIGRATIONS)).toEqual(['1', '2']);
  });

  it('v1 → v2: старий step (0…20) скидається до 0, нові поля навички, черга й забіги дістають типові значення', () => {
    const v1Skill = { attempts: 4, firstTry: 3, recent: [{ ok: true, day: '2026-10-01' }], days: ['2026-10-01'], needsReview: false, step: 7, stage: 0, due: null };
    const v1Progress = { levels: {}, runs: { 'w1-2': { seed: 5, results: ['first'], startedAt: 'x' } }, skills: { 'count-line': v1Skill } };
    const data = migratePersisted({ profiles: [profile], activeProfileId: 'a', settings: {}, progress: { a: v1Progress } }, 1);
    const p = data.progress.a;
    expect(p?.skills['count-line']).toMatchObject({ attempts: 4, step: 0, sinceStep: 0, streak: 0, struggle: 0, flagged: false });
    expect(p?.runs['w1-2']).toEqual({ seed: 5, results: ['first'], startedAt: 'x', swaps: [], warmup: false });
    expect(p?.retry).toEqual([]);
  });

  it('v2 → v3: повністю пройдені світи вважаються відсвяткованими; решта — ні; сміття в celebrated відкидається', () => {
    const w1 = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`w1-${i + 1}`, { firstTry: 6, togetherUsed: false, completedAt: 'x' }]));
    const data = migratePersisted({ profiles: [profile], activeProfileId: 'a', settings: {}, progress: { a: { levels: { ...w1, 'w2-1': {} } } } }, 2);
    expect(data.progress.a?.celebrated).toEqual(['w1']);
    const fresh = migratePersisted({ profiles: [profile], activeProfileId: 'a', settings: {}, progress: { a: { levels: {}, celebrated: ['w3', 'hub', 'nope', 'w3', 7] } } }, 3);
    expect(fresh.progress.a?.celebrated).toEqual(['w3']);
  });

  it('дані поточної версії лише нормалізуються', () => {
    const data = migratePersisted({ profiles: [profile], activeProfileId: 'a', settings: { sessionMinutes: 20 }, progress: {} }, SCHEMA_VERSION);
    expect(data.profiles).toHaveLength(1);
    expect(data.settings.sessionMinutes).toBe(20);
    expect(data.progress.a).toBeDefined();
  });

  it('ланцюг кроків виконується по порядку, кожен бачить результат попереднього', () => {
    const calls: number[] = [];
    const migrations: Record<number, Migration> = {
      1: (s) => {
        calls.push(1);
        // v1 → v2: profiles жили під ключем `kids`
        const { kids, ...rest } = s as { kids: unknown };
        return { ...rest, profiles: kids };
      },
      2: (s) => {
        calls.push(2);
        // v2 → v3: гучність була одним числом
        const old = s as { settings: { volume: number } };
        return { ...old, settings: { volumes: { speech: old.settings.volume, effects: old.settings.volume, music: 0.1 } } };
      },
    };
    const data = migratePersisted({ kids: [profile], activeProfileId: 'a', settings: { volume: 0.5 }, progress: {} }, 1, migrations, 3);
    expect(calls).toEqual([1, 2]);
    expect(data.profiles.map((p) => p.id)).toEqual(['a']);
    expect(data.settings.volumes).toEqual({ speech: 0.5, effects: 0.5, music: 0.1 });
  });

  it('пропущений крок — помилка програміста, а не тихий програш даних', () => {
    expect(() => migratePersisted({}, 1, {}, 3)).toThrow('Missing data migration 1 → 2');
    expect(() => migratePersisted({}, 0)).toThrow('Missing data migration 0 → 1');
  });

  it('дані новішої версії (застосунок відкотили) читаються як є, невідоме відкидається', () => {
    const data = migratePersisted({ profiles: [profile], activeProfileId: 'a', future: { x: 1 } }, SCHEMA_VERSION + 5);
    expect(data.profiles).toHaveLength(1);
    expect('future' in data).toBe(false);
  });

  it('зіпсовані дані будь-якої версії дають порожній, але робочий стан', () => {
    expect(migratePersisted('сміття', SCHEMA_VERSION).profiles).toEqual([]);
    expect(migratePersisted(null, SCHEMA_VERSION).activeProfileId).toBeNull();
  });
});
