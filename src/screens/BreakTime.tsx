import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Kubik } from '../characters/Kubik';
import type { KubikPose } from '../characters/poses';
import { Digits } from '../components/ui/Digits';
import { IconButton } from '../components/ui/IconButton';
import { afterBreakPath, afterBreakState, breakSteps, repPose } from '../session/breakPlan';
import { sessionClock } from '../session/sessionClock';
import { BUTTONS, SESSION_LINES } from '../speech/lines';
import { sfx } from '../speech/sfx';
import { useScript } from '../speech/useScript';
import { useTts } from '../speech/useTts';
import { selectActiveProfile, useAppStore } from '../store';
import styles from './session/Session.module.css';

/** Czas na przerwę! (BRIEF §6 п.11): бадьорий Kubik показує 3 рухові вправи з лічбою — «Podskocz dziesięć razy!», «Klaśnij pięć razy!», «Tupnij osiem razy!» (пози «стрибок», «плескання»,
 *  «тупання»; між вправами — encouraging) і лічить повтори вголос, поки на екрані з'являється число. «Dalej» (можна й раніше) веде туди, куди йшла дитина (`state.next`), або на мапу. */
export function BreakTime() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useAppStore(selectActiveProfile);
  const speaking = useTts().speaking;
  const [pose, setPose] = useState<KubikPose>('waving');
  const [rep, setRep] = useState(0);
  const [done, setDone] = useState(false);
  const to = afterBreakPath(location.state);

  useScript(async ({ say, wait }) => {
    sessionClock.markBreak();
    await wait(300);
    await say(SESSION_LINES.breakTime);
    for (const step of breakSteps()) {
      setRep(0);
      setPose('encouraging');
      await say(step.line);
      for (let k = 1; k <= step.n; k++) {
        setRep(k);
        setPose(repPose(step, k));
        sfx.play('pop');
        await say(step.count(k));
        await wait(260);
      }
      setRep(0);
      setPose('encouraging');
      await wait(500);
    }
    setPose('celebrating');
    setDone(true);
    sfx.play('correct');
  });

  if (!profile) return <Navigate to="/start" replace />;
  return (
    <main className={styles.screen}>
      <div className={styles.stage}>
        <Kubik pose={pose} talking={speaking} size={320} />
        <span className={styles.count} aria-hidden="true">{rep > 0 && <Digits value={rep} style={{ height: 120 }} />}</span>
      </div>
      <IconButton
        icon="next"
        label={BUTTONS.next}
        variant="primary"
        size={88}
        pulse={done}
        onClick={() => navigate(to, { replace: true, state: afterBreakState(location.state) })}
      />
    </main>
  );
}
