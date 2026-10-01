// Картинки 8 цуценят для вітрини AvatarButton. Справжні компоненти цуценят (PlayerPup, PupPicker) — етапи M4 і M6.
const urls = import.meta.glob<string>('../../assets/pups/pup-*.svg', { query: '?url', import: 'default', eager: true });

export function pupUrl(id: string): string {
  const entry = Object.entries(urls).find(([path]) => path.endsWith(`pup-${id}.svg`));
  if (!entry) throw new Error(`Pup image not found: ${id}`);
  return entry[1];
}
