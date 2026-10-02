import { describe, expect, it } from 'vitest';
import { levelById } from '../../curriculum/levels';
import { planLevel } from './levelPlan';
import { resolveGame } from '../registry';

describe('W2 «Ogród Cyfr»: усі 12 рівнів планується з багатьох зерен', () => {
  it('6 завдань, кожна гра реалізована, правильна відповідь проходить перевірку, плитки містять відповідь', () => {
    for (let n = 1; n <= 12; n++) {
      const level = levelById(`w2-${n}`);
      for (let seed = 1; seed <= 40; seed++) {
        const plan = planLevel(level, seed, resolveGame);
        expect(plan, `${level.id} #${seed}`).toHaveLength(6);
        plan.forEach((task, i) => {
          expect(task.def, `${level.id} #${seed} завдання ${i}`).not.toBeNull();
          const def = task.def!;
          const answer = def.answer(task.instance);
          expect(def.check(task.instance, answer)).toEqual({ ok: true });
          if (def.kind === 'choice') expect(def.tiles(task.instance).map((t) => t.value)).toContain(answer);
          expect(def.prompt(task.instance)).toMatch(/\S/);
          expect(def.prompt(task.instance)).not.toMatch(/\d/);
        });
      }
    }
  });
});
