import type { WorldKey } from '../speech/nouns';
import type { SkillId } from './types';

export interface SkillInfo {
  id: SkillId;
  world: WorldKey;
  /** Навичка ★-гілки: не блокує шлях і не входить в обов'язкове опанування світу. Назви для батьків — SKILL_NAMES у speech/lines.ts. */
  star?: true;
}

/** 29 навичок за колонкою «Skill goals» PEDAGOGY §1: W1 — 4, W2 — 4, W3 — 5, W4 — 4, W5 — 3, W6 — 4, W7 — 5. */
export const SKILLS: readonly SkillInfo[] = [
  { id: 'count-line', world: 'w1' },
  { id: 'count-scatter', world: 'w1' },
  { id: 'subitize-5', world: 'w1' },
  { id: 'give-n', world: 'w1' },
  { id: 'digit-quantity', world: 'w2' },
  { id: 'zero', world: 'w2' },
  { id: 'order-around', world: 'w2' },
  { id: 'compare-10', world: 'w2' },
  { id: 'add-combine', world: 'w3' },
  { id: 'plus-equals', world: 'w3' },
  { id: 'count-on', world: 'w3' },
  { id: 'bonds-5-10', world: 'w3' },
  { id: 'doubles', world: 'w3' },
  { id: 'teens', world: 'w4' },
  { id: 'count-from-any', world: 'w4' },
  { id: 'add-no-bridge-20', world: 'w4' },
  { id: 'bridge-ten', world: 'w4', star: true },
  { id: 'count-by-tens', world: 'w5' },
  { id: 'bundle-ten', world: 'w5' },
  { id: 'compose-2digit', world: 'w5' },
  { id: 'count-on-100', world: 'w6' },
  { id: 'neighbors', world: 'w6' },
  { id: 'chart-patterns', world: 'w6' },
  { id: 'compare-2digit', world: 'w6' },
  { id: 'add-tens', world: 'w7' },
  { id: 'plus-ten', world: 'w7' },
  { id: 'add-2digit-1digit', world: 'w7' },
  { id: 'add-with-bridge', world: 'w7', star: true },
  { id: 'story-problems', world: 'w7' },
];

const BY_ID: ReadonlyMap<SkillId, SkillInfo> = new Map(SKILLS.map((s) => [s.id, s]));

export const SKILL_IDS: readonly SkillId[] = SKILLS.map((s) => s.id);

export function skillInfo(id: SkillId): SkillInfo {
  const info = BY_ID.get(id);
  if (!info) throw new Error(`Unknown skill: ${id}`);
  return info;
}

export function isSkillId(value: unknown): value is SkillId {
  return typeof value === 'string' && BY_ID.has(value as SkillId);
}

export function skillsOfWorld(world: WorldKey): readonly SkillInfo[] {
  return SKILLS.filter((s) => s.world === world);
}
