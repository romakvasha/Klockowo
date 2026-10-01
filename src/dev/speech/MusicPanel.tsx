import { MISSION_LINES, PARENT, WORLD_NAMES } from '../../speech/lines';
import { MUSIC_ENABLED, music } from '../../speech/music';
import { MUSIC_WORLDS, WORLD_MUSIC, type MusicWorld, type Scene } from '../../speech/musicTheory';
import { useMusic } from '../../speech/useMusic';
import { say } from './log';
import styles from './Speech.module.css';

const SCENES: readonly { id: Scene; label: string }[] = [
  { id: 'menu', label: 'menu — мапа, стежка, місія' },
  { id: 'game', label: 'game — завдання (тихіше)' },
];

/** Фонова музика (M2b): грає після першого дотику; слухаємо світи, сцени, ducking під голосом і повзунок «Muzyka». */
export function MusicPanel() {
  const state = useMusic();
  const status = !MUSIC_ENABLED
    ? 'MUSIC_ENABLED = false — музику вимкнено, повзунка «Muzyka» у Strefa rodzica не буде.'
    : !state.unlocked
      ? 'Звук заблоковано — торкніться «Graj!» вище (або будь-де), потім натисніть «Музика».'
      : state.playing
        ? state.hidden ? 'Пауза: вкладка прихована.' : state.ducked ? 'Грає, притишена: говорить голос.' : 'Грає.'
        : 'Зупинено.';

  return (
    <section className={styles.panel} aria-labelledby="music-h">
      <h2 id="music-h" className={styles.h2}>Фонова музика</h2>
      <p className={`${styles.status} ${state.playing ? styles.ok : styles.warn}`} role="status">{status}</p>

      <div className={styles.controls}>
        <button
          type="button" className={state.playing ? styles.btnGhost : styles.btn} disabled={!MUSIC_ENABLED}
          onClick={() => (state.playing ? music.stop() : music.start())}
        >
          {state.playing ? '■ Стоп' : '▶ Музика'}
        </button>
        <button type="button" className={styles.btnGhost} onClick={() => void say(MISSION_LINES.slogan)}>
          ▶ Голос поверх музики: <span lang="pl">{MISSION_LINES.slogan}</span>
        </button>
      </div>

      <label className={styles.field}>
        <span>Світ</span>
        <select value={state.world} onChange={(e) => music.setWorld(e.target.value as MusicWorld)}>
          {MUSIC_WORLDS.map((w) => (
            <option key={w} value={w}>{w.toUpperCase()} · {WORLD_NAMES[w]} — {WORLD_MUSIC[w].label}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Сцена</span>
        <select value={state.scene} onChange={(e) => music.setScene(e.target.value as Scene)}>
          {SCENES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>

      <label className={styles.field}>
        <span>Гучність музики (<span lang="pl">{PARENT.settings.music}</span>): {Math.round(state.volume * 100)} %</span>
        <input
          type="range" min={0} max={1} step={0.05} value={state.volume}
          onChange={(e) => music.setVolume(Number(e.target.value))}
        />
      </label>

      <p className={styles.meta}>
        Світ перемикається з початку нової фрази (до ~15 с), тож зміну чути не одразу. Мелодія — за seed {state.seed}
        (змінюється при кожному завантаженні сторінки). Claude звуку не чує: оцінюйте на слух — чи тиха, чи не набридає,
        чи не заважає голосу — і вирішіть, лишати музику чи ховати (MUSIC_ENABLED).
      </p>
    </section>
  );
}
