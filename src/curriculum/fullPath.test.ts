import { describe, expect, it } from 'vitest';
import { adaptSpec } from './adaptSpec';
import { afterLevel } from './flow';
import { canPlay, currentWorldId, isWorldComplete, isWorldUnlocked, nextLevelId, worldProgressCount } from './progression';
import { levelsOfWorld } from './levels';
import { WORLD_KEYS, mainLevelIds, starLevelIds, worldById } from './worlds';
import { albumCount } from './rewards';
import { resolveGame } from '../games/registry';
import { TASKS_PER_LEVEL, planLevel } from '../games/engine/levelPlan';
import { createAppStore, memoryStorage } from '../store/appStore';

/** M25: дитина проходить усю програму від першого запуску до W7 через справжній store; на кожному кроці перевіряється,
 *  що наступний вузол відкритий, рівень планується (6 завдань, гра є), світ закривається рівно останнім основним рівнем. */
describe('наскрізний шлях: перший запуск → W7', () => {
  it('усі основні рівні по черзі, без глухих кутів', () => {
    let n = 0;
    const clock = new Date(2026, 9, 1, 10, 0, 0);
    const store = createAppStore(memoryStorage(), { now: () => clock, newId: () => `id${++n}` });
    const id = store.getState().addProfile({ pup: 'pudel' }) as string;
    const snap = () => store.getState().progress[id]!;
    const ctx = { extraTasks: true };

    expect(currentWorldId(snap())).toBe('w1');
    expect(isWorldUnlocked(snap(), 'w1')).toBe(true);
    expect(isWorldUnlocked(snap(), 'w2')).toBe(false);

    let played = 0;
    for (const world of WORLD_KEYS) {
      expect(isWorldUnlocked(snap(), world), `${world} відкритий`).toBe(true);
      expect(currentWorldId(snap()), `Kubik стоїть у ${world}`).toBe(world);
      const range = worldById(world).range;
      for (const [i, lid] of mainLevelIds(world).entries()) {
        expect(nextLevelId(snap(), world), `наступний у ${world}`).toBe(lid);
        expect(canPlay(snap(), lid, ctx), `${lid} відкритий`).toBe(true);
        if (i + 1 < mainLevelIds(world).length) expect(canPlay(snap(), mainLevelIds(world)[i + 1]!, ctx), 'наступний ще закритий').toBe(false);
        const level = levelsOfWorld(world).find((l) => l.id === lid)!;
        for (const step of [0, 2] as const) {
          const plan = planLevel(level, 7 + played, resolveGame, { adapt: (spec) => adaptSpec(spec, step, range) });
          expect(plan, lid).toHaveLength(TASKS_PER_LEVEL);
          plan.forEach((t) => expect(t.def, `${lid}: гра реалізована`).not.toBeNull());
        }
        store.getState().completeLevel(lid, { firstTry: 6, togetherUsed: false });
        played++;
        const last = i === mainLevelIds(world).length - 1;
        const after = afterLevel(snap(), lid, true);
        expect(after.screen, `після ${lid}`).toBe(last ? 'world-complete' : 'world-path');
        expect(isWorldComplete(snap(), world), `${world} закрито лише після останнього`).toBe(last);
      }
      store.getState().celebrateWorld(world);
      expect(worldProgressCount(snap(), world)).toEqual({ done: mainLevelIds(world).length, total: mainLevelIds(world).length });
      expect(albumCount(world, snap()).owned).toBeGreaterThan(0);
    }
    expect(played).toBe(WORLD_KEYS.flatMap((w) => mainLevelIds(w)).length);
    expect(isWorldComplete(snap(), 'w7')).toBe(true);
  });

  it('усі ★-рівні W4 і W7 плануються після відкриття гілки', () => {
    for (const world of ['w4', 'w7'] as const) {
      const range = worldById(world).range;
      for (const lid of starLevelIds(world)) {
        const level = levelsOfWorld(world).find((l) => l.id === lid)!;
        const plan = planLevel(level, 3, resolveGame, { adapt: (spec) => adaptSpec(spec, 0, range) });
        expect(plan).toHaveLength(TASKS_PER_LEVEL);
        plan.forEach((t) => expect(t.def).not.toBeNull());
      }
    }
  });
});
