import type { ReactNode } from 'react';
import styles from './Ui.module.css';

/** Секція вітрини: біла картка із заголовком (Fredoka) і приміткою. */
export function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        {title}
        {note && <span className={styles.note}>{note}</span>}
      </h2>
      {children}
    </section>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

/** Компонент у певному стані з підписом (як на бордах дизайну). */
export function Cell({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className={styles.cell}>
      {children}
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

export function Sub({ children }: { children: ReactNode }) {
  return <h3 className={styles.sub}>{children}</h3>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}

/** Службова кнопка дорослого для демо (не компонент дитини). */
export function DevButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={styles.devButton} onClick={onClick}>
      {children}
    </button>
  );
}
