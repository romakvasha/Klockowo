import { describe, expect, it } from 'vitest';
import { SPACE_PAD, SPACE_W, UNIT, lineX, rocketAnchor, ROCKET_H, SPACE_LINE_Y, ticks } from '../components/math/spaceGeometry';
import type { JumpTask, Level, StoryTask } from '../curriculum/types';
import { createRng } from './engine/rng';
import type { Assist, AssistContext, GenContext } from './engine/types';
import { BIG_MAX, addendOf, landings, pickBigPair, type Addend } from './bigAdd';
import { generateJump, landing, pickRocketOptions, type JumpInstance } from './skokiZabki/generate';
import { skokiZabki } from './skokiZabki';
import { hintRocket, hintStops, togetherRocket } from './skokiZabki/rocketAssist';
import { rocketPos } from './skokiZabki/RocketView';
import { generateStory, isBigStory, storyAnswer } from './historyjki/generate';
import { historyjki } from './historyjki';
import { hintStory, togetherStory } from './historyjki/assist';

const level: Level = { id: 'w7-1', world: 'w7', index: 1, kind: 'main', newIdea: true, skills: ['add-tens'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w7', index: previous.length, rng: createRng(seed), previous });
const ADDENDS: readonly Addend[] = ['tens', 'ten', 'ones', 'bridge'];

describe('pickBigPair', () => {
  it('кожен вид додавання дає пару, що справді є цим видом; сума ≤ 100', () => {
    for (const addend of ADDENDS) {
      for (let seed = 1; seed <= 300; seed++) {
        const [a, b] = pickBigPair(addend, createRng(seed));
        const tag = `${addend}#${seed}: ${a}+${b}`;
        expect(a + b, tag).toBeLessThanOrEqual(BIG_MAX);
        expect(a, tag).toBeGreaterThanOrEqual(10);
        expect(b, tag).toBeGreaterThanOrEqual(1);
        expect(addendOf(a, b), tag).toBe(addend);
      }
    }
  });

  it('tens: обидва кратні 10; ten: b = 10; ones: без переходу (a % 10 + b ≤ 9); bridge: a % 10 + b ≥ 10 і сума ≤ 99', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const [ta, tb] = pickBigPair('tens', createRng(seed));
      expect(ta % 10 === 0 && tb % 10 === 0).toBe(true);
      const [na, nb] = pickBigPair('ten', createRng(seed));
      expect(nb).toBe(10);
      expect(na % 10).not.toBe(0);
      const [oa, ob] = pickBigPair('ones', createRng(seed));
      expect((oa % 10) + ob).toBeLessThanOrEqual(9);
      expect(ob).toBeLessThanOrEqual(9);
      const [ba, bb] = pickBigPair('bridge', createRng(seed));
      expect((ba % 10) + bb).toBeGreaterThanOrEqual(10);
      expect(ba + bb).toBeLessThanOrEqual(99);
    }
  });

  it('діапазон першого доданка поважається (де можливо)', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const [a] = pickBigPair('ones', createRng(seed), [41, 59]);
      expect(a).toBeGreaterThanOrEqual(41);
      expect(a).toBeLessThanOrEqual(59);
    }
  });

  it('addendOf: 30 + 20 → tens, 34 + 10 → ten, 42 + 5 → ones, 38 + 5 → bridge; недопустимі → null', () => {
    expect(addendOf(30, 20)).toBe('tens');
    expect(addendOf(34, 10)).toBe('ten');
    expect(addendOf(42, 5)).toBe('ones');
    expect(addendOf(38, 5)).toBe('bridge');
    expect(addendOf(95, 9)).toBeNull();
    expect(addendOf(34, 15)).toBeNull();
  });
});

describe('landings: зупинки ракети', () => {
  it('десятки — по +10; +10 — одна зупинка; одиниці — по одній; через десяток — спершу до десятка', () => {
    expect(landings(30, 20)).toEqual([40, 50]);
    expect(landings(34, 10)).toEqual([44]);
    expect(landings(42, 5)).toEqual([43, 44, 45, 46, 47]);
    expect(landings(38, 5)).toEqual([40, 41, 42, 43]);
    expect(landings(8, 5)).toEqual([10, 11, 12, 13]);
    expect(landings(30, 30)).toEqual([40, 50, 60]);
  });

  it('остання зупинка — завжди сума; зупинки зростають', () => {
    for (const addend of ADDENDS) {
      for (let seed = 1; seed <= 100; seed++) {
        const [a, b] = pickBigPair(addend, createRng(seed));
        const stops = landings(a, b);
        expect(stops.at(-1), `${a}+${b}`).toBe(a + b);
        for (let i = 1; i < stops.length; i++) expect(stops[i]!).toBeGreaterThan(stops[i - 1]!);
      }
    }
  });
});

describe('пряма 0–100', () => {
  it('lineX монотонна й лежить у межах; 101 позначка, 11 підписаних десятків', () => {
    expect(lineX(0)).toBe(SPACE_PAD);
    expect(lineX(100)).toBeCloseTo(SPACE_W - SPACE_PAD);
    for (let n = 1; n <= 100; n++) expect(lineX(n) - lineX(n - 1)).toBeCloseTo(UNIT);
    expect(() => lineX(101)).toThrow(RangeError);
    expect(() => lineX(-1)).toThrow(RangeError);
    const t = ticks();
    expect(t).toHaveLength(101);
    expect(t.filter((x) => x.labelled).map((x) => x.n)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(t.find((x) => x.n === 5)!.h).toBeGreaterThan(t.find((x) => x.n === 4)!.h);
    expect(t.find((x) => x.n === 10)!.h).toBeGreaterThan(t.find((x) => x.n === 5)!.h);
  });

  it('ракета стоїть над лінією й вміщується над нею', () => {
    const a = rocketAnchor(34);
    expect(a.x).toBe(lineX(34));
    expect(a.y - ROCKET_H).toBeGreaterThanOrEqual(0);
    expect(a.y).toBeLessThanOrEqual(SPACE_LINE_Y);
  });
});

describe('ракета в «Skoki żabki»', () => {
  const spec = (over: Partial<JumpTask> = {}): JumpTask => ({
    game: 'skokiZabki', skill: 'add-tens', vehicle: 'rocket', addend: 'tens', max: 100, start: [11, 99], jumps: [1, 1], pads: 'numbered', tapJumps: true, answers: 'digit', ...over,
  });
  const instance = (over: Partial<JumpInstance> = {}): JumpInstance => ({
    game: 'skokiZabki', skill: 'plus-ten', review: false, vehicle: 'rocket', max: 100, start: 34, jumps: 10, pads: 'numbered', tapJumps: true, addend: 'ten', answers: 'digit', options: [33, 44, 54], ...over,
  });

  it('генератор: старт і відстань відповідають виду додавання, відповідь серед плиток, детерміновано', () => {
    for (const addend of ADDENDS) {
      for (let seed = 1; seed <= 100; seed++) {
        const i = generateJump(spec({ addend }), ctxFor(seed));
        expect(i.vehicle).toBe('rocket');
        expect(i.max).toBe(100);
        expect(addendOf(i.start, i.jumps)).toBe(addend);
        expect(i.options).toContain(landing(i));
        expect(new Set(i.options).size).toBe(3);
        expect(generateJump(spec({ addend }), ctxFor(seed))).toEqual(i);
      }
    }
  });

  it('pickRocketOptions: плитки в [0, 100]; для десятків — «не ті десятки» (±10, ±20)', () => {
    for (let answer = 0; answer <= 100; answer += 1) {
      for (const addend of ADDENDS) {
        const o = pickRocketOptions(answer, addend, createRng(answer + 1));
        expect(o).toHaveLength(3);
        expect(new Set(o).size).toBe(3);
        expect(o).toContain(answer);
        for (const n of o) {
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(100);
        }
      }
    }
    const o = pickRocketOptions(50, 'tens', createRng(1));
    expect(o.filter((n) => Math.abs(n - 50) % 10 === 0)).toHaveLength(3);
  });

  it('репліка й похвала: «Rakieta jest na liczbie trzydzieści cztery. Leci o dziesięć dalej. Gdzie wyląduje?» / «…dodać dziesięć równa się czterdzieści cztery.»', () => {
    expect(skokiZabki.prompt(instance())).toBe('Rakieta jest na liczbie trzydzieści cztery. Leci o dziesięć dalej. Gdzie wyląduje?');
    expect(skokiZabki.praise(instance(), 'Brawo!')).toBe('Brawo! Trzydzieści cztery dodać dziesięć równa się czterdzieści cztery.');
    expect(skokiZabki.answer(instance())).toBe(44);
  });

  it('rocketPos: старт, потім зупинки, не далі за посадку', () => {
    const i = instance({ start: 42, jumps: 5, addend: 'ones' });
    expect(rocketPos(i, 0)).toBe(42);
    expect(rocketPos(i, 1)).toBe(43);
    expect(rocketPos(i, 5)).toBe(47);
    expect(rocketPos(i, 99)).toBe(47);
  });

  const recorder = () => {
    const said: string[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = { say: async (t) => { said.push(t); }, wait: async () => undefined, setAssist: (a) => { assists.push(a); } };
    return { said, assists, ctx };
  };

  it('1-ша підказка: політ зупинками без останньої + «I co dalej?»; для однієї зупинки — повний політ', async () => {
    const a = recorder();
    await hintRocket(instance({ start: 42, jumps: 5, addend: 'ones' }), a.ctx, { nth: 1, response: null });
    expect(a.said).toEqual(['czterdzieści trzy', 'czterdzieści cztery', 'czterdzieści pięć', 'czterdzieści sześć', 'I co dalej?']);
    const b = recorder();
    await hintRocket(instance(), b.ctx, { nth: 1, response: null });
    expect(b.said).toEqual(['czterdzieści cztery']);
    expect(hintStops(1)).toBe(1);
    expect(hintStops(4)).toBe(3);
  });

  it('2-га підказка: маршрут порожніми кільцями й репліка; «разом» — усі зупинки й рівняння', async () => {
    const a = recorder();
    await hintRocket(instance(), a.ctx, { nth: 2, response: null });
    expect(a.said).toEqual(['Rakieta jest na liczbie trzydzieści cztery. Leci o dziesięć dalej. Gdzie wyląduje?']);
    expect(a.assists).toEqual([{ mode: 'hint', step: 0, level: 2 }]);
    const b = recorder();
    await togetherRocket(instance({ start: 38, jumps: 5, addend: 'bridge' }), b.ctx);
    expect(b.said).toEqual(['czterdzieści', 'czterdzieści jeden', 'czterdzieści dwa', 'czterdzieści trzy', 'Trzydzieści osiem dodać pięć równa się czterdzieści trzy.']);
    expect(b.assists.at(-1)?.step).toBe(4);
  });
});

describe('двоцифрові «Historyjki» (W7)', () => {
  const spec = (over: Partial<StoryTask> = {}): StoryTask => ({
    game: 'historyjki', skill: 'story-problems', sum: [21, 99], kind: 'join', addend: 'ones', answers: 'digit', ...over,
  });

  it('пара відповідає виду додавання; сума в межах; плитки містять відповідь; детерміновано', () => {
    for (const addend of ADDENDS) {
      for (let seed = 1; seed <= 100; seed++) {
        const i = generateStory(spec({ addend }), ctxFor(seed));
        expect(addendOf(i.a, i.b), `${addend}#${seed}`).toBe(addend);
        expect(isBigStory(i)).toBe(true);
        expect(i.options).toContain(storyAnswer(i));
        expect(generateStory(spec({ addend }), ctxFor(seed))).toEqual(i);
      }
    }
  });

  it('межі суми поважаються: 40…60', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateStory(spec({ addend: 'ten', sum: [40, 60] }), ctxFor(seed));
      expect(storyAnswer(i)).toBeGreaterThanOrEqual(40);
      expect(storyAnswer(i)).toBeLessThanOrEqual(60);
    }
  });

  it('текст історії з двоцифровими числами: узгодження й без цифр', () => {
    for (const addend of ADDENDS) {
      for (let seed = 1; seed <= 60; seed++) {
        const i = generateStory(spec({ addend, kind: 'mixed' }), ctxFor(seed));
        const prompt = historyjki.prompt(i);
        expect(prompt, `${addend}#${seed}`).not.toMatch(/\d|undefined|NaN/);
        expect(historyjki.praise(i, 'Brawo!')).not.toMatch(/\d|undefined|NaN/);
      }
    }
  });

  const recorder = () => {
    const said: string[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = { say: async (t) => { said.push(t); }, wait: async () => undefined, setAssist: (a) => { assists.push(a); } };
    return { said, assists, ctx };
  };

  it('підказка: «Zacznij od trzydziestu czterech i licz dalej.» і зупинки; «разом» — ще й рівняння', async () => {
    const i = generateStory(spec({ addend: 'ten' }), ctxFor(3));
    const a = recorder();
    await hintStory(i, a.ctx, { nth: 1, response: null });
    expect(a.said[0]).toMatch(/^Zacznij od .* i licz dalej\.$/);
    expect(a.said).toHaveLength(2);
    const b = recorder();
    await togetherStory(i, b.ctx);
    expect(b.said.at(-1)).toMatch(/dodać dziesięć równa się/);
    expect(b.assists.every((s) => s.mode === 'together')).toBe(true);
  });
});
