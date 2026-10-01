import { useState } from 'react';
import { ACCESSORY_WORLDS, MASCOT_STATES, MascotStage, PUP_IDS, PUP_TINTS, PlayerPup, pupLabel, type MascotState, type PointingDirection } from '../../characters';
import { AvatarButton, Digits, Dots, Toggle } from '../../components/ui';
import { cssVars } from '../../components/ui/cx';
import { FEEDBACK_LINES, PUPS, WORLD_NAMES } from '../../speech/lines';
import type { WorldKey } from '../../speech/nouns';
import { Hint, Section } from '../ui/UiSection';
import styles from './Characters.module.css';

export function PupsSection() {
  return (
    <Section title="8 цуценят для «Twój piesek»" note="картка 176 · цуценя 144 · пастелі 50 різних світів · без уніформ і транспорту, не схожі на команду">
      <div className={styles.pups}>
        {PUPS.map((pup) => (
          <div key={pup.id} className={styles.pupCard}>
            <div className={styles.pupFrame} style={cssVars({ '--tint': `var(--kl-${PUP_TINTS[pup.id]}-50)` })}>
              <PlayerPup id={pup.id} />
            </div>
            <div className={styles.pupText}>
              {pupLabel(pup.id)}
              <span>{pup.breed}</span>
              <span>голос: «{pup.line}»</span>
            </div>
            <AvatarButton size={72} tint={PUP_TINTS[pup.id]} profileName={pupLabel(pup.id)} silent>
              <PlayerPup id={pup.id} />
            </AvatarButton>
          </div>
        ))}
      </div>
      <Hint>
        Порядок — як у пікері (4×2). Аватар 72 — як на Mapie przygody. Справжній PupPicker (вибір, «Gotowe», «Witaj w drużynie!») — етап M6.
        Усього цуценят: {PUP_IDS.length}.
      </Hint>
    </Section>
  );
}

const STATE_NOTES: Readonly<Record<MascotState, string>> = {
  idle: 'чекає; «дихання» 3 с',
  talking: 'інструкція; рот A/O/E',
  pointing: 'показує на лоток / предмет',
  hint: `«${FEEDBACK_LINES.show}» — лише 1-й крок`,
  retry: `«${FEEDBACK_LINES.retry}» / «${FEEDBACK_LINES.almost}»`,
  together: '«Pomogę ci. Zrobimy to razem.»',
  correct: '«Brawo! Pięć jabłek.» — стрибок',
};

export function StageSection() {
  const [world, setWorld] = useState<WorldKey | ''>('w1');
  const [pointing, setPointing] = useState<PointingDirection>('down');
  const [speaking, setSpeaking] = useState(false);
  return (
    <Section title="MascotStage — Kubik + бульбашка" note="унизу ліворуч · ПК 184 px · планшет 150 / 120 · телефон 100 · у 844×390 прихований, виїжджає лише для hint і together">
      <div className={styles.controls}>
        <label className={styles.field}>
          Аксесуар світу
          <select value={world} onChange={(e) => setWorld(e.target.value as WorldKey | '')}>
            <option value="">без аксесуара</option>
            {ACCESSORY_WORLDS.map((w) => (
              <option key={w} value={w}>{w.toUpperCase()} · {WORLD_NAMES[w]}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Pointing
          <select value={pointing} onChange={(e) => setPointing(e.target.value as PointingDirection)}>
            <option value="down">вниз</option>
            <option value="left">вліво</option>
            <option value="right">вправо</option>
          </select>
        </label>
        <Toggle label="Говорить у будь-якому стані" checked={speaking} onChange={setSpeaking} />
      </div>
      <div className={styles.stages}>
        {MASCOT_STATES.map((state) => (
          <div key={state} className={styles.stageCell}>
            <div className={styles.stageBox}>
              <MascotStage
                className={styles.stagePlace}
                state={state}
                world={world || null}
                pointing={pointing}
                speaking={speaking ? true : undefined}
                card={5}
                bubble={
                  state === 'talking' ? (
                    <>
                      <Dots count={5} perRow={3} style={{ height: 40 }} />
                      <span>?</span>
                    </>
                  ) : state === 'correct' ? (
                    <Digits value={5} style={{ height: 56 }} />
                  ) : undefined
                }
              />
            </div>
            <strong>{state}</strong>
            <span className={styles.poseNote}>{STATE_NOTES[state]}</span>
          </div>
        ))}
      </div>
      <Hint>
        Бульбашка — лише іконки й цифри, хвостик до рота. Під час завдання Kubik — єдиний «зайвий» рух. У 844×390 Kubik виїжджає поверх сцени
        (знизу, 300 мс) лише для hint і together (перевір, звузивши вікно до 844×390).
      </Hint>
    </Section>
  );
}
