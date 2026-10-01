import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Kubik } from '../characters/Kubik';
import { CubeStrip, CubeTower } from '../components/ui/Cubes';
import { Logo } from '../components/ui/Logo';
import { cssVars } from '../components/ui/cx';
import { ISLAND_URL } from '../components/map/art';
import { LABELS } from '../speech/lines';
import { BOOT_TASKS, whenFontsReady, whenVoiceSettled } from './loading/boot';
import { bootProgress, filledSlots, isBooted } from './loading/bootProgress';
import styles from './Loading.module.css';

/** Ładowanie (BRIEF §6.1, design etap1/13): Kubik складає вежу з кубиків, смужка з 10 кубиків наповнюється; далі — Start. */
export function Loading() {
  const navigate = useNavigate();
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const started = performance.now();
    let done = 0;
    let leaving: number | undefined;
    void whenFontsReady().then(() => {
      done += 1;
    });
    void whenVoiceSettled().then(() => {
      done += 1;
    });
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      setFilled(filledSlots(bootProgress(elapsed, done, BOOT_TASKS)));
      if (leaving === undefined && isBooted(elapsed, done, BOOT_TASKS)) {
        window.clearInterval(timer);
        leaving = window.setTimeout(() => navigate('/start', { replace: true }), 350); // дати останньому кубику «вискочити»
      }
    }, 60);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(leaving);
    };
  }, [navigate]);

  return (
    <main className={styles.loading}>
      <img className={`${styles.island} ${styles.left}`} src={ISLAND_URL('w1')} alt="" aria-hidden="true" />
      <img className={`${styles.island} ${styles.right}`} src={ISLAND_URL('hub')} alt="" aria-hidden="true" />
      <Logo className={styles.logo} />
      <div className={styles.builder}>
        <Kubik pose="demonstrating" style={cssVars({ '--rig-h': 'clamp(150px, 38vh, 270px)' })} />
        <CubeTower className={styles.tower} />
      </div>
      <CubeStrip className={styles.strip} filled={filled} label={LABELS.loading} />
      <div className={styles.live} aria-live="polite">{LABELS.loading}</div>
    </main>
  );
}
