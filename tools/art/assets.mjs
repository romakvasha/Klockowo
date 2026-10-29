// Перелік усіх картинок нового дизайну (docs/DESIGN_V2.md) і запити до них для Gemini (англійською — так генератор розуміє точніше).
// Власник генерує сам у застосунку Gemini за сторінкою-пакетом design/v2/prompts.html (будує tools/art/pack.mjs), набір за набором.
//   refs — що прикріпити до запиту: `cut/…` — вирізки з фото (design/v2/cut/), `<id>.png` — уже згенеровані картинки;
//   edit — запит є правкою першого зразка: кадр той самий, змінюється лише названа деталь;
//   cut  — персонаж чи предмет на однотонному тлі, яке потім вирізається (rembg) → прозорий WebP; інакше — фон 16:9.
// Сирі файли: design/v2/gen/<id>.png → src/assets/v2/<group>/<id>.webp (у гру).

/** Обличчя на предметах для лічби — рішення власника (рекомендація D2: без облич; у жучків, метелика, каченяти й рибки — лише очі). */
export const ITEM_FACES = false;

const RENDER = 'High-quality 3D animated feature-film render, soft global illumination, bright cheerful daylight, vibrant saturated colours.';
const CUTE = 'Cute rounded proportions, big expressive eyes, soft detailed fur.';
const BRICKS = 'Everything is built from generic glossy plastic toy bricks whose round studs are perfectly smooth and blank.';
const NO_TEXT = 'No text, letters, numbers, logos or emblems anywhere.';
/** Тло для вирізання: біле, а для білої чи сіро-білої шерсті — інше, бо rembg губить білу шерсть на білому. */
const BG = { white: 'a plain flat pure white background', grey: 'a plain flat medium-grey background', blue: 'a plain flat sky-blue background' };
const alone = (bg = 'white') =>
  `The whole figure is visible with empty space around it and nothing touches the edges; centered on ${BG[bg]}, no floor, no shadow. ${NO_TEXT}`;

/** Жетон на нашийнику — свій, не як у «Psi Patrol»: маленька кругла цеглинка з одним пупирцем кольору нашийника. */
const tag = (collar, pendant) =>
  `a ${collar} collar with a small round ${pendant} pendant shaped like a toy brick with one smooth round stud (no badge, no emblem, no paw print)`;

export const CHARACTERS = {
  kubik: `Kubik, a beagle puppy who stands upright on his hind legs like a cartoon character: tan-brown and white fur, long floppy brown ears, a white blaze on the forehead, big warm brown eyes, black nose, white muzzle and chest, ${tag('blue', 'yellow')}`,
  latka: `Łatka, a Jack Russell terrier puppy standing on all four paws: white fur with ginger-brown patches on the ears, around one eye and on the back, ${tag('green', 'green')}`,
  pufka: `Pufka, a fluffy pure-white Samoyed puppy standing on all four paws, with a happy smiling face, ${tag('sky-blue', 'sky-blue')}`,
  tofik: `Tofik, a wheaten-coloured Scottish terrier puppy standing on all four paws: boxy blocky silhouette, short legs, upright pointed ears, bushy eyebrows and a small beard, ${tag('coral-red', 'coral-red')}`,
  iskra: `Iskra, a ginger-and-white Corgi puppy standing on all four paws, with big upright ears and short legs, ${tag('violet', 'violet')}`,
};

/** 17 поз Kubika — ті самі, що в коді (src/characters/poses.ts). idle — із закритим ротом: на ньому чергуються роти a/e/o. */
const POSES = {
  idle: 'standing calmly with a friendly closed-mouth smile, front paws relaxed, looking at the viewer',
  'pointing-left': 'pointing with one front paw towards the left edge of the picture, looking the same way',
  'pointing-right': 'pointing with one front paw towards the right edge of the picture, looking the same way',
  'pointing-down': 'pointing down at the ground in front of his feet, looking down',
  demonstrating: 'proudly holding up a small tower of three colourful toy bricks to show the viewer',
  thinking: 'thinking, one paw on his chin, eyes looking up',
  happy: 'jumping with joy, both front paws up, big open smile, tail wagging',
  celebrating: 'celebrating, throwing a handful of small colourful toy bricks into the air',
  encouraging: 'giving a kind encouraging look, one paw on his chest, head slightly tilted, gentle smile',
  waving: 'waving hello with one front paw, big smile',
  surprised: 'surprised, eyes wide open, ears up, both paws at his cheeks, small round open mouth',
  'with-card': 'holding a blank white rounded card with both front paws in front of his chest; the card is completely empty',
  'on-kart': 'sitting in a small open go-kart built from red and yellow toy bricks with smooth blank studs, paws on the steering wheel, seen from the front at a slight angle, the whole kart visible',
  sleepy: 'sitting, sleepy and yawning, eyes half closed',
  'break-jump': 'dancing: jumping high with both front paws up',
  'break-clap': 'dancing: clapping his front paws above his head',
  'break-stomp': 'dancing: marching and stomping one foot, swinging his front paws happily',
};
const MOUTHS = { a: 'wide open, as when saying "a", the tongue visible', e: 'open in a wide smile, as when saying "e"', o: 'small and round, as when saying "o"' };

/** Аксесуар світу (BRIEF): Kubik idle і happy у кожному світі. */
const OUTFITS = {
  w1: 'a small straw sun hat with a daisy', w2: 'a green gardener cap', w3: 'round colourful sunglasses pushed up on his forehead',
  w4: 'a yellow builder hard hat', w5: 'a small green explorer backpack with straps on his shoulders', w6: 'a red cap',
  w7: 'a round glass space helmet with a small star',
};

const TEAM_POSES = {
  idle: 'standing calmly, friendly smile, looking at the viewer',
  happy: 'jumping with joy, tail wagging, big open smile',
  pointing: 'sitting and pointing with one front paw towards the right edge of the picture, looking the same way',
};

/** «Twój piesek»: породи з голосових описів (lines.ts PUPS); без далматинців і вівчарок (BRIEF §8). */
const PLAYER_PUPS = {
  pon: 'a shaggy grey-and-white Polish Lowland Sheepdog puppy with a fringe that still lets its eyes show',
  nowofundland: 'a fluffy black Newfoundland puppy', pudel: 'a curly apricot poodle puppy',
  chart: 'a slim long-legged sandy-fawn Polish greyhound puppy', papillon: 'a white Papillon puppy with brown patches and big butterfly-like fringed ears',
  shihtzu: 'a gold-and-white Shih Tzu puppy with a little pink bow on its head', sharpei: 'a wrinkly cream Shar-Pei puppy',
  akita: 'a brindle-striped Akita puppy with a curled tail',
};
const PUP_BG = { pon: 'blue', papillon: 'grey' };

const ANIMALS = {
  mis: 'a brown teddy-bear cub', jezyk: 'a little hedgehog', kotek: 'a grey tabby kitten', lisek: 'an orange fox cub',
  zajaczek: 'a light-brown bunny', zabka: 'a little green frog', sowa: 'a brown owl chick', myszka: 'a little grey mouse',
};

/** Предмети для лічби по світах (src/speech/nouns.ts WORLD_OBJECT_IDS). */
const OBJECTS = {
  w1: { biedronka: 'ladybug', motyl: 'colourful butterfly', kwiatek: 'daisy flower', kaczuszka: 'yellow duckling' },
  w2: { jablko: 'red apple', gruszka: 'green pear', truskawka: 'strawberry', marchewka: 'carrot with green leaves' },
  w3: { rybka: 'small orange fish', muszelka: 'seashell', rozgwiazda: 'orange starfish', lodka: 'small sailboat' },
  w4: { auto: 'small car', rower: 'small bicycle', balonik: 'party balloon on a string', jajko: "light-brown hen's egg" },
  w5: { jagoda: 'plump blueberry', szyszka: 'pine cone', grzybek: 'brown forest mushroom', patyczek: 'short straight wooden stick' },
  w6: { parasolka: 'open colourful umbrella', tramwaj: 'small red-and-yellow tram', pilka: 'colourful beach ball', lizak: 'round swirl lollipop' },
  w7: { gwiazdka: 'golden star', planeta: 'ringed planet', rakieta: 'toy rocket', kometa: 'comet with a sparkly tail' },
};
const CRITTERS = new Set(['biedronka', 'motyl', 'kaczuszka', 'rybka']);

const FINGERS = ['the index finger', 'the index and middle fingers', 'the index, middle and ring fingers', 'four fingers, only the thumb folded', 'all five fingers spread wide'];

/** Споруди світів (src/components/map/worldBuildings.ts): з'являються, коли світ пройдено. */
const BUILDINGS = {
  w1: 'windmill with white walls, a red roof and four wooden sails', w2: 'greenhouse with clear glass panes and green frames, full of plants',
  w3: 'lighthouse with red and white stripes', w4: 'bridge with a little tower', w5: 'treehouse in a big round green tree',
  w6: 'colourful skyscraper', w7: 'rocket launch tower with a small rocket',
};
const VEHICLES = { balon: 'A hot-air balloon with a basket', zaglowka: 'A little sailboat', pociag: 'A little steam train with two open wagons, without a face', rakieta: 'A rocket' };

const WORLDS = {
  w1: 'Counting Meadow: a sunny flower meadow with ladybugs and butterflies, a duck pond, little houses with colourful roofs and round trees',
  w2: 'Garden of Digits: an orchard and vegetable garden with apple and pear trees, strawberry beds and rows of carrots',
  w3: 'Island of Adding: a tropical sandy island with a turquoise sea, shells, starfish and little boats',
  w4: 'Bridge of Twenty: a big bridge over a river, little cars and bicycles, colourful balloons in the sky',
  w5: 'Forest of Tens: a friendly forest of chunky block trees with blueberry bushes, pine cones and mushrooms',
  w6: 'City of a Hundred: a colourful town square with trams, umbrellas and a sweet stall with giant lollipops',
  w7: 'Space Road: deep space with a glowing rainbow road of star tiles, planets and floating islands',
  hub: 'Playground: a cheerful playground with slides, swings and a sandbox next to a little house with a garage',
};
const ISLANDS = {
  w1: 'with a flower meadow, a tiny duck pond and a little red-roofed house', w2: 'with small fruit trees and a vegetable bed',
  w3: 'with a sandy beach, a palm tree and a little boat', w4: 'with a small bridge over a stream', w5: 'with chunky block trees, mushrooms and pine cones',
  w6: 'with a few colourful little town houses', w7: 'made of purple space rock with glowing star tiles and a tiny rocket',
  hub: 'with a small playground: a slide and swings',
};
const CHESTS = { locked: 'closed with a big toy-brick padlock', ready: 'closed and softly glowing, ready to be opened', open: 'open, full of colourful stickers and little golden stars' };

const scene = (what) =>
  `A wide 16:9 landscape picture of ${what}. Eye-level view with gentle depth. ${BRICKS} The most important scenery stands in the middle third of the picture, because on a phone only a tall narrow strip from the centre is visible; the lower middle area is open and calm, because game cards will be placed on top of it. No puppies and no people. ${NO_TEXT} ${RENDER}`;
const map = (what) =>
  `A wide 16:9 picture of ${what}, seen from above at a gentle angle like a game map. The centre of the picture is a large open, flat and calm area left empty for the game's level path; scenery frames it along the edges and at the top. ${BRICKS} No puppies and no people. ${NO_TEXT} ${RENDER}`;

function item(id, what) {
  const face = ITEM_FACES ? 'with a cute friendly face: big shiny eyes and a small smile'
    : CRITTERS.has(id) ? 'with only two small simple black dot eyes (no mouth, no eyebrows)'
      : 'an ordinary object, not a character (no face, no eyes, no mouth)';
  return `A single ${what} as a smooth glossy toy, ${face}. One solid piece of moulded plastic with soft rounded edges, not built from toy bricks and without studs. A simple bold silhouette that is easy to recognise even when very small; natural colours. Three-quarter front view from slightly above, soft studio light from the upper left; centered, filling about three quarters of a square picture, on ${BG.white}, no shadow. ${NO_TEXT} ${RENDER}`;
}

const sets = [];
const list = [];
let current = '';
const set = (key, title, note) => { current = key; sets.push({ key, title, note }); };
const add = (group, id, prompt, { refs = [], edit = false, cut = true } = {}) =>
  list.push({ set: current, group, id, prompt: prompt.replace(/\s+/g, ' ').trim(), refs, edit, cut });

// Kubik: еталон kubik-idle зі зразком-вирізкою з фото, далі всі пози — зі зразком kubik-idle
const KEEP = (who) => `Use the attached picture as the character reference and keep ${who} exactly the same: face, fur pattern, ears, collar, pendant, proportions and style.`;
const pose = (p) => add('kubik', `kubik-${p}`, `${KEEP('Kubik')} ${CHARACTERS.kubik}, ${POSES[p]}. ${alone()} ${RENDER} ${CUTE}`, { refs: ['kubik-idle.png'] });
set('kubik-1', 'Kubik: головні пози', 'Почни з kubik-idle: зразок — вирізка з вашого фото. Коли kubik-idle вдалий, додай його сюди — далі він зразок для всіх поз, команди й цуценят.');
add('kubik', 'kubik-idle', `Use the attached picture of the puppy as the character reference: keep his face, fur colours, ears and proportions, but replace the round gold tag with the brick pendant described here. ${CHARACTERS.kubik}, ${POSES.idle}. ${alone()} ${RENDER} ${CUTE}`, { refs: ['cut/kubik-wave.png'] });
['pointing-left', 'pointing-right', 'pointing-down', 'demonstrating', 'thinking', 'happy', 'celebrating', 'encouraging', 'waving'].forEach(pose);
set('kubik-2', 'Kubik: ще пози й рот', 'Рот a / e / o — правка kubik-idle: поза, розмір і кадр мають збігтися з ним до пікселя, змінюється лише рот (у грі кадри чергуються, поки звучить голос).');
['surprised', 'with-card', 'on-kart', 'sleepy', 'break-jump', 'break-clap', 'break-stomp'].forEach(pose);
for (const [m, mouth] of Object.entries(MOUTHS)) {
  add('kubik', `kubik-talking-${m}`, `Edit the attached picture. Keep absolutely everything else identical: Kubik's pose, position, size, framing, lighting and the plain white background. Change only his mouth: ${mouth}.`, { refs: ['kubik-idle.png'], edit: true });
}
set('kubik-3', 'Kubik у світах', 'Правки готових kubik-idle і kubik-happy: додається лише аксесуар світу, усе інше лишається як було.');
for (const [w, outfit] of Object.entries(OUTFITS)) {
  for (const p of ['idle', 'happy']) {
    const astro = w === 'w7';
    add('kubik', `kubik-${w}-${p}`, `Edit the first attached picture: put ${outfit} on Kubik${astro ? ', like the helmet in the second picture' : ''}. Keep everything else identical: his face, pose, collar, yellow brick pendant, size, framing and the plain white background.`,
      { refs: [`kubik-${p}.png`, ...(astro ? ['cut/kubik-astro.png'] : [])], edit: true });
  }
}
// Команда: idle — зі зразком стилю kubik-idle, решта поз — зі зразком idle того самого цуценяти
set('team', 'Команда', 'idle — зі зразком стилю kubik-idle; happy і pointing — зі зразком idle того самого цуценяти. Łatka idle вже є з проби: можна завантажити її оригінал із того чату Gemini.');
for (const id of ['latka', 'pufka', 'tofik', 'iskra']) {
  const bg = id === 'pufka' ? 'grey' : 'white';
  add('team', `team-${id}-idle`, `Use the attached picture only as a style reference (the same 3D style, fur detail, eyes and collar with a brick pendant) and draw a different puppy: ${CHARACTERS[id]}, ${TEAM_POSES.idle}. ${alone(bg)} ${RENDER} ${CUTE}`, { refs: ['kubik-idle.png'] });
  for (const p of ['happy', 'pointing']) {
    add('team', `team-${id}-${p}`, `${KEEP('this puppy')} ${CHARACTERS[id]}, ${TEAM_POSES[p]}. ${alone(bg)} ${RENDER} ${CUTE}`, { refs: [`team-${id}-idle.png`] });
  }
}
set('pups', 'Twój piesek', 'Зразок стилю — kubik-idle. Простий червоний нашийник без жетона.');
for (const [id, what] of Object.entries(PLAYER_PUPS)) {
  add('pups', `pup-${id}`, `Use the attached picture only as a style reference (the same 3D style, fur detail and eyes) and draw a different puppy: ${what}, standing on all four paws, smiling, looking at the viewer, wearing a plain red collar without any tag or pendant. ${alone(PUP_BG[id])} ${RENDER} ${CUTE}`, { refs: ['kubik-idle.png'] });
}
// Тваринки місій: звичайна, потім радісна — правкою тієї самої картинки
const animals = (key, title, ids) => {
  set(key, title, 'Спершу звичайна (трохи сумна, чекає допомоги), одразу за нею в тому самому чаті — радісна, правкою тієї ж картинки.');
  for (const id of ids) {
    add('animals', `animal-${id}`, `${ANIMALS[id]}, standing and looking at the viewer, a little sad and hopeful, as if waiting for help. ${alone()} ${RENDER} ${CUTE}`);
    add('animals', `animal-${id}-happy`, `Edit the attached picture: make the ${ANIMALS[id].replace(/^an? /, '')} very happy: big open smile, sparkling eyes, paws up in joy. Keep the same character, colours, size, framing and the plain white background.`, { refs: [`animal-${id}.png`], edit: true });
  }
};
animals('animals-1', 'Тваринки 1', ['mis', 'jezyk', 'kotek', 'lisek']);
animals('animals-2', 'Тваринки 2', ['zajaczek', 'zabka', 'sowa', 'myszka']);
// Предмети для лічби: гладкі іграшки, однаковий ракурс і світло — у грі вони стоять рядами
const ITEM_NOTE = 'Гладкі іграшки, не з цеглинок, без облич. Однаковий ракурс і світло: у грі предмети стоять рядами — перший вдалий можна прикріпляти як зразок стилю до наступних.';
set('items-1', 'Предмети W1–W3', ITEM_NOTE);
for (const w of ['w1', 'w2', 'w3']) for (const [id, what] of Object.entries(OBJECTS[w])) add('items', `item-${id}`, item(id, what));
set('items-2', 'Предмети W4–W7', ITEM_NOTE);
for (const w of ['w4', 'w5', 'w6', 'w7']) for (const [id, what] of Object.entries(OBJECTS[w])) add('items', `item-${id}`, item(id, what));
set('digits', 'Цифри', 'Одна цифра на картинці, класичної форми, щоб читалась здалеку.');
for (let d = 0; d <= 9; d++) {
  add('digits', `digit-${d}`, `The digit ${d} as one big chunky 3D figure built from glossy toy bricks in red, yellow, blue and green, with smooth blank studs; the classic simple shape of the digit ${d}, instantly readable from far away. Front view, centered on ${BG.white}, no floor, no shadow; nothing else in the picture. ${RENDER}`);
}
set('hands', 'Руки', 'Перелічи пальці! Gemini часто помиляється — повторюй, доки на картинці не буде рівно стільки пальців, скільки в назві файла.');
for (let n = 0; n <= 5; n++) {
  const shows = n === 0 ? 'making a closed fist with no fingers raised' : `showing exactly ${n} raised ${n === 1 ? 'finger' : 'fingers'}: ${FINGERS[n - 1]}; all other fingers folded down`;
  add('hands', `hand-${n}`, `A cute cartoon child's right hand with smooth skin (not made of bricks), palm facing the viewer, ${shows}. ${alone()} ${RENDER}`);
}
// Будівлі й транспорт: усе з цеглинок
set('build', 'База, споруди світів, транспорт', 'База — будиночок команди на екрані Start. Споруди з’являються, коли світ пройдено. Транспорт — у місіях.');
add('world', 'base-druzyna', `A cheerful little house built from toy bricks, with a wide garage on one side for small vehicles, a red roof, round windows and a short path to the door. ${alone()} ${BRICKS} ${RENDER}`);
for (const [w, b] of Object.entries(BUILDINGS)) add('world', `build-${w}`, `A small ${b} built from toy bricks, standing on a small square green base plate. ${alone()} ${BRICKS} ${RENDER}`);
for (const [id, what] of Object.entries(VEHICLES)) add('team', `veh-${id}`, `${what} built from toy bricks, chunky and simple, three-quarter front view. ${alone()} ${BRICKS} ${RENDER}`);
// Світи: фон гри, фон доріжки рівнів, острів для мапи пригод
set('bg', 'Фони світів', '16:9, оригінал 2K. Головне — в середній третині: на телефоні видно лише середню смугу. Внизу посередині — спокійне місце під картки гри.');
add('world', 'bg-start', scene('a whole toy-brick village by a pond: little houses with colourful roofs, round trees, a small bridge and a waterfall, with an open grassy square in the middle'), { cut: false });
for (const [w, what] of Object.entries(WORLDS)) add('world', `bg-${w}`, scene(what), { cut: false });
set('path', 'Доріжки рівнів', 'Вид згори під кутом. Посередині — порожнє місце: доріжку з вузлами рівнів малює гра.');
for (const [w, what] of Object.entries(WORLDS)) if (w !== 'hub') add('world', `path-${w}`, map(what), { cut: false });
set('islands', 'Острови мапи й скрині', 'Острови — на блакитному тлі (біла хмаринка на білому загубилася б при вирізанні).');
for (const [w, d] of Object.entries(ISLANDS)) add('world', `island-${w}`, `A small floating island ${d}, resting on a little white cloud; compact round shape, seen from the front and slightly above. ${alone('blue')} ${BRICKS} ${RENDER}`);
add('world', 'island-locked', `A small floating island hidden under soft grey fog, with a big toy-brick padlock on top, resting on a little white cloud. ${alone('blue')} ${BRICKS} ${RENDER}`);
for (const [s, how] of Object.entries(CHESTS)) add('world', `chest-${s}`, `A toy-brick treasure chest, ${how}, three-quarter front view. ${alone()} ${BRICKS} ${RENDER}`);

export const SETS = sets;
export const ASSETS = list;
