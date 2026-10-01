import { useState } from 'react';
import { AvatarButton, IconButton, Overlay, Slider, Toggle } from '../../components/ui';
import { BUTTONS, LEVEL_LINES, PARENT, PRAISE, profileMapLabel } from '../../speech/lines';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { PlayerPup, type PupId } from '../../characters';
import { Cell, DevButton, Hint, Row, Section } from './UiSection';
import styles from './Ui.module.css';

const S = PARENT.settings;

function Pup({ id }: { id: PupId }) {
  return <PlayerPup id={id} />;
}

function AvatarRow() {
  return (
    <Row>
      <Cell caption="default · пастель профілю">
        <AvatarButton profileName="Ola" showName><Pup id="pudel" /></AvatarButton>
      </Cell>
      <Cell caption="pressed">
        <AvatarButton profileName="Ola" showName data-demo="pressed"><Pup id="pudel" /></AvatarButton>
      </Cell>
      <Cell caption="focus-visible">
        <AvatarButton profileName="Staś" tint="w3" showName data-demo="focus"><Pup id="nowofundland" /></AvatarButton>
      </Cell>
      <Cell caption="без імені">
        <AvatarButton tint="w6" showName><Pup id="papillon" /></AvatarButton>
      </Cell>
      <Cell caption="72 · Mapa przygody">
        <AvatarButton size={72} profileName="Ola" aria-label={profileMapLabel('Ola')}><Pup id="pudel" /></AvatarButton>
      </Cell>
    </Row>
  );
}

function ToggleList() {
  const [reduce, setReduce] = useState(true);
  const [extra, setExtra] = useState(false);
  const [unlock, setUnlock] = useState(false);
  return (
    <div className={styles.toggles}>
      <Toggle label={S.reduceMotion} checked={reduce} onChange={setReduce} />
      <Toggle label={S.extraTasks} checked={extra} onChange={setExtra} />
      <Toggle label={S.unlockWorld} checked={unlock} onChange={setUnlock} data-demo="focus" />
    </div>
  );
}

function SliderList() {
  const [speech, setSpeech] = useState(80);
  const [effects, setEffects] = useState(60);
  const [music, setMusic] = useState(30);
  const [rate, setRate] = useState(0.9);
  return (
    <div className={styles.sliders}>
      <p className={styles.group}>{S.volume}</p>
      <Slider
        label={S.speech}
        value={speech}
        valueText={`${speech}%`}
        step={10}
        onChange={setSpeech}
        onCommit={() => void tts.speak(PRAISE[0], { interrupt: true })}
      />
      <Slider
        label={S.effects}
        value={effects}
        valueText={`${effects}%`}
        step={10}
        data-demo="focus"
        onChange={setEffects}
        onCommit={() => sfx.play('correct')}
      />
      <Slider label={S.music} value={music} valueText={`${music}%`} step={10} data-demo="dragging" onChange={setMusic} />
      <p className={styles.group}>{S.speechRate}</p>
      <Slider
        label={S.speechRate}
        startLabel={S.slower}
        endLabel={S.faster}
        value={rate}
        min={0.7}
        max={1.2}
        step={0.1}
        showTicks
        onChange={setRate}
      />
    </div>
  );
}

function OverlayDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DevButton onClick={() => setOpen(true)}>Відкрити Overlay «{LEVEL_LINES.newSticker}»</DevButton>
      <Overlay open={open} label={LEVEL_LINES.newSticker} onClose={() => setOpen(false)}>
        <div className={styles.placeholder}>вміст</div>
        <IconButton icon="next" label={BUTTONS.next} variant="primary" onClick={() => setOpen(false)} />
      </Overlay>
    </>
  );
}

export function FormsSection() {
  return (
    <>
      <Section title="AvatarButton" note="160 (Start) · 72 (Mapa, угорі ліворуч) · тло — пастель профілю · ім'я лише для дорослого">
        <AvatarRow />
      </Section>

      <Section title="Overlay" note="затемнення ink 55 % · панель радіус 24 · scale .9 → 1 + згасання 300 мс · «Zamknij» 72 у кутку">
        <OverlayDemo />
        <Hint>
          Тло нерухоме, дотик повз панель її не закриває (дитина не закриє випадково), Esc закриває. Поки Overlay відкрито, решта застосунку
          недоступна для фокуса. Фокус повертається на кнопку, що його відкрила.
        </Hint>
      </Section>

      <Section title="Toggle" note="Strefa rodzica · рядок 56 px · перемикач 56×32, зона дотику 64×44 · клікабельний увесь рядок">
        <ToggleList />
        <Hint>Третій рядок — focus-visible. Space перемикає з клавіатури; диктор називає «switch» і стан.</Hint>
      </Section>

      <Section title="Slider" note="«Głośność», «Tempo mowy» · трек 8 · кулька 28 · зона 44">
        <SliderList />
        <Hint>
          Справжній input range: стрілки клавіатури крокують по 10 % (темп — 0,1). Перетягування — кулька 36 px з тінню. Другий повзунок —
          focus-visible, третій — перетягування. Після відпускання «Mowa» звучить пробна фраза «Brawo!», «Efekty» — звук «правильно».
        </Hint>
      </Section>
    </>
  );
}
