import { difficulties, progressStats } from '../../parent/report';
import { skillName, type PanelText } from '../../parent/text';
import { dayKey } from '../../store/progress';
import type { PanelLanguage, ProfileProgress } from '../../store/types';
import { Card } from './Card';
import styles from './Parent.module.css';

/** Postępy («Poprawnie za pierwszym razem» %, «Użyte podpowiedzi», «Minuty dziennie» за 7 днів) і Trudności («Myli 13 i 30», «Myli 26 i 62», «Liczy wszystko od początku…», навички з прапорцем). */
export function ProgressSection({ progress, t, lang }: { progress: ProfileProgress; t: PanelText; lang: PanelLanguage }) {
  const stats = progressStats(progress, dayKey(new Date()));
  const list = difficulties(progress);
  const maxMinutes = Math.max(1, ...stats.minutes.map((m) => m.minutes));
  return (
    <>
      <Card title={t.sections.progress} id="progress">
        <dl className={styles.facts}>
          <dt>{t.progress.firstTry}</dt>
          <dd>{stats.firstTryPct === null ? t.progress.noData : `${stats.firstTryPct}%`}</dd>
          <dt>{t.progress.hints}</dt>
          <dd>{stats.hints}</dd>
        </dl>
        <h3 className={styles.worldTitle}>{t.progress.minutesPerDay}</h3>
        <ol className={styles.bars} aria-label={t.progress.minutesPerDay}>
          {stats.minutes.map((m) => (
            <li key={m.day} className={styles.barItem}>
              <span className={styles.bar} style={{ height: `${Math.max(4, (m.minutes / maxMinutes) * 72)}px` }} aria-hidden="true" />
              <span className={styles.barValue}>{m.minutes}</span>
              <span className={styles.barDay}>{m.day.slice(5)}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card title={t.sections.difficulties} id="difficulties">
        {list.length === 0 ? (
          <p className={styles.muted}>{t.difficulties.none}</p>
        ) : (
          <ul className={styles.plain}>
            {list.map((d, i) => (
              <li key={i}>
                {d.kind === 'confuse' && t.difficulties.confuses(d.a, d.b)}
                {d.kind === 'countsAll' && t.difficulties.countsAll}
                {d.kind === 'flagged' && `${skillName(d.skill, lang)} — ${t.difficulties.flagged}`}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
