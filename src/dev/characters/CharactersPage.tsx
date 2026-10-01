import { Link } from 'react-router';
import styles from '../ui/Ui.module.css';
import { KubikSection } from './KubikSection';
import { PupsSection, StageSection } from './PupsStageSection';
import { TeamSection } from './TeamSection';

/** /#/dev/characters — Kubik (17 поз, аксесуари, рот A/O/E), команда з транспортом і силуетами, 8 цуценят, MascotStage (етап M4). */
export function CharactersPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/dev">← Dev</Link>
      <h1 className={styles.h1}>Персонажі</h1>
      <p className={styles.lead}>
        Kubik, команда (Łatka, Pufka, Tofik, Iskra), 8 цуценят для вибору, MascotStage. Рух — чистим CSS: «Mniej animacji» (prefers-reduced-motion)
        вимикає дихання, кліпання, хвіст і стрибок — лишається зміна пози.
      </p>
      <KubikSection />
      <StageSection />
      <TeamSection />
      <PupsSection />
    </main>
  );
}
