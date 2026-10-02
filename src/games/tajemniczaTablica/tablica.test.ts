import { describe, expect, it } from 'vitest';
import { MAGNIFIER_CELL, NAV_BUTTON, chartLayouts, columnOf, miniCell, pickChartLayout, rowNumbers, rowOf } from '../../components/math/chartLayout';
import type { ChartTask, Level } from '../../curriculum/types';
import { sceneReserved } from '../engine/frameMath';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext, SceneKind } from '../engine/types';
import { hintCells, hintChart, paintedByHint, tensLine, togetherChart } from './assist';
import {
  chartAnswer, checkChart, generateChart, numbersEndingWith, paintedCorrectly, pickLeaves, pickNeighborOptions, rowsFor, type ChartInstance,
} from './generate';
import { promptOf, tajemniczaTablica } from './index';
import { startRow } from './View';

const level: Level = { id: 'w6-1', world: 'w6', index: 1, kind: 'main', newIdea: true, skills: ['count-on-100'], tasks: [], draft: false };
const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => ({ level, world: 'w6', index: previous.length, rng: createRng(seed), previous });
const spec = (over: Partial<ChartTask> = {}): ChartTask => ({
  game: 'tajemniczaTablica', skill: 'count-on-100', mode: 'find', range: [1, 100], leaves: 0, step: 'one', direction: 'more', answers: 'digit', ...over,
});
const instance = (over: Partial<ChartInstance> = {}): ChartInstance => ({
  game: 'tajemniczaTablica', skill: 'count-on-100', review: false, mode: 'find', rows: 10, max: 100, target: 47, delta: 0, digit: 0, paintSet: [], leaves: [], answers: 'digit', options: [], ...over,
});

describe('геометрія таблиці', () => {
  it('rowOf / columnOf / rowNumbers: 47 → 5-й рядок (41–50), 7-ма клітинка; 50 → кінець рядка; 100 → останній', () => {
    expect(rowOf(1)).toBe(0);
    expect(rowOf(10)).toBe(0);
    expect(rowOf(11)).toBe(1);
    expect(rowOf(47)).toBe(4);
    expect(rowOf(50)).toBe(4);
    expect(rowOf(100)).toBe(9);
    expect(columnOf(47)).toBe(6);
    expect(columnOf(50)).toBe(9);
    expect(columnOf(41)).toBe(0);
    expect(rowNumbers(4)).toEqual([41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
    expect(rowNumbers(0)[0]).toBe(1);
  });

  it('rowsFor: скільки рядків до верхньої межі', () => {
    expect(rowsFor(10)).toBe(1);
    expect(rowsFor(25)).toBe(3);
    expect(rowsFor(30)).toBe(3);
    expect(rowsFor(100)).toBe(10);
    expect(rowsFor(150)).toBe(10);
  });

  it('numbersEndingWith: 5 → 5, 15…95; 0 → 10…100; у малій таблиці — лише до межі', () => {
    expect(numbersEndingWith(5, 100)).toHaveLength(10);
    expect(numbersEndingWith(0, 100)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(numbersEndingWith(5, 30)).toEqual([5, 15, 25]);
  });
});

describe('розкладки лупи (BRIEF §12: клітинки від 64 px, кнопки рядків від 80)', () => {
  const cases: { name: string; kind: SceneKind; vw: number; area: { w: number; h: number } }[] = [
    { name: '1280', kind: 'wide', vw: 1280, area: { w: 1152, h: 430 } },
    { name: '1024', kind: 'wide', vw: 1024, area: { w: 880, h: 400 } },
    { name: '768', kind: 'portrait', vw: 768, area: { w: 720, h: 720 } },
    { name: '390', kind: 'portrait', vw: 390, area: { w: 366, h: 366 } },
    { name: '844', kind: 'phone', vw: 844, area: { w: 560, h: 280 } },
  ];
  const intersects = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  it('кожна розкладка: елементи в межах дизайну й не перекриваються', () => {
    for (const rows of [1, 3, 10]) {
      for (const l of chartLayouts(rows)) {
        const parts = {
          mini: { x: l.mini.x, y: l.mini.y, w: l.mini.size, h: l.mini.h },
          magnifier: { x: l.magnifier.x, y: l.magnifier.y, w: l.magnifier.w, h: l.magnifier.h },
          up: { x: l.up.x, y: l.up.y, w: NAV_BUTTON, h: NAV_BUTTON },
          down: { x: l.down.x, y: l.down.y, w: NAV_BUTTON, h: NAV_BUTTON },
        };
        const names = Object.keys(parts) as (keyof typeof parts)[];
        for (const n of names) {
          const p = parts[n];
          expect(p.x, `${l.id}/${rows} ${n}`).toBeGreaterThanOrEqual(-0.01);
          expect(p.y, `${l.id}/${rows} ${n}`).toBeGreaterThanOrEqual(-0.01);
          expect(p.x + p.w, `${l.id}/${rows} ${n}`).toBeLessThanOrEqual(l.design.w + 0.01);
          expect(p.y + p.h, `${l.id}/${rows} ${n}`).toBeLessThanOrEqual(l.design.h + 0.01);
        }
        for (let i = 0; i < names.length; i++) {
          for (let j = i + 1; j < names.length; j++) expect(intersects(parts[names[i]!], parts[names[j]!]), `${l.id}/${rows} ${names[i]}×${names[j]}`).toBe(false);
        }
        expect(l.magnifier.cols * 2 >= 10 || l.magnifier.cols === 10).toBe(true);
      }
    }
  });

  it('у всіх 5 розмірах екрана: клітинка лупи ≥ 64 px, кнопки ≥ 80 px (на ПК ≥ 64), нічого не заходить на Kubika й за сцену', () => {
    for (const rows of [3, 10]) {
      for (const { name, kind, vw, area } of cases) {
        const reserved = sceneReserved(kind, vw, area);
        const { layout, place } = pickChartLayout(area, reserved, rows);
        const tag = `${name}/${rows}/${layout.id}`;
        expect(MAGNIFIER_CELL * place.scale, tag).toBeGreaterThanOrEqual(63.5);
        expect(NAV_BUTTON * place.scale, tag).toBeGreaterThanOrEqual(kind === 'wide' ? 64 : 79.5);
        expect(place.x + place.w, tag).toBeLessThanOrEqual(area.w);
        expect(place.y + place.h, tag).toBeLessThanOrEqual(area.h);
        for (const r of reserved) expect(intersects({ x: place.x, y: place.y, w: place.w, h: place.h }, r), tag).toBe(false);
      }
    }
  });

  it('розкладка за формою екрана: широка — рядок в одну лінію (10), вузькі — два шматки по 5', () => {
    expect(pickChartLayout({ w: 1152, h: 430 }, [], 10).layout.magnifier.cols).toBe(10);
    expect(pickChartLayout({ w: 366, h: 366 }, [], 10).layout.magnifier.cols).toBe(5);
  });

  it('miniCell — ціле число px', () => {
    for (const size of [110, 150, 290]) expect(Number.isInteger(miniCell(size))).toBe(true);
    expect(miniCell(290)).toBe(28);
  });
});

describe('generateChart', () => {
  it('find: ціль у діапазоні, листочки не закривають ціль, детерміновано', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = spec({ range: [10, 60], leaves: 4 });
      const i = generateChart(s, ctxFor(seed));
      expect(i.mode).toBe('find');
      expect(i.target).toBeGreaterThanOrEqual(10);
      expect(i.target).toBeLessThanOrEqual(60);
      expect(i.leaves).toHaveLength(4);
      expect(i.leaves).not.toContain(i.target);
      expect(i.rows).toBe(6);
      expect(chartAnswer(i)).toBe(i.target);
      expect(generateChart(s, ctxFor(seed))).toEqual(i);
    }
  });

  it('hidden: шукане закрите листочком, плитки містять відповідь, три різні числа в межах таблиці', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const i = generateChart(spec({ mode: 'hidden', range: [1, 100], leaves: 2 }), ctxFor(seed));
      expect(i.leaves).toContain(i.target);
      expect(i.leaves).toHaveLength(3);
      expect(i.options).toContain(i.target);
      expect(new Set(i.options).size).toBe(3);
      for (const n of i.options) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(100);
      }
    }
  });

  it('neighbors: «на 1» і «на 10», більше/менше; число й шукане лежать на таблиці; серед плиток «не той крок» і «не той бік»', () => {
    for (const range of [[2, 30], [11, 60], [1, 100]] as const) {
      for (const step of ['one', 'ten', 'mixed'] as const) {
        for (const direction of ['more', 'less', 'mixed'] as const) {
          for (let seed = 1; seed <= 40; seed++) {
            const i = generateChart(spec({ mode: 'neighbors', range, step, direction }), ctxFor(seed));
            const answer = chartAnswer(i);
            const tag = `${range}/${step}/${direction}#${seed}`;
            expect(answer, tag).toBeGreaterThanOrEqual(1);
            expect(answer, tag).toBeLessThanOrEqual(range[1]);
            expect(i.target, tag).toBeGreaterThanOrEqual(1);
            expect(i.target, tag).toBeLessThanOrEqual(range[1]);
            expect(Math.abs(i.delta), tag).toBeGreaterThan(0);
            expect(i.options, tag).toContain(answer);
            expect(new Set(i.options).size, tag).toBe(3);
            if (step === 'ten' && range[1] >= 20) expect(Math.abs(i.delta), tag).toBe(10);
            if (direction === 'more') expect(i.delta, tag).toBeGreaterThan(0);
            if (direction === 'less' && range[1] >= 12) expect(i.delta, tag).toBeLessThan(0);
          }
        }
      }
    }
  });

  it('pickNeighborOptions: 34 + 10 → серед плиток 35 (на 1 замість 10) і 24 (не той бік)', () => {
    const options = pickNeighborOptions(34, 10, 100, createRng(1));
    expect(options).toContain(44);
    expect(options).toContain(35);
    expect(options).toContain(24);
  });

  it('paint: цифра на кінці, набір — усі такі числа до межі', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateChart(spec({ mode: 'paint', range: [1, 50] }), ctxFor(seed));
      expect(i.paintSet).toEqual(numbersEndingWith(i.digit, 50));
      expect(i.paintSet.length).toBeGreaterThanOrEqual(3);
      expect(chartAnswer(i)).toBe(1);
      expect(i.options).toEqual([]);
    }
  });

  it('не повторює відповідь двічі поспіль; генератор відхиляє чужу гру', () => {
    for (let seed = 1; seed <= 60; seed++) expect(generateChart(spec({ range: [1, 30] }), ctxFor(seed, [7])).target).not.toBe(7);
    expect(() => tajemniczaTablica.generate({ game: 'blysk', skill: 'subitize-5', count: [1, 5], pattern: 'dice', exposureMs: 1000, answers: 'digit' }, ctxFor(1))).toThrow('cannot generate');
  });

  it('pickLeaves: k різних клітинок, без виключених', () => {
    const leaves = pickLeaves(5, 30, [3, 4], createRng(2));
    expect(new Set(leaves).size).toBe(5);
    expect(leaves).not.toContain(3);
    expect(leaves).not.toContain(4);
    expect(pickLeaves(99, 10, [1], createRng(1))).toHaveLength(9);
  });

  it('check: правильно; на 1 — «Prawie!» (не в paint); paintedCorrectly — рівно потрібний набір', () => {
    expect(checkChart({ mode: 'find', target: 47, delta: 0 }, 47)).toEqual({ ok: true });
    expect(checkChart({ mode: 'find', target: 47, delta: 0 }, 48)).toEqual({ ok: false, almost: true });
    expect(checkChart({ mode: 'neighbors', target: 34, delta: 10 }, 44)).toEqual({ ok: true });
    expect(checkChart({ mode: 'neighbors', target: 34, delta: 10 }, 35)).toEqual({ ok: false, almost: false });
    expect(checkChart({ mode: 'paint', target: 0, delta: 0 }, 1)).toEqual({ ok: true });
    expect(checkChart({ mode: 'paint', target: 0, delta: 0 }, 0)).toEqual({ ok: false, almost: false });
    expect(paintedCorrectly(new Set([5, 15, 25]), [5, 15, 25])).toBe(true);
    expect(paintedCorrectly(new Set([5, 15]), [5, 15, 25])).toBe(false);
    expect(paintedCorrectly(new Set([5, 15, 25, 35]), [5, 15, 25])).toBe(false);
  });

  it('startRow: hidden і neighbors — рядок цілі, решта — перший', () => {
    expect(startRow({ mode: 'hidden', target: 47 })).toBe(4);
    expect(startRow({ mode: 'neighbors', target: 12 })).toBe(1);
    expect(startRow({ mode: 'find', target: 47 })).toBe(0);
    expect(startRow({ mode: 'paint', target: 0 })).toBe(0);
  });
});

describe('гра як модуль рушія', () => {
  it('репліки: «Znajdź liczbę czterdzieści siedem.», «Co kryje się pod listkiem?», «Pomaluj liczby z piątką na końcu.», «Tu jest liczba trzydzieści cztery. Która liczba jest o dziesięć większa?»', () => {
    expect(promptOf(instance())).toBe('Znajdź liczbę czterdzieści siedem.');
    expect(promptOf(instance({ mode: 'hidden' }))).toBe('Co kryje się pod listkiem?');
    expect(promptOf(instance({ mode: 'paint', digit: 5 }))).toBe('Pomaluj liczby z piątką na końcu.');
    expect(promptOf(instance({ mode: 'paint', digit: 0 }))).toBe('Pomaluj liczby z zerem na końcu.');
    expect(promptOf(instance({ mode: 'neighbors', target: 34, delta: 10 }))).toBe('Tu jest liczba trzydzieści cztery. Która liczba jest o dziesięć większa?');
    expect(promptOf(instance({ mode: 'neighbors', target: 34, delta: -1 }))).toBe('Tu jest liczba trzydzieści cztery. Która liczba jest o jeden mniejsza?');
  });

  it('kindOf: find і paint — дія на таблиці, hidden і neighbors — плитки', () => {
    expect(tajemniczaTablica.kindOf?.(instance({ mode: 'find' }))).toBe('build');
    expect(tajemniczaTablica.kindOf?.(instance({ mode: 'paint' }))).toBe('build');
    expect(tajemniczaTablica.kindOf?.(instance({ mode: 'hidden' }))).toBe('choice');
    expect(tajemniczaTablica.kindOf?.(instance({ mode: 'neighbors' }))).toBe('choice');
  });

  it('похвала: «Brawo! Czterdzieści siedem.»; сусіди — з рівнянням; paint — «Wszystkie liczby z piątką na końcu.»', () => {
    expect(tajemniczaTablica.praise(instance(), 'Brawo!')).toBe('Brawo! Czterdzieści siedem.');
    expect(tajemniczaTablica.praise(instance({ mode: 'neighbors', target: 34, delta: 10 }), 'Brawo!')).toBe('Brawo! Trzydzieści cztery, o dziesięć więcej to czterdzieści cztery.');
    expect(tajemniczaTablica.praise(instance({ mode: 'neighbors', target: 34, delta: -1 }), 'Brawo!')).toBe('Brawo! Trzydzieści cztery, o jeden mniej to trzydzieści trzy.');
    expect(tajemniczaTablica.praise(instance({ mode: 'paint', digit: 5 }), 'Brawo!')).toBe('Brawo! Wszystkie liczby z piątką na końcu.');
  });
});

describe('допомога', () => {
  const recorder = () => {
    const said: string[] = [];
    const assists: Assist[] = [];
    const ctx: AssistContext = { say: async (t) => { said.push(t); }, wait: async () => undefined, setAssist: (a) => { assists.push(a); } };
    return { said, assists, ctx };
  };

  it('hintCells: рівень 1 — рядок цілі (десятки), рівень 2 — ще й стовпчик (одиниці), у межах max; paint — стовпчик чисел із цифрою', () => {
    const find = instance({ target: 47 });
    expect([...hintCells(find, 1)].sort((a, b) => a - b)).toEqual([41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
    const two = hintCells(find, 2);
    for (const n of [7, 17, 27, 37, 47, 57, 67, 77, 87, 97]) expect(two.has(n), `${n}`).toBe(true);
    expect(two.size).toBe(19);
    const small = hintCells(instance({ target: 12, max: 30 }), 2);
    expect([...small].every((n) => n <= 30)).toBe(true);
    expect(hintCells(instance({ mode: 'paint', paintSet: [5, 15, 25] }), 1)).toEqual(new Set([5, 15, 25]));
    // сусіди: підсвічується рядок результату
    expect(hintCells(instance({ mode: 'neighbors', target: 34, delta: 10 }), 1).has(44)).toBe(true);
  });

  it('1-ша підказка (find): «czterdzieści»; для чисел до 10 — «Znajdź liczbę…»; 2-га — «Cztery dziesiątki і siedem jedności…»', async () => {
    const a = recorder();
    await hintChart(instance(), a.ctx, { nth: 1, response: null });
    expect(a.said).toEqual(['czterdzieści']);
    expect(a.assists[0]).toEqual({ mode: 'hint', step: 0, level: 1 });
    const b = recorder();
    await hintChart(instance(), b.ctx, { nth: 2, response: null });
    expect(b.said).toEqual(['Cztery dziesiątki i siedem jedności to czterdzieści siedem.']);
    expect(tensLine(7)).toBe('Znajdź liczbę siedem.');
  });

  it('paint: 1-ша підказка називає цифру, 2-га ще й розфарбовує половину (по одному)', async () => {
    const i = instance({ mode: 'paint', digit: 5, paintSet: [5, 15, 25, 35, 45] });
    const a = recorder();
    await hintChart(i, a.ctx, { nth: 1, response: null });
    expect(a.said).toEqual(['Pomaluj liczby z piątką na końcu.']);
    const b = recorder();
    await hintChart(i, b.ctx, { nth: 2, response: null });
    expect(b.said).toEqual(['Pomaluj liczby z piątką na końcu.', 'pięć', 'piętnaście', 'dwadzieścia pięć']);
    expect(paintedByHint(5)).toBe(3);
    expect(b.assists.at(-1)).toEqual({ mode: 'hint', step: 3, level: 2 });
  });

  it('показ разом: find/hidden — розряди; neighbors — рівняння; paint — усі числа по одному', async () => {
    const a = recorder();
    await togetherChart(instance(), a.ctx);
    expect(a.said).toEqual(['Cztery dziesiątki i siedem jedności to czterdzieści siedem.']);
    expect(a.assists.at(-1)).toEqual({ mode: 'together', step: 1 });
    const b = recorder();
    await togetherChart(instance({ mode: 'neighbors', target: 34, delta: 10 }), b.ctx);
    expect(b.said).toEqual(['Trzydzieści cztery, o dziesięć więcej to czterdzieści cztery.']);
    const c = recorder();
    await togetherChart(instance({ mode: 'paint', paintSet: [5, 15] }), c.ctx);
    expect(c.said).toEqual(['pięć', 'piętnaście']);
    expect(c.assists.at(-1)).toEqual({ mode: 'together', step: 2 });
  });
});
