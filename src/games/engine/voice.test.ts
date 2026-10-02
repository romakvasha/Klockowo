import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { adaptSpec } from '../../curriculum/adaptSpec';
import { LEVELS } from '../../curriculum/levels';
import { worldById } from '../../curriculum/worlds';
import { availableLanguages, setLanguage } from '../../speech/language';
import type { Lang } from '../../speech/langCode';
import { PRAISE } from '../../speech/lines';
import { resolveGame } from '../registry';
import { planLevel } from './levelPlan';
import type { Assist, AssistContext, TaskBase } from './types';

/** Усе, що може прозвучати в завданні (інструкція, похвала, вступ, підказки, показ «разом»), — для кожного рівня програми, кроків −2/0/2 і багатьох зерен,
 *  кожною мовою гри: числа лише словами (CLAUDE.md), жодних «undefined»/«NaN», зайвих пробілів, жодних слів іншої мови; плитки різні й містять відповідь;
 *  кроки допомоги — цілі числа. */
function recorder() {
  const said: string[] = [];
  const assists: Assist[] = [];
  const ctx: AssistContext = {
    say: async (text) => { said.push(text); },
    wait: async () => undefined,
    setAssist: (a) => { assists.push(a); },
  };
  return { said, assists, ctx };
}

/** Літери, яких не може бути в репліках мови: в українській — латиниці, в англійській — кирилиці й польських літер. */
const FOREIGN: Readonly<Record<Lang, RegExp | null>> = {
  pl: null,
  uk: /[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]/,
  en: /[Ѐ-ӿąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/,
};

function badSpeech(text: string, lang: Lang): string | null {
  if (!/\S/.test(text)) return 'порожньо';
  if (/\d/.test(text)) return 'цифри';
  if (/undefined|NaN|null|\[object/.test(text)) return 'сміття';
  if (/ {2}|^\s|\s$/.test(text)) return 'пробіли';
  if (/\s[.,!?]/.test(text)) return 'пробіл перед розділовим знаком';
  const foreign = FOREIGN[lang];
  if (foreign?.test(text)) return 'літери іншої мови';
  return null;
}

const STEPS = [-2, 0, 2] as const;
const SEEDS = 12;

for (const lang of availableLanguages()) {
  describe(`голос усіх завдань програми — ${lang}`, () => {
    beforeAll(() => setLanguage(lang));
    afterAll(() => setLanguage('pl'));

    for (const world of ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'] as const) {
      it(`${world}: інструкції, похвала, вступ, підказки й «разом» — без цифр, сміття й чужих слів`, async () => {
        const range = worldById(world).range;
        const problems: string[] = [];
        let spoken = 0;
        for (const level of LEVELS.filter((l) => l.world === world)) {
          for (const step of STEPS) {
            for (let seed = 1; seed <= SEEDS; seed++) {
              const plan = planLevel(level, seed, resolveGame, { adapt: (spec) => adaptSpec(spec, step, range) });
              for (const [i, task] of plan.entries()) {
                const def = task.def!;
                const inst = task.instance as TaskBase;
                const where = `${lang} ${level.id} step ${step} #${seed} завдання ${i} (${def.id})`;
                const answer = def.answer(inst);
                const texts: string[] = [def.prompt(inst), def.sceneLabel(inst), ...PRAISE.map((p) => def.praise(inst, p))];
                const responses = [null, answer, Math.max(0, answer - 1), answer + 1];
                const runs: Promise<void>[] = [];
                const rec = recorder();
                if (def.intro) runs.push(def.intro(inst, rec.ctx));
                for (let nth = 1; nth <= 3; nth++) for (const response of responses) runs.push(def.hint(inst, rec.ctx, { nth, response }));
                runs.push(def.together(inst, rec.ctx, { nth: 2, response: null }));
                await Promise.all(runs);
                spoken += rec.said.length;
                for (const text of [...texts, ...rec.said]) {
                  const bad = badSpeech(text, lang);
                  if (bad) problems.push(`${where}: ${bad} — «${text}»`);
                }
                for (const a of rec.assists) {
                  if (!Number.isInteger(a.step) || a.step < 0) problems.push(`${where}: крок допомоги ${JSON.stringify(a)}`);
                }
                if ((def.kindOf?.(inst) ?? def.kind) === 'choice') {
                  const values = def.tiles(inst).map((t) => t.value);
                  if (new Set(values).size !== values.length) problems.push(`${where}: однакові плитки ${values.join(',')}`);
                  if (!values.includes(answer)) problems.push(`${where}: серед плиток нема відповіді ${answer}`);
                  if (values.some((v) => !Number.isInteger(v) || v < 0 || v > 100)) problems.push(`${where}: плитка поза 0–100 ${values.join(',')}`);
                }
                if (!def.check(inst, answer).ok) problems.push(`${where}: правильна відповідь не проходить`);
              }
            }
          }
        }
        expect(problems.slice(0, 20)).toEqual([]);
        expect(spoken, 'підказки й «разом» справді щось кажуть').toBeGreaterThan(500);
      }, 60_000);
    }
  });
}
