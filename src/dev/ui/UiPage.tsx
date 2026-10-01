import { Link } from 'react-router';
import { ButtonsSection } from './ButtonsSection';
import { FormsSection } from './FormsSection';
import { HudSection } from './HudSection';
import { TilesSection } from './TilesSection';
import { ViewportSection } from './ViewportSection';
import styles from './Ui.module.css';

/** /#/dev/ui — вітрина базових UI-компонентів зі всіма станами (етап M3). Стани pressed і focus-visible показано примусово
 *  (data-demo), справжні :active і :focus-visible працюють так само. Розміри плиток і кнопок залежать від ширини вікна. */
export function UiPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/dev">← Dev</Link>
      <h1 className={styles.h1}>UI-компоненти</h1>
      <p className={styles.lead}>
        PlayButton · IconButton · CheckButton · AnswerTile · DigitCard · HUD · ProgressBones · SpeechBubble · Overlay · Toggle · Slider ·
        AvatarButton. Звук «тика» і голос — після першого дотику. Перевір: Tab (фокус), «Mniej animacji» (prefers-reduced-motion),
        вузьке вікно / телефон.
      </p>
      <ButtonsSection />
      <TilesSection />
      <HudSection />
      <FormsSection />
      <ViewportSection />
    </main>
  );
}
