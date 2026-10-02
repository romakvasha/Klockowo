import { useState } from 'react';
import { PlayerPup } from '../../characters/PlayerPup';
import { PUP_IDS, PUP_TINTS, pupLabel, type PupId } from '../../characters';
import type { PanelText } from '../../parent/text';
import { MAX_NAME_LENGTH, MAX_PROFILES, useAppStore } from '../../store';
import { Card } from './Card';
import { ConfirmBox } from './ConfirmBox';
import styles from './Parent.module.css';

/** Profile (BRIEF §6 п.15): ім'я (необов'язкове), цуценя, «Dodaj profil» (до 4), вибір того, хто грає, видалення (з підтвердженням). Ім'я зберігається, коли поле втрачає фокус чи натиснуто Enter. */
export function ProfilesSection({ t }: { t: PanelText }) {
  const profiles = useAppStore((s) => s.profiles);
  const activeId = useAppStore((s) => s.activeProfileId);
  const addProfile = useAppStore((s) => s.addProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const selectProfile = useAppStore((s) => s.selectProfile);
  const removeProfile = useAppStore((s) => s.removeProfile);
  const [removing, setRemoving] = useState<string | null>(null);
  const p = t.profiles;

  const add = () => {
    // нове цуценя — перше, якого ще нема в інших профілях
    const used = new Set(profiles.map((x) => x.pup));
    const pup = (PUP_IDS.find((id) => !used.has(id)) ?? PUP_IDS[0]) as PupId;
    addProfile({ pup });
  };

  return (
    <Card title={t.sections.profiles} id="profiles">
      <ul className={styles.profileList}>
        {profiles.map((profile) => (
          <li key={profile.id} className={styles.profile} data-active={profile.id === activeId}>
            <label className={styles.field}>
              <span>{p.name}</span>
              <input
                type="text"
                defaultValue={profile.name ?? ''}
                maxLength={MAX_NAME_LENGTH}
                placeholder={p.namePlaceholder}
                onBlur={(e) => updateProfile(profile.id, { name: e.target.value.trim() || null })}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </label>
            <div className={styles.pups} role="radiogroup" aria-label={p.pup}>
              {PUP_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={profile.pup === id}
                  aria-label={pupLabel(id)}
                  className={styles.pupButton}
                  data-active={profile.pup === id}
                  style={{ background: `var(--kl-${PUP_TINTS[id]}-50)` }}
                  onClick={() => updateProfile(profile.id, { pup: id })}
                >
                  <PlayerPup id={id} size={44} />
                </button>
              ))}
            </div>
            <div className={styles.rowActions}>
              {profile.id === activeId ? (
                <span className={styles.activeBadge}>● {p.active}</span>
              ) : (
                <button type="button" className={styles.langButton} onClick={() => selectProfile(profile.id)}>
                  {p.name}: {profile.name ?? p.namePlaceholder}
                </button>
              )}
              <button type="button" className={styles.langButton} onClick={() => setRemoving(profile.id)}>{p.remove}</button>
            </div>
            {removing === profile.id && (
              <ConfirmBox
                message={t.backup.confirm(profile.name ?? p.namePlaceholder)}
                cancel={t.backup.cancel}
                confirm={t.backup.confirmYes}
                onCancel={() => setRemoving(null)}
                onConfirm={() => {
                  setRemoving(null);
                  removeProfile(profile.id);
                }}
              />
            )}
          </li>
        ))}
      </ul>
      <button type="button" className={styles.langButton} disabled={profiles.length >= MAX_PROFILES} onClick={add}>
        {profiles.length >= MAX_PROFILES ? p.full : `＋ ${p.add}`}
      </button>
    </Card>
  );
}
