import { Link } from 'react-router';
import styles from '../ui/Ui.module.css';
import { BackupSection } from './BackupSection';
import { CurriculumSection } from './CurriculumSection';
import { ProfilesSection } from './ProfilesSection';

/** /#/dev/data — профілі, прогрес і розблокування, навчальна програма, резервна копія (етап M5). */
export function DataPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/dev">← Dev</Link>
      <h1 className={styles.h1}>Дані</h1>
      <p className={styles.lead}>
        Сховище застосунку (zustand + localStorage, версія схеми 1) і навчальна програма. Додай профіль, «проходь» рівні й дивись, як відкриваються
        вузли та світи; перезавантаж сторінку — прогрес лишається; експортуй і імпортуй копію.
      </p>
      <ProfilesSection />
      <BackupSection />
      <CurriculumSection />
    </main>
  );
}
