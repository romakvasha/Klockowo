import { WORLD_KEYS } from '../../curriculum/worlds';
import { skillRows } from '../../parent/report';
import { skillName, type PanelText } from '../../parent/text';
import type { PanelLanguage, ProfileProgress } from '../../store/types';
import { Card } from './Card';
import styles from './Parent.module.css';

const GLYPH = { new: '○', learning: '◐', mastered: '●', review: '↻' } as const;

/** Mapa umiejętności: 29 навичок за світами; стан кожної — Nowa / W trakcie nauki / Opanowana / Do powtórki (значок + текст, не лише колір). */
export function SkillsSection({ progress, t, lang }: { progress: ProfileProgress; t: PanelText; lang: PanelLanguage }) {
  const rows = skillRows(progress);
  return (
    <Card title={t.sections.skills} id="skills">
      {WORLD_KEYS.map((w) => (
        <div key={w} className={styles.worldBlock}>
          <h3 className={styles.worldTitle}>{w.toUpperCase()}</h3>
          <ul className={styles.skillList}>
            {rows.filter((r) => r.world === w).map((r) => (
              <li key={r.id} className={styles.skill} data-state={r.state}>
                <span className={styles.badge} data-state={r.state}>
                  <span aria-hidden="true">{GLYPH[r.state]}</span> {t.skillStates[r.state]}
                </span>
                <span>{skillName(r.id, lang)}{r.star ? ` (${t.skillStar})` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}
