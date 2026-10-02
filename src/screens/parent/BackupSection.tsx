import { useRef, useState } from 'react';
import { backupFileName, downloadText, readFileText } from '../../parent/backupFile';
import type { PanelText } from '../../parent/text';
import { dayKey, selectActiveProfile, useAppStore } from '../../store';
import { Card } from './Card';
import { ConfirmBox } from './ConfirmBox';
import styles from './Parent.module.css';

/** Kopia zapasowa (BRIEF §6 п.15): «Eksportuj postępy» (файл JSON), «Importuj postępy» (файл → у новий профіль або замість прогресу активного), «Wyczyść postępy» (із підтвердженням
 *  «Usunąć wszystkie postępy profilu „Ola”? Tego nie da się cofnąć.» [Anuluj] [Tak, usuń]). Копія містить профіль і прогрес; налаштування пристрою (голос, гучність) не входять. */
export function BackupSection({ t }: { t: PanelText }) {
  const profile = useAppStore(selectActiveProfile);
  const exportProfile = useAppStore((s) => s.exportProfile);
  const importProfile = useAppStore((s) => s.importProfile);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [target, setTarget] = useState<'new' | 'replace'>('new');
  const file = useRef<HTMLInputElement>(null);
  const b = t.backup;
  if (!profile) return null;

  const doExport = () => {
    const text = exportProfile(profile.id);
    if (text) downloadText(backupFileName(profile, dayKey(new Date())), text);
  };

  const doImport = async (chosen: File | undefined) => {
    if (!chosen) return;
    const text = await readFileText(chosen);
    const result = text === null ? ({ ok: false, error: 'invalid' } as const) : importProfile(text, target === 'new' ? { type: 'new' } : { type: 'replace', profileId: profile.id });
    setMessage(result.ok ? `✔ ${b.done}` : `✘ ${b.errors[result.error] ?? result.error}`);
    if (file.current) file.current.value = '';
  };

  return (
    <Card title={t.sections.backup} id="backup">
      <div className={styles.rowActions}>
        <button type="button" className={styles.langButton} onClick={doExport}>⬇ {b.export}</button>
      </div>
      <fieldset className={styles.field}>
        <legend>{b.import}</legend>
        <div className={styles.choices}>
          <label className={styles.choice}>
            <input type="radio" name="import-target" checked={target === 'new'} onChange={() => setTarget('new')} />
            <span>{b.importNew}</span>
          </label>
          <label className={styles.choice}>
            <input type="radio" name="import-target" checked={target === 'replace'} onChange={() => setTarget('replace')} />
            <span>{b.importReplace}</span>
          </label>
        </div>
        <input ref={file} type="file" accept="application/json,.json" aria-label={b.import} onChange={(e) => void doImport(e.target.files?.[0])} />
      </fieldset>
      <p className={styles.message} role="status">{message || ' '}</p>
      <div className={styles.rowActions}>
        <button type="button" className={`${styles.langButton} ${styles.danger}`} onClick={() => setConfirming(true)}>{b.clear}</button>
      </div>
      {confirming && (
        <ConfirmBox
          message={b.confirm(profile.name ?? t.profiles.namePlaceholder)}
          cancel={b.cancel}
          confirm={b.confirmYes}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            resetProgress(profile.id);
          }}
        />
      )}
    </Card>
  );
}
