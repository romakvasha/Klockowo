// Перелік усього, що гра може сказати поточною мовою, — для запису голосу (tools/voice/generate.mjs). Висловлювання — це текст одного tts.speak();
// вага — як часто його приблизно чує дитина (інструкція й похвала — щоразу, підказки рідше), щоб при обмежених кредитах записати найчутніше.
// Лише для розробки: у збірку гри не потрапляє (його ніхто з гри не імпортує).
import { adaptSpec } from '../../curriculum/adaptSpec';
import { LEVELS } from '../../curriculum/levels';
import { WORLD_KEYS, worldById } from '../../curriculum/worlds';
import { planLevel } from '../../games/engine/levelPlan';
import type { AssistContext, TaskBase } from '../../games/engine/types';
import { resolveGame } from '../../games/registry';
import { demoSteps, type DemoKind } from '../../screens/mission/ideaDemo';
import { stickerName } from '../../screens/StickerAlbum';
import { getLanguage } from '../../speech/language';
import { LANG_NATIVE_NAMES } from '../../speech/langCode';
import * as L from '../../speech/lines';
import { ANIMAL_IDS, OBJECTS, WORLD_OBJECT_IDS } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';

export type UtteranceKind = 'number' | 'screen' | 'game';

export interface Utterance {
  text: string;
  kind: UtteranceKind;
  /** Приблизно, скільки разів прозвучить за кілька тижнів гри (відносно, для порядку запису). */
  weight: number;
}

const DEMO_KINDS: readonly DemoKind[] = ['count', 'flash', 'plate', 'sum', 'compare', 'bus'];

/** Усі висловлювання поточною мовою. `seeds` — скільки варіантів кожного рівня перебрати (більше — повніше, але довше). */
export async function collectUtterances(seeds = 120): Promise<Utterance[]> {
  const all = new Map<string, Utterance>();
  const add = (text: string, kind: UtteranceKind, weight: number) => {
    const t = text.trim();
    if (!t) return;
    const prev = all.get(t);
    if (prev) prev.weight += weight;
    else all.set(t, { text: t, kind, weight });
  };

  // числа окремо: лічба, плитки, Plac Zabaw (до ста)
  for (let n = 0; n <= 100; n++) add(numberWords(n), 'number', 1);

  // екрани: Start, цуценята, місії, кінець рівня, світи, перерва, альбом, Plac Zabaw, батьківська пробна фраза
  const screen = (text: string, weight = 2) => add(text, 'screen', weight);
  for (const table of [L.START_LINES, L.MISSION_LINES, L.FEEDBACK_LINES, L.LEVEL_LINES, L.WORLD_INTROS, L.SESSION_LINES, L.ERROR_LINES]) {
    for (const text of Object.values(table)) screen(text, 5);
  }
  for (const text of L.PRAISE) screen(text, 5);
  for (const p of L.PUPS) screen(p.line);
  for (const text of [L.PLAYGROUND.review, L.PLAYGROUND.paint, L.PLAYGROUND.count]) screen(text);
  screen(L.BUTTONS.same);
  screen(LANG_NATIVE_NAMES[getLanguage()], 1);
  for (const e of L.BREAK_EXERCISES) screen(L.breakLine(e.verb, e.n));
  for (const animal of ANIMAL_IDS) screen(stickerName({ kind: 'animal', animal, owned: true, star: false } as Parameters<typeof stickerName>[0]), 1);
  for (const vehicle of ['balon', 'zaglowka', 'pociag', 'rakieta'] as const) screen(stickerName({ kind: 'vehicle', vehicle, owned: true } as Parameters<typeof stickerName>[0]), 1);
  for (const world of WORLD_KEYS) screen(stickerName({ kind: 'building', world, owned: true } as Parameters<typeof stickerName>[0]), 1);
  for (const id of Object.values(WORLD_OBJECT_IDS).flat()) {
    screen(L.missionLine(id, OBJECTS[id]), 3);
    for (const kind of DEMO_KINDS) for (const step of demoSteps(kind, OBJECTS[id])) if (step.say) screen(step.say, 1);
  }

  // ігри: усі рівні, кілька кроків складності; інструкція й похвала — щоразу, плитки — дотики, підказки — рідше
  for (const level of LEVELS) {
    const range = worldById(level.world).range;
    for (let seed = 1; seed <= seeds; seed++) {
      const step = [0, 0, 0, 1, -1, 2, -2][seed % 7] ?? 0;
      for (const task of planLevel(level, seed, resolveGame, { adapt: (spec) => adaptSpec(spec, step, range) })) {
        const def = task.def;
        if (!def) continue;
        const inst = task.instance as TaskBase;
        const answer = def.answer(inst);
        add(def.prompt(inst), 'game', 1);
        add(def.praise(inst, L.PRAISE[seed % L.PRAISE.length] ?? L.PRAISE[0]), 'game', 1);
        const said = (weight: number): AssistContext => ({ say: async (t) => add(t, 'game', weight), wait: async () => undefined, setAssist: () => undefined });
        if (def.intro) await def.intro(inst, said(1));
        for (let nth = 1; nth <= 2; nth++) {
          for (const response of [null, answer, Math.max(0, answer - 1), answer + 1]) await def.hint(inst, said(0.05), { nth, response });
        }
        await def.together(inst, said(0.1), { nth: 2, response: null });
      }
    }
  }
  return [...all.values()];
}
