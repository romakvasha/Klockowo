import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BUTTONS } from '../../speech/lines';
import { sfx } from '../../speech/sfx';
import { Digits, HUD, Icon, IconButton, ProgressBones, SpeechBubble, type SpeechBubbleProps } from '../../components/ui';
import { Cell, DevButton, Hint, Row, Section } from './UiSection';
import styles from './Ui.module.css';

/** Кубик із п'ятьма крапками (вміст бульбашки): справжні DotCard — етап M10. */
function DiceFive() {
  return (
    <svg viewBox="0 0 40 40" width="46" height="46" fill="currentColor" aria-hidden="true">
      {[[8, 8], [32, 8], [20, 20], [8, 32], [32, 32]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.5" />
      ))}
    </svg>
  );
}

/** Лапка (вміст бульбашки «Wybierz swojego pieska!»): справжня лапка Kubika — етап M4. */
function Paw() {
  return (
    <svg viewBox="0 0 48 48" width="52" height="52" fill="currentColor" aria-hidden="true">
      <ellipse cx="24" cy="31" rx="10" ry="8.5" />
      <ellipse cx="11.5" cy="20" rx="4.2" ry="5.2" />
      <ellipse cx="19" cy="12.5" rx="4.2" ry="5.4" />
      <ellipse cx="29" cy="12.5" rx="4.2" ry="5.4" />
      <ellipse cx="36.5" cy="20" rx="4.2" ry="5.2" />
    </svg>
  );
}

function Bubble({ caption, children, ...props }: { caption: string; children: ReactNode } & SpeechBubbleProps) {
  return (
    <Cell caption={caption}>
      <SpeechBubble {...props} className={styles.bubbleGap}>{children}</SpeechBubble>
    </Cell>
  );
}

/** HUD з живими кісточками: «Dodaj kosteczkę» → слот підсвічується, кісточка долітає за 600 мс. */
function HudDemo() {
  const [filled, setFilled] = useState(2);
  const [arriving, setArriving] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const addBone = () => {
    if (filled >= 6) {
      setFilled(0);
      setArriving(null);
      return;
    }
    setFilled(filled + 1);
    setArriving(filled);
    sfx.play('pop', { pitch: filled });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setArriving(null), 900);
  };
  const listen = () => {
    setPulse(false);
    requestAnimationFrame(() => setPulse(true));
  };

  return (
    <div className={styles.stageFlush}>
      <HUD
        world="w1"
        filled={filled}
        arriving={arriving}
        listenPulse={pulse}
        onListen={listen}
        stripExtra={<IconButton icon="bulb" label={BUTTONS.help} variant="hint" />}
      />
      <div className={styles.controls} style={{ padding: '0 24px 24px' }}>
        <DevButton onClick={addBone}>{filled >= 6 ? '↻ спочатку' : '＋ кісточка долітає'}</DevButton>
        <DevButton onClick={listen}>▶ «Posłuchaj» пульсує</DevButton>
      </div>
    </div>
  );
}

export function HudSection() {
  return (
    <>
      <Section title="HUD · ProgressBones" note="панель 104 (телефон 112) · кнопки 72 / 80 · 6 слотів по центру · відступи ≥ 24 px">
        <HudDemo />
        <Hint>
          Розкладка залежить від вікна: на ПК слоти 60×48 у ряд; до 600 px (телефон) — 2 ряди по 3; у 844×390 (альбом) панель стає
          бічною смугою 128 px із «Mapa», «Posłuchaj», «Pomóż mi», а кісточки — рядом 28 px угорі сцени. Усі п'ять в'юпортів — у галереї внизу.
        </Hint>
        <Row>
          <Cell caption="empty · слот surface-2, пунктир ink-soft"><ProgressBones total={1} filled={0} /></Cell>
          <Cell caption="filled · reward + контур ink"><ProgressBones total={1} filled={1} /></Cell>
          <Cell caption="arriving · слот підсвічено, посадка"><ProgressBones total={1} filled={1} arriving={0} /></Cell>
          <Cell caption="початок рівня · 0 / 6"><ProgressBones filled={0} /></Cell>
          <Cell caption="3-тя долітає · 3 / 6"><ProgressBones filled={3} arriving={2} /></Cell>
          <Cell caption="рівень пройдено · 6 / 6"><ProgressBones filled={6} /></Cell>
        </Row>
        <Hint>Слотів завжди 6: кісточку дають і після «показу разом». Лише одна кісточка летить за раз. Кісточки не інтерактивні.</Hint>
      </Section>

      <Section title="SpeechBubble — лише іконки або цифри" note="біла, контур 3, радіус 24, мін. висота 104 · хвостик до рота Kubika">
        <div className={styles.bubbles}>
          <Bubble caption="число + крапки кубика">
            <Digits value={5} style={{ height: 64 }} />
            <DiceFive />
          </Bubble>
          <Bubble caption="«Wybierz swojego pieska!»">
            <Paw />
            <span>?</span>
          </Bubble>
          <Bubble caption="thinking — хмаринка" variant="thinking">
            <span style={{ fontSize: 60 }}>?</span>
          </Bubble>
          <Bubble caption="talking — Kubik говорить" variant="talking">
            <Icon name="speaker" size={56} />
          </Bubble>
          <Bubble caption="хвостик справа" tail="right">
            <Digits value={47} style={{ height: 64 }} />
          </Bubble>
        </div>
        <Hint>Тексту в бульбашці немає — дитина ще не читає; те саме звучить голосом.</Hint>
      </Section>
    </>
  );
}
