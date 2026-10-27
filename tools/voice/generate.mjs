// Записаний голос для гри: node tools/voice/generate.mjs --lang pl --budget 30000 [--dry] [--limit 20] [--seeds 120] [--prune] [--yes] [--workers 3]
// 1) Перелік усього, що гра каже цією мовою (src/dev/voice/inventory.ts), ділимо на речення так само, як гра (src/speech/clips.ts).
// 2) Висловлювання звучить записом, лише коли записано ВСІ його речення, тому в межах --budget символів тексту беремо висловлювання
//    жадібно: найчутніші на символ першими (спільні речення далі вже безкоштовні). Кредитів ElevenLabs іде не більше, ніж символів
//    (скільки саме — каже відповідь сервісу: eleven_v4 на Starter брав ≈ 0,4 кредиту за символ).
// 3) Озвучка ElevenLabs (голос і модель — config.json) у public/audio/<мова>/<хеш>.mp3; manifest.json оновлюється після кожного файла:
//    перерваний запуск продовжується з того самого місця, а вже записане вдруге не оплачується.
// --dry — лише план і кошторис (без ключа й кредитів); --limit N — не більше N нових речень (проба); --prune — прибрати записи,
// яких гра вже не каже; --yes — без запитання «Продовжити?»; --workers N — запитів одночасно (Starter дозволяє 3);
// --redo "речення" — записати це речення наново (не той наголос, шум), можна кілька разів.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { openApp } from './app.mjs';
import { apiKey, loadConfig, ROOT, subscription, synthesize } from './eleven.mjs';

const { values: args } = parseArgs({
  options: {
    lang: { type: 'string', default: 'pl' },
    budget: { type: 'string' },
    limit: { type: 'string' },
    seeds: { type: 'string', default: '120' },
    dry: { type: 'boolean', default: false },
    prune: { type: 'boolean', default: false },
    yes: { type: 'boolean', default: false },
    workers: { type: 'string', default: '3' },
    redo: { type: 'string', multiple: true, default: [] },
  },
});
const lang = args.lang;
const budget = Number(args.budget ?? 0); // без --budget — нових речень не записуємо (лише --redo)
const limit = args.limit === undefined ? Infinity : Number(args.limit);
const config = loadConfig();
const voiceId = config.voices?.[lang];
if (!voiceId) {
  console.error(`Немає голосу для «${lang}»: впишіть voice_id у tools/voice/config.json → voices.${lang}.`);
  process.exit(1);
}
const fmt = (n) => Math.round(n).toLocaleString('uk-UA');
const pct = (part, all) => `${all > 0 ? Math.round((part / all) * 100) : 0} %`;

// ---------- Що гра каже ----------
const app = await openApp();
let utterances, splitSentences, clipKey;
try {
  const { setLanguage } = await app.load('/src/speech/language.ts');
  ({ splitSentences, clipKey } = await app.load('/src/speech/clips.ts'));
  const { collectUtterances } = await app.load('/src/dev/voice/inventory.ts');
  setLanguage(lang);
  utterances = await collectUtterances(Number(args.seeds));
} finally {
  await app.close();
}

/** Речення: ключ → { text — як озвучувати (найчастіший варіант написання), cost — символи }. */
const sentences = new Map();
for (const u of utterances) {
  u.keys = [];
  for (const s of splitSentences(u.text)) {
    const key = clipKey(s);
    if (!key) continue;
    let e = sentences.get(key);
    if (!e) sentences.set(key, (e = { variants: new Map() }));
    e.variants.set(s, (e.variants.get(s) ?? 0) + u.weight);
    if (!u.keys.includes(key)) u.keys.push(key);
  }
}
for (const e of sentences.values()) {
  [[e.text]] = [...e.variants].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
  e.cost = e.text.length;
}
const spoken = utterances.filter((u) => u.keys.length > 0);
const totalChars = [...sentences.values()].reduce((sum, e) => sum + e.cost, 0);

// ---------- Що вже записано ----------
const DIR = `${ROOT}public/audio/${lang}/`;
const MANIFEST = `${DIR}manifest.json`;
const old = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : null;
const clips = { ...(old?.clips ?? {}) };
if (Object.keys(clips).length > 0 && (old.voice !== voiceId || old.model !== config.model)) {
  console.error(`У public/audio/${lang}/ записи іншим голосом чи моделлю (${old.voice} · ${old.model}). Два голоси в грі не змішуємо:`);
  console.error(`видаліть теку public/audio/${lang}/ і запустіть знову — усе запишеться заново.`);
  process.exit(1);
}
const stale = Object.keys(clips).filter((key) => !sentences.has(key));
if (args.prune && !args.dry) {
  for (const key of stale) {
    const file = `${DIR}${clips[key]}.mp3`;
    if (existsSync(file)) unlinkSync(file);
    delete clips[key];
  }
}
const done = new Set(Object.keys(clips).filter((key) => sentences.has(key)));

// ---------- План: спершу --redo, далі жадібно, найчутніше на символ ----------
const order = [];
const planned = new Set();
let planCost = 0;
for (const key of new Set(args.redo.flatMap((text) => splitSentences(text).map(clipKey)))) {
  if (!sentences.has(key)) {
    console.warn(`--redo: гра не каже «${key}» — пропускаю.`);
    continue;
  }
  done.delete(key);
  planned.add(key);
  order.push(key);
  planCost += sentences.get(key).cost;
}
let open = spoken.filter((u) => !u.keys.every((k) => done.has(k)));
for (;;) {
  let best = null;
  let bestScore = 0;
  let bestCost = 0;
  open = open.filter((u) => {
    let cost = 0;
    let fresh = 0;
    for (const k of u.keys) {
      if (done.has(k) || planned.has(k)) continue;
      cost += sentences.get(k).cost;
      fresh++;
    }
    if (cost === 0) return false;
    if (planCost + cost <= budget && order.length + fresh <= limit && u.weight / cost > bestScore) {
      best = u;
      bestScore = u.weight / cost;
      bestCost = cost;
    }
    return true;
  });
  if (!best) break;
  for (const k of best.keys) {
    if (done.has(k) || planned.has(k)) continue;
    planned.add(k);
    order.push(k);
  }
  planCost += bestCost;
}

/** Частка того, що чує дитина (за вагою висловлювань), яка звучатиме записом, якщо записано речення `have`. */
function coverage(have) {
  const sum = { all: [0, 0], number: [0, 0], screen: [0, 0], game: [0, 0] };
  for (const u of spoken) {
    const hit = u.keys.every((k) => have.has(k)) ? u.weight : 0;
    for (const bucket of [sum.all, sum[u.kind]]) {
      bucket[0] += hit;
      bucket[1] += u.weight;
    }
  }
  return `${pct(...sum.all)} (числа ${pct(...sum.number)}, екрани ${pct(...sum.screen)}, ігри ${pct(...sum.game)})`;
}

console.log(`Мова ${lang} · голос ${voiceId} · ${config.model}`);
console.log(`Гра каже ${fmt(spoken.length)} різних висловлювань: ${fmt(sentences.size)} різних речень, ${fmt(totalChars)} символів — стільки коштує записати все (кредитів — не більше).`);
console.log(`Уже записано: ${fmt(done.size)} речень — звучить записом ${coverage(done)}.${stale.length ? ` Записів, яких гра вже не каже: ${stale.length}${args.prune ? ' (прибираю)' : ' (--prune прибере)'}.` : ''}`);
const after = new Set([...done, ...planned]);
console.log(`План у межах ${fmt(budget)} символів: ${fmt(order.length)} нових речень, ${fmt(planCost)} символів (кредитів — не більше).`);
console.log(`Після запису звучатиме записом: ${coverage(after)} того, що чує дитина. Решта — браузерний голос (цілими висловлюваннями, без змішування).`);
if (args.dry) {
  console.log('\nПерші речення плану:');
  for (const k of order.slice(0, 12)) console.log(`  ${sentences.get(k).text}`);
  console.log('\nНайчутніше, що лишиться браузерним голосом:');
  for (const u of spoken.filter((x) => !x.keys.every((k) => after.has(k))).sort((a, b) => b.weight - a.weight).slice(0, 12)) {
    console.log(`  ${u.weight.toFixed(1).padStart(6)}  ${u.text}`);
  }
  process.exit(0);
}

// ---------- Озвучка ----------
function save() {
  const sorted = Object.fromEntries(Object.entries(clips).sort(([a], [b]) => a.localeCompare(b, lang)));
  const complete = [...sentences.keys()].every((key) => key in clips);
  const text = `${JSON.stringify({ voice: voiceId, model: config.model, complete, clips: sorted }, null, 1)}\n`;
  // Windows буває на мить блокує файл (антивірус, npm run dev) — кілька спроб із паузою
  for (let attempt = 1; ; attempt++) {
    try {
      return writeFileSync(MANIFEST, text);
    } catch (error) {
      if (attempt >= 20) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
}

mkdirSync(DIR, { recursive: true });
if (order.length === 0) {
  save();
  console.log('Нових речень немає — нічого не озвучую.');
  process.exit(0);
}
const key = apiKey();
const account = await subscription(key);
if (account) console.log(`Кредити акаунта: використано ${fmt(account.used)} з ${fmt(account.limit)} (лишилось ${fmt(account.limit - account.used)}).`);
if (!args.yes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Озвучити ${fmt(order.length)} речень (${fmt(planCost)} символів, кредитів — не більше)? Напишіть «так»: `);
  rl.close();
  if (!/^(так|tak|yes|y|т)$/i.test(answer.trim())) process.exit(0);
}

let spent = 0;
let reserved = 0; // символи запитів, що ще в дорозі: бюджет не перевищуємо й паралельно
let next = 0;
let recorded = 0;
let failure = null;
async function worker() {
  while (!failure && next < order.length) {
    const k = order[next];
    const e = sentences.get(k);
    if (spent + reserved + e.cost > Math.max(budget, planCost)) return;
    next++;
    reserved += e.cost;
    try {
      const result = await synthesize({ key, voiceId, text: e.text, lang, config });
      const file = createHash('sha1').update(k).digest('hex').slice(0, 12);
      writeFileSync(`${DIR}${file}.mp3`, result.audio);
      clips[k] = file;
      spent += result.cost ?? e.cost;
      recorded++;
      save();
      process.stdout.write(`\r${recorded} / ${order.length} речень · ${fmt(spent)} кредитів`);
    } catch (error) {
      failure ??= { text: e.text, message: error.message };
    } finally {
      reserved -= e.cost;
    }
  }
}
await Promise.all(Array.from({ length: Math.max(1, Number(args.workers)) }, worker));
save();
if (failure) {
  console.error(`\nЗупинилось на «${failure.text}»: ${failure.message}\nЗаписане збережено — повторний запуск продовжить із цього місця.`);
  process.exit(1);
}
console.log(`\nГотово: ${fmt(Object.keys(clips).length)} записів у public/audio/${lang}/, витрачено ≈ ${fmt(spent)} кредитів.`);
console.log(`Звучить записом: ${coverage(new Set(Object.keys(clips)))} того, що чує дитина.`);
