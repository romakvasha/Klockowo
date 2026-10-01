import type { TaskSpec } from '../../curriculum/types';
import { W1_LEVELS } from '../../curriculum/levels/w1';
import { SKILLS } from '../../curriculum/skills';
import { WORLDS } from '../../curriculum/worlds';
import { GAME_TITLES, SKILL_NAMES, WORLD_NAMES } from '../../speech/lines';
import { Hint, Section } from '../ui/UiSection';
import styles from './Data.module.css';

const range = (r: readonly [number, number]) => (r[0] === r[1] ? String(r[0]) : `${r[0]}–${r[1]}`);

/** Короткий опис завдання для таблиці: гра + головні параметри. */
function describeTask(t: TaskSpec): string {
  const tag = t.review ? ' ↺' : '';
  switch (t.game) {
    case 'policzIDotknij': return `Policz ${range(t.count)} ${t.arrangement}${t.look === 'similar' ? ' (схожі)' : ''}${tag}`;
    case 'blysk': return `Błysk ${range(t.count)} ${t.pattern} ${t.exposureMs / 1000} с${tag}`;
    case 'nakarmZwierzaka': return `Nakarm ${range(t.count)}${t.slots ? ' слоти' : ''}${tag}`;
    default: return `${GAME_TITLES[t.game]}${tag}`;
  }
}

export function CurriculumSection() {
  return (
    <>
      <Section title="Програма: 7 світів і хаб" note="BRIEF §5 · PEDAGOGY §1; рівні W1 описано повністю, решта — заготовки">
        <div className={styles.wide}>
          <table className={styles.table}>
            <thead>
              <tr><th>Світ</th><th>Колір</th><th>Гість</th><th>Числа</th><th>Рівні</th><th>★</th><th>Ігри</th></tr>
            </thead>
            <tbody>
              {WORLDS.map((w) => (
                <tr key={w.id}>
                  <td>{w.id.toUpperCase()} · {WORLD_NAMES[w.id]}</td>
                  <td><span className={styles.swatch} style={{ background: w.color }} /> {w.color}</td>
                  <td>{w.guest ?? '—'}</td>
                  <td>{range(w.range)}</td>
                  <td>{w.mainLevels || '—'}</td>
                  <td>{w.starLevels ? `${w.starLevels} (після ${w.starBranchAfter})` : '—'}</td>
                  <td>{w.games.map((g) => GAME_TITLES[g]).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="W1 «Łąka Liczenia» — 12 рівнів по 6 завдань" note="↺ — спіральне повторення (2 з 6); «нова» — Kubik показує нову ідею">
        <div className={styles.wide}>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Нова</th><th>Завдання</th></tr>
            </thead>
            <tbody>
              {W1_LEVELS.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.newIdea ? '★' : ''}</td>
                  <td>{l.tasks.map(describeTask).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="29 навичок" note="для карти навичок у Strefa rodzica (M22) і черги повторень (M12); назви — [do sprawdzenia]">
        <div className={styles.wide}>
          <table className={styles.table}>
            <tbody>
              {SKILLS.map((s) => (
                <tr key={s.id}>
                  <td>{s.world.toUpperCase()}{s.star ? ' ★' : ''}</td>
                  <td>{s.id}</td>
                  <td>{SKILL_NAMES[s.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Hint>Опанування навички — ≥ 80 % з першого разу за останні 10 елементів у ≥ 2 різні дні (PEDAGOGY §3).</Hint>
      </Section>
    </>
  );
}
