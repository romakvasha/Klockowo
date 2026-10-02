import { describe, expect, it } from 'vitest';
import { GAME_PROMPTS } from '../../speech/lines';
import { STORY_INTRO, STORY_OBJECTS, storyCombine, storyJoin } from '../../speech/stories';
import type { Level, StoryTask } from '../../curriculum/types';
import { sceneReserved } from '../engine/frameMath';
import { createRng } from '../engine/rng';
import { placeContent } from '../engine/placeContent';
import type { Assist, AssistContext, GenContext, SceneKind } from '../engine/types';
import { hintStory, storyFrame, storyMarks, togetherStory } from './assist';
import { checkStory, generateStory, storyAnswer, type StoryInstance } from './generate';
import { historyjki } from './index';
import { storyLayout } from './View';

const level: Level = { id: 'w3-4', world: 'w3', index: 4, kind: 'main', newIdea: true, skills: ['add-combine'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w3', index: previous.length, rng: createRng(seed), previous });
const spec = (over: Partial<StoryTask> = {}): StoryTask => ({ game: 'historyjki', skill: 'add-combine', sum: [3, 8], kind: 'join', answers: 'digit', ...over });
const instance = (over: Partial<StoryInstance> = {}): StoryInstance => ({
  game: 'historyjki', skill: 'add-combine', review: false, kind: 'join', object: 'rybka', other: 'rybka', a: 2, b: 3, answers: 'digit', options: [4, 5, 6], ...over,
});

describe('польські тексти історій', () => {
  it('«прийшло ще»: узгодження дієслова й числівника для 1, 2–4, 5+', () => {
    expect(storyJoin('rybka', 2, 3).full).toBe('Posłuchaj historyjki. W stawie pływają dwie rybki. Przypływają jeszcze trzy. Ile rybek jest teraz w stawie?');
    expect(storyJoin('rybka', 1, 5).setup).toBe('W stawie pływa jedna rybka.');
    expect(storyJoin('rybka', 5, 1).setup).toBe('W stawie pływa pięć rybek.');
    expect(storyJoin('rybka', 5, 1).arrival).toBe('Przypływa jeszcze jedna.');
    expect(storyJoin('rybka', 1, 2).arrival).toBe('Przypływają jeszcze dwie.');
    expect(storyJoin('rybka', 1, 5).arrival).toBe('Przypływa jeszcze pięć.');
    expect(storyJoin('rybka', 1, 4).arrival).toBe('Przypływają jeszcze cztery.');
  });

  it('сталий підмет («Fala przynosi») — знахідний: «jedną», «dwie»', () => {
    expect(storyJoin('muszelka', 3, 1).arrival).toBe('Fala przynosi jeszcze jedną.');
    expect(storyJoin('muszelka', 3, 2).arrival).toBe('Fala przynosi jeszcze dwie.');
    expect(storyJoin('muszelka', 4, 3).question).toBe('Ile muszelek jest teraz na plaży?');
  });

  it('усі сцени W3 читаються без цифр і без порожніх місць для чисел 1…9', () => {
    for (const object of STORY_OBJECTS) {
      for (let a = 1; a <= 9; a++) {
        for (let b = 1; b <= 10 - a; b++) {
          const { full } = storyJoin(object, a, b);
          expect(full, `${object} ${a}+${b}`).not.toMatch(/\d|undefined|NaN/);
          expect(full.startsWith(STORY_INTRO)).toBe(true);
          expect(full.endsWith('?')).toBe(true);
        }
      }
    }
  });

  it('«разом»: «Na obrazku są dwie rybki i trzy łódki. Ile jest razem?»', () => {
    expect(storyCombine('rybka', 'lodka', 2, 3)).toBe('Posłuchaj historyjki. Na obrazku są dwie rybki i trzy łódki. Ile jest razem?');
    expect(storyCombine('lodka', 'rybka', 1, 1)).toBe('Posłuchaj historyjki. Na obrazku są jedna łódka i jedna rybka. Ile jest razem?');
  });

  it('є сцени для чотирьох предметів W3', () => {
    expect([...STORY_OBJECTS].sort()).toEqual(['lodka', 'muszelka', 'rozgwiazda', 'rybka']);
  });

  it('приклад BRIEF збігається за будовою з нашими: «Posłuchaj historyjki.» + дві фрази + «Ile … jest teraz …?»', () => {
    expect(GAME_PROMPTS.storyExample).toMatch(/^Na gałęzi siedzą dwa ptaszki\. Przylatują jeszcze trzy\. Ile ptaszków jest teraz/);
  });
});

describe('відповідь «Historyjki»', () => {
  it('сума; check: правильно, на 1 поряд — «Prawie!», далі — хибно', () => {
    expect(storyAnswer({ a: 2, b: 3 })).toBe(5);
    expect(checkStory({ a: 2, b: 3 }, 5)).toEqual({ ok: true });
    expect(checkStory({ a: 2, b: 3 }, 6)).toEqual({ ok: false, almost: true });
    expect(checkStory({ a: 2, b: 3 }, 8)).toEqual({ ok: false, almost: false });
  });
});

describe('generateStory', () => {
  it('сума й доданки в межах, відповідь серед плиток, детерміновано', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const i = generateStory(spec({ sum: [4, 9] }), ctxFor(seed));
      expect(storyAnswer(i)).toBeGreaterThanOrEqual(4);
      expect(storyAnswer(i)).toBeLessThanOrEqual(9);
      expect(i.a).toBeGreaterThanOrEqual(1);
      expect(i.b).toBeGreaterThanOrEqual(1);
      expect(i.options).toContain(storyAnswer(i));
      expect(new Set(i.options).size).toBe(3);
      expect(generateStory(spec({ sum: [4, 9] }), ctxFor(seed))).toEqual(i);
    }
  });

  it('join — один предмет; combine — два різних; mixed дає обидва', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const join = generateStory(spec({ kind: 'join' }), ctxFor(seed));
      expect(join.kind).toBe('join');
      expect(join.other).toBe(join.object);
      const combine = generateStory(spec({ kind: 'combine' }), ctxFor(seed));
      expect(combine.kind).toBe('combine');
      expect(combine.other).not.toBe(combine.object);
      kinds.add(generateStory(spec({ kind: 'mixed' }), ctxFor(seed)).kind);
    }
    expect([...kinds].sort()).toEqual(['combine', 'join']);
  });

  it('не повторює відповідь двічі поспіль; суми 11–20 теж працюють', () => {
    for (let seed = 1; seed <= 100; seed++) expect(storyAnswer(generateStory(spec(), ctxFor(seed, [5])))).not.toBe(5);
    for (let seed = 1; seed <= 50; seed++) expect(storyAnswer(generateStory(spec({ sum: [11, 20] }), ctxFor(seed)))).toBeGreaterThanOrEqual(11);
  });

  it('генератор відхиляє чужу гру', () => {
    expect(() => historyjki.generate({ game: 'blysk', skill: 'subitize-5', count: [1, 5], pattern: 'dice', exposureMs: 1000, answers: 'digit' }, ctxFor(1))).toThrow('cannot generate');
  });
});

describe('гра як модуль рушія', () => {
  it('репліка — вся історія; похвала — «Brawo! Dwa dodać trzy równa się pięć.»', () => {
    expect(historyjki.prompt(instance())).toBe('Posłuchaj historyjki. W stawie pływają dwie rybki. Przypływają jeszcze trzy. Ile rybek jest teraz w stawie?');
    expect(historyjki.prompt(instance({ kind: 'combine', other: 'lodka' }))).toBe('Posłuchaj historyjki. Na obrazku są dwie rybki i trzy łódki. Ile jest razem?');
    expect(historyjki.praise(instance(), 'Brawo!')).toBe('Brawo! Dwa dodać trzy równa się pięć.');
    expect(historyjki.answer(instance())).toBe(5);
    expect(historyjki.kind).toBe('choice');
  });
});

describe('допомога', () => {
  const recorder = () => {
    const said: string[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = {
      say: async (t) => { said.push(t); },
      wait: async () => undefined,
      setAssist: (a) => { assists.push(a); },
    };
    return { said, assists, ctx };
  };

  it('1-ша підказка: лічба всіх предметів історії з номерками', async () => {
    const { said, assists, ctx } = recorder();
    await hintStory(instance(), ctx, { nth: 1, response: null });
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'cztery', 'pięć']);
    expect(assists.at(-1)).toEqual({ mode: 'hint', step: 5, level: 1 });
  });

  it('2-га підказка: рамка, «Zacznij od dwóch i licz dalej.» і лічба від числа', async () => {
    const { said, assists, ctx } = recorder();
    await hintStory(instance(), ctx, { nth: 2, response: null });
    expect(said).toEqual(['Zacznij od dwóch i licz dalej.', 'trzy', 'cztery', 'pięć']);
    expect(assists[0]).toEqual({ mode: 'hint', step: 2, level: 2 });
    expect(assists.at(-1)).toEqual({ mode: 'hint', step: 5, level: 2 });
  });

  it('показ разом: лічба від числа й «Dwa dodać trzy równa się pięć.»', async () => {
    const { said, assists, ctx } = recorder();
    await togetherStory(instance(), ctx);
    expect(said.at(0)).toBe('Zacznij od dwóch i licz dalej.');
    expect(said.at(-1)).toBe('Dwa dodać trzy równa się pięć.');
    expect(assists.every((a) => a.mode === 'together')).toBe(true);
  });

  it('storyMarks: лічба йде через перший кадр і продовжується у другому', () => {
    expect(storyMarks(2, 3, 0)).toEqual({ first: [null, null], second: [null, null, null] });
    expect(storyMarks(2, 3, 3)).toEqual({ first: [1, 2], second: [3, null, null] });
    expect(storyMarks(2, 3, 9)).toEqual({ first: [1, 2], second: [3, 4, 5] });
  });

  it('storyFrame: перша група суцільна, названі — теж, решта суми — тьмяна, далі порожні; 20 комірок для сум понад 10', () => {
    expect(storyFrame(2, 5, 2)).toEqual(['solid', 'solid', 'dim', 'dim', 'dim', 'empty', 'empty', 'empty', 'empty', 'empty']);
    expect(storyFrame(2, 5, 4).slice(0, 5)).toEqual(['solid', 'solid', 'solid', 'solid', 'dim']);
    expect(storyFrame(8, 14, 8)).toHaveLength(20);
  });
});

describe('кадри у сцені', () => {
  const cases: { kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
    { kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
    { kind: 'wide', vw: 1024, area: { w: 880, h: 400 } },
    { kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
    { kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
  ];

  it('усі три кадри вміщуються в сцену, не заходять на Kubika; портрет — стовпчик, решта — ряд', () => {
    for (const { kind, vw, area } of cases) {
      const layout = storyLayout(kind);
      expect(kind === 'portrait' ? layout.design.h > layout.design.w : layout.design.w > layout.design.h, kind).toBe(true);
      const reserved = sceneReserved(kind, vw, area);
      const p = placeContent(area, reserved, layout.design, { maxScale: 1.4 });
      expect(p.x + p.w, kind).toBeLessThanOrEqual(area.w);
      expect(p.y + p.h, kind).toBeLessThanOrEqual(area.h);
      for (const r of reserved) expect(p.x < r.x + r.w && r.x < p.x + p.w && p.y < r.y + r.h && r.y < p.y + p.h, kind).toBe(false);
      // предмет (до 56 px, у дев'яти — менше) лишається читабельним
      expect(p.scale, kind).toBeGreaterThan(0.4);
    }
  });
});
