import { Link } from 'react-router';
import styles from './Dev.module.css';

const BASE = ['bg', 'surface', 'surface-2', 'ink', 'ink-soft', 'neutral-edge', 'disabled'];
const SEMANTIC = [
  'primary', 'primary-edge', 'secondary', 'secondary-edge', 'success', 'success-edge',
  'retry', 'retry-edge', 'reward', 'reward-edge', 'locked', 'locked-edge',
];
const PLACES = ['tens', 'tens-digit', 'ones', 'ones-digit'];
const BLOCKS = ['grass', 'earth', 'stone', 'sand', 'water', 'wood', 'leaves'].map((b) => `block-${b}`);
const WORLDS = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'hub'];
const SHADES = ['50', '100', '500', '700'];

function Swatch({ token }: { token: string }) {
  return (
    <div className={styles.swatch}>
      <div className={styles.chip} style={{ background: `var(--kl-${token})` }} />
      --kl-{token}
    </div>
  );
}

function Group({ title, tokens }: { title: string; tokens: string[] }) {
  return (
    <>
      <h2 className={styles.h2}>{title}</h2>
      <div className={styles.grid}>
        {tokens.map((t) => (
          <Swatch key={t} token={t} />
        ))}
      </div>
    </>
  );
}

/** /#/dev/tokens — токени з design/extracted/tokens.css і перевірка шрифтів (latin-ext, cyrillic). */
export function TokensPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/dev">← Dev</Link>
      <h1 className={styles.h1}>Токени</h1>

      <Group title="Baza" tokens={BASE} />
      <Group title="Semantyka (wypełnienie / krawędź)" tokens={SEMANTIC} />
      <Group title="Dziesiątki / jedności" tokens={PLACES} />
      <Group title="Bloki terenu" tokens={BLOCKS} />

      <h2 className={styles.h2}>Światy (50 · 100 · 500 · 700)</h2>
      {WORLDS.map((w) => (
        <div key={w} className={styles.world}>
          <span className={styles.worldLabel}>{w}</span>
          {SHADES.map((s) => (
            <Swatch key={s} token={`${w}-${s}`} />
          ))}
        </div>
      ))}

      <h2 className={styles.h2}>Шрифти</h2>
      <p className={`${styles.sample} ${styles.display}`}>Klockowo — Fredoka 700</p>
      <p className={styles.sample}>Nunito 700: Łąka, Gęś, Ćma, Śliwka, Źrebię, Żaba — Ąą Ćć Ęę Łł Ńń Óó Śś Źź Żż</p>
      <p className={styles.sample} style={{ fontWeight: 600 }}>
        Nunito 600 (cyrillic): Українська — Їжак, Єнот, Ґудзик, Щука
      </p>
      <p className={styles.digits}>0123456789</p>

      <h2 className={styles.h2}>Блокова кнопка (натисни)</h2>
      <button type="button" className={styles.block}>Graj!</button>
    </main>
  );
}
