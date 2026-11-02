import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Kubik } from '../characters/Kubik';
import { PlayerPup } from '../characters/PlayerPup';
import { PUP_TINTS } from '../characters/pups';
import { BASE_URL, BG_URL } from '../components/map/art';
import { Backdrop } from '../components/world/Backdrop';
import { AvatarButton } from '../components/ui/AvatarButton';
import { HoldToConfirm } from '../components/ui/HoldToConfirm';
import { Icon } from '../components/ui/Icon';
import { Logo } from '../components/ui/Logo';
import { PlayButton } from '../components/ui/PlayButton';
import { SpeechBubble } from '../components/ui/SpeechBubble';
import { cssVars } from '../components/ui/cx';
import { LABELS, PARENT_GEAR_LABEL, START_LINES } from '../speech/lines';
import { tts } from '../speech/tts';
import { useTts } from '../speech/useTts';
import { useAppStore } from '../store';
import { LanguagePicker } from './start/LanguagePicker';
import styles from './Start.module.css';

type Phase = 'play' | 'who';

/** Start (BRIEF §6.2): спершу лише велика «Graj!» — перший дотик вмикає звук. Далі: профілів немає → Twój piesek; один → одразу мапа;
 *  кілька → голос «Kto dziś gra?» і до 4 аватарів (дотик відкриває мапу). З мапи аватар веде сюди одразу до вибору (`state.pick`). */
export function Start() {
  const navigate = useNavigate();
  const location = useLocation();
  const profiles = useAppStore((s) => s.profiles);
  const selectProfile = useAppStore((s) => s.selectProfile);
  const speaking = useTts().speaking;
  const pickRequested = (location.state as { pick?: boolean } | null)?.pick === true;
  const [phase, setPhase] = useState<Phase>(pickRequested && profiles.length > 0 ? 'who' : 'play');

  useEffect(() => {
    if (phase !== 'who') return;
    void tts.speak(START_LINES.whoPlays, { interrupt: true });
    return () => tts.cancel(); // голос не лунає на наступному екрані
  }, [phase]);

  const play = () => {
    const [only] = profiles;
    if (!only) navigate('/pup');
    else if (profiles.length === 1) {
      selectProfile(only.id);
      navigate('/map');
    } else setPhase('who');
  };

  const choose = (id: string) => {
    selectProfile(id);
    navigate('/map');
  };

  return (
    <main className={styles.start}>
      <Backdrop src={BG_URL('start')} />
      <HoldToConfirm className={styles.gear} label={PARENT_GEAR_LABEL} onConfirm={() => navigate('/parent-gate')}>
        <Icon name="gear" />
      </HoldToConfirm>
      {phase === 'play' && <LanguagePicker />}

      <header className={styles.top}>
        <Logo />
      </header>

      <section className={styles.center}>
        {phase === 'play' ? (
          <PlayButton idle onClick={play} />
        ) : (
          <ul className={styles.avatars} aria-label={START_LINES.whoPlays}>
            {profiles.map((profile, i) => (
              <li key={profile.id} className={styles.avatar} style={{ animationDelay: `${i * 80}ms` }}>
                <AvatarButton
                  size={160}
                  profileName={profile.name}
                  tint={PUP_TINTS[profile.pup]}
                  style={cssVars({ '--size': 'min(160px, 34vw, 30vh)' })}
                  onClick={() => choose(profile.id)}
                >
                  <PlayerPup id={profile.pup} />
                </AvatarButton>
                <span className={styles.name} data-empty={profile.name === null} aria-hidden="true">
                  {profile.name ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className={styles.bottom}>
        <img className={styles.base} src={BASE_URL()} alt={LABELS.base} draggable={false} />
        <div className={styles.kubik}>
          {phase === 'who' && (
            <SpeechBubble className={styles.bubble}>
              {profiles.slice(0, 2).map((p) => (
                <span key={p.id} className={styles.mini} style={cssVars({ '--tint': `var(--kl-${PUP_TINTS[p.pup]}-50)` })}>
                  <PlayerPup id={p.pup} />
                </span>
              ))}
              <span>?</span>
            </SpeechBubble>
          )}
          <Kubik pose={phase === 'play' ? 'waving' : 'idle'} talking={phase === 'who' && speaking} />
        </div>
      </footer>
    </main>
  );
}
