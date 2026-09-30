import { Link } from 'react-router';
import { screenById, type ScreenId } from '../app/routes';
import styles from './ScreenStub.module.css';

/** Тимчасова заглушка екрана — кожен етап M6–M22 замінює її справжнім екраном. */
export function ScreenStub({ id }: { id: ScreenId }) {
  const screen = screenById(id);
  return (
    <main className={styles.stub}>
      <h1 className={styles.title}>{screen.name}</h1>
      <p className={styles.note}>
        Заглушка · етап {screen.stage} · BRIEF {screen.brief}
      </p>
      <Link className={styles.link} to="/dev">
        Dev
      </Link>
    </main>
  );
}
