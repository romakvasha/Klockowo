import { useNavigate } from 'react-router';
import { Kubik } from '../characters/Kubik';
import { IconButton } from '../components/ui/IconButton';
import { BUTTONS, ERROR_LINES } from '../speech/lines';
import { useScript } from '../speech/useScript';
import { useTts } from '../speech/useTts';
import styles from './session/Session.module.css';

/** Błąd (BRIEF §6 п.16): здивований Kubik, голос «Ups! Spróbujmy jeszcze raz.», кнопка «Jeszcze raz» із круговою стрілкою. Без тексту, цифр і кодів — дитина нічого не читає. Як маршрут
 *  /error кнопка веде на мапу; як запасний екран (AppErrorBoundary) — скидає помилку й повертає на мапу. */
export function ErrorScreen({ onRetry }: { onRetry?: () => void }) {
  const navigate = useNavigate();
  const speaking = useTts().speaking;
  useScript(async ({ say, wait }) => {
    await wait(300);
    await say(ERROR_LINES.oops);
  });
  return (
    <main className={styles.screen}>
      <div className={styles.stage}>
        <Kubik pose="surprised" talking={speaking} size={300} />
      </div>
      <IconButton icon="retry" label={BUTTONS.again} variant="retry" size={88} onClick={onRetry ?? (() => navigate('/map', { replace: true }))} />
    </main>
  );
}
