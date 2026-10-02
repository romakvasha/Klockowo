import { describe, expect, it } from 'vitest';
import { COUNT_GAP_MS, countSequence } from './countSong';
import { LEVELS, levelsOfWorld } from './levels';
import { PER_SKILL, PLAYGROUND_COUNT, candidateTasks, playgroundTasks, skillRank, type PlaygroundProgress } from './playground';
import type { SkillId } from './types';

const done = (worlds: readonly ('w1' | 'w2' | 'w3')[]): Record<string, unknown> => {
  const levels: Record<string, unknown> = {};
  for (const w of worlds) for (const l of levelsOfWorld(w)) levels[l.id] = {};
  return levels;
};
const progress = (levels: Record<string, unknown>, skills: PlaygroundProgress['skills'] = {}): PlaygroundProgress => ({ levels, skills });

describe('skillRank', () => {
  const today = '2026-10-10';
  it('«Do powtórki» → 0, настав день → 1, у розкладі → 2, решта → 3', () => {
    expect(skillRank({ stage: 2, due: null, needsReview: true }, today)).toBe(0);
    expect(skillRank({ stage: 2, due: '2026-10-09', needsReview: false }, today)).toBe(1);
    expect(skillRank({ stage: 2, due: today, needsReview: false }, today)).toBe(1);
    expect(skillRank({ stage: 2, due: '2026-10-20', needsReview: false }, today)).toBe(2);
    expect(skillRank({ stage: 0, due: null, needsReview: false }, today)).toBe(3);
    expect(skillRank(undefined, today)).toBe(3);
  });
});

describe('candidateTasks', () => {
  it('лише завдання пройдених рівнів, без повторень, лише ігри, які можна грати', () => {
    const all = candidateTasks(progress(done(['w1'])), () => true);
    expect(all.length).toBeGreaterThan(0);
    for (const t of all) {
      expect(t.level.startsWith('w1-')).toBe(true);
      expect(t.spec.review).not.toBe(true);
    }
    expect(candidateTasks(progress({}), () => true)).toEqual([]);
    expect(candidateTasks(progress(done(['w1'])), () => false)).toEqual([]);
    expect(candidateTasks(progress(done(['w1'])), (g) => g === 'blysk').every((t) => t.spec.game === 'blysk')).toBe(true);
  });

  it('у пройденому рівні W3 — його власні завдання; непройдені не потрапляють', () => {
    const levels = { 'w3-1': {} };
    const list = candidateTasks(progress(levels), () => true);
    expect(list.every((t) => t.level === 'w3-1')).toBe(true);
    expect(list.length).toBe(LEVELS.find((l) => l.id === 'w3-1')!.tasks.filter((t) => !t.review).length);
  });
});

describe('playgroundTasks', () => {
  it('6 завдань із пройдених рівнів, детерміновано за зерном, різні зерна дають різні набори', () => {
    const p = progress(done(['w1', 'w2']));
    const a = playgroundTasks(p, '2026-10-10', 1);
    expect(a).toHaveLength(PLAYGROUND_COUNT);
    expect(playgroundTasks(p, '2026-10-10', 1)).toEqual(a);
    const sets = new Set(Array.from({ length: 10 }, (_, s) => playgroundTasks(p, '2026-10-10', s + 1).map((t) => `${t.level}#${t.index}`).join()));
    expect(sets.size).toBeGreaterThan(3);
  });

  it('не більше PER_SKILL на навичку, коли вибір достатній', () => {
    const p = progress(done(['w1', 'w2', 'w3']));
    for (let seed = 1; seed <= 30; seed++) {
      const tasks = playgroundTasks(p, '2026-10-10', seed);
      const counts = new Map<SkillId, number>();
      for (const t of tasks) counts.set(t.spec.skill, (counts.get(t.spec.skill) ?? 0) + 1);
      for (const [skill, n] of counts) expect(n, `${skill}#${seed}`).toBeLessThanOrEqual(PER_SKILL);
    }
  });

  it('навички «Do powtórki» й ті, що чекають повторення, потрапляють першими', () => {
    const p = progress(done(['w1', 'w2']), {
      compare: undefined,
      'give-n': { stage: 1, due: '2026-10-01', needsReview: true },
      zero: { stage: 2, due: '2026-10-09', needsReview: false },
    } as PlaygroundProgress['skills']);
    for (let seed = 1; seed <= 20; seed++) {
      const skills = playgroundTasks(p, '2026-10-10', seed).map((t) => t.spec.skill);
      expect(skills).toContain('give-n');
      expect(skills).toContain('zero');
    }
  });

  it('мало пройдених рівнів: менше шести завдань — але обмеження на навичку знімається, щоб заповнити набір', () => {
    const p = progress({ 'w1-1': {} });
    const tasks = playgroundTasks(p, '2026-10-10', 1);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.length).toBeLessThanOrEqual(PLAYGROUND_COUNT);
    expect(new Set(tasks.map((t) => `${t.level}#${t.index}`)).size).toBe(tasks.length);
  });

  it('нічого не пройдено → порожній набір (екран покаже підказку)', () => {
    expect(playgroundTasks(progress({}), '2026-10-10', 1)).toEqual([]);
  });
});

describe('«Liczymy do stu»', () => {
  it('по одному: 1…100 (або від числа); десятками: 10, 20…100', () => {
    expect(countSequence('ones')).toHaveLength(100);
    expect(countSequence('ones')[0]).toBe(1);
    expect(countSequence('ones').at(-1)).toBe(100);
    expect(countSequence('ones', 95)).toEqual([95, 96, 97, 98, 99, 100]);
    expect(countSequence('tens')).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(countSequence('tens', 35)).toEqual([40, 50, 60, 70, 80, 90, 100]);
    expect(countSequence('tens', 100)).toEqual([100]);
  });

  it('межі зрізаються; десятки повільніші за одиниці', () => {
    expect(countSequence('ones', -5)[0]).toBe(1);
    expect(countSequence('ones', 500)).toEqual([100]);
    expect(COUNT_GAP_MS.tens).toBeGreaterThan(COUNT_GAP_MS.ones);
  });
});
