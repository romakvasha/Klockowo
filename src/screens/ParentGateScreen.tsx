import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import { freshSeed, createRng } from '../games/engine/rng';
import { parentAccess } from '../parent/access';
import { INITIAL_GATE, gateReducer, makeChallenge, type GateKey } from '../parent/gate';
import { panelText } from '../parent/text';
import { selectActiveProfile, useAppStore } from '../store';
import styles from './parent/Parent.module.css';

/** Bramka rodzica (BRIEF §6 п.14): сюди ведуть утримання шестерні 3 с. Письмове питання без озвучення («Wpisz wynik: siedem razy osiem»), цифрова клавіатура, «Wejdź». Приклад щоразу інший.
 *  Помилка — «Niepoprawny wynik. Spróbuj ponownie.»; після 3 помилок — назад до дитини. Текст — мовою панелі. */
export function ParentGateScreen() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.settings.panelLanguage);
  const profile = useAppStore(selectActiveProfile);
  const t = panelText(lang);
  const challenge = useMemo(() => makeChallenge(createRng(freshSeed())), []);
  const [state, press] = useReducer((s: typeof INITIAL_GATE, key: GateKey) => gateReducer(s, key, challenge), INITIAL_GATE);
  const home = profile ? '/map' : '/start';

  useEffect(() => {
    if (state.status === 'open') {
      parentAccess.grant();
      navigate('/parent', { replace: true });
    }
    if (state.status === 'locked') {
      const timer = window.setTimeout(() => navigate(home, { replace: true }), 1400);
      return () => window.clearTimeout(timer);
    }
  }, [state.status, navigate, home]);

  return (
    <main className={styles.gate}>
      <p className={styles.question} lang={lang}>{t.gateInstruction(challenge.a, challenge.b)}</p>
      <output className={styles.answer} aria-live="polite" data-status={state.status}>{state.input || ' '}</output>
      <p className={styles.message} role="status">{state.status === 'wrong' || state.status === 'locked' ? t.gateWrong : ' '}</p>
      <NumericKeypad
        onDigit={(digit) => press({ type: 'digit', digit })}
        onBack={() => press({ type: 'back' })}
        onSubmit={() => press({ type: 'submit' })}
        backLabel={t.gateBackspace}
        submitLabel={t.gateEnter}
        disabled={state.status === 'locked' || state.status === 'open'}
      />
      <button type="button" className={styles.link} onClick={() => navigate(home, { replace: true })}>
        {t.gateBack}
      </button>
    </main>
  );
}
