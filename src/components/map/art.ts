// Арт мапи з src/assets/world: острови світів, замок (сірий камінь) і «Baza Drużyny».
const islands = import.meta.glob<string>('../../assets/world/island-*.svg', { query: '?url', import: 'default', eager: true });
const bases = import.meta.glob<string>('../../assets/world/base-*.svg', { query: '?url', import: 'default', eager: true });

function find(sources: Record<string, string>, suffix: string): string {
  const entry = Object.entries(sources).find(([path]) => path.endsWith(suffix));
  if (!entry) throw new Error(`Map art not found: ${suffix}`);
  return entry[1];
}

/** 'w1' … 'w7', 'hub' або 'locked'. */
export const ISLAND_URL = (id: string): string => find(islands, `island-${id}.svg`);
export const BASE_URL = (): string => find(bases, 'base-druzyna.svg');

const chests = import.meta.glob<string>('../../assets/world/chest-*.svg', { query: '?url', import: 'default', eager: true });
const decors = import.meta.glob<string>('../../assets/world/deco-*.svg', { query: '?url', import: 'default', eager: true });

/** Скриня світу 132×155: 'locked' | 'ready' | 'open'. */
export const CHEST_URL = (state: string): string => find(chests, `chest-${state}.svg`);
/** Декор сцени стежки: 'meadow' (deco-w1-meadow), 'tree', 'pine', 'palm', 'rocks', 'pool'. */
export const DECOR_URL = (kind: string): string => find(decors, kind === 'meadow' ? 'deco-w1-meadow.svg' : `deco-${kind}.svg`);
