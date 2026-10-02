import { describe, expect, it } from 'vitest';
import { LEVELS, levelById } from '../../curriculum/levels';
import type { CompareTask } from '../../curriculum/types';
import { ANIMALS } from '../../speech/nouns';
import { createRng } from '../engine/rng';
import type { Assist, AssistContext, GenContext } from '../engine/types';
import { hintCompare, resultText, sentence, togetherCompare } from './assist';
import {
  LEFT, RIGHT, SAME, checkCompare, correctChoice, generateCompare, pairing, pickCounts, winnerSide, type CompareInstance,
} from './generate';
import { comparePrompt, ktoMaWiecej } from './index';
import { compareLayout, pairBlock } from './layout';
import { sizeFactors } from './View';

const ctxFor = (seed: number, previous: readonly number[] = []): GenContext => {
  const level = levelById('w2-4');
  return { level, world: level.world, index: previous.length, rng: createRng(seed), previous };
};
const spec = (over: Partial<CompareTask> = {}): CompareTask => ({
  game: 'ktoMaWiecej', skill: 'compare-10', count: [1, 10], diff: [1, 4], ask: 'more', show: 'objects', ...over,
});
const instance = (over: Partial<CompareInstance> = {}): CompareInstance => ({
  game: 'ktoMaWiecej', skill: 'compare-10', review: false, animals: ['mis', 'zajaczek'], item: 'marchewka', counts: [5, 2], ask: 'more', show: 'objects',
  equalPossible: false, bigSide: null, correct: LEFT, seed: 1, ...over,
});

describe('correctChoice / pairing', () => {
  it('«więcej» — більша купка, «mniej» — менша, рівні — «Tyle samo»', () => {
    expect(correctChoice([5, 2], 'more')).toBe(LEFT);
    expect(correctChoice([2, 5], 'more')).toBe(RIGHT);
    expect(correctChoice([5, 2], 'less')).toBe(RIGHT);
    expect(correctChoice([2, 5], 'less')).toBe(LEFT);
    expect(correctChoice([4, 4], 'more')).toBe(SAME);
    expect(correctChoice([0, 0], 'less')).toBe(SAME);
    expect(correctChoice([0, 3], 'more')).toBe(RIGHT);
  });

  it('пари: скільки пар і зайвих, у кого більше', () => {
    expect(pairing([5, 2])).toEqual({ pairs: 2, extra: 3, richer: 0 });
    expect(pairing([1, 6])).toEqual({ pairs: 1, extra: 5, richer: 1 });
    expect(pairing([4, 4])).toEqual({ pairs: 4, extra: 0, richer: null });
    expect(pairing([0, 3])).toEqual({ pairs: 0, extra: 3, richer: 1 });
  });

  it('winnerSide збігається з відповіддю', () => {
    expect(winnerSide({ correct: LEFT })).toBe(0);
    expect(winnerSide({ correct: RIGHT })).toBe(1);
    expect(winnerSide({ correct: SAME })).toBeNull();
  });
});

describe('pickCounts', () => {
  it('різниця в межах diff, обидві купки в count, купки різні', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const [a, b] = pickCounts([0, 10], [2, 4], 0, createRng(seed));
      expect(Math.abs(a - b)).toBeGreaterThanOrEqual(2);
      expect(Math.abs(a - b)).toBeLessThanOrEqual(4);
      for (const n of [a, b]) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(10);
      }
    }
  });

  it('різниця більша за діапазон стискається; різниця 1 у вузькому діапазоні працює', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const [a, b] = pickCounts([1, 3], [5, 9], 0, createRng(seed));
      expect(Math.abs(a - b)).toBe(2);
      const [c, d] = pickCounts([1, 2], [1, 1], 0, createRng(seed));
      expect(Math.abs(c - d)).toBe(1);
    }
  });

  it('equal = 1 — купки завжди рівні й не порожні, якщо діапазон дозволяє', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const [a, b] = pickCounts([0, 6], [1, 3], 1, createRng(seed));
      expect(a).toBe(b);
      expect(a).toBeGreaterThanOrEqual(1);
    }
    expect(pickCounts([0, 0], [1, 1], 1, createRng(1))).toEqual([0, 0]);
  });

  it('частота «Tyle samo» наближається до заданої', () => {
    let same = 0;
    for (let seed = 1; seed <= 600; seed++) {
      const [a, b] = pickCounts([1, 8], [1, 3], 0.3, createRng(seed));
      if (a === b) same++;
    }
    expect(same / 600).toBeGreaterThan(0.22);
    expect(same / 600).toBeLessThan(0.38);
  });
});

describe('generateCompare', () => {
  it('різні тваринки, предмет із фруктів W2, відповідь збігається з кількостями, детерміновано', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const i = generateCompare(spec({ equal: 0.3, ask: 'mixed' }), ctxFor(seed));
      expect(i.animals[0]).not.toBe(i.animals[1]);
      expect(['jablko', 'gruszka', 'truskawka', 'marchewka']).toContain(i.item);
      expect(i.correct).toBe(correctChoice(i.counts, i.ask));
      expect(i.equalPossible).toBe(true);
      expect(generateCompare(spec({ equal: 0.3, ask: 'mixed' }), ctxFor(seed))).toEqual(i);
    }
  });

  it('без equal купки завжди різні й «Tyle samo» неможливе', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const i = generateCompare(spec(), ctxFor(seed));
      expect(i.counts[0]).not.toBe(i.counts[1]);
      expect(i.equalPossible).toBe(false);
      expect(i.correct).not.toBe(SAME);
    }
  });

  it('mixed — трапляються обидва запитання; більша купка буває з обох боків', () => {
    const asks = new Set<string>();
    const sides = new Set<number>();
    for (let seed = 1; seed <= 80; seed++) {
      const i = generateCompare(spec({ ask: 'mixed' }), ctxFor(seed));
      asks.add(i.ask);
      sides.add(i.correct);
    }
    expect(asks).toEqual(new Set(['more', 'less']));
    expect(sides.has(LEFT) && sides.has(RIGHT)).toBe(true);
  });

  it('підступ sizeTrick: більші предмети на МЕНШІЙ купці', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const i = generateCompare(spec({ show: 'sizeTrick' }), ctxFor(seed));
      expect(i.bigSide).not.toBeNull();
      const other = 1 - (i.bigSide as number);
      expect(i.counts[i.bigSide as 0 | 1]).toBeLessThan(i.counts[other]!);
    }
    expect(generateCompare(spec(), ctxFor(1)).bigSide).toBeNull();
  });

  it('усі «Kto ma więcej?» у W2: числа й різниця в межах рівня', () => {
    const tasks = LEVELS.filter((l) => l.world === 'w2').flatMap((l) => l.tasks.filter((t): t is CompareTask => t.game === 'ktoMaWiecej').map((t) => ({ l, t })));
    expect(tasks.length).toBeGreaterThan(8);
    for (const { l, t } of tasks) {
      for (let seed = 1; seed <= 25; seed++) {
        const i = generateCompare(t, ctxFor(seed));
        const [a, b] = i.counts;
        for (const n of i.counts) {
          expect(n, l.id).toBeGreaterThanOrEqual(t.count[0]);
          expect(n, l.id).toBeLessThanOrEqual(t.count[1]);
        }
        if (a !== b) expect(Math.abs(a - b), l.id).toBeGreaterThanOrEqual(t.diff[0]);
      }
    }
  });
});

describe('checkCompare / інструкція / репліки', () => {
  it('правильний бік — ok; хибний — не ok, «Prawie!» нема', () => {
    expect(checkCompare(instance(), LEFT)).toEqual({ ok: true });
    expect(checkCompare(instance(), RIGHT)).toEqual({ ok: false, almost: false });
    expect(checkCompare(instance(), SAME)).toEqual({ ok: false, almost: false });
  });

  it('інструкція: «Kto ma więcej marchewek?»; «mniej»; з можливим «Tyle samo» — «A może tyle samo?»', () => {
    expect(comparePrompt(instance())).toBe('Kto ma więcej marchewek?');
    expect(comparePrompt(instance({ ask: 'less' }))).toBe('Kto ma mniej marchewek?');
    expect(comparePrompt(instance({ item: 'gruszka', equalPossible: true }))).toBe('Kto ma więcej gruszek? A może tyle samo?');
  });

  it('відповідь і похвала: «Miś ma więcej marchewek.», «Zajączek ma mniej…», «Tyle samo.»', () => {
    expect(sentence(resultText(instance()))).toBe('Miś ma więcej marchewek.');
    expect(sentence(resultText(instance({ counts: [2, 5], ask: 'less', correct: LEFT })))).toBe('Miś ma mniej marchewek.');
    expect(sentence(resultText(instance({ counts: [2, 5], correct: RIGHT })))).toBe('Zajączek ma więcej marchewek.');
    expect(sentence(resultText(instance({ counts: [3, 3], correct: SAME })))).toBe('Tyle samo.');
    expect(ktoMaWiecej.praise(instance(), 'Brawo!')).toBe('Brawo! Miś ma więcej marchewek.');
    expect(ktoMaWiecej.praise(instance({ counts: [3, 3], correct: SAME }), 'Świetnie!')).toBe('Świetnie! Tyle samo.');
  });

  it('гра — конструктор без запису числа відповіді; плиток нема; відповідь — LEFT/RIGHT/SAME', () => {
    expect(ktoMaWiecej.kind).toBe('build');
    expect(ktoMaWiecej.recordsAnswer).toBe(false);
    expect(ktoMaWiecej.tiles(instance())).toEqual([]);
    expect(ktoMaWiecej.answer(instance({ correct: RIGHT }))).toBe(RIGHT);
  });

  it('усі реплики без цифр', () => {
    for (const i of [instance(), instance({ ask: 'less', equalPossible: true, item: 'truskawka' })]) {
      expect(comparePrompt(i)).not.toMatch(/\d/);
      expect(resultText(i)).not.toMatch(/\d/);
    }
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

  it('1-ша підказка: предмети стають парами (step 1), без голосу й без сяйва зайвих', async () => {
    const { said, assists, ctx } = recorder();
    await hintCompare(instance(), ctx, { nth: 1, response: null });
    expect(assists.map((a) => a.step)).toEqual([1]);
    expect(said).toEqual([]);
  });

  it('2-га підказка: пари, потім сяйво зайвих (step 2)', async () => {
    const { assists, ctx } = recorder();
    await hintCompare(instance(), ctx, { nth: 2, response: null });
    expect(assists.map((a) => [a.step, a.level])).toEqual([[1, 2], [2, 2]]);
  });

  it('режим цифр: 1-ша підказка лише називає числа обох тваринок («Miś ma pięć.»), купки з’являються з 2-ї', async () => {
    const digits = instance({ show: 'digits' });
    const first = recorder();
    await hintCompare(digits, first.ctx, { nth: 1, response: null });
    expect(first.said).toEqual(['Miś ma pięć.', 'Zajączek ma dwa.']);
    expect(first.assists.every((a) => a.step === 0)).toBe(true);
    const second = recorder();
    await hintCompare(digits, second.ctx, { nth: 2, response: null });
    expect(second.said).toEqual([]);
    expect(second.assists.map((a) => a.step)).toEqual([1, 2]);
  });

  it('показ разом: пари, сяйво, потім відповідь словами', async () => {
    const { said, assists, ctx } = recorder();
    await togetherCompare(instance(), ctx);
    expect(assists.map((a) => [a.mode, a.step])).toEqual([['together', 1], ['together', 2]]);
    expect(said).toEqual(['Miś ma więcej marchewek.']);
    const same = recorder();
    await togetherCompare(instance({ counts: [3, 3], correct: SAME }), same.ctx);
    expect(same.said).toEqual(['Tyle samo.']);
  });

  it('імена тваринок у підказці — зі словника', () => {
    expect(ANIMALS.mis.one).toBe('miś');
  });
});

const rectsOverlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('compareLayout', () => {
  // сцена для трьох видів екрана (див. frameMath): wide має ділянку Kubika внизу ліворуч, phone — смугу кісточок угорі
  const scenes = [
    { name: 'wide', area: { w: 1180, h: 420 }, reserved: [{ x: 0, y: 296, w: 313, h: 124 }] },
    { name: 'portrait', area: { w: 390, h: 390 }, reserved: [] },
    { name: 'tablet', area: { w: 768, h: 768 }, reserved: [] },
    { name: 'phone', area: { w: 716, h: 340 }, reserved: [{ x: 0, y: 0, w: 716, h: 46 }] },
  ];
  const pairsOfCounts: [number, number][] = [[0, 3], [10, 0], [7, 3], [1, 10], [6, 6], [10, 10], [4, 2]];

  it('предмети купок: у межах своєї картки, не перекриваються, не лізуть у ділянку Kubika, однакового розміру без підступу', () => {
    for (const s of scenes) {
      for (const counts of pairsOfCounts) {
        const layout = compareLayout(s.area, s.reserved, counts, [1, 1], createRng(7));
        expect(layout.sizes[0], `${s.name} ${counts}`).toBe(layout.sizes[1]);
        for (const side of [0, 1] as const) {
          const card = layout.cards[side];
          const boxes = layout.piles[side].map((p) => ({ x: p.x, y: p.y, w: layout.sizes[side], h: layout.sizes[side] }));
          expect(boxes).toHaveLength(counts[side]);
          boxes.forEach((b, i) => {
            expect(b.x, `${s.name} ${counts} ліво`).toBeGreaterThanOrEqual(card.x);
            expect(b.y, `${s.name} ${counts} верх`).toBeGreaterThanOrEqual(card.y);
            expect(b.x + b.w, `${s.name} ${counts} право`).toBeLessThanOrEqual(card.x + card.w);
            expect(b.y + b.h, `${s.name} ${counts} низ`).toBeLessThanOrEqual(card.y + card.h);
            for (const z of s.reserved) expect(rectsOverlap(b, z), `${s.name} ${counts} Kubik`).toBe(false);
            for (let j = i + 1; j < boxes.length; j++) expect(rectsOverlap(b, boxes[j]!), `${s.name} ${counts} перекриття`).toBe(false);
          });
        }
        expect(rectsOverlap(layout.cards[0], layout.cards[1])).toBe(false);
      }
    }
  });

  it('предмети не заходять на тваринок своєї картки', () => {
    for (const s of scenes) {
      const layout = compareLayout(s.area, s.reserved, [10, 10], [1, 1], createRng(3));
      for (const side of [0, 1] as const) {
        for (const p of layout.piles[side]) {
          expect(rectsOverlap({ x: p.x, y: p.y, w: layout.sizes[side], h: layout.sizes[side] }, layout.animals[side]), s.name).toBe(false);
        }
      }
    }
  });

  it('підступ: на меншій купці предмети більші', () => {
    for (const s of scenes) {
      const layout = compareLayout(s.area, s.reserved, [3, 7], sizeFactors(0), createRng(5));
      expect(layout.sizes[0], s.name).toBeGreaterThan(layout.sizes[1]);
      const flipped = compareLayout(s.area, s.reserved, [7, 3], sizeFactors(1), createRng(5));
      expect(flipped.sizes[1], s.name).toBeGreaterThan(flipped.sizes[0]);
    }
  });

  it('пари: стоять у межах сцени, не перекриваються, у парі A зліва від B на одному рівні; усі однакового розміру', () => {
    for (const s of scenes) {
      for (const counts of pairsOfCounts) {
        const layout = compareLayout(s.area, s.reserved, counts, [1, 1], createRng(9));
        const size = layout.pairSize;
        const all = [...layout.paired[0].map((p) => ({ x: p.x, y: p.y, w: size, h: size })), ...layout.paired[1].map((p) => ({ x: p.x, y: p.y, w: size, h: size }))];
        expect(layout.paired[0]).toHaveLength(counts[0]);
        expect(layout.paired[1]).toHaveLength(counts[1]);
        all.forEach((b, i) => {
          expect(b.x, `${s.name} ${counts}`).toBeGreaterThanOrEqual(0);
          expect(b.y, `${s.name} ${counts}`).toBeGreaterThanOrEqual(0);
          expect(b.x + b.w, `${s.name} ${counts}`).toBeLessThanOrEqual(s.area.w);
          expect(b.y + b.h, `${s.name} ${counts}`).toBeLessThanOrEqual(s.area.h);
          for (let j = i + 1; j < all.length; j++) expect(rectsOverlap(b, all[j]!), `${s.name} ${counts} перекриття`).toBe(false);
        });
        const m = Math.min(counts[0], counts[1]);
        for (let u = 0; u < m; u++) {
          expect(layout.paired[1][u]!.y).toBe(layout.paired[0][u]!.y);
          expect(layout.paired[1][u]!.x).toBeGreaterThan(layout.paired[0][u]!.x);
        }
      }
    }
  });

  it('блок пар: до п’яти одиниць — один стовпець, більше — два; зайві продовжують одиниці без пари', () => {
    const region = { x: 100, y: 100, w: 600, h: 300 };
    const small = pairBlock(region, [4, 2], 60);
    expect(new Set(small.a.map((p) => p.x)).size).toBe(1);
    const big = pairBlock(region, [8, 3], 60);
    expect(new Set(big.a.map((p) => p.x)).size).toBe(2);
    // зайві ліві предмети (4–7) займають одиниці без правої пари
    expect(big.b).toHaveLength(3);
    expect(big.a).toHaveLength(8);
    expect(pairBlock(region, [0, 0], 60)).toEqual({ size: 60, a: [], b: [] });
  });

  it('детермінована: те саме зерно — та сама розкладка', () => {
    const a = compareLayout(scenes[0]!.area, scenes[0]!.reserved, [6, 4], [1, 1], createRng(11));
    const b = compareLayout(scenes[0]!.area, scenes[0]!.reserved, [6, 4], [1, 1], createRng(11));
    expect(a).toEqual(b);
  });
});
