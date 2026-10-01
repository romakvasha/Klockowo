/** Слотів-кісточок на рівні завжди 6: кісточку дають і після «показу разом» (BRIEF §7). */
export const BONES_PER_LEVEL = 6;

/** empty — порожній слот; filled — кісточка на місці; arriving — кісточка щойно долетіла (підсвічений слот). */
export type BoneState = 'empty' | 'filled' | 'arriving';

/** @param filled скільки слотів заповнено (разом із тим, що долітає); @param arriving індекс слота, куди зараз долітає. */
export function boneStates(total: number, filled: number, arriving: number | null = null): BoneState[] {
  if (!Number.isInteger(total) || total < 1) throw new RangeError(`Bones: total must be a positive integer, got ${total}`);
  if (!Number.isInteger(filled) || filled < 0 || filled > total) {
    throw new RangeError(`Bones: filled must be 0–${total}, got ${filled}`);
  }
  return Array.from({ length: total }, (_, i): BoneState => {
    if (i >= filled) return 'empty';
    return i === arriving ? 'arriving' : 'filled';
  });
}
