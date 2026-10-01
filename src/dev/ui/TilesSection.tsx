import { useState } from 'react';
import { AnswerTile, CheckButton, DigitCard, type TileState } from '../../components/ui';
import { FEEDBACK_LINES, praiseEcho } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { Cell, DevButton, Hint, Row, Section, Sub } from './UiSection';
import styles from './Ui.module.css';

/** Мініатюрне завдання на «Policz i dotknij»: вибір плитки озвучує число, перевіряє лише «Gotowe» (BRIEF §7). */
function PlayDemo() {
  const options = [6, 7, 8];
  const answer = 7;
  const [chosen, setChosen] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);

  const select = (n: number) => {
    setChosen(n);
    void tts.speak(numberWords(n), { interrupt: true });
  };
  const check = () => {
    if (chosen === null) return;
    if (chosen === answer) {
      setSolved(true);
      sfx.play('correct');
      void tts.speak(praiseEcho(numberWords(answer)), { interrupt: true });
    } else {
      setWrong((w) => [...w, chosen]);
      setChosen(null);
      sfx.play('retry');
      void tts.speak(FEEDBACK_LINES.retry, { interrupt: true });
    }
  };
  const reset = () => {
    tts.cancel();
    setChosen(null);
    setWrong([]);
    setSolved(false);
  };
  const stateOf = (n: number): TileState => {
    if (solved && n === answer) return 'correct';
    if (wrong.includes(n)) return 'retry';
    return chosen === n ? 'selected' : 'default';
  };

  return (
    <div className={styles.stage}>
      <div className={styles.controls}>
        {options.map((n) => (
          <AnswerTile key={n} value={n} dots={n} state={stateOf(n)} disabled={solved && n !== answer} onClick={() => select(n)} silent />
        ))}
        <CheckButton disabled={chosen === null || solved} onClick={check} silent />
        <DevButton onClick={reset}>↻ спочатку</DevButton>
      </div>
      <Hint>
        Правильна відповідь — 7. Торкнись плитки (вона озвучить число), потім «Gotowe». Неправильна плитка тьмяніє до 40 % і лишається на місці
        (рамка й стрілка непрозорі); правильна «вистрибує» із галочкою. Голос працює, якщо в браузері є польський.
      </Hint>
    </div>
  );
}

export function TilesSection() {
  // зміна key перемонтовує ряд — анімації correct / retry відтворюються знову
  const [replay, setReplay] = useState(0);
  return (
    <>
      <Section title="AnswerTile — стани" note="120×120 · радіус 20 · цифра 72 · контур 3 px ink · край #E3CFA8">
        <Row key={replay}>
          <Cell caption="default"><AnswerTile value={6} /></Cell>
          <Cell caption="pressed"><AnswerTile value={6} data-demo="pressed" /></Cell>
          <Cell caption="selected · кільце 4 px"><AnswerTile value={7} state="selected" /></Cell>
          <Cell caption="correct · зелена + галочка"><AnswerTile value={7} state="correct" /></Cell>
          <Cell caption="retry · вміст 40 %, рамка 100 %"><AnswerTile value={8} state="retry" /></Cell>
          <Cell caption="locked"><AnswerTile value={30} state="locked" /></Cell>
          <Cell caption="dragging ×1,1"><AnswerTile value={6} state="dragging" /></Cell>
          <Cell caption="focus-visible"><AnswerTile value={6} data-demo="focus" /></Cell>
          <Cell caption="highlighted (підказка)"><AnswerTile value={6} state="highlighted" /></Cell>
        </Row>
        <div className={styles.controls}>
          <DevButton onClick={() => setReplay((n) => n + 1)}>▶ показати анімації correct / retry знову</DevButton>
        </div>
        <Hint>
          Помилка: хитання ±6 px двічі (300 мс), без червоного. Правильно: «вистрибує» 350 мс, галочка промальовується. При prefers-reduced-motion
          рух замінюється згасанням 150 мс.
        </Hint>
      </Section>

      <Section title="AnswerTile — варіанти" note="W1: цифра + крапки · W4–W7: розряди · розміри за BRIEF §12">
        <Row>
          <Cell caption="W1 · 3"><AnswerTile value={3} dots={3} /></Cell>
          <Cell caption="W1 · 5"><AnswerTile value={5} dots={5} /></Cell>
          <Cell caption="W1 · 7 = 5 + 2"><AnswerTile value={7} dots={7} /></Cell>
          <Cell caption="W4–W7 · 47"><AnswerTile value={47} places /></Cell>
          <Cell caption="W4–W7 · 30"><AnswerTile value={30} places /></Cell>
          <Cell caption="розряди + correct: цифри ink"><AnswerTile value={47} places state="correct" /></Cell>
        </Row>
        <Sub>Розміри плитки: 1440×900 · 1024×768 · база 1280×720 · 390×844 · 844×390</Sub>
        <Row>
          <Cell caption="140 · цифра 80"><AnswerTile value={9} size={140} digit={80} /></Cell>
          <Cell caption="128 · цифра 76"><AnswerTile value={9} size={128} digit={76} /></Cell>
          <Cell caption="120 · цифра 72"><AnswerTile value={9} size={120} digit={72} /></Cell>
          <Cell caption="96 · цифра 56"><AnswerTile value={9} size={96} digit={56} /></Cell>
          <Cell caption="88 · цифра 49"><AnswerTile value={9} size={88} digit={49} /></Cell>
        </Row>
        <Hint>
          Двоцифрові: десятки #1A4FA0, одиниці #A34700 — лише на білій плитці; у correct (зелена заливка) обидві цифри стають ink.
          Справжній розмір плитки на цій сторінці залежить від ширини вікна (--kl-tile); нижня галерея показує всі п'ять в'юпортів.
        </Hint>
      </Section>

      <Section title="DigitCard" note="120×160 · радіус 20 · цифра 110 · картки цифр, доріжка, «Cyfra i obrazek», картка в лапах Kubika">
        <Row>
          <Cell caption="default"><DigitCard value={8} /></Cell>
          <Cell caption="highlighted · підказка / показ"><DigitCard value={8} state="highlighted" /></Cell>
          <Cell caption="selected"><DigitCard value={2} state="selected" /></Cell>
          <Cell caption="correct"><DigitCard value={2} state="correct" /></Cell>
          <Cell caption="retry"><DigitCard value={9} state="retry" /></Cell>
          <Cell caption="W1 · цифра + крапки кубика"><DigitCard value={6} dots={6} /></Cell>
          <Cell caption="0 — «zero» (W2)"><DigitCard value={0} /></Cell>
          <Cell caption="30 · розряди (W5–W6)"><DigitCard value={30} places /></Cell>
        </Row>
        <Hint>Перетягування завжди можна замінити двома дотиками: торкнутися предмета, потім місця.</Hint>
      </Section>

      <Section title="Міні-завдання з плитками" note="вибір → «Gotowe» → правильно / спробуй ще, зі звуком і голосом">
        <PlayDemo />
      </Section>
    </>
  );
}
