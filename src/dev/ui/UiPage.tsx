import { Link } from 'react-router';
import { BricksSection } from './BricksSection';
import { ButtonsSection } from './ButtonsSection';
import { FormsSection } from './FormsSection';
import { HudSection } from './HudSection';
import { TilesSection } from './TilesSection';
import { ViewportSection } from './ViewportSection';
import styles from './Ui.module.css';

/** /#/dev/ui — вітрина базових UI-компонентів зі всіма станами (M3; вигляд v2 — глянцеві цеглинки, D2b). Стани pressed і focus-visible
 *  показано примусово (data-demo), справжні :active і :focus-visible працюють так само. Розміри плиток і кнопок залежать від ширини вікна. */
export function UiPage() {
  return (
    <div className={styles.backdrop}>
    <main className={styles.page}>
      <Link className={styles.back} to="/dev">← Dev</Link>
      <h1 className={styles.h1}>UI-компоненти · v2</h1>
      <p className={styles.lead}>
        Глянцеві цеглинки за полотном D1 (docs/DESIGN_V2.md §4): палітра, іконки, логотип, PlayButton · IconButton · CheckButton · AnswerTile ·
        DigitCard · HUD · ProgressBones · SpeechBubble · Overlay. Звук «тика» і голос — після першого дотику. Перевір: Tab (фокус),
        «Mniej animacji» (prefers-reduced-motion), вузьке вікно / телефон.
      </p>
      <BricksSection />
      <ButtonsSection />
      <TilesSection />
      <HudSection />
      <FormsSection />
      <ViewportSection />
    </main>
    </div>
  );
}
