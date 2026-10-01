import { describe, expect, it } from 'vitest';
import {
  canPlay, currentWorldId, isLevelDone, isNodePlayable, isWorldComplete, isWorldUnlocked, nextLevelId, nodeState, starsDone,
  worldProgressCount, type NodeContext, type ProgressSnapshot,
} from './progression';
import type { LevelId, WorldKey } from './types';
import { mainLevelIds, starLevelIds } from './worlds';

const ctx: NodeContext = { extraTasks: true };

function progress(done: readonly string[] = [], manualUnlocks: readonly string[] = []): ProgressSnapshot {
  return { levels: Object.fromEntries(done.map((id) => [id, {}])), manualUnlocks };
}
const world = (w: WorldKey): LevelId[] => [...mainLevelIds(w)];

describe('розблокування світів', () => {
  it('на початку відкритий лише W1; хаб і W2 закриті', () => {
    const p = progress();
    expect(isWorldUnlocked(p, 'w1')).toBe(true);
    expect(isWorldUnlocked(p, 'w2')).toBe(false);
    expect(isWorldUnlocked(p, 'hub')).toBe(false);
  });

  it('пройшов W1 → відкриваються W2 і «Plac Zabaw»; W3 ще ні', () => {
    const p = progress(world('w1'));
    expect(isWorldComplete(p, 'w1')).toBe(true);
    expect(isWorldUnlocked(p, 'w2')).toBe(true);
    expect(isWorldUnlocked(p, 'hub')).toBe(true);
    expect(isWorldUnlocked(p, 'w3')).toBe(false);
  });

  it('11 рівнів із 12 — світ ще не пройдено', () => {
    const p = progress(world('w1').slice(0, 11));
    expect(isWorldComplete(p, 'w1')).toBe(false);
    expect(isWorldUnlocked(p, 'w2')).toBe(false);
  });

  it('★-рівні не потрібні для проходження світу; хаб ніколи не «пройдений»', () => {
    expect(isWorldComplete(progress(world('w4')), 'w4')).toBe(true);
    expect(isWorldComplete(progress(), 'hub')).toBe(false);
  });

  it('ручне відкриття дорослим відкриває лише цей світ, але не попередні й не наступні', () => {
    const p = progress([], ['w4']);
    expect(isWorldUnlocked(p, 'w4')).toBe(true);
    expect(isWorldUnlocked(p, 'w3')).toBe(false);
    expect(isWorldUnlocked(p, 'w5')).toBe(false);
  });

  it('currentWorldId: де стоїть Kubik', () => {
    expect(currentWorldId(progress())).toBe('w1');
    expect(currentWorldId(progress(world('w1')))).toBe('w2');
    expect(currentWorldId(progress([...world('w1'), ...world('w2')]))).toBe('w3');
    const all = (['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'] as const).flatMap(world);
    expect(currentWorldId(progress(all))).toBe('w7');
    // ручне відкриття W4 без проходження попередніх: Kubik біля першого відкритого непройденого — W1
    expect(currentWorldId(progress([], ['w4']))).toBe('w1');
  });
});

describe('вузли стежки', () => {
  it('на початку світиться лише w1-1, решта — замок', () => {
    const p = progress();
    expect(nodeState(p, 'w1-1', ctx)).toBe('next');
    expect(nodeState(p, 'w1-2', ctx)).toBe('locked');
    expect(nodeState(p, 'w1-12', ctx)).toBe('locked');
    expect(nodeState(p, 'w2-1', ctx)).toBe('locked');
    expect(nextLevelId(p, 'w1')).toBe('w1-1');
  });

  it('після w1-1 світиться w1-2, w1-1 пройдено й його можна переграти', () => {
    const p = progress(['w1-1']);
    expect(nodeState(p, 'w1-1', ctx)).toBe('done');
    expect(nodeState(p, 'w1-2', ctx)).toBe('next');
    expect(nodeState(p, 'w1-3', ctx)).toBe('locked');
    expect(isNodePlayable('done')).toBe(true);
    expect(isNodePlayable('next')).toBe(true);
    expect(isNodePlayable('locked')).toBe(false);
  });

  it('пропущений вузол не відкриває наступних: світиться перший непройдений', () => {
    const p = progress(['w1-1', 'w1-3']);
    expect(nextLevelId(p, 'w1')).toBe('w1-2');
    expect(nodeState(p, 'w1-3', ctx)).toBe('done');
    expect(nodeState(p, 'w1-4', ctx)).toBe('locked');
  });

  it('після останнього рівня світу nextLevelId — null, наступний світ відкрито', () => {
    const p = progress(world('w1'));
    expect(nextLevelId(p, 'w1')).toBeNull();
    expect(nodeState(p, 'w2-1', ctx)).toBe('next');
    expect(nextLevelId(p, 'hub')).toBeNull();
  });

  it('«Do powtórki»: пройдений вузол зі списку повторення', () => {
    const p = progress(['w1-1', 'w1-2']);
    expect(nodeState(p, 'w1-1', { ...ctx, reviewLevels: new Set<LevelId>(['w1-1']) })).toBe('review');
    expect(nodeState(p, 'w1-2', { ...ctx, reviewLevels: new Set<LevelId>(['w1-1']) })).toBe('done');
    expect(isNodePlayable('review')).toBe(true);
  });

  it('невідомий рівень — помилка', () => {
    expect(() => nodeState(progress(), 'w9-1' as LevelId, ctx)).toThrow('Unknown level');
  });
});

describe('★-гілка W4 (4 вузли, не блокує шлях)', () => {
  const branchAt = 6; // W4: гілка відкривається після 6-го основного рівня
  const w1to3 = [...world('w1'), ...world('w2'), ...world('w3')];
  const upTo = (n: number) => [...w1to3, ...world('w4').slice(0, n)];

  it('до вузла розгалуження ★ закриті; після нього відкривається перший ★-вузол', () => {
    expect(nodeState(progress(upTo(branchAt - 1)), 'w4-s1', ctx)).toBe('locked');
    expect(nodeState(progress(upTo(branchAt)), 'w4-s1', ctx)).toBe('star');
    expect(nodeState(progress(upTo(branchAt)), 'w4-s2', ctx)).toBe('locked');
  });

  it('★-вузли відкриваються по одному; пройдений ★ — done', () => {
    const p = progress([...upTo(branchAt), 'w4-s1']);
    expect(nodeState(p, 'w4-s1', ctx)).toBe('done');
    expect(nodeState(p, 'w4-s2', ctx)).toBe('star');
    expect(nodeState(p, 'w4-s3', ctx)).toBe('locked');
    expect(starsDone(p, 'w4')).toBe(1);
  });

  it('основний шлях іде далі, не чекаючи ★', () => {
    const p = progress(upTo(branchAt));
    expect(nextLevelId(p, 'w4')).toBe('w4-7');
    expect(isWorldComplete(progress([...w1to3, ...world('w4')]), 'w4')).toBe(true);
  });

  it('вимкнено «Zadania dodatkowe ★» — вузли приховано (і не відкриваються за адресою)', () => {
    const off: NodeContext = { extraTasks: false };
    const p = progress(upTo(branchAt));
    expect(nodeState(p, 'w4-s1', off)).toBe('hidden');
    expect(canPlay(p, 'w4-s1', off)).toBe(false);
    expect(canPlay(p, 'w4-s1', ctx)).toBe(true);
  });

  it('у світі без ★-гілки ★-вузлів немає', () => {
    expect(starLevelIds('w1')).toEqual([]);
    expect(() => nodeState(progress(), 'w1-s1' as LevelId, ctx)).toThrow('Unknown level');
  });
});

describe('canPlay: адреса /play/:levelId недовірена', () => {
  it('грати можна лише відкриті вузли; сміття й заблоковане — ні', () => {
    const p = progress(['w1-1']);
    expect(canPlay(p, 'w1-1', ctx)).toBe(true);
    expect(canPlay(p, 'w1-2', ctx)).toBe(true);
    expect(canPlay(p, 'w1-3', ctx)).toBe(false);
    expect(canPlay(p, 'w2-1', ctx)).toBe(false);
    for (const bad of ['', 'w1', 'w1-99', '__proto__', 'constructor', 'w1-1/../w1-5']) expect(canPlay(p, bad, ctx), bad).toBe(false);
  });

  it('isLevelDone не плутає прототипні ключі', () => {
    expect(isLevelDone(progress(), 'constructor' as LevelId)).toBe(false);
  });
});

describe('worldProgressCount', () => {
  it('лічильник пройдених основних рівнів світу', () => {
    expect(worldProgressCount(progress(['w1-1', 'w1-2', 'w1-5']), 'w1')).toEqual({ done: 3, total: 12 });
    expect(worldProgressCount(progress(), 'w3')).toEqual({ done: 0, total: 15 });
    expect(worldProgressCount(progress(), 'hub')).toEqual({ done: 0, total: 0 });
  });
});
