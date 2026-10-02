import { describe, expect, it } from 'vitest';
import { planLevel } from '../games/engine/levelPlan';
import { resolveGame } from '../games/registry';
import { STEP_MAX, STEP_MIN, type Struggle } from './adaptivity';
import { adaptSpec, adaptTask, altSpec } from './adaptSpec';
import { levelsOfWorld } from './levels';
import type { BusTask, CompareTask, CountTask, FeedTask, FlashTask, HouseTask, JumpTask, MatchTask, SumTask, TaskSpec, StoryTask, TenTask, TrainTask } from './types';

const count: CountTask = { game: 'policzIDotknij', skill: 'count-scatter', count: [1, 8], arrangement: 'scatter', look: 'similar', answers: 'digitDots' };
const flash: FlashTask = { game: 'blysk', skill: 'subitize-5', count: [1, 5], pattern: 'random', exposureMs: 1200, answers: 'digitDots' };
const feed: FeedTask = { game: 'nakarmZwierzaka', skill: 'give-n', count: [4, 8], slots: false };
const match: MatchTask = { game: 'cyfraIObrazek', skill: 'digit-quantity', pairs: 3, numbers: [0, 10], set: 'mixed' };
const train: TrainTask = { game: 'zgubionyWagonik', skill: 'order-around', range: [1, 10], length: 6, gap: 'end', step: 1, answers: 'digit' };
const compare: CompareTask = { game: 'ktoMaWiecej', skill: 'compare-10', count: [1, 8], diff: [2, 3], ask: 'more', show: 'sizeTrick' };
const bus: BusTask = { game: 'autobusDziesiatka', skill: 'bonds-5-10', count: [1, 9], ask: 'empty', exposureMs: 1500, answers: 'digit' };
const house: HouseTask = { game: 'domekLiczb', skill: 'bonds-5-10', whole: [6, 10], missing: 'left', show: 'digits', answers: 'digit' };
const sum: SumTask = { game: 'ileRazem', skill: 'add-combine', sum: [4, 8], lid: false, order: 'any', doubles: false, symbols: true, answers: 'digit' };
const jump: JumpTask = { game: 'skokiZabki', skill: 'count-on', max: 10, start: [0, 6], jumps: [2, 4], pads: 'numbered', tapJumps: true, answers: 'digit' };
const ten: TenTask = { game: 'zrobDziesiatke', skill: 'bonds-5-10', known: [4, 8], show: 'frame' };
const W1: readonly [number, number] = [1, 10];

describe('adaptSpec: крок униз — менше чисел і більше опори, крок угору — більше чисел і менше опори', () => {
  it('крок 0 — завдання без змін', () => {
    for (const spec of [count, flash, feed, match, train, compare, bus, house, sum]) expect(adaptSpec(spec, 0, W1)).toBe(spec);
  });

  it('«Policz i dotknij»', () => {
    expect(adaptSpec(count, -1, W1)).toMatchObject({ count: [1, 6], look: 'distinct', arrangement: 'scatter' });
    expect(adaptSpec(count, -2, W1)).toMatchObject({ count: [1, 4], arrangement: 'line' });
    expect(adaptSpec(count, 1, W1)).toMatchObject({ count: [1, 10] });
    expect(adaptSpec({ ...count, count: [1, 3] }, -2, W1)).toMatchObject({ count: [1, 3] });
  });

  it('«Błysk!»: довший показ і крапки кубика / коротший показ', () => {
    expect(adaptSpec(flash, -1, W1)).toMatchObject({ pattern: 'dice', count: [1, 4], exposureMs: 1700 });
    expect(adaptSpec(flash, 2, W1)).toMatchObject({ pattern: 'random', count: [1, 7], exposureMs: 700 });
    expect(adaptSpec({ ...flash, pattern: 'dice', count: [1, 5] }, 2, W1)).toMatchObject({ pattern: 'random' });
    expect(adaptSpec({ ...flash, pattern: 'dice', count: [1, 5] }, 1, W1)).toMatchObject({ pattern: 'dice', count: [1, 6] });
  });

  it("«Nakarm zwierzaka»: слоти рамки-десятки з'являються одразу", () => {
    expect(adaptSpec(feed, -1, W1)).toMatchObject({ count: [4, 6], slots: true });
    expect(adaptSpec({ ...feed, slots: true }, 1, W1)).toMatchObject({ count: [4, 10], slots: false });
  });

  it('«Cyfra i obrazek», «Zgubiony wagonik», «Kto ma więcej?», «Autobus dziesiątka»', () => {
    expect(adaptSpec(match, -2, W1)).toMatchObject({ pairs: 2, set: 'objects' });
    expect(adaptSpec(match, 2, W1)).toMatchObject({ pairs: 4 });
    expect(adaptSpec(train, -1, W1)).toMatchObject({ gap: 'end', length: 5 });
    expect(adaptSpec(train, 1, W1)).toMatchObject({ gap: 'middle', length: 6 });
    expect(adaptSpec(train, 2, W1)).toMatchObject({ gap: 'any' });
    expect(adaptSpec(compare, -1, W1)).toMatchObject({ diff: [3, 4], show: 'objects' });
    expect(adaptSpec(compare, 2, W1)).toMatchObject({ diff: [1, 1] });
    expect(adaptSpec(bus, -1, W1)).toMatchObject({ exposureMs: 0, ask: 'empty' });
    expect(adaptSpec(bus, -2, W1)).toMatchObject({ ask: 'full' });
  });

  it('інша гра для тієї ж навички (або null)', () => {
    expect(altSpec(count, 'w1')).toMatchObject({ game: 'nakarmZwierzaka', skill: 'count-scatter', slots: true });
    expect(altSpec(feed, 'w2')).toMatchObject({ game: 'policzIDotknij', skill: 'give-n', arrangement: 'line', answers: 'digit' });
    expect(altSpec(flash, 'w1')).toMatchObject({ game: 'policzIDotknij', skill: 'subitize-5', answers: 'digitDots' });
    expect(altSpec(match, 'w2')).toMatchObject({ game: 'policzIDotknij', count: [1, 10] });
    expect(altSpec(train, 'w2')).toBeNull();
    expect(altSpec({ ...count, review: true }, 'w1')?.review).toBe(true);
  });

  it('adaptTask: інша гра лише на найнижчому кроці з труднощами; полегшення знижує крок', () => {
    expect(adaptTask(count, { step: STEP_MIN, struggle: 1 }, 0, 'w1').game).toBe('nakarmZwierzaka');
    expect(adaptTask(count, { step: 0, struggle: 1 }, 0, 'w1').game).toBe('policzIDotknij');
    expect(adaptTask(count, { step: 0, struggle: 0 }, 1, 'w1')).toEqual(adaptSpec(count, -1, W1));
    expect(adaptTask(count, undefined, 0, 'w1')).toBe(count);
  });
});

describe('adaptSpec: «Domek liczb» і «Ile razem?»', () => {
  it('«Domek liczb»: крок униз — менше ціле, предмети, порожнє віконце праворуч; вгору — більше ціле, лише цифри, віконце навмання', () => {
    expect(adaptSpec(house, -1, [1, 10])).toMatchObject({ whole: [6, 8], show: 'pictures', missing: 'right' });
    expect(adaptSpec({ ...house, show: 'pictures', missing: 'right' }, 1, [1, 20])).toMatchObject({ whole: [6, 12], show: 'pictures', missing: 'right' });
    expect(adaptSpec({ ...house, show: 'pictures', missing: 'right' }, 2, [1, 20])).toMatchObject({ show: 'digits', missing: 'any' });
  });

  it('«Ile razem?»: крок униз — менша сума, без кришки й символів, більший доданок першим; вгору — більша сума, з кроку 2 — кришка', () => {
    expect(adaptSpec({ ...sum, lid: true }, -1, [1, 10])).toMatchObject({ sum: [4, 7], lid: false, symbols: false, order: 'bigFirst' });
    expect(adaptSpec({ ...sum, doubles: true }, -2, [1, 10])).toMatchObject({ order: 'any', doubles: true });
    expect(adaptSpec(sum, 1, [1, 10])).toMatchObject({ sum: [4, 9], lid: false });
    expect(adaptSpec(sum, 2, [1, 10])).toMatchObject({ sum: [4, 10], lid: true });
  });

  it('адаптовані завдання W3-подібних рівнів плануються на всіх кроках з правильною відповіддю серед плиток', () => {
    for (const spec of [house, sum]) {
      for (let step = STEP_MIN; step <= STEP_MAX; step++) {
        const adapted = adaptSpec(spec, step, [1, 10]);
        const level = { id: 'w3-1', world: 'w3', index: 1, kind: 'main', newIdea: false, skills: [spec.skill], tasks: Array.from({ length: 6 }, () => adapted), draft: false } as const;
        for (let seed = 1; seed <= 20; seed++) {
          for (const task of planLevel(level, seed, resolveGame)) {
            const def = task.def!;
            const answer = def.answer(task.instance);
            expect(def.check(task.instance, answer)).toEqual({ ok: true });
            expect(def.tiles(task.instance).map((t) => t.value)).toContain(answer);
          }
        }
      }
    }
  });
});

describe('усі рівні W1–W2 на кожному кроці й з іншою грою плануються без помилок', () => {
  it('правильна відповідь проходить перевірку, плитки містять відповідь, числа в межах світу', () => {
    const variants: { step: number; struggle: Struggle }[] = [];
    for (let step = STEP_MIN; step <= STEP_MAX; step++) variants.push({ step, struggle: 0 });
    variants.push({ step: STEP_MIN, struggle: 1 });
    for (const world of ['w1', 'w2'] as const) {
      for (const level of levelsOfWorld(world)) {
        for (const v of variants) {
          for (let seed = 1; seed <= 12; seed++) {
            const plan = planLevel(level, seed, resolveGame, { adapt: (spec: TaskSpec) => adaptTask(spec, v, 0, world) });
            expect(plan).toHaveLength(6);
            for (const task of plan) {
              const label = `${level.id} крок ${v.step}/${v.struggle} #${seed} ${task.instance.game}`;
              const def = task.def!;
              expect(def, label).toBeTruthy();
              const answer = def.answer(task.instance);
              expect(def.check(task.instance, answer), label).toEqual({ ok: true });
              if (def.recordsAnswer !== false) {
                expect(answer, label).toBeGreaterThanOrEqual(0);
                expect(answer, label).toBeLessThanOrEqual(10);
              }
              if (def.kind === 'choice') expect(def.tiles(task.instance).map((t) => t.value), label).toContain(answer);
            }
          }
        }
      }
    }
  });
});

describe('adaptSpec: «Skoki żabki» і «Zrób dziesiątkę»', () => {
  it('крок 0 — без змін', () => {
    expect(adaptSpec(jump, 0, [1, 10])).toBe(jump);
    expect(adaptSpec(ten, 0, [1, 10])).toBe(ten);
  });

  it('жабка: крок униз — менше стрибків, цифри всюди, стрибає від дотику; вгору — «в думці», далі лише віхи', () => {
    expect(adaptSpec({ ...jump, tapJumps: false, pads: 'landmarks' }, -1, [1, 10])).toMatchObject({ jumps: [2, 3], pads: 'numbered', tapJumps: true });
    expect(adaptSpec(jump, -2, [1, 10])).toMatchObject({ jumps: [2, 2] });
    expect(adaptSpec({ ...jump, jumps: [2, 2] }, -2, [1, 10])).toMatchObject({ jumps: [2, 2] });
    expect(adaptSpec(jump, 1, [1, 10])).toMatchObject({ jumps: [2, 5], tapJumps: false, pads: 'numbered' });
    expect(adaptSpec(jump, 2, [1, 10])).toMatchObject({ jumps: [2, 6], pads: 'landmarks' });
    expect(adaptSpec({ ...jump, jumps: [2, 6] }, 2, [1, 10])).toMatchObject({ jumps: [2, 6] });
    expect(adaptSpec({ ...jump, max: 20, jumps: [2, 6] }, 2, [1, 20])).toMatchObject({ jumps: [2, 8] });
  });

  it('десятка: крок униз — докласти менше, рамка з відомими; вгору — більше, з кроку 2 лише цифра; межі 1…9', () => {
    expect(adaptSpec({ ...ten, show: 'digit' }, -1, [1, 10])).toMatchObject({ known: [5, 9], show: 'frame' });
    expect(adaptSpec(ten, -2, [1, 10])).toMatchObject({ known: [6, 9] });
    expect(adaptSpec(ten, 1, [1, 10])).toMatchObject({ known: [3, 7], show: 'frame' });
    expect(adaptSpec(ten, 2, [1, 10])).toMatchObject({ known: [2, 6], show: 'digit' });
    expect(adaptSpec({ ...ten, known: [1, 3] }, 2, [1, 10])).toMatchObject({ known: [1, 1] });
  });

  it('altSpec: для цих ігор заміни немає', () => {
    expect(altSpec(jump, 'w3')).toBeNull();
    expect(altSpec(ten, 'w3')).toBeNull();
  });
});

describe('adaptSpec: «Historyjki»', () => {
  const story: StoryTask = { game: 'historyjki', skill: 'add-combine', sum: [4, 8], kind: 'combine', answers: 'digit' };

  it('крок униз — менша сума й лише «прийшло ще»; вгору — більша сума, а join з кроку 1 стає mixed', () => {
    expect(adaptSpec(story, 0, [1, 10])).toBe(story);
    expect(adaptSpec(story, -1, [1, 10])).toMatchObject({ sum: [4, 7], kind: 'join' });
    expect(adaptSpec(story, 1, [1, 10])).toMatchObject({ sum: [4, 9], kind: 'combine' });
    expect(adaptSpec({ ...story, kind: 'join' }, 1, [1, 10])).toMatchObject({ kind: 'mixed' });
    expect(adaptSpec({ ...story, kind: 'join' }, 1, [1, 10])).toMatchObject({ sum: [4, 9] });
  });
});

describe('«Nakarm zwierzaka» з коробками по 10 (W5)', () => {
  const boxes: FeedTask = { game: 'nakarmZwierzaka', skill: 'compose-2digit', count: [21, 49], slots: false, boxes: true };
  const W5: [number, number] = [10, 100];

  it('крок міняє верхню межу на 10, але не вище 59 і не вужче за 3 числа; коробки лишаються', () => {
    expect(adaptSpec(boxes, 1, W5)).toMatchObject({ count: [21, 59], boxes: true, slots: false });
    expect(adaptSpec(boxes, 2, W5)).toMatchObject({ count: [21, 59], boxes: true });
    expect(adaptSpec(boxes, -1, W5)).toMatchObject({ count: [21, 39], boxes: true });
    expect(adaptSpec(boxes, -2, W5)).toMatchObject({ count: [21, 29], boxes: true });
  });

  it('на найнижчому кроці з труднощами — «Paczki», режим «Zbuduj liczbę…»', () => {
    expect(altSpec(boxes, 'w5')).toMatchObject({ game: 'paczkiPoDziesiec', mode: 'build', total: [21, 49], skill: 'compose-2digit', answers: 'digit' });
  });
});
