import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { isWorldUnlocked } from '../curriculum/progression';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { brickDigitUrl } from '../components/math/art';
import { BUTTONS, PLAYGROUND } from '../speech/lines';
import { tts } from '../speech/tts';
import { selectActiveProfile, selectActiveProgress, useAppStore } from '../store';
import { ChartPaint } from './playground/ChartPaint';
import { CountSong } from './playground/CountSong';
import { ReviewSession } from './playground/ReviewSession';
import { BG_URL } from '../components/map/art';
import { Backdrop } from '../components/world/Backdrop';
import styles from './playground/Playground.module.css';

type Activity = 'menu' | 'review' | 'paint' | 'count';

/** Мініатюра «Pomaluj tablicę» (полотно D1): сітка 4×4 з кількома розфарбованими клітинками. */
const PAINT_PREVIEW: readonly boolean[] = [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1].map(Boolean);

/** «Plac Zabaw» (BRIEF §6 п.13; відкривається після W1): мішане повторення й вільна гра — розфарбовування таблиці 100 і лічба до 100 з Kubikom. Кнопка «Mapa» веде назад (з активності — до меню). */
export function Playground() {
  const navigate = useNavigate();
  const profile = useAppStore(selectActiveProfile);
  const progress = useAppStore(selectActiveProgress);
  const [activity, setActivity] = useState<Activity>('menu');

  if (!profile) return <Navigate to="/start" replace />;
  if (!isWorldUnlocked(progress, 'hub')) return <Navigate to="/map" replace />;

  // повторення — на весь екран, зі своїм HUD і «Mapa»
  if (activity === 'review') return <ReviewSession onExit={() => setActivity('menu')} />;

  const back = () => (activity === 'menu' ? navigate('/map') : setActivity('menu'));
  const pick = (next: Activity, label: string) => {
    void tts.speak(label, { interrupt: true });
    setActivity(next);
  };

  return (
    <main className={styles.screen}>
      <Backdrop src={BG_URL('hub')} />
      <header className={styles.bar}>
        <IconButton icon="home" label={BUTTONS.map} onClick={back} />
        <h1 className={styles.title}>{PLAYGROUND.title}</h1>
      </header>
      {activity === 'menu' && (
        <nav className={styles.menu} aria-label={PLAYGROUND.title}>
          <button type="button" className={`kl-brick kl-studs ${styles.tile}`} data-brick="orange" data-kind="review" onClick={() => pick('review', PLAYGROUND.review)}>
            <Icon name="retry" className={`kl-glyph ${styles.tileIcon}`} />
            <span className={`kl-glyph ${styles.tileLabel}`}>{PLAYGROUND.review}</span>
          </button>
          <button type="button" className={`kl-brick kl-studs ${styles.tile}`} data-brick="purple" data-kind="paint" onClick={() => pick('paint', PLAYGROUND.paint)}>
            <span className={styles.paintGrid} aria-hidden="true">
              {PAINT_PREVIEW.map((on, i) => <i key={i} data-on={on} />)}
            </span>
            <span className={`kl-glyph ${styles.tileLabel}`}>{PLAYGROUND.paint}</span>
          </button>
          <button type="button" className={`kl-brick kl-studs ${styles.tile}`} data-brick="yellow" data-kind="count" onClick={() => pick('count', PLAYGROUND.count)}>
            <span className={styles.hundred} aria-hidden="true">
              {[1, 0, 0].map((d, i) => <img key={i} src={brickDigitUrl(d)} alt="" draggable={false} />)}
            </span>
            <span className={`kl-glyph ${styles.tileLabel}`}>{PLAYGROUND.count}</span>
          </button>
        </nav>
      )}
      {activity === 'paint' && <ChartPaint />}
      {activity === 'count' && <CountSong />}
    </main>
  );
}
