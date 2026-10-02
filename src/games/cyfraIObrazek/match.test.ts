import { describe, expect, it } from 'vitest';
import { kindAllowed } from '../../components/math/setFaces';
import type { Level, MatchTask } from '../../curriculum/types';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext } from '../engine/types';
import { hintMatch, hintTarget, hintTargets, togetherMatch } from './assist';
import { generateMatch, pickKind, pickNumbers, shuffledOrder, type MatchInstance } from './generate';
import { cyfraIObrazek } from './index';
import {
  checkMatch, decodeLinks, encodeLinks, isComplete, keepCorrect, linkPair, mistakenSets, setOfDigit, unlinkDigit, unlinkSet, wrongSets,
} from './match';
import { helpFocus, togetherLinks } from './View';

const LEVEL: Level = { id: 'w2-3', world: 'w2', index: 3, kind: 'main', newIdea: false, skills: ['digit-quantity'], tasks: [], draft: false };
const ctxFor = (seed: number): GenContext => ({ level: LEVEL, world: 'w2', index: 0, rng: createRng(seed), previous: [] });
const spec = (over: Partial<MatchTask> = {}): MatchTask => ({
  game: 'cyfraIObrazek', skill: 'digit-quantity', pairs: 3, numbers: [1, 5], set: 'objects', ...over,
});

describe('кодування зв\'язків', () => {
  it('encode ↔ decode: усі часткові й повні зв\'язки для 2–4 пар', () => {
    for (let k = 2; k <= 4; k++) {
      const options: (number | null)[] = [null, ...Array.from({ length: k }, (_, j) => j)];
      const total = options.length ** k;
      const seen = new Set<number>();
      for (let n = 0; n < total; n++) {
        const links = Array.from({ length: k }, (_, i) => options[Math.floor(n / options.length ** i) % options.length]!);
        const code = encodeLinks(links);
        expect(decodeLinks(code, k)).toEqual(links);
        seen.add(code);
      }
      expect(seen.size).toBe(total);
    }
  });

  it('нічого не зв\'язано — 0; null декодується як «нічого»', () => {
    expect(encodeLinks([null, null, null])).toBe(0);
    expect(decodeLinks(null, 3)).toEqual([null, null, null]);
    expect(decodeLinks(0, 2)).toEqual([null, null]);
  });

  it('isComplete — коли в усіх наборів є пара', () => {
    expect(isComplete([0, 1])).toBe(true);
    expect(isComplete([0, null])).toBe(false);
    expect(isComplete([])).toBe(false);
  });
});

describe('пари один до одного', () => {
  it('linkPair: плитка переходить до нового набору, старий її втрачає; старий зв\'язок набору замінюється', () => {
    expect(linkPair([null, null, null], 0, 2)).toEqual([2, null, null]);
    expect(linkPair([2, null, null], 1, 2)).toEqual([null, 2, null]);
    expect(linkPair([2, 1, null], 0, 0)).toEqual([0, 1, null]);
    expect(linkPair([0, 1, 2], 0, 1)).toEqual([1, null, 2]);
  });

  it('unlinkSet / unlinkDigit / setOfDigit', () => {
    expect(unlinkSet([0, 1], 0)).toEqual([null, 1]);
    expect(unlinkDigit([0, 1], 1)).toEqual([0, null]);
    expect(setOfDigit([2, null, 0], 0)).toBe(2);
    expect(setOfDigit([2, null, 0], 1)).toBeNull();
  });

  it('wrongSets — без пари чи з хибною; mistakenSets — лише з хибною; keepCorrect лишає правильні', () => {
    const correct = [1, 0, 2];
    expect(wrongSets(correct, [1, 2, null])).toEqual([1, 2]);
    expect(mistakenSets(correct, [1, 2, null])).toEqual([1]);
    expect(keepCorrect(correct, [1, 2, 2])).toEqual([1, null, 2]);
    expect(wrongSets(correct, [1, 0, 2])).toEqual([]);
  });

  it('checkMatch: правильно лише коли всі пари збігаються; «Prawie!» тут нема', () => {
    const correct = [2, 0, 1];
    expect(checkMatch(correct, encodeLinks([2, 0, 1]))).toEqual({ ok: true });
    expect(checkMatch(correct, encodeLinks([0, 2, 1]))).toEqual({ ok: false, almost: false });
    expect(checkMatch(correct, encodeLinks([1, 0, 2]))).toEqual({ ok: false, almost: false });
  });
});

describe('генератор', () => {
  it('pickNumbers: k різних у діапазоні; нуль обов\'язковий для навички zero', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const n = pickNumbers([1, 5], 3, false, createRng(seed));
      expect(new Set(n).size).toBe(3);
      expect(n.every((x) => x >= 1 && x <= 5)).toBe(true);
      expect(pickNumbers([0, 5], 3, true, createRng(seed))).toContain(0);
    }
    expect(() => pickNumbers([1, 2], 3, false, createRng(1))).toThrow(RangeError);
  });

  it('pickKind: заданий спосіб; понад 10 — предмети; mixed — без повторів, поки є вибір', () => {
    expect(pickKind('dots', 5, [], createRng(1))).toBe('dots');
    expect(pickKind('dots', 14, [], createRng(1))).toBe('objects');
    expect(pickKind('fingers', 10, [], createRng(1))).toBe('fingers');
    const used = ['objects', 'dots', 'fingers'] as const;
    expect(pickKind('mixed', 5, used, createRng(1))).toBe('tenFrame');
    expect(pickKind('mixed', 15, [], createRng(1))).toBe('objects');
    for (let seed = 1; seed <= 30; seed++) expect(kindAllowed(pickKind('mixed', 9, [], createRng(seed)), 9)).toBe(true);
  });

  it('shuffledOrder: перестановка, не тотожна', () => {
    for (let k = 2; k <= 4; k++) {
      for (let seed = 1; seed <= 40; seed++) {
        const order = shuffledOrder(k, createRng(seed));
        expect([...order].sort()).toEqual(Array.from({ length: k }, (_, i) => i));
        expect(order.some((v, i) => v !== i)).toBe(true);
      }
    }
  });

  it('інваріанти: цифри — перестановка кількостей, correct вказує на плитку з потрібною цифрою, кінд дозволений для числа', () => {
    const specs = [spec(), spec({ pairs: 2 }), spec({ pairs: 4, numbers: [0, 10], set: 'mixed' }), spec({ pairs: 3, numbers: [0, 5], set: 'dots', skill: 'zero' }), spec({ pairs: 4, numbers: [11, 20], set: 'mixed' })];
    for (const s of specs) {
      for (let seed = 1; seed <= 40; seed++) {
        const t = generateMatch(s, ctxFor(seed));
        const counts = t.sets.map((x) => x.count);
        expect(new Set(counts).size).toBe(s.pairs);
        expect([...t.digits].sort((a, b) => a - b)).toEqual([...counts].sort((a, b) => a - b));
        t.sets.forEach((set, i) => {
          expect(t.digits[t.correct[i]!]).toBe(set.count);
          expect(kindAllowed(set.kind, set.count)).toBe(true);
          expect(set.count).toBeGreaterThanOrEqual(s.numbers[0]);
          expect(set.count).toBeLessThanOrEqual(s.numbers[1]);
        });
        expect(new Set(t.correct).size).toBe(s.pairs);
        expect(t.correct.some((c, i) => c !== i)).toBe(true);
        expect(new Set(t.sets.map((x) => x.object)).size).toBe(Math.min(s.pairs, 4));
      }
    }
  });

  it('skill zero: нуль серед наборів; у способі dots нуль — порожня картка (count 0)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const t = generateMatch(spec({ skill: 'zero', numbers: [0, 5], set: 'fingers' }), ctxFor(seed));
      expect(t.sets.map((s) => s.count)).toContain(0);
    }
  });

  it('детермінований: те саме зерно — те саме завдання', () => {
    expect(generateMatch(spec(), ctxFor(5))).toEqual(generateMatch(spec(), ctxFor(5)));
  });

  it('гра: відповідь — кодування правильних пар; перевірка; похвала читає числа за порядком наборів', () => {
    const t = generateMatch(spec({ pairs: 3 }), ctxFor(8));
    expect(cyfraIObrazek.answer(t)).toBe(encodeLinks(t.correct));
    expect(cyfraIObrazek.check(t, cyfraIObrazek.answer(t))).toEqual({ ok: true });
    expect(cyfraIObrazek.tiles(t)).toEqual([]);
    expect(cyfraIObrazek.recordsAnswer).toBe(false);
    expect(cyfraIObrazek.prompt(t)).toBe('Połącz obrazki z liczbami.');
    const fixed: MatchInstance = { ...t, sets: t.sets.map((s, i) => ({ ...s, count: [3, 1, 2][i]! })) };
    expect(cyfraIObrazek.praise(fixed, 'Brawo!')).toBe('Brawo! Trzy, jeden, dwa.');
  });
});

describe('допомога Kubika', () => {
  const instance: MatchInstance = {
    game: 'cyfraIObrazek', skill: 'digit-quantity', review: false,
    sets: [
      { count: 3, kind: 'objects', object: 'jablko', seed: 1 },
      { count: 0, kind: 'objects', object: 'gruszka', seed: 2 },
      { count: 2, kind: 'dots', object: 'truskawka', seed: 3 },
    ],
    digits: [2, 3, 0],
    correct: [1, 2, 0],
  };
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

  it('hintTarget: перший набір без правильної пари; усі правильні — перший', () => {
    expect(hintTarget([1, 2, 0], [1, null, null])).toBe(1);
    expect(hintTarget([1, 2, 0], [null, 2, 0])).toBe(0);
    expect(hintTarget([1, 2, 0], [1, 2, 0])).toBe(0);
    expect(hintTargets([1, 2, 0], [1, 0, null])).toEqual([1, 2]);
    expect(hintTargets([1, 2, 0], [1, 2, 0])).toEqual([0, 1, 2]);
  });

  it('1-ша підказка лічить один набір (перший без правильної пари) і не називає підсумок', async () => {
    const { said, assists, ctx } = recorder();
    // у відповіді дитини перший набір уже з'єднано правильно (плитка 1), другий — ні
    await hintMatch(instance, ctx, { nth: 1, response: encodeLinks([1, null, null]) });
    expect(said).toEqual(['Tu nic nie ma.']); // набір 1 порожній (нуль)
    expect(assists).toEqual([{ mode: 'hint', step: 0, focus: 1, level: 1 }]);
  });

  it('1-ша підказка для набору з предметами: «jeden, dwa, trzy», step росте, focus — набір', async () => {
    const { said, assists, ctx } = recorder();
    await hintMatch(instance, ctx, { nth: 1, response: null });
    expect(said).toEqual(['jeden', 'dwa', 'trzy']);
    expect(assists.map((a) => [a.step, a.focus, a.level])).toEqual([[1, 0, 1], [2, 0, 1], [3, 0, 1]]);
  });

  it('2-га підказка лічить усі набори без правильної пари, по черзі', async () => {
    const { said, assists, ctx } = recorder();
    await hintMatch(instance, ctx, { nth: 2, response: encodeLinks([1, null, null]) });
    expect(said).toEqual(['Tu nic nie ma.', 'jeden', 'dwa']);
    expect(assists.map((a) => [a.focus, a.step, a.level])).toEqual([[1, 0, 2], [2, 1, 2], [2, 2, 2]]);
  });

  it('показ разом: лічить кожен набір і одразу з\'єднує (step = кількість + 1); нуль — «Tu nic nie ma.» і зв\'язок', async () => {
    const { said, assists, ctx } = recorder();
    await togetherMatch(instance, ctx);
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'Tu nic nie ma.', 'jeden', 'dwa']);
    expect(assists.every((a) => a.mode === 'together')).toBe(true);
    const links = assists.filter((a) => a.step > instance.sets[a.focus!]!.count);
    expect(links.map((a) => [a.focus, a.step])).toEqual([[0, 4], [1, 1], [2, 3]]);
  });

  it('helpFocus: фокус, лічильник на картці, чи з\'єднано', () => {
    expect(helpFocus(instance, { mode: 'none', step: 0 })).toEqual({ focus: null, counted: null, linked: false });
    expect(helpFocus(instance, { mode: 'hint', step: 2, focus: 0, level: 1 })).toEqual({ focus: 0, counted: 2, linked: false });
    expect(helpFocus(instance, { mode: 'hint', step: 0, focus: 1, level: 1 })).toEqual({ focus: 1, counted: 0, linked: false });
    expect(helpFocus(instance, { mode: 'together', step: 4, focus: 0 })).toEqual({ focus: 0, counted: 3, linked: true });
    expect(helpFocus(instance, { mode: 'together', step: 1, focus: 1 })).toEqual({ focus: 1, counted: 0, linked: true });
  });

  it('togetherLinks: Kubik з\'єднав набори до фокусного (фокусний — лише коли пораховано)', () => {
    expect(togetherLinks(instance, 0, false)).toEqual([null, null, null]);
    expect(togetherLinks(instance, 0, true)).toEqual([1, null, null]);
    expect(togetherLinks(instance, 2, false)).toEqual([1, 2, null]);
    expect(togetherLinks(instance, 2, true)).toEqual([1, 2, 0]);
  });
});
