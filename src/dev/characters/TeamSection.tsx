import { useState } from 'react';
import { TEAM, TEAM_MEMBERS, TEAM_POSES, TeamPup, Vehicle, Kubik, type TeamMember } from '../../characters';
import { SILHOUETTE_URL, need } from '../../characters/art';
import { cssVars } from '../../components/ui/cx';
import { CHARACTER_NAMES } from '../../speech/lines';
import type { WorldKey } from '../../speech/nouns';
import { Cell, DevButton, Hint, Section } from '../ui/UiSection';
import styles from './Characters.module.css';

/** Світ, у колірах якого картка гостя (перший світ, де цуценя — гість). */
const HOME: Readonly<Record<TeamMember, WorldKey>> = { latka: 'w1', pufka: 'w3', tofik: 'w4', iskra: 'w7' };

const FACTS: Readonly<Record<TeamMember, readonly string[]>> = {
  latka: ["Силует: вушка-«клапани», тонкий хвіст угору.", "Куля в зелено-білі смуги, кошик із дерев'яних блоків."],
  pufka: ["Силует: пухнаста «хмаринка», хвіст-кулька, гострі вушка.", "Вітрильник: блакитний корпус, ілюмінатори, біле вітрило."],
  tofik: ["Силует: «блокова» голова, брови, борідка, короткі лапи.", "Паровозик без обличчя; вантаж — десяток і одиниці в кольорах розрядів."],
  iskra: ["Силует: величезні стоячі вуха, без хвоста, короткі лапи.", "Ракета з білих блоків із фіолетовим носом і крилами."],
};

const SILHOUETTES = [
  { key: 'kubik', name: 'Kubik', note: 'довгі висячі вуха, хвіст угору' },
  { key: 'latka', name: 'Łatka', note: 'вушка-клапани, тонкий хвіст' },
  { key: 'pufka', name: 'Pufka', note: 'пухнастий контур, хвіст-кулька' },
  { key: 'tofik', name: 'Tofik', note: 'прямокутний, борідка, короткі лапи' },
  { key: 'iskra', name: 'Iskra', note: 'величезні вуха, без хвоста' },
] as const;

function Member({ member, arrive }: { member: TeamMember; arrive: number }) {
  const info = TEAM[member];
  const world = HOME[member];
  const vestNote = member === 'latka' ? ' (і у W2)' : member === 'tofik' ? ' (і у W5), без пожежної символіки' : '';
  return (
    <section
      className={styles.member}
      style={cssVars({ '--bg-color': `var(--kl-${world}-50)`, '--edge-color': `var(--kl-${world}-700)` })}
    >
      <div className={styles.memberHead}>
        <span className={styles.memberName}>{CHARACTER_NAMES[member]}</span>
        <span className={styles.worldChip}>{info.worlds}</span>
      </div>
      <div className={styles.note}>{info.breed}</div>
      <div className={styles.figures}>
        {TEAM_POSES.map((pose) => (
          <Cell key={pose} caption={pose}>
            <TeamPup member={member} pose={pose} size={100} />
          </Cell>
        ))}
        <Cell caption="pointing · flip">
          <TeamPup member={member} pose="pointing" flip size={100} />
        </Cell>
      </div>
      <div className={styles.vehicleBox}>
        <Vehicle key={arrive} kind={info.vehicle} arrive={arrive > 0} />
      </div>
      <div className={styles.vest}>
        <span className={styles.swatch} style={{ background: info.vest }} />
        <span>{info.vest} — жилет{vestNote}</span>
      </div>
      {FACTS[member].map((fact) => (
        <div key={fact} className={styles.vest}>{fact}</div>
      ))}
    </section>
  );
}

export function TeamSection() {
  const [arrive, setArrive] = useState(0);
  return (
    <>
      <Section title="Команда — гості місій" note="ті самі групи SVG, що й у Kubika · колір спорядження = колір першого світу, де цуценя — гість">
        <div className={styles.controls}>
          <DevButton onClick={() => setArrive((n) => n + 1)}>▶ транспорт приїжджає (600 мс)</DevButton>
        </div>
        <div className={styles.team}>
          {TEAM_MEMBERS.map((m) => (
            <Member key={m} member={m} arrive={arrive} />
          ))}
        </div>
        <Hint>
          Гість говорить лише у Wprowadzenie (виклик місії); під час завдань гостей на екрані немає. Pointing показує вправо, вліво —
          дзеркально (<code>flip</code>). Транспорт приїжджає 600 мс ease-out і завмирає — лише Wprowadzenie, Koniec poziomu й альбом.
        </Hint>
      </Section>

      <Section title="W6 «Miasto Setki» — уся команда разом" note="кожен у своєму кольорі · Kubik у кепці світу">
        <div className={styles.together}>
          <TeamPup member="latka" pose="happy" size={140} />
          <TeamPup member="pufka" pose="happy" size={140} />
          <Kubik pose="happy" accessory="w6" size={160} />
          <TeamPup member="tofik" pose="happy" size={140} />
          <TeamPup member="iskra" pose="happy" size={140} />
          <div className={styles.street} />
        </div>
      </Section>

      <Section title="Силуети без кольору" note="5 різних форм — розрізняються навіть у ч/б">
        <div className={styles.silhouettes}>
          {SILHOUETTES.map(({ key, name, note }) => (
            <div key={key} className={styles.silhouette}>
              <img src={need(SILHOUETTE_URL, key, 'Silhouette')} alt="" width={104} height={130} />
              {name}
              <span className={styles.poseNote}>{note}</span>
            </div>
          ))}
        </div>
        <Hint>
          Спільна форма команди — жилет зі світловідбивною смужкою й квадратний жетон-кубик #FFC21A на нашийнику. Жодних щитів, круглих жетонів із
          символом, шоломів пожежника чи поліцейської форми; породи команди не повторюються серед 8 цуценят «Twój piesek».
        </Hint>
      </Section>
    </>
  );
}
