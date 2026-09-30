import { Link } from 'react-router';
import { SCREENS } from '../app/routes';
import { DEV_PAGES } from './pages';
import styles from './Dev.module.css';

/** /#/dev — перелік dev-сторінок і всіх екранів (для перевірки без проходження всього шляху). */
export function DevIndex() {
  return (
    <main className={styles.page}>
      <h1 className={styles.h1}>Klockowo · dev</h1>

      <h2 className={styles.h2}>Dev-сторінки</h2>
      <ul className={styles.list}>
        {DEV_PAGES.map((p) => (
          <li key={p.path}>
            {p.ready ? (
              <Link className={styles.item} to={p.path}>
                {p.title} <span className={styles.stage}>{p.stage}</span>
              </Link>
            ) : (
              <span className={`${styles.item} ${styles.planned}`}>
                {p.title} <span className={styles.stage}>{p.stage} · ще немає</span>
              </span>
            )}
          </li>
        ))}
      </ul>

      <h2 className={styles.h2}>Екрани (заглушки)</h2>
      <ul className={styles.list}>
        {SCREENS.map((s) => (
          <li key={s.id}>
            <Link className={styles.item} to={s.example ?? s.path}>
              {s.name} <span className={styles.stage}>{s.stage} · {s.example ?? s.path}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
