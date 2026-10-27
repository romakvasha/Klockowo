// node tools/voice/voices.mjs — голоси вашого акаунта ElevenLabs: назва, voice_id, тип (premade — готовий, cloned — ваш клон,
// professional — професійний клон), стать/вік/акцент і мови, перевірені для голосу. Кредитів не витрачає.
import { apiKey, listVoices } from './eleven.mjs';

const key = apiKey();
const voices = await listVoices(key);
if (voices.length === 0) {
  console.log('У акаунті немає голосів. Додайте голос із бібліотеки (Voices → Library → Add) або клонуйте свій (Voices → Add voice).');
  process.exit(0);
}
const order = { cloned: 0, professional: 1, generated: 2, premade: 3 };
voices.sort((a, b) => (order[a.category] ?? 9) - (order[b.category] ?? 9) || a.name.localeCompare(b.name));
for (const v of voices) {
  const l = v.labels ?? {};
  const langs = (v.verified_languages ?? []).map((x) => x.language).filter(Boolean);
  const about = [l.gender, l.age, l.accent, l.use_case ?? l.description].filter(Boolean).join(', ');
  console.log(`${v.name.padEnd(28)} ${v.voice_id}  [${v.category}] ${about}${langs.length ? `  мови: ${[...new Set(langs)].join(', ')}` : ''}`);
}
console.log('\nСкопіюйте voice_id потрібного голосу в tools/voice/config.json → "voices" (окремо для pl, uk, en) або передайте в пробу:');
console.log('  node tools/voice/sample.mjs --voices ID1,ID2');
