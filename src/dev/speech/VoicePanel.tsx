import { useEffect } from 'react';
import { BUTTONS, MISSION_LINES } from '../../speech/lines';
import { sfx } from '../../speech/sfx';
import { tts, type TtsStatus } from '../../speech/tts';
import { useTts } from '../../speech/useTts';
import { say, useSpeechLog } from './log';
import styles from './Speech.module.css';

const STATUS_TEXT: Record<TtsStatus, string> = {
  unsupported: 'Браузер не вміє озвучувати (немає Web Speech API).',
  loading: 'Голоси ще завантажуються…',
  'no-voice': 'Польського голосу в браузері немає — дитина побачить екран NoVoice (M21).',
  ready: 'Польський голос знайдено — можна слухати.',
};

// Вибір голосу й темпу пам'ятаємо лише для зручності на цій сторінці (справжні налаштування — M5/M22).
const STORE_KEY = 'klockowo.dev.speech';
interface Saved { voiceURI?: string | null; rate?: number; volume?: number }

function readSaved(): Saved {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as Saved;
  } catch {
    return {};
  }
}
function writeSaved(patch: Saved): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...readSaved(), ...patch }));
  } catch {
    /* сховище недоступне — не критично */
  }
}

export function VoicePanel() {
  const state = useTts();
  const log = useSpeechLog();

  useEffect(() => {
    const saved = readSaved();
    if (saved.voiceURI !== undefined) tts.setVoiceURI(saved.voiceURI);
    if (saved.rate !== undefined) tts.setRate(saved.rate);
    if (saved.volume !== undefined) tts.setVolume(saved.volume);
  }, []);

  return (
    <section className={styles.panel} aria-labelledby="voice-h">
      <h2 id="voice-h" className={styles.h2}>Голос</h2>

      <p className={`${styles.status} ${state.status === 'ready' ? styles.ok : styles.warn}`} role="status">
        {STATUS_TEXT[state.status]} <span className={styles.meta}>Браузер бачить голосів: {state.voiceCount}</span>
      </p>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            tts.unlock();
            sfx.unlock();
            sfx.play('tap');
          }}
        >
          {BUTTONS.play}
        </button>
        <span className={state.unlocked ? styles.ok : styles.warn}>
          Звук {state.unlocked ? 'розблоковано ✓' : 'заблоковано — торкніться будь-де'}
        </span>
        <button type="button" className={styles.btnGhost} onClick={() => void say(MISSION_LINES.slogan)}>
          ▶ <span lang="pl">{MISSION_LINES.slogan}</span>
        </button>
        <button type="button" className={styles.btnGhost} onClick={() => tts.cancel()}>■ Стоп</button>
      </div>

      <label className={styles.field}>
        <span>Голос</span>
        <select
          value={state.voiceURI ?? ''}
          onChange={(e) => {
            const uri = e.target.value || null;
            tts.setVoiceURI(uri);
            writeSaved({ voiceURI: uri });
          }}
        >
          <option value="">Авто (найкращий польський)</option>
          {state.voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} · {v.lang} · {v.localService ? 'локальний' : 'онлайн'}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Темп: {state.rate.toFixed(2)}</span>
        <input
          type="range" min={0.5} max={1.3} step={0.05} value={state.rate}
          onChange={(e) => {
            tts.setRate(Number(e.target.value));
            writeSaved({ rate: Number(e.target.value) });
          }}
        />
      </label>

      <label className={styles.field}>
        <span>Гучність голосу: {Math.round(state.volume * 100)} %</span>
        <input
          type="range" min={0} max={1} step={0.05} value={state.volume}
          onChange={(e) => {
            tts.setVolume(Number(e.target.value));
            writeSaved({ volume: Number(e.target.value) });
          }}
        />
      </label>

      <div>
        <h3 className={styles.h3}>Останні озвучення</h3>
        {log.length === 0 ? (
          <p className={styles.meta}>Ще нічого не озвучували. «spoken» = справді договорив, «skipped» = тихо пропущено (немає голосу чи дотику).</p>
        ) : (
          <ol className={styles.log}>
            {log.map((e) => (
              <li key={e.id}>
                <span className={e.result === 'spoken' ? styles.ok : styles.warn}>{e.result}</span> · {e.ms} мс ·{' '}
                <span lang="pl">{e.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
