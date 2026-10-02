import { describe, expect, it } from 'vitest';
import { padLayout } from '../../components/math/padLayout';
import type { JumpTask, Level } from '../../curriculum/types';
import { sceneReserved } from '../engine/frameMath';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext, SceneKind } from '../engine/types';
import { assistJumped, frogPad, hintJump, hintJumps, togetherJump } from './assist';
import { checkJump, generateJump, landing, pickJumpOptions, type JumpInstance } from './generate';
import { skokiZabki } from './index';
import { FROG_HIT, pickPond } from './View';

const level: Level = { id: 'w3-1', world: 'w3', index: 1, kind: 'main', newIdea: false, skills: ['count-on'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w3', index: previous.length, rng: createRng(seed), previous });
const spec = (over: Partial<JumpTask> = {}): JumpTask => ({
  game: 'skokiZabki', skill: 'count-on', max: 10, start: [0, 7], jumps: [1, 3], pads: 'numbered', tapJumps: true, answers: 'digit', ...over,
});
const instance = (over: Partial<JumpInstance> = {}): JumpInstance => ({
  game: 'skokiZabki', skill: 'count-on', review: false, max: 10, start: 4, jumps: 3, pads: 'numbered', tapJumps: true, answers: 'digit', options: [6, 7, 8], ...over,
});

describe('відповідь «Skoki żabki»', () => {
  it('приземлення = старт + стрибки; check: правильно, на 1 поряд — «Prawie!», далі — хибно', () => {
    expect(landing({ start: 4, jumps: 3 })).toBe(7);
    expect(checkJump({ start: 4, jumps: 3 }, 7)).toEqual({ ok: true });
    expect(checkJump({ start: 4, jumps: 3 }, 6)).toEqual({ ok: false, almost: true });
    expect(checkJump({ start: 4, jumps: 3 }, 4)).toEqual({ ok: false, almost: false });
  });
});

describe('pickJumpOptions', () => {
  it('три різні числа в [0, max] за зростанням; серед них приземлення й «стартовий листок порахували стрибком» (на 1 менше)', () => {
    for (const max of [10, 20]) {
      for (let start = 0; start < max; start++) {
        for (let jumps = 1; start + jumps <= max; jumps++) {
          const options = pickJumpOptions(start, jumps, max, createRng(max * 1000 + start * 31 + jumps));
          const name = `${start}+${jumps}/${max}`;
          expect(options, name).toHaveLength(3);
          expect(new Set(options).size, name).toBe(3);
          expect(options).toEqual([...options].sort((a, b) => a - b));
          expect(options).toContain(start + jumps);
          expect(options).toContain(start + jumps - 1);
          for (const n of options) {
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThanOrEqual(max);
          }
        }
      }
    }
  });
});

describe('generateJump', () => {
  it('старт і приземлення — у межах прямої, стрибків у межах діапазону, детерміновано', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = spec({ jumps: [2, 5], start: [0, 9] });
      const i = generateJump(s, ctxFor(seed));
      expect(i.jumps).toBeGreaterThanOrEqual(2);
      expect(i.jumps).toBeLessThanOrEqual(5);
      expect(i.start).toBeGreaterThanOrEqual(0);
      expect(landing(i)).toBeLessThanOrEqual(10);
      expect(i.options).toContain(landing(i));
      expect(generateJump(s, ctxFor(seed))).toEqual(i);
    }
  });

  it('0–20: приземлення до 20, стрибки до 8', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateJump(spec({ max: 20, start: [0, 18], jumps: [2, 8] }), ctxFor(seed));
      expect(landing(i)).toBeLessThanOrEqual(20);
      expect(i.max).toBe(20);
    }
  });

  it('жабка не вистрибує за край, навіть коли діапазони «не влазять»', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateJump(spec({ start: [8, 10], jumps: [3, 5] }), ctxFor(seed));
      expect(landing(i)).toBeLessThanOrEqual(10);
      expect(i.start).toBeGreaterThanOrEqual(0);
    }
  });

  it('не повторює приземлення двічі поспіль, коли є з чого вибрати', () => {
    for (let seed = 1; seed <= 100; seed++) expect(landing(generateJump(spec(), ctxFor(seed, [5])))).not.toBe(5);
  });

  it('переносить прапорці з TaskSpec', () => {
    const i = generateJump(spec({ pads: 'landmarks', tapJumps: false, review: true }), ctxFor(1));
    expect(i).toMatchObject({ pads: 'landmarks', tapJumps: false, review: true, skill: 'count-on', game: 'skokiZabki' });
  });
});

describe('гра як модуль рушія', () => {
  it('репліка: «Żabka jest na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?» (BRIEF §7); один стрибок — «raz»', () => {
    expect(skokiZabki.prompt(instance())).toBe('Żabka jest na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?');
    expect(skokiZabki.prompt(instance({ jumps: 1 }))).toBe('Żabka jest na liczbie cztery. Skacze raz. Gdzie wyląduje?');
  });

  it('похвала: «Brawo! Cztery i trzy to siedem.»; плитки з крапками лише для digitDots', () => {
    expect(skokiZabki.praise(instance(), 'Brawo!')).toBe('Brawo! Cztery i trzy to siedem.');
    expect(skokiZabki.tiles(instance()).map((t) => t.dots)).toEqual([undefined, undefined, undefined]);
    expect(skokiZabki.tiles(instance({ answers: 'digitDots' })).map((t) => t.dots)).toEqual([6, 7, 8]);
    expect(skokiZabki.answer(instance())).toBe(7);
  });

  it('generate відхиляє чужу гру', () => {
    expect(() => skokiZabki.generate({ game: 'blysk', skill: 'subitize-5', count: [1, 5], pattern: 'dice', exposureMs: 1000, answers: 'digit' }, ctxFor(1))).toThrow('cannot generate');
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

  it('1-ша підказка: програє всі стрибки, крім останнього, з лічбою й «I co dalej?»', async () => {
    const { said, assists, ctx } = recorder();
    await hintJump(instance(), ctx, { nth: 1, response: null });
    expect(said).toEqual(['jeden', 'dwa', 'I co dalej?']);
    expect(assists[0]).toEqual({ mode: 'hint', step: 0, level: 1 });
    expect(assists.at(-1)).toEqual({ mode: 'hint', step: 2, level: 1 });
  });

  it('1-ша підказка для одного стрибка: показує його й не питає «I co dalej?»', async () => {
    const { said, ctx } = recorder();
    await hintJump(instance({ jumps: 1 }), ctx, { nth: 1, response: null });
    expect(said).toEqual(['jeden']);
    expect(hintJumps(1)).toBe(1);
    expect(hintJumps(2)).toBe(1);
    expect(hintJumps(5)).toBe(4);
  });

  it('2-га підказка: маршрут пунктиром, жабка на старті, голос читає завдання', async () => {
    const { said, assists, ctx } = recorder();
    await hintJump(instance(), ctx, { nth: 2, response: null });
    expect(said).toEqual(['Żabka jest na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?']);
    expect(assists).toEqual([{ mode: 'hint', step: 0, level: 2 }]);
  });

  it('показ разом: усі стрибки з лічбою й «Cztery i trzy to siedem.»', async () => {
    const { said, assists, ctx } = recorder();
    await togetherJump(instance(), ctx);
    expect(said).toEqual(['jeden', 'dwa', 'trzy', 'Cztery i trzy to siedem.']);
    expect(assists.every((a) => a.mode === 'together')).toBe(true);
    expect(assists.at(-1)?.step).toBe(3);
  });

  it('frogPad: старт + стрибки, не далі за приземлення й не раніше за старт', () => {
    expect(frogPad({ start: 4, jumps: 3 }, 0)).toBe(4);
    expect(frogPad({ start: 4, jumps: 3 }, 2)).toBe(6);
    expect(frogPad({ start: 4, jumps: 3 }, 9)).toBe(7);
    expect(frogPad({ start: 4, jumps: 3 }, -1)).toBe(4);
  });

  it('assistJumped: підказка 1 і «разом» ведуть жабку, підказка 2 повертає на старт, без допомоги — null', () => {
    expect(assistJumped({ mode: 'hint', step: 2, level: 1 })).toBe(2);
    expect(assistJumped({ mode: 'hint', step: 0, level: 2 })).toBe(0);
    expect(assistJumped({ mode: 'together', step: 3 })).toBe(3);
    expect(assistJumped({ mode: 'none', step: 0 })).toBeNull();
    expect(assistJumped({ mode: 'intro', step: 0 })).toBeNull();
  });
});

describe('ставок у сцені', () => {
  const cases: { kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
    { kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
    { kind: 'wide', vw: 1024, area: { w: 880, h: 400 } },
    { kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
    { kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
  ];

  it('усе вміщується в сцену, не заходить на Kubika; листок не менший за 24 px', () => {
    for (const max of [10, 20] as const) {
      for (const { kind, vw, area } of cases) {
        const reserved = sceneReserved(kind, vw, area);
        const { layout, place } = pickPond(max, area, reserved);
        expect(layout.max).toBe(max);
        expect(place.x + place.w, `${max}/${kind}`).toBeLessThanOrEqual(area.w);
        expect(place.y + place.h, `${max}/${kind}`).toBeLessThanOrEqual(area.h);
        for (const r of reserved) expect(place.x < r.x + r.w && r.x < place.x + place.w && place.y < r.y + r.h && r.y < place.y + place.h, `${max}/${kind}`).toBe(false);
        expect(place.scale * 48, `${max}/${kind}`).toBeGreaterThanOrEqual(24);
      }
    }
  });

  it('вузька область бере коротші ряди (більше рядів), широка — один ряд для 0–10', () => {
    const wide = pickPond(10, { w: 1152, h: 430 }, []);
    expect(wide.layout.rows).toBe(1);
    const narrow = pickPond(10, { w: 366, h: 366 }, []);
    expect(narrow.layout.rows).toBe(2);
    expect(narrow.layout).toEqual(padLayout(10, 6));
  });

  it('майданчик дотику по жабці ≥ 80 px у координатах сцени', () => {
    expect(FROG_HIT).toBeGreaterThanOrEqual(80);
  });
});
