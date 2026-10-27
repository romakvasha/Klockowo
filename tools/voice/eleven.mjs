// Спільне для скриптів голосу (tools/voice/*): ключ ElevenLabs із .env.local, запит озвучки з повторами, список голосів.
// Запускається лише на комп'ютері розробника (Node 20.12+). У сайт ключ і ці запити не потрапляють — гра програє готові mp3.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API = 'https://api.elevenlabs.io';
export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Ключ з .env.local (ELEVENLABS_API_KEY=…). Файл не комітиться (.gitignore: .env.*). */
export function apiKey() {
  const file = `${ROOT}.env.local`;
  if (existsSync(file)) process.loadEnvFile(file);
  const key = process.env.ELEVENLABS_API_KEY?.trim();
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

/** Зрозуміле пояснення типових помилок API. */
function explain(status, body) {
  if (status === 401) return 'ключ недійсний або без потрібного дозволу (Text to Speech — для озвучки; для списку голосів — дозвіл на голоси, або передайте voice_id вручну)';
  if (status === 402 || /quota|credits/i.test(body)) return 'закінчились кредити на акаунті ElevenLabs';
  if (status === 404) return 'голос не знайдено — перевірте voice_id (node tools/voice/voices.mjs)';
  return body.slice(0, 300);
}

/**
 * Озвучує текст і повертає mp3 (Buffer). `context` — сусідній текст для природної інтонації шматка (previous_text / next_text):
 * він не озвучується. Якщо модель не приймає мову чи контекст (422), пробуємо ще раз без них. 429 і 5xx — повтор із паузою.
 */
export async function synthesize({ key, voiceId, text, lang, config, context = {} }) {
  const url = `${API}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${config.output_format}`;
  let body = {
    text,
    model_id: config.model,
    language_code: lang,
    voice_settings: config.voice_settings,
    apply_text_normalization: 'off', // числа в нас уже словами — нічого не «нормалізувати»
    ...(context.previous ? { previous_text: context.previous } : {}),
    ...(context.next ? { next_text: context.next } : {}),
  };
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const detail = await res.text();
    if (res.status === 422 && (body.language_code || body.previous_text || body.next_text || body.apply_text_normalization)) {
      // модель не підтримує якесь із необов'язкових полів — без них
      const { language_code: _l, previous_text: _p, next_text: _n, apply_text_normalization: _a, ...rest } = body;
      body = rest;
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * attempt);
      continue;
    }
    throw new Error(`ElevenLabs ${res.status}: ${explain(res.status, detail)}`);
  }
  throw new Error('ElevenLabs: забагато повторів (сервіс перевантажений або ліміт запитів) — спробуйте пізніше');
}

/** Голоси акаунта: [{ voice_id, name, category, labels, verified_languages }]. */
export async function listVoices(key) {
  const res = await fetch(`${API}/v1/voices`, { headers: { 'xi-api-key': key } });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${explain(res.status, await res.text())}`);
  const data = await res.json();
  return Array.isArray(data.voices) ? data.voices : [];
}
