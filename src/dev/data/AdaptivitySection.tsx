import { useState } from 'react';
import { chooseSwaps, dueSkills, levelSpecs, reviewLevelIds } from '../../curriculum/review';
import { currentWorldId, nextLevelId } from '../../curriculum/progression';
import { findLevel } from '../../curriculum/levels';
import { SKILL_IDS } from '../../curriculum/skills';
import type { SkillId } from '../../curriculum/types';
import { resolveGame } from '../../games/registry';
import { SKILL_NAMES } from '../../speech/lines';
import { appStore, dayKey, selectActiveProgress, skillState, useAppStore, type SkillRecord } from '../../store';
import uiStyles from '../ui/Ui.module.css';
import { Hint, Section } from '../ui/UiSection';
import styles from './Data.module.css';

/** Службові зміни навички прямо в сторі (лише dev): зсунути повторення на сьогодні чи позначити «Do powtórki». */
function patchSkills(change: (id: SkillId, r: SkillRecord) => SkillRecord) {
  appStore.setState((s) => {
    const id = s.activeProfileId;
    const p = id ? s.progress[id] : undefined;
    if (!id || !p) return {};
    const skills = Object.fromEntries(Object.entries(p.skills).map(([k, r]) => [k, change(k as SkillId, r)]));
    return { progress: { ...s.progress, [id]: { ...p, skills } } };
  });
}

/** /#/dev/data → «Адаптивність і повторення» (M12): крок навичок, розклад повторень, черга й те, що стане в наступний рівень. */
export function AdaptivitySection() {
  const progress = useAppStore(selectActiveProgress);
  const hasProfile = useAppStore((s) => s.activeProfileId !== null);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const [skill, setSkill] = useState<SkillId>('count-line');
  const today = dayKey(new Date());

  const answer = (ok: boolean, n: number, day = today) => {
    for (let i = 0; i < n; i++) {
      recordAnswer({ t: Date.now(), day, skill, game: 'policzIDotknij', level: null, firstTry: ok, attempts: ok ? 1 : 2, hints: 0, together: false, ms: 0 });
    }
  };

  const world = currentWorldId(progress);
  const next = world === 'hub' ? null : nextLevelId(progress, world);
  const nextLevel = next ? findLevel(next) : undefined;
  const queue = nextLevel ? chooseSwaps(nextLevel, progress, today, (spec) => resolveGame(spec.game) !== undefined) : null;
  const rows = SKILL_IDS.filter((id) => progress.skills[id]);

  return (
    <Section title="Адаптивність і повторення" note="M12 · PEDAGOGY §3: крок −2…2, повторення 1/3/7/14/30 днів, «Do powtórki», черга «разом»">
      {!hasProfile && <Hint>Спершу додайте профіль вище.</Hint>}
      <div className={uiStyles.controls}>
        <select value={skill} onChange={(e) => setSkill(e.target.value as SkillId)}>
          {SKILL_IDS.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
        <button type="button" className={uiStyles.devButton} onClick={() => answer(true, 5)}>✓ ×5 з першого разу</button>
        <button type="button" className={uiStyles.devButton} onClick={() => answer(false, 2)}>✗ ×2 помилки</button>
        <button type="button" className={uiStyles.devButton} onClick={() => answer(true, 10, '2000-01-01')}>✓ ×10 «учора» (для опанування)</button>
        <button type="button" className={uiStyles.devButton} onClick={() => patchSkills((_, r) => (r.stage > 0 && !r.needsReview ? { ...r, due: today } : r))}>
          ⏰ усі повторення — сьогодні
        </button>
        <button type="button" className={uiStyles.devButton} onClick={() => patchSkills((id, r) => (id === skill ? { ...r, needsReview: true, due: null } : r))}>
          ↺ навичка → «Do powtórki»
        </button>
      </div>
      <div className={styles.wide}>
        <table className={styles.table}>
          <thead>
            <tr><th>Навичка</th><th>Стан</th><th>Крок</th><th>Поспіль / після зміни</th><th>Труднощі</th><th>Повторення</th></tr>
          </thead>
          <tbody>
            {rows.map((id) => {
              const r = progress.skills[id]!;
              return (
                <tr key={id}>
                  <td title={SKILL_NAMES[id]}>{id}</td>
                  <td>{skillState(r)}</td>
                  <td>{r.step > 0 ? `+${r.step}` : r.step}</td>
                  <td>{r.streak} / {r.sinceStep}</td>
                  <td>{['—', 'інша гра', 'інша гра + ⚑'][r.struggle]}{r.flagged ? ' · ⚑ батькам' : ''}</td>
                  <td>{r.needsReview ? 'Do powtórki' : r.stage > 0 ? `ступінь ${r.stage}, ${r.due}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Hint>
        Сьогодні до повторення: {dueSkills(progress.skills, today).join(', ') || '—'}. Вузли «Do powtórki»: {[...reviewLevelIds(progress)].join(', ') || '—'}.
        Черга «разом»: {progress.retry.map((r) => `${r.level}#${r.index + 1}`).join(', ') || '—'}.
      </Hint>
      {nextLevel && queue && (
        <Hint>
          Наступний рівень {nextLevel.id}{queue.warmup ? ' (розминка — перший рівень дня)' : ''}:{' '}
          {levelSpecs(nextLevel, queue).map((s) => `${s.spec.game}${s.kind === 'own' ? '' : ` ←${s.kind} ${s.ref.level}`}`).join(' · ')}
        </Hint>
      )}
    </Section>
  );
}
