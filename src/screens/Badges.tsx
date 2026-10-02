import { Navigate, useNavigate } from 'react-router';
import { DiligenceBadge } from '../components/ui/DiligenceBadge';
import { Digits } from '../components/ui/Digits';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { LEVELS } from '../curriculum/levels';
import { ALBUM, BUTTONS, LEVEL_LINES } from '../speech/lines';
import { sfx } from '../speech/sfx';
import { tts } from '../speech/tts';
import { diligenceBadgesOf, selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import styles from './rewards/Rewards.module.css';

/** Odznaki (BRIEF §6 п.10): значки «Nie poddajesz się!» — квадратні жетони-кубики #FFC21A, як у Kubika на нашийнику; по одному за рівень, у якому дитина хоч раз розв'язувала разом із Kubikom.
 *  Під значком — світ і номер рівня (іконка й цифри). Дотик — Kubik каже «Nie poddajesz się!». Поки значків нема, видно один блідий жетон. */
export function Badges() {
  const navigate = useNavigate();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);
  if (!profile) return <Navigate to="/start" replace />;
  const earned = diligenceBadgesOf(progress);
  const levels = earned.map((id) => LEVELS.find((l) => l.id === id)).filter((l): l is (typeof LEVELS)[number] => l !== undefined);

  const say = () => {
    sfx.play('pop');
    void tts.speak(LEVEL_LINES.diligence, { interrupt: true });
  };

  return (
    <main className={styles.page}>
      <header className={styles.bar}>
        <IconButton icon="stickers" label={ALBUM.title} variant="neutral" onClick={() => navigate('/album')} />
        <h1 className={styles.title}>{ALBUM.badges}</h1>
        <IconButton icon="home" label={BUTTONS.map} variant="neutral" onClick={() => navigate('/map')} />
      </header>
      <div className={styles.grid} role="list">
        {levels.length === 0 && (
          <div role="listitem" className={styles.badgeCell} data-owned="false">
            <DiligenceBadge size={112} />
          </div>
        )}
        {levels.map((l) => (
          <div key={l.id} role="listitem" style={{ display: 'contents' }}>
            <button type="button" className={styles.badgeCell} data-owned="true" aria-label={LEVEL_LINES.diligence} onClick={say}>
              <DiligenceBadge size={112} />
              <span className={styles.badgeMeta} aria-hidden="true">
                <Icon name={l.world} width={28} height={28} />
                <Digits value={l.index} style={{ height: 22 }} />
                {l.kind === 'star' && <Icon name="star" width={22} height={22} />}
              </span>
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
