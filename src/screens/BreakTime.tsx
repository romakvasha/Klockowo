import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Icon } from '../components/ui/Icon';
import type { IconName } from '../components/ui/icons';
import { IconButton } from '../components/ui/IconButton';
import { cx } from '../components/ui/cx';
import { BG_URL, type BackdropScene } from '../components/map/art';
import { Backdrop } from '../components/world/Backdrop';
import { afterBreakPath, afterBreakState } from '../session/breakPlan';
import { DANCE_BEAT_MS, SONG_FILE, SONG_SCENES, songAt, songProgress, type SongScene } from '../session/breakSong';
import { sessionClock } from '../session/sessionClock';
import { BUTTONS, SESSION_LINES, SONG } from '../speech/lines';
import { sfx } from '../speech/sfx';
import { useScript } from '../speech/useScript';
import { selectActiveProfile, useAppStore } from '../store';
import { SongStage } from './session/SongStage';
import styles from './session/BreakTime.module.css';

/** Фон і значок кожної сцени куплету (полотно D1, дошка S11). */
const SCENE_BG: Readonly<Record<SongScene, BackdropScene>> = { village: 'start', numbers: 'hub', duck: 'w1', space: 'w7', party: 'hub' };
const SCENE_ICON: Readonly<Record<SongScene, IconName>> = { village: 'home', numbers: 'pack', duck: 'w1', space: 'w7', party: 'star' };

const lessMotion = (setting: boolean): boolean => setting || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Czas na przerwę! (BRIEF §6 п.11, docs/DESIGN_V2.md §6): Kubik каже «Czas na przerwę!», і звучить пісенька «Kubik liczy do dziesięciu» —
 *  сцени куплетів змінюються, рядок, що звучить, — великий, наступний — дрібніше; Kubik і команда танцюють. Фонова музика гри тут мовчить
 *  (MusicRouteSync), голос під час пісні — теж. «Dalej» — будь-коли: веде туди, куди йшла дитина (`state.next`), або на мапу. */
export function BreakTime() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useAppStore(selectActiveProfile);
  const volume = useAppStore((s) => s.settings.volumes.speech);
  const calm = lessMotion(useAppStore((s) => s.settings.reduceMotion));
  const audio = useRef<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(150);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [done, setDone] = useState(false);
  const [beat, setBeat] = useState(0);
  const to = afterBreakPath(location.state);

  const play = () => {
    const a = audio.current;
    if (!a) return;
    a.play().then(
      () => setBlocked(false),
      () => setBlocked(true), // браузер не дав звук без дотику (iOS) — дитина натисне ▶
    );
  };

  useEffect(() => {
    const a = new Audio(SONG_FILE);
    a.preload = 'auto';
    audio.current = a;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => Number.isFinite(a.duration) && setDuration(a.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setDone(true);
      sfx.play('correct');
    };
    // вкладка сховалась — пауза; повернулась — грає далі, якщо грала
    let resume = false;
    const onVisibility = () => {
      if (document.hidden) {
        resume = !a.paused;
        a.pause();
      } else if (resume) {
        void a.play().catch(() => setBlocked(true));
      }
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      a.pause();
      a.removeAttribute('src');
      a.load();
      audio.current = null;
    };
  }, []);

  // фони сцен підвантажуються одразу, щоб зміна куплету не блимала порожнім тлом
  useEffect(() => {
    for (const s of new Set(Object.values(SCENE_BG))) new Image().src = BG_URL(s);
  }, []);

  useEffect(() => {
    if (audio.current) audio.current.volume = Math.min(1, Math.max(0, volume));
  }, [volume]);

  // танець — на такт, лише поки грає пісня
  useEffect(() => {
    if (!playing || calm) return;
    const id = setInterval(() => setBeat((b) => b + 1), DANCE_BEAT_MS);
    return () => clearInterval(id);
  }, [playing, calm]);

  useScript(async ({ say, wait }) => {
    sessionClock.markBreak();
    await wait(300);
    await say(SESSION_LINES.breakTime);
    play();
  });

  if (!profile) return <Navigate to="/start" replace />;
  const now = songAt(time);
  const progress = Math.round(songProgress(time, duration) * 100);
  return (
    <main className={styles.screen} data-calm={calm}>
      <Backdrop key={now.scene} src={BG_URL(SCENE_BG[now.scene])} className={styles.bg} />
      <h1 className={cx('kl-card', styles.title)}>{SESSION_LINES.breakTime}</h1>
      <IconButton
        icon="next"
        label={BUTTONS.next}
        size={88}
        pulse={done}
        className={styles.next}
        onClick={() => navigate(to, { replace: true, state: afterBreakState(location.state) })}
      />
      <SongStage scene={now.scene} beat={beat} calm={calm} />
      {blocked && <IconButton icon="play" label={SONG.title} size={120} pulse className={styles.play} onClick={play} />}
      <section className={cx('kl-card', styles.lyrics)} aria-label={SONG.title}>
        <p className={styles.line} aria-live="polite">{now.line ?? SONG.title}</p>
        <p className={styles.upcoming}>{now.next}</p>
        <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={SONG.title}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.scenes} aria-hidden="true">
          {SONG_SCENES.map((s) => (
            <span key={s} data-on={s === now.scene}>
              <Icon name={SCENE_ICON[s]} />
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
