import { Navigate, useNavigate } from 'react-router';
import { Kubik } from '../characters/Kubik';
import { IconButton } from '../components/ui/IconButton';
import { sessionClock } from '../session/sessionClock';
import { BUTTONS, SESSION_LINES } from '../speech/lines';
import { useScript } from '../speech/useScript';
import { useTts } from '../speech/useTts';
import { selectActiveProfile, useAppStore } from '../store';
import styles from './session/Session.module.css';

/** Koniec na dziś (BRIEF §6 п.12): сонний Kubik біля будки, «Koniec na dziś. Do zobaczenia!». З'являється лише після завершення поточного рівня; наступний урок сам не запускається —
 *  кнопка «Mapa» веде на Start (там можна вибрати гравця або знову натиснути «Graj!»). Сесія закривається: наступний рівень почне нову. */
export function EndOfDay() {
  const navigate = useNavigate();
  const profile = useAppStore(selectActiveProfile);
  const speaking = useTts().speaking;

  useScript(async ({ say, wait }) => {
    sessionClock.reset();
    await wait(500);
    await say(SESSION_LINES.endOfDay);
  });

  if (!profile) return <Navigate to="/start" replace />;
  return (
    <main className={styles.screen} data-night="true">
      <div className={styles.stage}>
        <div className={styles.house} aria-hidden="true">
          <span className={styles.roof} />
          <span className={styles.wall}>
            <span className={styles.door} />
          </span>
        </div>
        <Kubik pose="sleepy" talking={speaking} size={300} className={styles.sleepy} />
      </div>
      <IconButton icon="home" label={BUTTONS.map} variant="neutral" size={80} onClick={() => navigate('/start', { replace: true })} />
    </main>
  );
}
