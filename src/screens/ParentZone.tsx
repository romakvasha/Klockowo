import { Navigate, useNavigate } from 'react-router';
import { parentAccess } from '../parent/access';
import { panelText } from '../parent/text';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import { OverviewSection } from './parent/OverviewSection';
import { ProgressSection } from './parent/ProgressSection';
import { SettingsSection } from './parent/SettingsSection';
import { SkillsSection } from './parent/SkillsSection';
import styles from './parent/Parent.module.css';

/** Strefa rodzica (BRIEF §6 п.15): спокійний дорослий стиль (текст 18 px, кнопки від 44 px), перемикач «Język panelu: Polski / Українська». Сюди веде лише Bramka rodzica (дозвіл на 15 хв
 *  у sessionStorage). Розділи: Podsumowanie, Ostatnia sesja, Mapa umiejętności, Postępy, Trudności, Ustawienia; профілі й копія — наступним етапом. */
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
    <main className={styles.zone} lang={lang === 'uk' ? 'uk' : 'pl'}>
      <header className={styles.header}>
        <h1 className={styles.zoneTitle}>{t.title}</h1>
        <div className={styles.lang} role="group" aria-label={t.language}>
          <span>{t.language}:</span>
          <button type="button" aria-pressed={lang === 'pl'} className={styles.langButton} onClick={() => update({ panelLanguage: 'pl' })}>Polski</button>
          <button type="button" aria-pressed={lang === 'uk'} className={styles.langButton} onClick={() => update({ panelLanguage: 'uk' })}>Українська</button>
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
    </main>
  );
}
