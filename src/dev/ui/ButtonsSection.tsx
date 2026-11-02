import { useState } from 'react';
import { BUTTONS, LABELS } from '../../speech/lines';
import { CheckButton, IconButton, PlayButton, actionColor, type IconName } from '../../components/ui';
import { Cell, DevButton, Hint, Row, Section } from './UiSection';
import styles from './Ui.module.css';

/** Дії дитини: одна дія — одна іконка — один колір цеглинки (полотно D1, ACTION_COLOR). */
const ACTIONS: ReadonlyArray<{ icon: IconName; label: string; note: string }> = [
  { icon: 'home', label: BUTTONS.map, note: '«Mapa» · HUD ліворуч' },
  { icon: 'speaker', label: BUTTONS.listen, note: '«Posłuchaj» · HUD праворуч, пульсує раз' },
  { icon: 'bulb', label: BUTTONS.help, note: '«Pomóż mi» — після 1-ї помилки' },
  { icon: 'next', label: BUTTONS.next, note: '«Dalej»' },
  { icon: 'retry', label: BUTTONS.again, note: '«Jeszcze raz», «Wyczyść»' },
  { icon: 'stickers', label: BUTTONS.stickers, note: '«Naklejki»' },
  { icon: 'badge', label: LABELS.badges, note: '«Odznaki» — жетон-цеглинка (★ лише для гілок)' },
  { icon: 'close', label: BUTTONS.close, note: '«Zamknij», «Stop»' },
  { icon: 'pour', label: BUTTONS.pour, note: '«Wsyp!» (Ile razem?)' },
  { icon: 'pack', label: BUTTONS.pack, note: '«Zapakuj» (Paczki)' },
];

/** «Posłuchaj» пульсує один раз; щоб показати знову, скидаємо й вмикаємо прапор. */
function PulseDemo() {
  const [pulse, setPulse] = useState(false);
  const replay = () => {
    setPulse(false);
    requestAnimationFrame(() => setPulse(true));
  };
  return (
    <>
      <IconButton icon="speaker" label={BUTTONS.listen} pulse={pulse} onClick={replay} />
      <DevButton onClick={replay}>▶ pulse (1 раз)</DevButton>
    </>
  );
}

export function ButtonsSection() {
  return (
    <>
      <Section title="PlayButton" note="«Graj!» · зелена цеглинка, 2 пупирці · висота 120 (Start, Wprowadzenie) / 96 (телефон), ширина × 1,6">
        <div className={styles.stage}>
          <Row>
            <Cell caption="default"><PlayButton /></Cell>
            <Cell caption="pressed — «вдавлюється» на 5 px"><PlayButton data-demo="pressed" /></Cell>
            <Cell caption="focus-visible"><PlayButton data-demo="focus" /></Cell>
            <Cell caption="idle · «дихання» 2,4 с"><PlayButton idle /></Cell>
            <Cell caption="size 96 · телефон"><PlayButton size={96} /></Cell>
          </Row>
        </div>
        <Hint>Бриф §4: кнопки дитини — лише іконки, тож «Graj!» — трикутник (слово звучить при дотику й іде в aria-label).</Hint>
      </Section>

      <Section title="IconButton" note="кругла цеглинка з 1 пупирцем · 72 px на ПК, 80 на телефоні · значок 56 % · колір — від дії">
        {ACTIONS.map(({ icon, label, note }) => (
          <div key={icon} className={styles.variant}>
            <div className={styles.variantName}>
              {actionColor(icon)}
              <span>{note}</span>
            </div>
            <div className={styles.variantCells}>
              <Cell caption="default"><IconButton icon={icon} label={label} /></Cell>
              <Cell caption="pressed"><IconButton icon={icon} label={label} data-demo="pressed" /></Cell>
              <Cell caption="focus-visible"><IconButton icon={icon} label={label} data-demo="focus" /></Cell>
              <Cell caption="size 80"><IconButton icon={icon} label={label} size={80} /></Cell>
              {icon === 'speaker' && <PulseDemo />}
              {icon === 'next' && <Cell caption="88 · Koniec poziomu"><IconButton icon="next" label={BUTTONS.next} size={88} /></Cell>}
            </div>
          </div>
        ))}
        <Hint>Натисни будь-яку кнопку: м'який «тик» (після першого дотику). Hover ні на що не впливає. Колір можна змінити пропом color.</Hint>
      </Section>

      <Section title="CheckButton" note="«Gotowe» · помаранчева цеглинка · 120×88 (телефон 80×80) · є в кожному завданні з вибором">
        <div className={styles.stage}>
          <Row>
            <Cell caption="disabled · нічого не вибрано"><CheckButton disabled /></Cell>
            <Cell caption="default"><CheckButton /></Cell>
            <Cell caption="pressed"><CheckButton data-demo="pressed" /></Cell>
            <Cell caption="focus-visible"><CheckButton data-demo="focus" /></Cell>
          </Row>
        </div>
        <Hint>
          Дотик до плитки лише вибирає її й озвучує число; перевірка — тільки по «Gotowe». Неактивна кнопка — пласка бліда, без краю й пупирців,
          сіра пунктирна рамка + сіра галочка (не лише колір). Полотно D1: «Gotowe» 168×104 — розмір зміниться разом із розкладкою (D3).
        </Hint>
      </Section>
    </>
  );
}
