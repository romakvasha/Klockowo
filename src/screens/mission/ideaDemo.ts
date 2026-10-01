// «Patrz, pokażę ci.»: коротка демонстрація нової ідеї рівня у Wprowadzenie (BRIEF §6.6, до 20 с). Чисті дані: вид демонстрації за навичкою
// і кроки «стадія + що каже голос». Малює їх IdeaPanel; послідовністю керує Mission через startScript, тож картинка йде в такт голосу.
import type { SkillId } from '../../curriculum/types';
import { GAME_PROMPTS, addSentence, thereIs, twoGroups } from '../../speech/lines';
import type { Noun } from '../../speech/nouns';
import { numberWords } from '../../speech/numberWords';

/** count — торкаємося предметів і рахуємо; flash — крапки на мить («Błysk!»); plate — кладемо на тарілку рівно стільки; sum — дві групи разом. */
export type DemoKind = 'count' | 'flash' | 'plate' | 'sum';

const SUM_SKILLS: ReadonlySet<SkillId> = new Set<SkillId>([
  'add-combine', 'plus-equals', 'count-on', 'bonds-5-10', 'doubles', 'add-no-bridge-20', 'bridge-ten', 'add-tens', 'plus-ten',
  'add-2digit-1digit', 'add-with-bridge', 'story-problems',
]);

/** Вид демонстрації за першою навичкою рівня; невідомі й ще не оформлені навички показуємо як лічбу. */
export function demoKindFor(skills: readonly SkillId[]): DemoKind {
  const first = skills[0];
  if (first === 'subitize-5') return 'flash';
  if (first === 'give-n') return 'plate';
  if (first !== undefined && SUM_SKILLS.has(first)) return 'sum';
  return 'count';
}

export interface DemoStep {
  /** Стадія картинки; сенс залежить від виду (див. IdeaPanel): лічба й тарілка — кількість «зарахованих» предметів, n + 1 — підсумок. */
  stage: number;
  /** Репліка Kubika на цьому кроці (поки вона звучить, стадія видима). */
  say?: string;
  /** Пауза після репліки, мс. */
  hold: number;
}

/** Скільки предметів показуємо у демонстрації (лічба, крапки, тарілка). */
export const DEMO_COUNT = 3;
/** Доданки демонстрації «разом»: 3 + 2 = 5 (борд etap2/18). */
export const DEMO_SUM: readonly [number, number] = [3, 2];

export function demoSteps(kind: DemoKind, noun: Noun): DemoStep[] {
  const n = DEMO_COUNT;
  const counted = (): DemoStep[] =>
    Array.from({ length: n }, (_, i) => ({ stage: i + 1, say: numberWords(i + 1), hold: 250 }));
  switch (kind) {
    case 'count':
    case 'plate':
      return [{ stage: 0, hold: 600 }, ...counted(), { stage: n + 1, say: thereIs(n, noun), hold: 900 }];
    case 'flash':
      return [
        { stage: 0, say: GAME_PROMPTS.blink, hold: 300 },
        { stage: 1, hold: 1200 },
        { stage: 2, say: numberWords(n), hold: 900 },
      ];
    case 'sum': {
      const [a, b] = DEMO_SUM;
      return [
        { stage: 0, say: twoGroups(a, b, noun), hold: 400 },
        { stage: 1, hold: 500 },
        { stage: 2, say: addSentence(a, b), hold: 900 },
      ];
    }
  }
}

/** Скільки мс триває демонстрація без голосу (для довідки й тесту: бриф обмежує вступ 20 с). */
export function demoPausesMs(steps: readonly DemoStep[]): number {
  return steps.reduce((sum, s) => sum + s.hold, 0);
}
