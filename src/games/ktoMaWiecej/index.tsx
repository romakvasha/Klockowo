import { ObjectArt } from '../../components/math/ObjectArt';
import { GAME_PROMPTS, LABELS, praiseEcho, whoHasLess, whoHasMore } from '../../speech/lines';
import { OBJECTS } from '../../speech/nouns';
import type { GameDef } from '../engine/types';
import { hintCompare, resultText, togetherCompare } from './assist';
import { checkCompare, generateFromSpec, type CompareInstance } from './generate';
import { CompareScene } from './View';
import styles from './View.module.css';

/** Інструкція: «Kto ma więcej marchewek?» / «Kto ma mniej marchewek?»; коли можливе «Tyle samo» — ще й «A może tyle samo?». */
export function comparePrompt(i: Pick<CompareInstance, 'ask' | 'item' | 'equalPossible'>): string {
  const noun = OBJECTS[i.item];
  const question = i.ask === 'more' ? whoHasMore(noun) : whoHasLess(noun);
  return i.equalPossible ? `${question} ${GAME_PROMPTS.orSame}` : question;
}

/** «Kto ma więcej?» (BRIEF §7 гра 6): дві тваринки з купками → дотик до більшої (чи меншої) купки або «Tyle samo» → «Gotowe» → предмети стають парами, зайві світяться. */
export const ktoMaWiecej: GameDef<CompareInstance> = {
  id: 'ktoMaWiecej',
  kind: 'build',
  // відповідь — «ліва / права / порівну», а не число для порівняння: в історію (answer/wrong) воно не йде
  recordsAnswer: false,
  generate: generateFromSpec,
  prompt: comparePrompt,
  // бульбашка Kubika: предмет і «?»
  bubble: (i) => (
    <span className={styles.ask}>
      <ObjectArt object={i.item} size={56} />
      <b>?</b>
    </span>
  ),
  sceneLabel: () => LABELS.compare,
  tiles: () => [],
  answer: (i) => i.correct,
  check: checkCompare,
  // «Brawo! Miś ma więcej marchewek.» / «Brawo! Tyle samo.»
  praise: (i, praise) => praiseEcho(resultText(i), praise),
  hint: hintCompare,
  together: togetherCompare,
  Scene: CompareScene,
};
