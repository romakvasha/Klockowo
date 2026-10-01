import { PUP_IDS, PlayerPup } from '../../characters';
import { AvatarButton } from '../../components/ui';
import { currentWorldId, nextLevelId, nodeState, worldProgressCount } from '../../curriculum/progression';
import { levelsOfWorld } from '../../curriculum/levels';
import { WORLD_KEYS, worldById } from '../../curriculum/worlds';
import { WORLD_NAMES } from '../../speech/lines';
import { MAX_PROFILES, selectActiveProgress, useAppStore } from '../../store';
import { DevButton, Hint, Section } from '../ui/UiSection';
import styles from './Data.module.css';

export function ProfilesSection() {
  const profiles = useAppStore((s) => s.profiles);
  const activeId = useAppStore((s) => s.activeProfileId);
  const progress = useAppStore(selectActiveProgress);
  const extraTasks = useAppStore((s) => s.settings.extraTasks);
  const { addProfile, selectProfile, removeProfile, completeLevel, resetProgress, setWorldUnlocked, updateSettings } = useAppStore((s) => s);

  const ctx = { extraTasks };
  const current = currentWorldId(progress);
  const next = current === 'hub' ? null : nextLevelId(progress, current);

  return (
    <Section title="Профілі й прогрес" note="зберігається в localStorage (ключ klockowo); перезавантаж сторінку — усе лишається">
      <div className={styles.profiles}>
        {profiles.map((p) => (
          <div key={p.id} className={styles.profile} data-active={p.id === activeId}>
            <AvatarButton size={72} profileName={p.name ?? p.id} tint="hub" onClick={() => selectProfile(p.id)} silent>
              <PlayerPup id={p.pup} />
            </AvatarButton>
            <span>{p.name ?? p.id}{p.id === activeId ? ' · активний' : ''}</span>
            <DevButton onClick={() => removeProfile(p.id)}>Видалити</DevButton>
          </div>
        ))}
        {profiles.length < MAX_PROFILES && (
          <DevButton onClick={() => addProfile({ name: profiles.length === 0 ? 'Ola' : null, pup: PUP_IDS[profiles.length % PUP_IDS.length] ?? 'pon' })}>
            ＋ профіль ({profiles.length}/{MAX_PROFILES})
          </DevButton>
        )}
      </div>

      {activeId ? (
        <>
          <div className={styles.profiles}>
            <DevButton onClick={() => next && completeLevel(next, { firstTry: 5, togetherUsed: false })}>
              ▶ пройти наступний рівень{next ? ` (${next})` : ''}
            </DevButton>
            <DevButton onClick={() => completeLevel('w1-1', { firstTry: 6, togetherUsed: true })}>w1-1 «разом із Kubikom»</DevButton>
            <DevButton onClick={() => resetProgress(activeId)}>↻ скинути прогрес</DevButton>
            <DevButton onClick={() => updateSettings({ extraTasks: !extraTasks })}>★-гілки: {extraTasks ? 'видно' : 'приховано'}</DevButton>
          </div>
          {WORLD_KEYS.map((w) => {
            const count = worldProgressCount(progress, w);
            return (
              <div key={w} className={styles.worldRow}>
                <div className={styles.worldName}>
                  {w.toUpperCase()} · {WORLD_NAMES[w]}
                  <span>{count.done}/{count.total}{w === current ? ' · Kubik тут' : ''}{progress.manualUnlocks.includes(w) ? ' · відкрито вручну' : ''}</span>
                  <DevButton onClick={() => setWorldUnlocked(w, !progress.manualUnlocks.includes(w))}>
                    {progress.manualUnlocks.includes(w) ? 'закрити вручну' : 'відкрити вручну'}
                  </DevButton>
                </div>
                <div className={styles.nodes}>
                  {levelsOfWorld(w).map((l) => {
                    const state = nodeState(progress, l.id, ctx);
                    return (
                      <span key={l.id} className={styles.chip} data-state={state} title={`${l.id}: ${state}`}>
                        {l.kind === 'star' ? `★${l.index}` : l.index}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <Hint>
            Колір вузла: зелений — пройдено, помаранчевий — «світиться» (наступний), жовтий — відкритий ★, сірий — замок, пунктир — ★ приховано.
            W2 відкриється, коли пройдено всі 12 рівнів W1 (або «відкрити вручну»); «Plac Zabaw» — теж після W1 (світ: {worldById('hub').order}).
          </Hint>
        </>
      ) : (
        <Hint>Немає активного профілю: додай профіль або обери його (Start → «Kto dziś gra?»).</Hint>
      )}
    </Section>
  );
}
