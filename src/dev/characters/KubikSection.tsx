import { useState } from 'react';
import { ACCESSORY_WORLDS, KUBIK_POSES, Kubik, type KubikPose } from '../../characters';
import type { WorldKey } from '../../speech/nouns';
import { Toggle } from '../../components/ui';
import { WORLD_NAMES } from '../../speech/lines';
import { Cell, DevButton, Hint, Section } from '../ui/UiSection';
import styles from './Characters.module.css';

const NOTES: Readonly<Record<KubikPose, string>> = {
  idle: 'спокій, дихає',
  'pointing-left': 'лапкою вліво',
  'pointing-right': 'лапкою вправо',
  'pointing-down': 'униз, на лоток',
  demonstrating: 'показує кубик',
  thinking: 'думає, «?»',
  happy: 'стрибок, виляє хвостом',
  celebrating: 'підкидає кубики',
  encouraging: 'підбадьорює, лапка вгору',
  waving: 'вітається',
  surprised: '«Ups!» — службові стани',
  'with-card': 'тримає DigitCard',
  'on-kart': 'картинг із блоків · мапа',
  sleepy: 'позіхає в будці',
  'break-jump': '«Podskocz dziesięć razy!»',
  'break-clap': '«Klaśnij pięć razy!»',
  'break-stomp': '«Tupnij osiem razy!»',
};

/** Живий Kubik: обрати позу й аксесуар, увімкнути рот A/O/E; «ще раз» перезапускає появу позі (стрибок радості). */
function LiveKubik() {
  const [pose, setPose] = useState<KubikPose>('idle');
  const [accessory, setAccessory] = useState<WorldKey | ''>('');
  const [talking, setTalking] = useState(false);
  const [card, setCard] = useState(7);
  const [replay, setReplay] = useState(0);
  return (
    <div className={styles.live}>
      <Kubik key={replay} pose={pose} accessory={accessory || null} talking={talking} card={card} size={260} label="Kubik" />
      <div className={styles.panel}>
        <label className={styles.field}>
          Поза
          <select value={pose} onChange={(e) => setPose(e.target.value as KubikPose)}>
            {KUBIK_POSES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Аксесуар світу
          <select value={accessory} onChange={(e) => setAccessory(e.target.value as WorldKey | '')}>
            <option value="">без аксесуара</option>
            {ACCESSORY_WORLDS.map((w) => (
              <option key={w} value={w}>{w.toUpperCase()} · {WORLD_NAMES[w]}</option>
            ))}
          </select>
        </label>
        {pose === 'with-card' && (
          <label className={styles.field}>
            Число на картці
            <input type="number" min={0} max={99} value={card} onChange={(e) => setCard(Math.min(99, Math.max(0, Number(e.target.value) || 0)))} />
          </label>
        )}
        <Toggle label="Говорить (рот A / O / E)" checked={talking} onChange={setTalking} />
        <DevButton onClick={() => setReplay((n) => n + 1)}>↻ показати появу позі знову</DevButton>
      </div>
    </div>
  );
}

export function KubikSection() {
  return (
    <>
      <Section title="Kubik — живий" note="поза + аксесуар + рот; дихання 3 с, кліпання раз на 4–6 с, happy / celebrating — стрибок 12 px і хвіст ±15°">
        <LiveKubik />
        <Hint>
          Рот «talking» — три окремі форми (A, O, E), що міняються ≈ 9 разів/с, на будь-якій позі; у справжній грі його вмикатиме
          <code> useTts().speaking</code>. При «Mniej animacji» (prefers-reduced-motion) рух зникає: лишається зміна пози, а рот — просто відкритий.
        </Hint>
      </Section>

      <Section title="17 поз Kubika" note="кожна поза — окремий SVG, viewBox 0 −30 200 250; лапками Kubik не рахує, кількість — кубиками чи карткою">
        <div className={styles.poses}>
          {KUBIK_POSES.map((pose) => (
            <div key={pose} className={styles.poseCard}>
              <Kubik pose={pose} card={7} size={175} />
              <span className={styles.poseName}>{pose}</span>
              <span className={styles.poseNote}>{NOTES[pose]}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Аксесуари світів — шар #accessory поверх будь-якої пози" note="капелюшок W1 · пов'язка W2 · окуляри W3 · каска W4 · бінокль W5 · кепка W6 · шолом W7">
        <div className={styles.accRow}>
          {ACCESSORY_WORLDS.map((w, i) => (
            <Cell key={w} caption={`${WORLD_NAMES[w]}`}>
              <Kubik pose={KUBIK_POSES[i === 3 ? 1 : 0] ?? 'idle'} accessory={w} size={175} animate={false} />
            </Cell>
          ))}
        </div>
      </Section>
    </>
  );
}
