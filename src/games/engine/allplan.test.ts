import { describe, expect, it } from 'vitest';
import { adaptSpec } from '../../curriculum/adaptSpec';
import { levelsOfWorld } from '../../curriculum/levels';
import type { WorldKey } from '../../curriculum/types';
import { worldById } from '../../curriculum/worlds';
import { resolveGame } from '../registry';
import { planLevel } from './levelPlan';

const WORLDS: readonly WorldKey[] = ['w2', 'w3', 'w4', 'w5', 'w6', 'w7'];
const STEPS = [-2, 0, 2] as const;

describe('усі рівні W2–W7 (основні й ★) планується з багатьох зерен і кроків складності', () => {
  for (const world of WORLDS) {
    it(`${world}: 6 завдань, гра реалізована, правильна відповідь проходить перевірку, плитки містять відповідь, репліка без цифр`, () => {
      const range = worldById(world).range;
      for (const level of levelsOfWorld(world)) {
        for (const step of STEPS) {
          for (let seed = 1; seed <= 25; seed++) {
            const plan = planLevel(level, seed, resolveGame, { adapt: (spec) => adaptSpec(spec, step, range) });
            expect(plan, `${level.id} #${seed}`).toHaveLength(6);
            plan.forEach((task, i) => {
              const where = `${level.id} step ${step} #${seed} завдання ${i}`;
              expect(task.def, where).not.toBeNull();
              const def = task.def!;
              const answer = def.answer(task.instance);
              expect(def.check(task.instance, answer), where).toEqual({ ok: true });
              if ((def.kindOf?.(task.instance) ?? def.kind) === 'choice') expect(def.tiles(task.instance).map((t) => t.value), where).toContain(answer);
              expect(def.prompt(task.instance), where).toMatch(/\S/);
              expect(def.prompt(task.instance), where).not.toMatch(/\d/);
              expect(def.praise(task.instance, 'Brawo!'), where).not.toMatch(/\d|undefined|NaN/);
            });
          }
        }
      }
    });
  }
});
