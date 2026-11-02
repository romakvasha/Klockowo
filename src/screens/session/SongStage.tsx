import { Kubik } from '../../characters/Kubik';
import { TeamPup } from '../../characters/TeamPup';
import { TEAM_MEMBERS, type TeamMember } from '../../characters/poses';
import { brickDigitUrl, itemUrl } from '../../components/math/art';
import { dancePose, type SongScene } from '../../session/breakSong';
import styles from './BreakTime.module.css';

/** Предмети сцени куплету навколо танцюристів (декор): мама-качка — п'ять каченят, космос — 5 + 5 зірок, свято — кульки,
 *  приспів — великі цифри п'ятірками: 1…5 («raz, dwa, trzy, cztery, pięć»), потім 6…10 (`half`). */
function Props({ scene, half }: { scene: SongScene; half: 0 | 1 }) {
  const img = (src: string, k: number) => <img key={k} className={styles.prop} style={{ animationDelay: `${(k % 5) * 120}ms` }} src={src} alt="" draggable={false} />;
  switch (scene) {
    case 'numbers':
      return (
        <div key={half} className={styles.digits}>
          {Array.from({ length: 5 }, (_, k) => half * 5 + k + 1).map((n, k) => (
            <span key={n} className={styles.prop} style={{ animationDelay: `${k * 90}ms` }}>
              {String(n).split('').map((d, j) => <img key={j} src={brickDigitUrl(Number(d))} alt="" draggable={false} />)}
            </span>
          ))}
        </div>
      );
    case 'duck':
      return <div className={styles.props}>{Array.from({ length: 5 }, (_, k) => img(itemUrl('kaczuszka'), k))}</div>;
    case 'space':
      return <div className={styles.props}>{Array.from({ length: 10 }, (_, k) => img(itemUrl('gwiazdka'), k))}</div>;
    case 'party':
      return <div className={styles.props}>{Array.from({ length: 6 }, (_, k) => img(itemUrl('balonik'), k))}</div>;
    default:
      return null;
  }
}

/** Пари цуценят обабіч Kubika; на кожному такті одне з пари радіє, інше — у спокої, і навпаки. */
const LEFT: readonly TeamMember[] = TEAM_MEMBERS.slice(0, 2);
const RIGHT: readonly TeamMember[] = TEAM_MEMBERS.slice(2);

/** Сцена пісеньки (`half` — яка п'ятірка цифр у приспіві): предмети куплету, Kubik і команда танцюють (`beat` — номер такту). `calm` («Mniej animacji») — без танцю: усі радіють і стоять. */
export function SongStage({ scene, half, beat, calm }: { scene: SongScene; half: 0 | 1; beat: number; calm: boolean }) {
  const pup = (m: TeamMember, k: number, flip: boolean) => (
    <TeamPup key={m} member={m} pose={calm || (beat + k) % 2 === 0 ? 'happy' : 'idle'} flip={flip} animate={!calm} className={styles.pup} />
  );
  return (
    <div className={styles.stage} data-scene={scene}>
      <Props scene={scene} half={half} />
      <div className={styles.dancers}>
        <div className={styles.side}>{LEFT.map((m, k) => pup(m, k, false))}</div>
        <Kubik pose={calm ? 'happy' : dancePose(beat)} animate={!calm} className={styles.kubik} />
        <div className={styles.side}>{RIGHT.map((m, k) => pup(m, k, true))}</div>
      </div>
    </div>
  );
}
