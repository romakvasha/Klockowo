import { DotCard } from '../../components/math/DotCard';
import { GAME_PROMPTS, LABELS, flashReveal } from '../../speech/lines';
import { checkCount } from '../policzIDotknij/check';
import type { GameDef } from '../engine/types';
import { hintFlash, introFlash, togetherFlash } from './assist';
import { flashLayout, generateFromSpec, type FlashInstance } from './generate';
import { FlashScene } from './View';
import styles from './View.module.css';

/** «Błysk!» (BRIEF §7 гра 2): «Patrz uważnie! Ile kropek?» → картка на мить → вибір із 3 плиток → «Gotowe» → картка повертається з групами. */
export const blysk: GameDef<FlashInstance> = {
  id: 'blysk',
  kind: 'choice',
  generate: generateFromSpec,
  prompt: () => GAME_PROMPTS.blink,
  // бульбашка: сорочка картки (вона вже з «?») — що саме треба запам'ятати
  bubble: (i) => (
    <span className={styles.ask}>
      <DotCard layout={flashLayout(i)} face="back" size={64} world="w1" label={LABELS.dotCard} />
    </span>
  ),
  sceneLabel: () => LABELS.dotCard,
  tiles: (i) => i.options.map((value) => ({ value, dots: i.answers === 'digit' ? undefined : value })),
  answer: (i) => i.count,
  check: checkCount,
  // «Brawo! Trzy i dwa to pięć.»
  praise: (i, praise) => `${praise} ${flashReveal(i.groups)}`,
  intro: introFlash,
  hint: hintFlash,
  together: togetherFlash,
  Scene: FlashScene,
};
