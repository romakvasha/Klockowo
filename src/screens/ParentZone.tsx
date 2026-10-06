import { Navigate, useNavigate } from 'react-router';
import { parentAccess } from '../parent/access';
import { panelText } from '../parent/text';
import { LANG_NATIVE_NAMES, LANGS } from '../speech/langCode';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import { BackupSection } from './parent/BackupSection';
import { OverviewSection } from './parent/OverviewSection';
import { ProfilesSection } from './parent/ProfilesSection';
import { ProgressSection } from './parent/ProgressSection';
import { SettingsSection } from './parent/SettingsSection';
import { SkillsSection } from './parent/SkillsSection';
import styles from './parent/Parent.module.css';

/** Strefa rodzica (BRIEF §6 п.15): спокійний дорослий стиль (текст 18 px, кнопки від 44 px), перемикач «Język panelu: Polski / Українська / English». Сюди веде лише Bramka rodzica (дозвіл на 15 хв
 *  у sessionStorage). Розділи: Podsumowanie, Ostatnia sesja, Mapa umiejętności, Postępy, Trudności, Ustawienia, Profile, Kopia zapasowa. */
export function ParentZone() {
  const navigate = useNavigate();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);
  const lang = useAppStore((s) => s.settings.panelLanguage);
  const update = useAppStore((s) => s.updateSettings);
  const t = panelText(lang);

  if (!parentAccess.isGranted()) return <Navigate to="/parent-gate" replace />;
  if (!profile) return <Navigate to="/start" replace />;

  return (
    <main className={styles.zone} lang={lang}>
      <header className={styles.header}>
        <h1 className={styles.zoneTitle}>{t.title}</h1>
        <div className={styles.lang} role="group" aria-label={t.language}>
          <span>{t.language}:</span>
          {LANGS.map((code) => (
            <button key={code} type="button" lang={code} aria-pressed={lang === code} className={styles.langButton} onClick={() => update({ panelLanguage: code })}>
              {LANG_NATIVE_NAMES[code]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.exit}
          onClick={() => {
            parentAccess.revoke();
            navigate('/map', { replace: true });
          }}
        >
          {t.exit}
        </button>
      </header>
      <OverviewSection profile={profile} progress={progress} t={t} />
      <SkillsSection progress={progress} t={t} lang={lang} />
      <ProgressSection progress={progress} t={t} lang={lang} />
      <SettingsSection t={t} />
      <ProfilesSection t={t} />
      <BackupSection t={t} />
    </main>
  );
}
