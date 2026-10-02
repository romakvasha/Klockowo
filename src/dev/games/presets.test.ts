import { describe, expect, it } from 'vitest';
import type { Level } from '../../curriculum/types';
import { planLevel } from '../../games/engine/levelPlan';
import { resolveGame } from '../../games/registry';
import { DEFAULT_PRESET, PRESETS, presetById } from './presets';

const levelOf = (world: Level['world'], spec: Level['tasks'][number]): Level => ({
  id: `${world}-1`, world, index: 1, kind: 'main', newIdea: false, skills: [spec.skill], tasks: Array.from({ length: 6 }, () => spec), draft: false,
});

describe('пресети dev-вітрини ігор', () => {
  it('id унікальні, назви непорожні', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const p of PRESETS) expect(p.title.length).toBeGreaterThan(5);
  });

  it('кожен пресет планується з багатьох зерен: 6 завдань, гра реалізована, відповідь — скінченне число', () => {
    for (const preset of PRESETS) {
      const level = levelOf(preset.world, preset.spec);
      for (let seed = 1; seed <= 40; seed++) {
        const plan = planLevel(level, seed, resolveGame);
        expect(plan).toHaveLength(6);
        for (const task of plan) {
          expect(task.def).not.toBeNull();
          expect(Number.isFinite(task.def!.answer(task.instance))).toBe(true);
          expect(task.def!.check(task.instance, task.def!.answer(task.instance))).toEqual({ ok: true });
        }
      }
    }
  });

  it('presetById: невідомий id → типовий', () => {
    expect(presetById('nope')).toBe(DEFAULT_PRESET);
    expect(presetById(null)).toBe(DEFAULT_PRESET);
    expect(presetById('match-3').spec.game).toBe('cyfraIObrazek');
  });
});
