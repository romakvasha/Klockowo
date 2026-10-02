import { Slider } from '../../components/ui/Slider';
import { Toggle } from '../../components/ui/Toggle';
import { WORLD_KEYS } from '../../curriculum/worlds';
import type { PanelText } from '../../parent/text';
import { MUSIC_ENABLED } from '../../speech/music';
import { tts } from '../../speech/tts';
import { useTts } from '../../speech/useTts';
import { selectActiveProgress, useAppStore, type SessionMinutes } from '../../store';
import { Card } from './Card';
import styles from './Parent.module.css';

const SESSIONS: readonly SessionMinutes[] = [10, 15, 20];

/** Ustawienia (BRIEF §6 п.15): «Długość sesji» (10/15/20 min), «Głos» (польські голоси браузера), «Tempo mowy», «Głośność» (три повзунки «Mowa», «Efekty», «Muzyka»), «Mniej animacji»,
 *  «Zadania dodatkowe ★», «Odblokuj świat ręcznie». Зміни застосовуються одразу (SettingsSync). */
export function SettingsSection({ t }: { t: PanelText }) {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const progress = useAppStore(selectActiveProgress);
  const setWorldUnlocked = useAppStore((s) => s.setWorldUnlocked);
  const voices = useTts().voices;
  const s = t.settings;
  const pct = (v: number) => Math.round(v * 100);
  const sample = () => void tts.speak('Brawo!', { interrupt: true });

  return (
    <Card title={t.sections.settings} id="settings">
      <fieldset className={styles.field}>
        <legend>{s.sessionLength}</legend>
        <div className={styles.choices}>
          {SESSIONS.map((m) => (
            <label key={m} className={styles.choice}>
              <input type="radio" name="session" checked={settings.sessionMinutes === m} onChange={() => update({ sessionMinutes: m })} />
              <span>{m} {s.minutesUnit}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className={styles.field}>
        <span>{s.voice}</span>
        <select value={settings.voiceURI ?? ''} onChange={(e) => update({ voiceURI: e.target.value || null })} disabled={voices.length === 0}>
          <option value="">{voices.length === 0 ? s.voiceNone : s.voiceAuto}</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
          ))}
        </select>
      </label>

      <Slider
        label={s.speechRate}
        startLabel={s.slower}
        endLabel={s.faster}
        min={0.7}
        max={1.2}
        step={0.1}
        showTicks
        value={settings.speechRate}
        onChange={(v) => update({ speechRate: Math.round(v * 10) / 10 })}
        onCommit={sample}
      />

      <h3 className={styles.worldTitle}>{s.volume}</h3>
      <Slider label={s.speech} value={pct(settings.volumes.speech)} min={0} max={100} step={5} valueText={`${pct(settings.volumes.speech)}%`} onChange={(v) => update({ volumes: { speech: v / 100 } })} onCommit={sample} />
      <Slider label={s.effects} value={pct(settings.volumes.effects)} min={0} max={100} step={5} valueText={`${pct(settings.volumes.effects)}%`} onChange={(v) => update({ volumes: { effects: v / 100 } })} />
      {MUSIC_ENABLED && (
        <Slider label={s.music} value={pct(settings.volumes.music)} min={0} max={100} step={5} valueText={`${pct(settings.volumes.music)}%`} onChange={(v) => update({ volumes: { music: v / 100 } })} />
      )}

      <Toggle label={s.reduceMotion} checked={settings.reduceMotion} onChange={(reduceMotion) => update({ reduceMotion })} />
      <Toggle label={s.extraTasks} checked={settings.extraTasks} onChange={(extraTasks) => update({ extraTasks })} />

      <h3 className={styles.worldTitle}>{s.unlockWorld}</h3>
      <p className={styles.muted}>{s.unlockNote}</p>
      {WORLD_KEYS.filter((w) => w !== 'w1').map((w) => (
        <Toggle key={w} label={w.toUpperCase()} checked={progress.manualUnlocks.includes(w)} onChange={(on) => setWorldUnlocked(w, on)} />
      ))}
    </Card>
  );
}
