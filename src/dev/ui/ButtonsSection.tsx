import { useState } from 'react';
import { BUTTONS } from '../../speech/lines';
import { CheckButton, IconButton, PlayButton, type IconButtonVariant, type IconName } from '../../components/ui';
import { Cell, DevButton, Hint, Row, Section } from './UiSection';
import styles from './Ui.module.css';

const VARIANTS: ReadonlyArray<{ variant: IconButtonVariant; icon: IconName; label: string; note: string }> = [
  { variant: 'neutral', icon: 'home', label: BUTTONS.map, note: '«Mapa», «Naklejki», «Zamknij»' },
  { variant: 'secondary', icon: 'speaker', label: BUTTONS.listen, note: '«Posłuchaj»' },
  { variant: 'primary', icon: 'next', label: BUTTONS.next, note: '«Dalej»' },
  { variant: 'hint', icon: 'bulb', label: BUTTONS.help, note: '«Pomóż mi» — після 1-ї помилки' },
  { variant: 'retry', icon: 'retry', label: BUTTONS.again, note: '«Jeszcze raz» (службові стани)' },
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
      <IconButton icon="speaker" label={BUTTONS.listen} variant="secondary" pulse={pulse} onClick={replay} />
      <DevButton onClick={replay}>▶ pulse (1 раз)</DevButton>
    </>
  );
}

export function ButtonsSection() {
  return (
    <>
      <Section title="PlayButton" note="«Graj!» · primary · 160 (Start) / 120 (Wprowadzenie) / 96 (телефон) · іконка 45 %">
        <Row>
          <Cell caption="default"><PlayButton /></Cell>
          <Cell caption="pressed (показано примусово)"><PlayButton data-demo="pressed" /></Cell>
          <Cell caption="focus-visible"><PlayButton data-demo="focus" /></Cell>
          <Cell caption="idle · «дихання» 2,4 с"><PlayButton idle /></Cell>
          <Cell caption="size 120"><PlayButton size={120} /></Cell>
          <Cell caption="size 96"><PlayButton size={96} /></Cell>
        </Row>
      </Section>

      <Section title="IconButton" note="72 px на ПК · 80 на телефоні · іконка 40 / 44 · кнопки дитини — лише іконки, слово = aria-label і голос">
        {VARIANTS.map(({ variant, icon, label, note }) => (
          <div key={variant} className={styles.variant}>
            <div className={styles.variantName}>
              {variant}
              <span>{note}</span>
            </div>
            <div className={styles.variantCells}>
              <Cell caption="default"><IconButton icon={icon} label={label} variant={variant} /></Cell>
              <Cell caption="pressed"><IconButton icon={icon} label={label} variant={variant} data-demo="pressed" /></Cell>
              <Cell caption="focus-visible"><IconButton icon={icon} label={label} variant={variant} data-demo="focus" /></Cell>
              <Cell caption="size 80"><IconButton icon={icon} label={label} variant={variant} size={80} /></Cell>
              {variant === 'neutral' && (
                <Cell caption="«Zamknij»"><IconButton icon="close" label={BUTTONS.close} /></Cell>
              )}
              {variant === 'secondary' && <PulseDemo />}
              {variant === 'primary' && (
                <Cell caption="88 · Koniec poziomu"><IconButton icon="next" label={BUTTONS.next} variant="primary" size={88} /></Cell>
              )}
            </div>
          </div>
        ))}
        <Hint>Натисни будь-яку кнопку: м'який «тик» (після першого дотику). Hover ні на що не впливає.</Hint>
      </Section>

      <Section title="CheckButton" note="«Gotowe» · 120×88 (телефон 80×80) · є в кожному завданні з вибором">
        <Row>
          <Cell caption="disabled · нічого не вибрано"><CheckButton disabled /></Cell>
          <Cell caption="default"><CheckButton /></Cell>
          <Cell caption="pressed"><CheckButton data-demo="pressed" /></Cell>
          <Cell caption="focus-visible"><CheckButton data-demo="focus" /></Cell>
        </Row>
        <Hint>
          Дотик до плитки лише вибирає її й озвучує число; перевірка — тільки по «Gotowe». Неактивна кнопка — пласка, без краю,
          сіра рамка + сіра галочка (не лише колір).
        </Hint>
      </Section>
    </>
  );
}
