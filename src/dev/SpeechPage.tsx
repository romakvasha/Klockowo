import { Link } from 'react-router';
import { LinesList } from './speech/LinesList';
import { NumberGrid } from './speech/NumberGrid';
import { PhraseLab } from './speech/PhraseLab';
import { SfxPanel } from './speech/SfxPanel';
import { VoicePanel } from './speech/VoicePanel';
import devStyles from './Dev.module.css';
import styles from './speech/Speech.module.css';

/** /#/dev/speech — голос і звуки (M2): стан, число + предмет → фраза → озвучення, усі числа 0–100, репліки, ефекти. */
export function SpeechPage() {
  return (
    <main className={devStyles.page}>
      <Link className={devStyles.back} to="/dev">← Dev</Link>
      <h1 className={devStyles.h1}>Голос і звуки</h1>
      <p className={styles.meta}>
        Claude звуку не чує — усе тут слухає власник. Спершу торкніться «Graj!» (браузер вмикає звук лише після дотику),
        потім виберіть голос і послухайте числа 0–100, рядки §9 та ефекти.
      </p>
      <div className={styles.stack}>
        <VoicePanel />
        <PhraseLab />
        <NumberGrid />
        <LinesList />
        <SfxPanel />
      </div>
    </main>
  );
}
