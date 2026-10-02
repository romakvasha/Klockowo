import { describe, expect, it } from 'vitest';
import { placeContent } from '../engine/placeContent';
import type { HouseTask, Level } from '../../curriculum/types';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext, SceneKind } from '../engine/types';
import { sceneReserved } from '../engine/frameMath';
import { frameMarks, hintHouse, togetherHouse } from './assist';
import { WHOLE_MAX, WHOLE_MIN, checkHouse, generateHouse, houseAnswer, pickHouseOptions, type HouseInstance } from './generate';
import { domekLiczb } from './index';
import { DESIGN, frameCell, frameState } from './View';

const level: Level = { id: 'w3-1', world: 'w3', index: 1, kind: 'main', newIdea: false, skills: ['bonds-5-10'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w3', index: previous.length, rng: createRng(seed), previous });
const spec = (over: Partial<HouseTask> = {}): HouseTask => ({
  game: 'domekLiczb', skill: 'bonds-5-10', whole: [5, 10], missing: 'any', show: 'digits', answers: 'digit', ...over,
});
const instance = (over: Partial<HouseInstance> = {}): HouseInstance => ({
  game: 'domekLiczb', skill: 'bonds-5-10', review: false, whole: 8, known: 3, missing: 'right', show: 'digits', answers: 'digit', object: 'rybka', options: [3, 4, 5], ...over,
});

describe('відповідь «Domek liczb»', () => {
  it('друга частина цілого', () => {
    expect(houseAnswer({ whole: 8, known: 3 })).toBe(5);
    expect(houseAnswer({ whole: 10, known: 9 })).toBe(1);
  });

  it('check: правильно, на 1 поряд — «Prawie!», далі — просто хибно', () => {
    expect(checkHouse({ whole: 8, known: 3 }, 5)).toEqual({ ok: true });
    expect(checkHouse({ whole: 8, known: 3 }, 4)).toEqual({ ok: false, almost: true });
    expect(checkHouse({ whole: 8, known: 3 }, 3)).toEqual({ ok: false, almost: false });
  });
});

describe('pickHouseOptions', () => {
  it('три різні числа за зростанням у [1, стеля]; серед них відповідь і відома частина, коли вона інша', () => {
    for (let whole = WHOLE_MIN; whole <= WHOLE_MAX; whole++) {
      for (let known = 1; known < whole; known++) {
        const answer = whole - known;
        const options = pickHouseOptions(answer, known, whole, createRng(whole * 31 + known));
        expect(options, `${whole}=${known}+?`).toHaveLength(3);
        expect(new Set(options).size).toBe(3);
        expect(options).toEqual([...options].sort((a, b) => a - b));
        expect(options).toContain(answer);
        for (const n of options) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(Math.max(3, whole - 1));
        }
        if (known !== answer && whole > 4) expect(options, `${whole}=${known}+?`).toContain(known);
      }
    }
  });
});

describe('generateHouse', () => {
  it('ціле в діапазоні, відома частина 1…ціле−1, відповідь є серед плиток, детерміновано', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateHouse(spec({ whole: [4, 9] }), ctxFor(seed));
      expect(i.whole).toBeGreaterThanOrEqual(4);
      expect(i.whole).toBeLessThanOrEqual(9);
      expect(i.known).toBeGreaterThanOrEqual(1);
      expect(i.known).toBeLessThan(i.whole);
      expect(i.options).toContain(houseAnswer(i));
      expect(generateHouse(spec({ whole: [4, 9] }), ctxFor(seed))).toEqual(i);
    }
  });

  it('діапазон обрізається до 3–20; віконце «навмання» дає обидва боки; ліве/праве — як у завданні', () => {
    const sides = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) {
      const i = generateHouse(spec({ whole: [-5, 99] }), ctxFor(seed));
      expect(i.whole).toBeGreaterThanOrEqual(WHOLE_MIN);
      expect(i.whole).toBeLessThanOrEqual(WHOLE_MAX);
      sides.add(i.missing);
      expect(generateHouse(spec({ missing: 'left' }), ctxFor(seed)).missing).toBe('left');
      expect(generateHouse(spec({ missing: 'right' }), ctxFor(seed)).missing).toBe('right');
    }
    expect(sides).toEqual(new Set(['left', 'right']));
  });

  it('найменше ціле 3 — три плитки 1, 2, 3', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const i = generateHouse(spec({ whole: [3, 3] }), ctxFor(seed));
      expect(i.options).toEqual([1, 2, 3]);
    }
  });

  it('відповідь не повторюється підряд, коли є з чого вибрати', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const i = generateHouse(spec({ whole: [6, 10] }), ctxFor(seed, [4]));
      expect(houseAnswer(i)).not.toBe(4);
    }
  });
});

describe('гра «Domek liczb»', () => {
  it('інструкція — «Osiem to trzy i ile?», похвала — склад числа', () => {
    expect(domekLiczb.prompt(instance())).toBe('Osiem to trzy i ile?');
    expect(domekLiczb.praise(instance(), 'Brawo!')).toBe('Brawo! Trzy i pięć to osiem.');
    expect(domekLiczb.answer(instance())).toBe(5);
    expect(domekLiczb.kind).toBe('choice');
  });

  it('плитки: цифри чи цифри з крапками', () => {
    expect(domekLiczb.tiles(instance())).toEqual([3, 4, 5].map((value) => ({ value, dots: undefined })));
    expect(domekLiczb.tiles(instance({ answers: 'digitDots' }))).toEqual([3, 4, 5].map((value) => ({ value, dots: value })));
  });

  it('generate з іншої гри — помилка', () => {
    expect(() => domekLiczb.generate({ game: 'blysk', skill: 'subitize-5', count: [1, 3], pattern: 'dice', exposureMs: 2000, answers: 'digit' }, ctxFor(1))).toThrow();
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

  it('1-ша підказка: Kubik лічить відому частину й каже «Zacznij od trzech i licz dalej.»', async () => {
    const { said, assists, ctx } = recorder();
    await hintHouse(instance(), ctx, { nth: 1, response: null });
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'Zacznij od trzech i licz dalej.']);
    expect(assists.map((a) => a.step)).toEqual([0, 1, 2, 3]);
    expect(assists.every((a) => a.mode === 'hint' && a.level === 1)).toBe(true);
  });

  it('2-га підказка: рамка-десятка й повтор запитання', async () => {
    const { said, assists, ctx } = recorder();
    await hintHouse(instance(), ctx, { nth: 2, response: null });
    expect(said).toEqual(['Osiem to trzy i ile?']);
    expect(assists).toEqual([{ mode: 'hint', step: 0, level: 2 }]);
  });

  it('показ разом: лічить фішки, яких бракує, і підсумовує', async () => {
    const { said, assists, ctx } = recorder();
    await togetherHouse(instance(), ctx);
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'Trzy i pięć to osiem.']);
    expect(assists.at(-1)).toEqual({ mode: 'together', step: 5 });
  });

  it('frameMarks: номери йдуть по тьмяних комірках після відомої частини, не далі відповіді', () => {
    expect(frameMarks(3, 5, 0, 10)).toEqual(Array(10).fill(null));
    expect(frameMarks(3, 5, 2, 10)).toEqual([null, null, null, 1, 2, null, null, null, null, null]);
    expect(frameMarks(3, 5, 99, 10)).toEqual([null, null, null, 1, 2, 3, 4, 5, null, null]);
  });
});

describe('рамка й композиція', () => {
  it('frameState: відомі суцільні, решта до цілого тьмяні, далі порожні; з відповіддю — усе суцільне', () => {
    expect(frameState(8, 3, false)).toEqual(['solid', 'solid', 'solid', 'dim', 'dim', 'dim', 'dim', 'dim', 'empty', 'empty']);
    expect(frameState(8, 3, true).filter((c) => c === 'solid')).toHaveLength(8);
    expect(frameState(15, 4, false)).toHaveLength(20);
    expect(frameState(10, 10 - 1, false).filter((c) => c === 'dim')).toHaveLength(1);
  });

  it('рамка для 11–20 — дрібніші комірки (дві рамки влізають у двір)', () => {
    expect(frameCell(10)).toBeGreaterThan(frameCell(11));
    const frames = 2;
    expect(frames * (2 * frameCell(20) + 6) + 8).toBeLessThanOrEqual(120);
  });

  it('композиція вміщується в сцену в усіх виглядах і не заходить на Kubika', () => {
    const cases: { kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
      { kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
      { kind: 'wide', vw: 1024, area: { w: 880, h: 400 } },
      { kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
      { kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
    ];
    for (const { kind, vw, area } of cases) {
      const reserved = sceneReserved(kind, vw, area);
      const p = placeContent(area, reserved, DESIGN);
      expect(p.scale).toBeGreaterThan(0.35);
      expect(p.x + p.w).toBeLessThanOrEqual(area.w);
      expect(p.y + p.h).toBeLessThanOrEqual(area.h);
      for (const r of reserved) expect(p.x < r.x + r.w && r.x < p.x + p.w && p.y < r.y + r.h && r.y < p.y + p.h, kind).toBe(false);
    }
  });
});
