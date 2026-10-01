import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Kubik } from '../characters/Kubik';
import { PupPicker } from '../characters/PupPicker';
import type { PupId } from '../characters/pups';
import { CheckButton } from '../components/ui/CheckButton';
import { Paw } from '../components/ui/Paw';
import { SpeechBubble } from '../components/ui/SpeechBubble';
import { PUPS, START_LINES } from '../speech/lines';
import { sfx } from '../speech/sfx';
import { tts } from '../speech/tts';
import { useTts } from '../speech/useTts';
import { useAppStore } from '../store';
import styles from './PupChoice.module.css';

/** Twój piesek (BRIEF §6.3, design etap1/16): голос «Wybierz swojego pieska!», 8 цуценят; дотик — коротка репліка («Kudłaty piesek!»),
 *  «Gotowe» стає активною після вибору → створюється профіль, «Witaj w drużynie!» → Mapa przygody (після того, як голос договорив). */
export function PupChoice() {
  const navigate = useNavigate();
  const addProfile = useAppStore((s) => s.addProfile);
  const selectProfile = useAppStore((s) => s.selectProfile);
  const speaking = useTts().speaking;
  const [pup, setPup] = useState<PupId | null>(null);
  const [leaving, setLeaving] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void tts.speak(START_LINES.choosePup, { interrupt: true });
    return () => {
      mounted.current = false;
      tts.cancel();
    };
  }, []);

  const pick = (id: PupId) => {
    setPup(id);
    const line = PUPS.find((p) => p.id === id)?.line;
    if (line) void tts.speak(line, { interrupt: true });
  };

  const done = async () => {
    if (!pup || leaving) return;
    setLeaving(true);
    const id = addProfile({ pup });
    if (id) selectProfile(id);
    sfx.play('correct');
    await tts.speak(START_LINES.welcome, { interrupt: true });
    if (mounted.current) navigate(id ? '/map' : '/start', { replace: true });
  };

  return (
    <main className={styles.page}>
      <div className={styles.floor} aria-hidden="true" />
      <div className={styles.guide}>
        <SpeechBubble className={styles.bubble}>
          <Paw className={styles.paw} />
          <span>?</span>
        </SpeechBubble>
        <Kubik pose="idle" talking={speaking} />
      </div>
      <div className={styles.picker}>
        <PupPicker value={pup} onPick={pick} />
      </div>
      <div className={styles.done}>
        <CheckButton disabled={pup === null || leaving} silent onClick={() => void done()} />
      </div>
    </main>
  );
}
