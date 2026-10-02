import { ObjectArt } from '../../components/math/ObjectArt';
import { Digits } from '../../components/ui/Digits';
import { buildNumber, howManyTogether, packInstruction, placeValue } from '../../speech/lines';
import { OBJECTS } from '../../speech/nouns';
import type { GameDef } from '../engine/types';
import { hintPack, togetherPack } from './assist';
import { checkPack, generateFromSpec, packAnswer, type PackInstance } from './generate';
import { PaczkiScene } from './View';
import styles from './View.module.css';

/** «Zapakuj jagody po dziesięć. Ile jest jagód razem?» (loose) · «Ile jest jagód razem?» (packed) · «Zbuduj liczbę czterdzieści siedem.» (build) — POLISH_COPY §5, гра 12. */
export function promptOf(i: PackInstance): string {
  const noun = OBJECTS[i.object];
  if (i.mode === 'build') return buildNumber(i.total);
  return i.mode === 'loose' ? `${packInstruction(noun)} ${howManyTogether(noun)}` : howManyTogether(noun);
}

/** «Paczki po dziesięć» (BRIEF §7 гра 12): пакуємо по 10 → «dziesięć, dwadzieścia…» → «Ile razem?» → «Gotowe» → «Cztery dziesiątki i siedem jedności to czterdzieści siedem.» */
export const paczkiPoDziesiec: GameDef<PackInstance> = {
  id: 'paczkiPoDziesiec',
  kind: 'choice',
  kindOf: (i) => (i.mode === 'build' ? 'build' : 'choice'),
  generate: generateFromSpec,
  prompt: promptOf,
  // бульбашка Kubika: предмет і «?» (loose, packed) або число, яке треба зібрати (build)
  bubble: (i) =>
    i.mode === 'build' ? (
      <span className={styles.ask}>
        <Digits value={i.total} places style={{ height: 36 }} />
      </span>
    ) : (
      <span className={styles.ask}>
        <ObjectArt object={i.object} size={52} />
        <b>?</b>
      </span>
    ),
  sceneLabel: promptOf,
  tiles: (i) => i.options.map((value) => ({ value, dots: undefined })),
  answer: packAnswer,
  check: checkPack,
  // «Brawo! Cztery dziesiątki i siedem jedności to czterdzieści siedem.»
  praise: (i, praise) => `${praise} ${placeValue(i.total)}`,
  hint: hintPack,
  together: togetherPack,
  Scene: PaczkiScene,
};
