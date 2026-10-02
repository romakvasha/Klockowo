import { Link } from 'react-router';
import styles from '../ui/Ui.module.css';
import { SCHEMA_VERSION } from '../../store';
import { AdaptivitySection } from './AdaptivitySection';
import { BackupSection } from './BackupSection';
import { CurriculumSection } from './CurriculumSection';
import { ProfilesSection } from './ProfilesSection';

/** /#/dev/data — профілі, прогрес і розблокування, навчальна програма, резервна копія (етапи M5, M12). */
export function DataPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/dev">← Dev</Link>
      <h1 className={styles.h1}>Дані</h1>
      <p className={styles.lead}>
        Сховище застосунку (zustand + localStorage, версія схеми {SCHEMA_VERSION}) і навчальна програма. Додай профіль, «проходь» рівні й дивись, як відкриваються
        вузли та світи; перезавантаж сторінку — прогрес лишається; експортуй і імпортуй копію.
      </p>
      <ProfilesSection />
      <AdaptivitySection />
      <BackupSection />
      <CurriculumSection />
    </main>
  );
}
