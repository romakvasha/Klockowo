import { useState } from 'react';
import { useAppStore } from '../../store';
import { DevButton, Hint, Section } from '../ui/UiSection';
import styles from './Data.module.css';

const ERRORS: Record<string, string> = {
  'not-json': 'це не JSON',
  'not-klockowo': 'це не файл Klockowo',
  'unsupported-version': 'файл зроблено новішою версією застосунку',
  invalid: 'файл пошкоджений',
  'too-many-profiles': 'уже 4 профілі — місця немає',
  'no-profile': 'немає профілю для заміни',
};

export function BackupSection() {
  const activeId = useAppStore((s) => s.activeProfileId);
  const store = useAppStore((s) => s);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  const runImport = (target: 'new' | 'replace') => {
    const result = store.importProfile(text, target === 'new' || !activeId ? { type: 'new' } : { type: 'replace', profileId: activeId });
    setMessage(result.ok ? `✔ імпортовано (профіль ${result.profileId})` : `✘ ${ERRORS[result.error] ?? result.error}`);
  };

  return (
    <Section title="Резервна копія («Kopia zapasowa»)" note="Eksportuj postępy · Importuj postępy · Wyczyść postępy — у Strefa rodzica (M22)">
      <div className={styles.profiles}>
        <DevButton onClick={() => activeId && setText(store.exportProfile(activeId) ?? '')}>⬇ експорт активного профілю</DevButton>
        <DevButton onClick={() => runImport('new')}>⬆ імпорт у новий профіль</DevButton>
        <DevButton onClick={() => runImport('replace')}>⬆ імпорт замість прогресу активного</DevButton>
      </div>
      <textarea className={styles.area} value={text} onChange={(e) => setText(e.target.value)} placeholder="Тут з'явиться JSON експорту; вставте сюди файл копії для імпорту" aria-label="JSON копії" />
      <div className={styles.result} role="status">{message}</div>
      <Hint>Копія містить профіль (ім'я, цуценя) і прогрес; налаштування пристрою (голос, гучність) не входять.</Hint>
      <details>
        <summary>Сирий стан сховища</summary>
        <pre className={styles.pre}>
          {JSON.stringify({ profiles: store.profiles, activeProfileId: store.activeProfileId, settings: store.settings, progress: store.progress }, null, 2)}
        </pre>
      </details>
    </Section>
  );
}
