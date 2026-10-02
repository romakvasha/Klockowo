import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { availableLanguages, useLanguage } from '../../speech/language';
import { LANG_BCP47, LANG_CODES, LANG_NATIVE_NAMES, type Lang } from '../../speech/langCode';
import { tts } from '../../speech/tts';
import { useAppStore } from '../../store';
import styles from './LanguagePicker.module.css';

/** Мова, обрана щойно: після перемикання екран перемонтовується, і новий Start вимовляє її назву вже новим голосом. */
let greet: Lang | null = null;

/** Вибір мови гри на Start: «PL», «UA», «EN» — круглі кнопки, як шестерня батьків (дорослий елемент, 64 px); обрана — заливка й галочка
 *  (не лише колір). Дотик перемикає мову гри й мову панелі батьків; голос називає мову, а якщо голосу цієї мови в браузері немає — екран «Brak głosu».
 *  Поки перекладено лише польську, перемикача не видно. */
export function LanguagePicker() {
  const navigate = useNavigate();
  const current = useLanguage();
  const update = useAppStore((s) => s.updateSettings);
  const langs = availableLanguages();

  useEffect(() => {
    if (greet !== current) return;
    greet = null;
    const { status } = tts.getState();
    if (status === 'no-voice' || status === 'unsupported') navigate('/no-voice');
    else void tts.speak(LANG_NATIVE_NAMES[current], { interrupt: true });
  }, [current, navigate]);

  if (langs.length < 2) return null;

  const choose = (lang: Lang) => {
    if (lang === current) {
      void tts.speak(LANG_NATIVE_NAMES[lang], { interrupt: true });
      return;
    }
    greet = lang;
    update({ language: lang, panelLanguage: lang });
  };

  return (
    <div className={styles.picker} role="group" aria-label={langs.map((l) => LANG_NATIVE_NAMES[l]).join(' · ')}>
      {langs.map((lang) => (
        <button
          key={lang}
          type="button"
          className={styles.chip}
          lang={LANG_BCP47[lang]}
          aria-label={LANG_NATIVE_NAMES[lang]}
          aria-pressed={lang === current}
          onClick={() => choose(lang)}
        >
          <span aria-hidden="true">{LANG_CODES[lang]}</span>
          {lang === current && (
            <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="11" />
              <path d="M6.5 12.5 L10.5 16.5 L17.5 8" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
