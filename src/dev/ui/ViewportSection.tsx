import { Hint, Section } from './UiSection';
import styles from './Ui.module.css';

/** Профілі BRIEF §12: у кожному iframe справжній в'юпорт, тому media queries (плитки, кнопки, HUD) працюють як на пристрої. */
const PROFILES = [
  { name: '1440×900 · плитки 140', w: 1440, h: 900, scale: 0.4 },
  { name: '1024×768 · плитки 128', w: 1024, h: 768, scale: 0.45 },
  { name: '768×1024 · портрет', w: 768, h: 1024, scale: 0.35 },
  { name: '390×844 · телефон, плитки 96', w: 390, h: 844, scale: 0.5 },
  { name: '844×390 · телефон, альбом, плитки 88', w: 844, h: 390, scale: 0.55 },
] as const;

export function ViewportSection() {
  // HashRouter: той самий документ, інший хеш
  const src = `${window.location.pathname}${window.location.search}#/dev/ui-frame`;
  return (
    <Section title="П'ять в'юпортів" note="HUD + три плитки + «Gotowe» у кожному розмірі (масштаб зменшено; iframe завантажуються ліниво)">
      <div className={styles.frames}>
        {PROFILES.map(({ name, w, h, scale }) => (
          <figure key={name} className={styles.frame}>
            <div className={styles.frameBox} style={{ width: w * scale, height: h * scale }}>
              <iframe
                className={styles.frameIframe}
                title={name}
                src={src}
                width={w}
                height={h}
                loading="lazy"
                style={{ transform: `scale(${scale})` }}
              />
            </div>
            <figcaption className={styles.frameName}>{name}</figcaption>
          </figure>
        ))}
      </div>
      <Hint>
        Перевіряй також на справжньому телефоні: <code>npm run dev -- --host</code> і відкрий /#/dev/ui за адресою комп'ютера в мережі.
      </Hint>
    </Section>
  );
}
