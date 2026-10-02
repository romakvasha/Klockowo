import { useNavigate } from 'react-router';
import { Kubik } from '../characters/Kubik';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { markNoVoiceSeen } from '../session/noVoice';
import { BUTTONS, NO_VOICE_MESSAGE } from '../speech/lines';
import styles from './session/Session.module.css';

/** Brak polskiego głosu (BRIEF §6 п.16): Kubik із перекресленим динаміком й повідомлення для ДОРОСЛОГО (дитина ще не читає): «Brak polskiego głosu w tej przeglądarce. Zobacz: Strefa rodzica →
 *  Ustawienia → Głos.». Звук не озвучується (голосу нема). «Dalej» веде на Start — гра працює й без голосу (інструкції лишаються на екрані як картинки й цифри). */
export function NoVoice() {
  const navigate = useNavigate();
  return (
    <main className={styles.screen}>
      <div className={styles.stage}>
        <Kubik pose="thinking" size={260} />
        <Icon name="speaker-off" className={styles.muted} aria-hidden="true" />
      </div>
      <p className={styles.adult} lang="pl">{NO_VOICE_MESSAGE}</p>
      <IconButton
        icon="next"
        label={BUTTONS.next}
        variant="primary"
        size={88}
        onClick={() => {
          markNoVoiceSeen();
          navigate('/start', { replace: true });
        }}
      />
    </main>
  );
}
