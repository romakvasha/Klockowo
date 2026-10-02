import { Digits } from '../../components/ui/Digits';
import { GAME_PROMPTS, allWithDigit, findNumber, neighborAnswer, neighborQuestion, paintDigit, praiseEcho } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import type { GameDef } from '../engine/types';
import { hintChart, togetherChart } from './assist';
import { checkChart, chartAnswer, generateFromSpec, type ChartInstance } from './generate';
import { ChartScene } from './View';
import styles from './View.module.css';

/** Репліка-запитання: «Znajdź liczbę czterdzieści siedem.» · «Co kryje się pod listkiem?» · «Pomaluj liczby z piątką na końcu.» · «Tu jest liczba …. Która liczba jest o dziesięć większa?» (POLISH_COPY §5, гра 13). */
export function promptOf(i: ChartInstance): string {
  switch (i.mode) {
    case 'find': return findNumber(i.target);
    case 'hidden': return GAME_PROMPTS.underLeaf;
    case 'paint': return paintDigit(i.digit);
    case 'neighbors': return neighborQuestion(i.target, i.delta);
  }
}

/** «Tajemnicza tablica» (BRIEF §7 гра 13): таблиця 100 — мініатюра й лупа-рядок; find/paint — дія на таблиці й «Gotowe», hidden/neighbors — плитки. */
export const tajemniczaTablica: GameDef<ChartInstance> = {
  id: 'tajemniczaTablica',
  kind: 'choice',
  kindOf: (i) => (i.mode === 'find' || i.mode === 'paint' ? 'build' : 'choice'),
  // розфарбування — відповідь не є числом (1 = «усе вірно»), в історію вона не пишеться; find/hidden/neighbors — число
  recordsAnswer: true,
  generate: generateFromSpec,
  prompt: promptOf,
  // бульбашка Kubika: число, яке шукаємо (find), «?» (hidden), цифра (paint) чи базове число (neighbors)
  bubble: (i) => (
    <span className={styles.ask}>
      {i.mode === 'find' && <Digits value={i.target} places style={{ height: 36 }} />}
      {i.mode === 'hidden' && <b>?</b>}
      {i.mode === 'paint' && <Digits value={i.digit} style={{ height: 36 }} />}
      {i.mode === 'neighbors' && (
        <>
          <Digits value={i.target} places style={{ height: 36 }} />
          <b>±</b>
          <Digits value={Math.abs(i.delta)} style={{ height: 30 }} />
        </>
      )}
    </span>
  ),
  sceneLabel: promptOf,
  tiles: (i) => i.options.map((value) => ({ value, dots: undefined })),
  answer: chartAnswer,
  check: checkChart,
  // «Brawo! Czterdzieści siedem.» · «Brawo! Trzydzieści cztery, o dziesięć więcej to czterdzieści cztery.»
  praise: (i, praise) => {
    if (i.mode === 'neighbors') return `${praise} ${neighborAnswer(i.target, i.delta)}`;
    if (i.mode === 'paint') return `${praise} ${allWithDigit(i.digit)}`;
    return praiseEcho(numberWords(chartAnswer(i)), praise);
  },
  hint: hintChart,
  together: togetherChart,
  Scene: ChartScene,
};
