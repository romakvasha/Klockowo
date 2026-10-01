// Чиста робота з розміткою SVG-персонажів (Kubik, команда). Кожна поза — окремий SVG із групами
// #tail, #legs, #body, #headwrap › (#head, #eyes, #mouth, #ears, #accessory), #paw-l, #paw-r (BRIEF §9, design etap1/11).
// Розмітку збираємо рядками, щоб її можна було тестувати без DOM; React лише вставляє готовий рядок.

/** Балансоване виймання `<g id="…">…</g>` з розміткою (вкладені `<g>` враховано). */
export function extractGroup(markup: string, id: string): string | null {
  const start = markup.indexOf(`<g id="${id}"`);
  if (start < 0) return null;
  const tag = /<g\b|<\/g>/g;
  tag.lastIndex = start;
  let depth = 0;
  for (let m = tag.exec(markup); m; m = tag.exec(markup)) {
    depth += m[0] === '</g>' ? -1 : 1;
    if (depth === 0) return markup.slice(start, m.index + m[0].length);
  }
  return null;
}

/** Вміст групи без її власного тегу `<g …>` і `</g>`. */
export function groupContent(group: string): string {
  return group.slice(group.indexOf('>') + 1, group.lastIndexOf('</g>'));
}

export function replaceGroup(markup: string, id: string, next: string): string {
  const group = extractGroup(markup, id);
  if (group === null) throw new Error(`SVG group #${id} not found`);
  return markup.replace(group, () => next);
}

/** Вставляє розмітку перед групою `<g id="anchorId" …>`: так картка опиняється між тілом і лапами. */
export function insertBefore(markup: string, anchorId: string, extra: string): string {
  const at = markup.indexOf(`<g id="${anchorId}"`);
  if (at < 0) throw new Error(`SVG group #${anchorId} not found`);
  return markup.slice(0, at) + extra + markup.slice(at);
}

/** Аксесуар світу — окремий SVG із групою #accessory; кладемо його в порожній шар #accessory пози
 *  (той лежить усередині #headwrap, тож аксесуар іде за поворотом голови). */
export function injectAccessory(markup: string, accessorySvgInner: string): string {
  const accessory = extractGroup(accessorySvgInner, 'accessory');
  if (accessory === null) throw new Error('Accessory SVG has no #accessory group');
  return replaceGroup(markup, 'accessory', `<g id="accessory">${groupContent(accessory)}</g>`);
}

export interface Mouths {
  a: string;
  o: string;
  e: string;
}

/** Рот → чотири шари: base (як у позі) і a/o/e (говорить). Показ перемикає CSS за data-m, тож розмітка не перемальовується
 *  9 разів на секунду і анімації інших частин (кліпання, хвіст) не збиваються. */
export function withMouths(markup: string, mouths: Mouths): string {
  const current = extractGroup(markup, 'mouth');
  if (current === null) throw new Error('SVG group #mouth not found');
  const layer = (name: string, content: string) => `<g data-m="${name}">${content}</g>`;
  return replaceGroup(
    markup,
    'mouth',
    `<g id="mouth">${layer('base', groupContent(current))}${layer('a', mouths.a)}${layer('o', mouths.o)}${layer('e', mouths.e)}</g>`,
  );
}

/** Обгортає групу #tail у `<g data-wag>`: CSS крутить обгортку, а власний атрибут transform хвоста (поза) лишається недоторканим.
 *  Крутити саму групу не можна — CSS transform-origin ламає SVG-атрибут `rotate(кут cx cy)`. Позам без хвоста (sleepy, Iskra) нічого не робить. */
export function wrapTail(markup: string): string {
  const tail = extractGroup(markup, 'tail');
  return tail === null ? markup : markup.replace(tail, () => `<g data-wag>${tail}</g>`);
}

/** Очі відкриті (еліпси) — можна кліпати; «щасливі» дуги й заплющені очі не кліпають. */
export function eyesOpen(markup: string): boolean {
  return extractGroup(markup, 'eyes')?.includes('<ellipse') ?? false;
}

/** `id="x"` → `data-part="x"`: кілька персонажів на сторінці не дублюють id, а CSS знаходить частини за data-part. */
export function idsToParts(markup: string): string {
  return markup.replace(/ id="([^"]+)"/g, ' data-part="$1"');
}
