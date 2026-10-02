import type { ReactNode } from 'react';
import styles from './Parent.module.css';

/** Картка розділу Strefa rodzica: заголовок і вміст, спокійний дорослий стиль (текст 18 px). */
export function Card({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className={styles.card} id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 className={styles.cardTitle} id={id ? `${id}-title` : undefined}>{title}</h2>
      {children}
    </section>
  );
}
