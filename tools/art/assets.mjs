// Перелік усіх картинок нового дизайну (docs/DESIGN_V2.md) із запитами для генератора зображень (англійською — так генератори
// розуміють точніше). Скрипт генерації (tools/art/generate.mjs, буде після вибору сервісу) бере звідси id, розмір, фон і зразки:
//   refs — id картинок-зразків, які надсилаються разом із запитом, щоб персонаж був той самий на всіх картинках;
//   cut  — true: персонаж/предмет на однотонному фоні, після генерації фон вирізається (rembg) → прозорий PNG/WebP.
// Шляхи результату: design/v2/gen/<id>.png (сирі) → src/assets/v2/<group>/<id>.webp (у гру).

export const STYLE = [
  '3D animated feature-film style render, soft global illumination, vibrant saturated primary colors,',
  'a cheerful world built of generic glossy plastic toy building bricks with round studs (no brand logos, no text),',
  'cute rounded proportions, big expressive eyes, detailed soft fur, bright sunny daylight, gentle depth of field.',
].join(' ');

const ISOLATED = 'Single character, full body, centered, isolated on a plain flat pure white background, no ground shadow, no text, no frame.';
const OBJECT = 'Single object, centered, isolated on a plain flat pure white background, no shadow, no text, toy-like 3D render.';
const SCENE = 'Wide 16:9 landscape scene with no characters and no text; keep the lower middle area calm and uncluttered so game cards can sit on top.';

/** Жетон на нашийнику — свій, не як у «Psi Patrol»: маленька кругла цеглинка з одним пупирцем кольору нашийника. */
const tag = (collar, pendant) =>
  `a ${collar} collar with a small round ${pendant} toy-brick pendant (one round stud) - no badge, no emblem, no paw-print tag`;

export const CHARACTERS = {
  kubik: `Kubik, a beagle puppy: tan-brown and white fur, long floppy brown ears, white blaze on the forehead, big warm brown eyes, black nose, white muzzle and chest, ${tag('blue', 'yellow')}`,
  latka: `Łatka, a Jack Russell terrier puppy: white fur with ginger-brown patches, ${tag('green', 'green')}`,
  pufka: `Pufka, a fluffy white Samoyed puppy with a smiling face, ${tag('sky-blue', 'sky-blue')}`,
  tofik: `Tofik, a wheaten Scottish terrier puppy: boxy blocky silhouette, short legs, upright ears, bushy eyebrows and beard, ${tag('coral-red', 'coral-red')}, no firefighter gear`,
  iskra: `Iskra, a ginger-and-white Corgi puppy with big upright ears, ${tag('violet', 'violet')}`,
};

const POSES = {
  idle: 'standing calmly, friendly smile, looking at the viewer',
  talking: 'standing, mouth open as if speaking, friendly',
  happy: 'jumping with joy, tail wagging, big smile',
  celebrating: 'celebrating, throwing small colorful toy bricks into the air',
  demonstrating: 'holding up a small stack of colorful toy bricks to show the viewer',
  encouraging: 'kind encouraging look, one paw on the chest',
  thinking: 'thinking, paw on the chin, a small question mark brick floating above the head',
  'pointing-left': 'pointing with the left paw to the left side',
  'pointing-right': 'pointing with the right paw to the right side',
  'pointing-down': 'pointing down with one paw',
  waving: 'waving hello with one paw',
  surprised: 'surprised, eyes wide, ears up',
  sleepy: 'sleepy, yawning, sitting',
  'with-card': 'holding a blank white rounded card in both paws in front of the chest',
  'break-clap': 'clapping paws above the head, dancing',
  'break-jump': 'jumping high with paws up',
  'break-stomp': 'stomping one foot, marching happily',
};

/** Аксесуар світу (BRIEF): Kubik idle і happy у кожному світі. */
const OUTFITS = {
  w1: 'a small straw sun hat with a daisy', w2: 'a green gardener cap', w3: 'round sunglasses', w4: 'a yellow builder hard hat',
  w5: 'a little explorer backpack', w6: 'a red city cap', w7: 'a round space helmet with a star',
};

const OBJECTS = {
  biedronka: 'a ladybug', motyl: 'a colorful butterfly', kwiatek: 'a daisy flower', kaczuszka: 'a yellow duckling',
  jablko: 'a red apple', gruszka: 'a green pear', truskawka: 'a strawberry', marchewka: 'a carrot',
  rybka: 'a small orange fish', muszelka: 'a seashell', rozgwiazda: 'a starfish', lodka: 'a small toy sailboat',
  auto: 'a small toy car', rower: 'a small bicycle', balonik: 'a party balloon', jajko: 'an egg',
  jagoda: 'a blueberry', szyszka: 'a pine cone', grzybek: 'a mushroom', patyczek: 'a wooden stick',
  parasolka: 'an umbrella', tramwaj: 'a small tram', pilka: 'a ball', lizak: 'a lollipop',
  gwiazdka: 'a golden star', planeta: 'a ringed planet', rakieta: 'a toy rocket', kometa: 'a comet with a sparkly tail',
};

const ANIMALS = {
  mis: 'a teddy bear cub', jezyk: 'a hedgehog', kotek: 'a kitten', lisek: 'a fox cub',
  zajaczek: 'a bunny', zabka: 'a little frog', sowa: 'an owl', myszka: 'a little mouse',
};

/** «Twój piesek»: породи з голосових описів (lines.ts PUPS); без далматинців і вівчарок (BRIEF §8). */
const PLAYER_PUPS = {
  pon: 'a shaggy grey-and-white Polish Lowland Sheepdog puppy', nowofundland: 'a fluffy black Newfoundland puppy',
  pudel: 'a curly apricot poodle puppy', chart: 'a slim fast Polish greyhound puppy', papillon: 'a Papillon puppy with butterfly-like ears',
  shihtzu: 'a Shih Tzu puppy with a little bow', sharpei: 'a wrinkly Shar-Pei puppy', akita: 'a brindle-striped Akita puppy',
};

const WORLDS = {
  w1: 'Counting Meadow: a sunny flower meadow with ladybugs, butterflies and a duck pond, toy-brick houses and trees',
  w2: 'Garden of Digits: an orchard and vegetable garden with apple and pear trees, strawberry beds and carrots',
  w3: 'Island of Adding: a tropical sandy island, turquoise sea, shells, starfish and little boats',
  w4: 'Bridge of Twenty: a big toy-brick bridge over a river, little cars and bicycles, balloons in the sky',
  w5: 'Forest of Tens: a forest of wooden blocks with blueberries, pine cones and mushrooms',
  w6: 'City of a Hundred: a colorful toy-brick city with trams, umbrellas and a lollipop shop',
  w7: 'Space Road: deep space with a glowing rainbow road of star tiles, planets and floating islands',
  hub: 'Playground: a cheerful toy-brick playground with slides, swings and a sandbox',
};

const VEHICLES = { balon: 'a hot-air balloon', zaglowka: 'a little sailboat', pociag: 'a little steam train with wagons of toy bricks, no face', rakieta: 'a toy-brick rocket' };

const list = [];
const add = (group, id, prompt, { cut = true, refs = [], size = cut ? '1024x1024' : '1536x864' } = {}) =>
  list.push({ group, id, prompt: `${prompt} ${cut && !prompt.includes(OBJECT) ? ISOLATED : ''} ${STYLE}`.replace(/\s+/g, ' ').trim(), cut, refs, size });

// Kubik: усі пози, 3 форми рота (з пози idle), аксесуари світів
for (const [pose, what] of Object.entries(POSES)) add('kubik', `kubik-${pose}`, `${CHARACTERS.kubik}, ${what}.`, { refs: ['ref-kubik'] });
for (const [m, mouth] of Object.entries({ a: 'wide open "a"', e: 'half-open smiling "e"', o: 'round "o"' })) {
  add('kubik', `kubik-talking-${m}`, `${CHARACTERS.kubik}, standing calmly, the same pose as the reference, mouth ${mouth} as if speaking.`, { refs: ['kubik-idle'] });
}
for (const [w, outfit] of Object.entries(OUTFITS)) {
  add('kubik', `kubik-${w}-idle`, `${CHARACTERS.kubik}, wearing ${outfit}, standing calmly, friendly smile.`, { refs: ['kubik-idle'] });
  add('kubik', `kubik-${w}-happy`, `${CHARACTERS.kubik}, wearing ${outfit}, jumping with joy.`, { refs: ['kubik-happy'] });
}
// Команда: 3 пози + транспорт
for (const id of ['latka', 'pufka', 'tofik', 'iskra']) {
  for (const pose of ['idle', 'happy', 'pointing-right']) add('team', `team-${id}-${pose.replace('-right', '')}`, `${CHARACTERS[id]}, ${POSES[pose]}.`, { refs: ['ref-kubik'] });
}
for (const [id, what] of Object.entries(VEHICLES)) add('team', `veh-${id}`, `${what} built of toy bricks. ${OBJECT}`);
// «Twój piesek»: 8 порід
for (const [id, what] of Object.entries(PLAYER_PUPS)) add('pups', `pup-${id}`, `${what}, plain collar without any tag, standing and smiling.`, { refs: ['ref-kubik'] });
// Тваринки місій: звичайна й радісна
for (const [id, what] of Object.entries(ANIMALS)) {
  add('animals', `animal-${id}`, `${what}, standing, a little worried, waiting for help.`);
  add('animals', `animal-${id}-happy`, `${what}, very happy, smiling widely.`, { refs: [`animal-${id}`] });
}
// Предмети для лічби (однаковий ракурс і світло — їх кладуть рядами)
for (const [id, what] of Object.entries(OBJECTS)) add('items', `item-${id}`, `${what}. ${OBJECT}`, { size: '1024x1024' });
// Цифри 0–9 з цеглинок, руки 0–5 (перевіряти кількість пальців!)
for (let d = 0; d <= 9; d++) add('digits', `digit-${d}`, `the digit ${d} built of glossy toy bricks in red, yellow, blue and green. ${OBJECT}`);
for (let n = 0; n <= 5; n++) add('hands', `hand-${n}`, `a cute cartoon child's hand showing exactly ${n} raised fingers${n === 0 ? ' (a closed fist)' : ''}, palm facing the viewer. ${OBJECT}`);
// Світи: фон гри, фон доріжки рівнів (з вільною звивистою стежкою), острів для мапи пригод
for (const [w, scene] of Object.entries(WORLDS)) {
  add('world', `bg-${w}`, `${scene}. ${SCENE}`, { cut: false });
  if (w !== 'hub') add('world', `path-${w}`, `${scene}, seen from above at an angle, with a wide empty winding path from the bottom left to the top right. ${SCENE}`, { cut: false });
  add('world', `island-${w}`, `a small floating island in the style of ${scene.split(':')[0]}, on a little cloud.`);
}
add('world', 'island-locked', 'a small floating island covered with grey fog and a big padlock brick.');
for (const s of ['locked', 'ready', 'open']) add('world', `chest-${s}`, `a toy-brick treasure chest, ${s === 'locked' ? 'closed with a padlock' : s === 'ready' ? 'closed and glowing, ready to open' : 'open, full of colorful stickers and stars'}.`);
add('world', 'bg-start', `${WORLDS.w1}, a wide welcoming view of the whole toy-brick village. ${SCENE}`, { cut: false });

export const ASSETS = list;
