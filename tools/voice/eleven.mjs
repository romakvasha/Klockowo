// Спільне для скриптів голосу (tools/voice/*): ключ ElevenLabs із .env.local, запит озвучки з повторами, список голосів.
// Запускається лише на комп'ютері розробника (Node 20.12+). У сайт ключ і ці запити не потрапляють — гра програє готові mp3.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API = 'https://api.elevenlabs.io';
export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Ключ з .env.local (ELEVENLABS_API_KEY=…). Файл не комітиться (.gitignore: .env.*). optional — без ключа повертає null, а не зупиняє скрипт. */
export function apiKey({ optional = false } = {}) {
  const file = `${ROOT}.env.local`;
  if (existsSync(file)) process.loadEnvFile(file);
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key && optional) return null;
  if (!key) {
    console.error('Немає ключа. Створіть у корені проєкту файл .env.local з рядком:\n  ELEVENLABS_API_KEY=ваш_ключ\nІнструкція: docs/VOICE.md');
    process.exit(1);
  }
  return key;
}

/** Налаштування голосу (модель, формат, голоси для мов, швидкість…) — tools/voice/config.json, без секретів. */
export function loadConfig() {
  return JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Зрозуміле пояснення типових помилок API (і відповідь сервісу в дужках). */
function explain(status, body) {
  const said = ` (${body.slice(0, 200)})`;
  if (status === 402 || /quota|credits/i.test(body)) return `закінчились кредити — на акаунті чи ліміт цього ключа (API Keys → ліміт)${said}`;
  if (status === 401) return `ключ недійсний або без потрібного дозволу (Text to Speech — для озвучки; для списку голосів — дозвіл на голоси, або передайте voice_id вручну)${said}`;
  if (status === 404) return `голос не знайдено — перевірте voice_id (node tools/voice/voices.mjs)${said}`;
  return body.slice(0, 300);
}

/** Необов'язкові поля запиту — у порядку, в якому їх прибираємо, якщо модель їх не приймає (422). Мову — останньою. */
const OPTIONAL = ['apply_text_normalization', 'previous_text', 'next_text', 'language_code'];
const unsupported = new Set();

/**
 * Озвучує текст: { audio: mp3 (Buffer), cost: витрачені кредити з відповіді або null }. `context` — сусідній текст для природної
 * інтонації (previous_text / next_text): він не озвучується. Якщо модель не приймає необов'язкове поле (422), прибираємо його
 * (по одному, з попередженням) і далі не надсилаємо. 429 і 5xx — повтор із паузою.
 */
export async function synthesize({ key, voiceId, text, lang, config, context = {} }) {
  const url = `${API}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${config.output_format}`;
  const body = {
    text,
    model_id: config.model,
    language_code: lang,
    voice_settings: config.voice_settings,
    apply_text_normalization: 'off', // числа в нас уже словами — нічого не «нормалізувати»
    ...(context.previous ? { previous_text: context.previous } : {}),
    ...(context.next ? { next_text: context.next } : {}),
  };
  for (const field of unsupported) delete body[field];
  for (let attempt = 1; attempt <= 8; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const cost = Number(res.headers.get('character-cost'));
      return { audio: Buffer.from(await res.arrayBuffer()), cost: Number.isFinite(cost) && cost > 0 ? cost : null };
    }
    const detail = await res.text();
    const drop = res.status === 422 ? OPTIONAL.find((field) => field in body) : undefined;
    if (drop) {
      console.warn(`\n(модель ${config.model} не приймає «${drop}» — далі без нього)`);
      unsupported.add(drop);
      delete body[drop];
      continue;
    }
    // 401 посеред довгого запису буває тимчасовим — двічі пробуємо ще, далі зупиняємось (кредити не витрачаються)
    if (res.status === 429 || res.status >= 500 || (res.status === 401 && attempt <= 2 && !/quota|credits/i.test(detail))) {
      await sleep(1500 * attempt);
      continue;
    }
    throw new Error(`ElevenLabs ${res.status}: ${explain(res.status, detail)}`);
  }
  throw new Error('ElevenLabs: забагато повторів (сервіс перевантажений або ліміт запитів) — спробуйте пізніше');
}

/** Кредити акаунта { used, limit } або null, якщо ключ не має дозволу на дані користувача (це не заважає озвучці). */
export async function subscription(key) {
  try {
    const res = await fetch(`${API}/v1/user/subscription`, { headers: { 'xi-api-key': key } });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.character_count === 'number' ? { used: data.character_count, limit: data.character_limit } : null;
  } catch {
    return null;
  }
}

/** Голоси акаунта: [{ voice_id, name, category, labels, verified_languages }]. */
export async function listVoices(key) {
  const res = await fetch(`${API}/v1/voices`, { headers: { 'xi-api-key': key } });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${explain(res.status, await res.text())}`);
  const data = await res.json();
  return Array.isArray(data.voices) ? data.voices : [];
}
