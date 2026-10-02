import { lastSession, overview } from '../../parent/report';
import type { PanelText } from '../../parent/text';
import type { Profile, ProfileProgress } from '../../store/types';
import { Card } from './Card';
import styles from './Parent.module.css';

/** Podsumowanie й Ostatnia sesja: скільки рівнів і світів пройдено, наліпки, значки, хвилини; коли й скільки грали востаннє. */
export function OverviewSection({ profile, progress, t }: { profile: Profile; progress: ProfileProgress; t: PanelText }) {
  const o = overview(progress);
  const last = lastSession(progress);
  return (
    <>
      <Card title={t.sections.summary} id="summary">
        <dl className={styles.facts}>
          <dt>{t.summary.player}</dt>
          <dd>{profile.name || t.profiles.namePlaceholder}</dd>
          <dt>{t.summary.levels}</dt>
          <dd>{o.levelsDone} / {o.levelsTotal}</dd>
          <dt>{t.summary.worlds}</dt>
          <dd>{o.worldsDone} / {o.worldsTotal}</dd>
          <dt>{t.summary.stickers}</dt>
          <dd>{o.stickers}</dd>
          <dt>{t.summary.badges}</dt>
          <dd>{o.badges}</dd>
          <dt>{t.summary.minutes}</dt>
          <dd>{o.minutes}</dd>
        </dl>
      </Card>
      <Card title={t.sections.lastSession} id="last-session">
        {last ? (
          <dl className={styles.facts}>
            <dt>{t.lastSession.day}</dt>
            <dd>{last.day}</dd>
            <dt>{t.lastSession.minutes}</dt>
            <dd>{last.minutes}</dd>
            <dt>{t.lastSession.levels}</dt>
            <dd>{last.levels}</dd>
          </dl>
        ) : (
          <p className={styles.muted}>{t.lastSession.none}</p>
        )}
      </Card>
    </>
  );
}
