import { clipSlug } from '../../speech/clips';
import { say } from './log';
import styles from './Speech.module.css';

interface Props {
  text: string;
  /** службовий підпис українською */
  label?: string;
  /** позначка джерела, напр. «§9» */
  mark?: string;
  rate?: number;
}

/** Рядок: кнопка ▶ (озвучити), польська фраза, підпис і slug файла-заміни для public/audio/. */
export function PhraseRow({ text, label, mark, rate }: Props) {
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.play}
        onClick={() => void say(text, rate ? { rate } : undefined)}
        aria-label={`Озвучити: ${text}`}
      >
        ▶
      </button>
      <span className={styles.rowBody}>
        <span className={styles.phrase} lang="pl">{text}</span>
        <span className={styles.meta}>
          {label}
          {mark && <span className={styles.mark}>{mark}</span>}
          <span className={styles.slug}>{clipSlug(text)}</span>
        </span>
      </span>
    </li>
  );
}
