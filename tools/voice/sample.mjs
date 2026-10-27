// Проба голосу: node tools/voice/sample.mjs [--voices ID1,ID2] [--langs pl,uk,en] [--models eleven_v4,eleven_multilingual_v2] [--dry]
// Озвучує справжні репліки Klockowo (samplePhrases.mjs) кожним голосом і моделлю, кладе mp3 у voice-samples/ (не комітиться) і робить
// voice-samples/index.html — відкрийте його в браузері й порівняйте: ціле речення / те саме зі шматків / лічба. --dry лише рахує кредити.
import { mkdirSync, writeFileSync } from 'node:fs';
import { apiKey, listVoices, loadConfig, ROOT, synthesize } from './eleven.mjs';
import { SAMPLES, sampleChars } from './samplePhrases.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]] : acc), []),
);
const config = loadConfig();
const langs = String(args.langs ?? 'pl,uk,en').split(',');
const models = String(args.models ?? config.model).split(',');
const key = apiKey();

// голоси: з --voices, інакше з config.json для мови, інакше сам вибере: ваш клон першим, далі два готові жіночі голоси.
// Список голосів потрібен лише для автовибору й назв: ключ без дозволу на голоси теж працює, якщо voice_id передано вручну.
let all = [];
try {
  all = await listVoices(key);
} catch (error) {
  const manual = typeof args.voices === 'string' || Object.values(config.voices ?? {}).some(Boolean);
  if (!manual) {
    console.error(`Не вдалося отримати список голосів (${error.message}).`);
    console.error('Скопіюйте ID голосу на сайті ElevenLabs (Voices → My Voices → «⋯» → Copy voice ID) і запустіть:\n  node tools/voice/sample.mjs --voices ID');
    process.exit(1);
  }
}
function voicesFor(lang) {
  if (typeof args.voices === 'string') return args.voices.split(',').map((id) => all.find((v) => v.voice_id === id) ?? { voice_id: id, name: id });
  const fromConfig = config.voices?.[lang];
  if (fromConfig) return [all.find((v) => v.voice_id === fromConfig) ?? { voice_id: fromConfig, name: fromConfig }];
  const cloned = all.filter((v) => v.category === 'cloned' || v.category === 'professional');
  const female = all.filter((v) => v.category === 'premade' && v.labels?.gender === 'female');
  return [...cloned, ...female].slice(0, 2);
}

const plan = langs.flatMap((lang) => voicesFor(lang).flatMap((voice) => models.map((model) => ({ lang, voice, model }))));
const credits = plan.reduce((sum, p) => sum + sampleChars(p.lang), 0);
console.log(`Проба: ${plan.length} наборів (${plan.map((p) => `${p.lang}/${p.voice.name}/${p.model}`).join(', ')}), ≈ ${credits} символів (кредитів).`);
if (args.dry) process.exit(0);
if (plan.length === 0) {
  console.error('Немає голосів для проби. Запустіть node tools/voice/voices.mjs і передайте --voices ID.');
  process.exit(1);
}

const OUT = `${ROOT}voice-samples/`;
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40);
const sections = [];
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const { lang, voice, model } of plan) {
  const dir = `${slug(voice.name)}/${model}/${lang}`;
  mkdirSync(`${OUT}${dir}`, { recursive: true });
  const cfg = { ...config, model };
  const say = async (text, file, context) => {
    const mp3 = await synthesize({ key, voiceId: voice.voice_id, text, lang, config: cfg, context });
    writeFileSync(`${OUT}${dir}/${file}`, mp3);
    process.stdout.write('.');
    return `${dir}/${file}`;
  };
  const s = SAMPLES[lang];
  const items = [];
  for (const [i, text] of s.whole.entries()) items.push({ label: text, whole: await say(text, `w${i}.mp3`) });
  for (const [i, pieces] of s.pieces.entries()) {
    const text = pieces.join(' ');
    const whole = await say(text, `p${i}-whole.mp3`);
    const parts = [];
    for (const [j, piece] of pieces.entries()) {
      // шматок отримує сусідній текст речення — інтонація як у цілій фразі
      parts.push(await say(piece, `p${i}-${j}.mp3`, { previous: pieces.slice(0, j).join(' '), next: pieces.slice(j + 1).join(' ') }));
    }
    items.push({ label: text, whole, parts });
  }
  const counting = [];
  for (const [i, n] of s.counting.entries()) counting.push(await say(n, `n${i}.mp3`));
  items.push({ label: s.counting.join(', '), counting });
  sections.push({ title: `${lang.toUpperCase()} · ${voice.name} · ${model}`, items });
  console.log(` ${lang}/${voice.name}/${model} — готово`);
}

const html = `<!doctype html><html lang="uk"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Klockowo — проба голосу</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:24px;max-width:960px;color:#2d2a4a;background:#fff7e8}h2{margin-top:32px}
.item{background:#fff;border-radius:12px;padding:12px 16px;margin:8px 0;box-shadow:0 1px 3px #0002}.label{font-weight:600;margin-bottom:6px}
button{font:inherit;padding:6px 14px;margin:4px 8px 4px 0;border-radius:999px;border:2px solid #d9661c;background:#ff8a3d;color:#fff;cursor:pointer}
label{margin-left:8px}</style>
<h1>Klockowo — проба голосу</h1>
<p>«Ціле» — речення одним файлом. «Зі шматків» — те саме речення, складене з окремих файлів (так звучатимуть фрази з числами). Пауза між шматками:
<input id="gap" type="range" min="0" max="300" step="10" value="40"> <span id="gapv">40</span> мс.</p>
${sections.map((sec) => `<h2>${esc(sec.title)}</h2>${sec.items.map((it) => `<div class="item"><div class="label">${esc(it.label)}</div>
${it.whole ? `<button data-seq='${JSON.stringify([it.whole])}'>▶ ціле</button>` : ''}
${it.parts ? `<button data-seq='${JSON.stringify(it.parts)}'>▶ зі шматків</button>` : ''}
${it.counting ? `<button data-seq='${JSON.stringify(it.counting)}' data-gap="350">▶ лічба по одному</button>` : ''}</div>`).join('')}`).join('')}
<script>
const gap=document.getElementById('gap'),gapv=document.getElementById('gapv');gap.oninput=()=>gapv.textContent=gap.value;
let token=0;
async function play(list,pause){const my=++token;for(const src of list){if(my!==token)return;const a=new Audio(src);await new Promise(r=>{a.onended=r;a.onerror=r;a.play().catch(r)});await new Promise(r=>setTimeout(r,pause));}}
document.querySelectorAll('button[data-seq]').forEach(b=>b.onclick=()=>play(JSON.parse(b.dataset.seq),Number(b.dataset.gap??gap.value)));
</script></html>`;
writeFileSync(`${OUT}index.html`, html);
console.log(`\nГотово: відкрийте ${OUT}index.html у браузері.`);
