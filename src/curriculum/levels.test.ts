import { describe, expect, it } from 'vitest';
import type { TaskSpec } from './types';
import { LEVELS, findLevel, levelById, levelsOfWorld } from './levels';
import { W1_LEVELS } from './levels/w1';
import { W2_LEVELS } from './levels/w2';
import { W3_LEVELS } from './levels/w3';
import { W4_LEVELS } from './levels/w4';
import { W5_LEVELS } from './levels/w5';
import { skillInfo } from './skills';
import { WORLD_KEYS, parseLevelId, worldById } from './worlds';

describe('усі рівні програми', () => {
  it('87 основних + 8 ★ = 95 рівнів, унікальні id, кожен id розбирається у власні світ/вид/номер', () => {
    expect(LEVELS).toHaveLength(95);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(95);
    expect(LEVELS.filter((l) => l.kind === 'main')).toHaveLength(87);
    expect(LEVELS.filter((l) => l.kind === 'star')).toHaveLength(8);
    for (const l of LEVELS) expect(parseLevelId(l.id), l.id).toEqual({ world: l.world, kind: l.kind, index: l.index });
  });

  it('levelsOfWorld: основні за порядком, потім ★', () => {
    expect(levelsOfWorld('w4').map((l) => l.id)).toEqual([
      ...Array.from({ length: 12 }, (_, i) => `w4-${i + 1}`),
      'w4-s1', 'w4-s2', 'w4-s3', 'w4-s4',
    ]);
    expect(levelsOfWorld('w3')).toHaveLength(15);
  });

  it('levelById / findLevel: невідомий id — помилка чи undefined', () => {
    expect(levelById('w2-5').world).toBe('w2');
    expect(findLevel('w9-1')).toBeUndefined();
    expect(() => levelById('w1-13')).toThrow('Unknown level');
  });

  it('W6–W7 — заготовки (draft, без завдань); W1–W5 — описано повністю', () => {
    for (const l of LEVELS) {
      if (l.world === 'w1' || l.world === 'w2' || l.world === 'w3' || l.world === 'w4' || l.world === 'w5') expect(l.draft, l.id).toBe(false);
      else {
        expect(l.draft, l.id).toBe(true);
        expect(l.tasks, l.id).toEqual([]);
      }
    }
  });
});

describe('W1 «Łąka Liczenia» — 12 рівнів по 6 завдань', () => {
  const w1 = worldById('w1');

  it('12 рівнів, кожен — місія з 6 завдань', () => {
    expect(W1_LEVELS).toHaveLength(12);
    W1_LEVELS.forEach((l, i) => {
      expect(l.index, l.id).toBe(i + 1);
      expect(l.tasks, l.id).toHaveLength(6);
    });
  });

  it('рівень 1 (для M8): шість завдань «Policz i dotknij» 1–3 в рядку, без повторення', () => {
    const [first] = W1_LEVELS;
    expect(first?.tasks.every((t) => t.game === 'policzIDotknij' && !t.review)).toBe(true);
    for (const t of first?.tasks ?? []) {
      if (t.game === 'policzIDotknij') {
        expect(t.count).toEqual([1, 3]);
        expect(t.arrangement).toBe('line');
      }
    }
  });

  it('спіральне повторення: рівень 1 — 0, решта — рівно 2 з 6 (≈ 30 %)', () => {
    W1_LEVELS.forEach((l, i) => {
      expect(l.tasks.filter((t) => t.review).length, l.id).toBe(i === 0 ? 0 : 2);
    });
  });

  it('ігри, навички й діапазони — лише W1: 1–10, цифра з крапками на плитках', () => {
    for (const l of W1_LEVELS) {
      for (const t of l.tasks) {
        expect(w1.games, `${l.id} ${t.game}`).toContain(t.game);
        expect(skillInfo(t.skill).world, `${l.id} ${t.skill}`).toBe('w1');
        if (t.game === 'policzIDotknij' || t.game === 'blysk' || t.game === 'nakarmZwierzaka') {
          expect(t.count[0], l.id).toBeGreaterThanOrEqual(1);
          expect(t.count[1], l.id).toBeLessThanOrEqual(10);
          expect(t.count[0], l.id).toBeLessThanOrEqual(t.count[1]);
        }
        if (t.game === 'policzIDotknij' || t.game === 'blysk') expect(t.answers, l.id).toBe('digitDots');
      }
    }
  });

  it('навички нових завдань входять у skills рівня', () => {
    for (const l of W1_LEVELS) {
      for (const t of l.tasks.filter((x) => !x.review)) expect(l.skills, `${l.id} ${t.skill}`).toContain(t.skill);
    }
  });

  it('нові ідеї: лічба (1), «Błysk!» (3), дати N (4), розсип (6); решта — без «Patrz, pokażę ci.»', () => {
    expect(W1_LEVELS.filter((l) => l.newIdea).map((l) => l.index)).toEqual([1, 3, 4, 6]);
  });

  it('складність росте: експозиція «Błysk!» не збільшується (2 с → 1 с); розсип і числа не зменшуються', () => {
    const exposures = W1_LEVELS.flatMap((l) => l.tasks.flatMap((t) => (t.game === 'blysk' ? [t.exposureMs] : [])));
    expect(exposures.length).toBeGreaterThan(0);
    expect(Math.max(...exposures)).toBe(2000);
    expect(Math.min(...exposures)).toBe(1000);
    exposures.forEach((ms, i) => {
      if (i > 0) expect(ms, `exposure #${i}`).toBeLessThanOrEqual(exposures[i - 1] ?? Infinity);
    });
  });

  it('підсумковий рівень 12 (скриня): розсип до 10, дати 6–10 і «Błysk!»', () => {
    const last = W1_LEVELS[11];
    expect(last).toBeDefined();
    const games = new Set(last?.tasks.map((t) => t.game));
    expect(games).toEqual(new Set(['policzIDotknij', 'nakarmZwierzaka', 'blysk']));
    expect(last?.skills).toEqual(['count-scatter', 'give-n', 'subitize-5']);
  });
});

describe('світи без ★ чи з ★', () => {
  it('кількість заготовок збігається з описом світів', () => {
    for (const w of WORLD_KEYS) {
      const levels = levelsOfWorld(w);
      expect(levels.filter((l) => l.kind === 'main')).toHaveLength(worldById(w).mainLevels);
      expect(levels.filter((l) => l.kind === 'star')).toHaveLength(worldById(w).starLevels);
    }
  });
});

describe('W2 «Ogród Cyfr» — 12 рівнів по 6 завдань', () => {
  const w2 = worldById('w2');

  it('12 рівнів, кожен — місія з 6 завдань', () => {
    expect(W2_LEVELS).toHaveLength(12);
    W2_LEVELS.forEach((l, i) => {
      expect(l.index, l.id).toBe(i + 1);
      expect(l.tasks, l.id).toHaveLength(6);
      expect(l.draft, l.id).toBe(false);
    });
  });

  it('спіральне повторення: у кожному рівні рівно 2 з 6 завдань (≈ 30 %)', () => {
    for (const l of W2_LEVELS) expect(l.tasks.filter((t) => t.review).length, l.id).toBe(2);
  });

  it('ігри W2 — лише з каталогу світу; нові завдання мають навичку, заявлену в рівні', () => {
    for (const l of W2_LEVELS) {
      for (const t of l.tasks) expect(w2.games, `${l.id} ${t.game}`).toContain(t.game);
      for (const t of l.tasks.filter((x) => !x.review)) expect(l.skills, `${l.id} ${t.skill}`).toContain(t.skill);
    }
  });

  it('діапазони чисел — 0–10; плитки W2 — цифри (крапки лише на перших двох рівнях)', () => {
    for (const l of W2_LEVELS) {
      for (const t of l.tasks) {
        const range = 'count' in t ? t.count : 'numbers' in t ? t.numbers : 'range' in t ? t.range : null;
        if (range) {
          expect(range[0], `${l.id} ${t.game}`).toBeGreaterThanOrEqual(0);
          expect(range[1], `${l.id} ${t.game}`).toBeLessThanOrEqual(10);
        }
        if ((t.game === 'policzIDotknij' || t.game === 'blysk') && l.index > 2) expect(t.answers, l.id).not.toBe('digitDots');
      }
    }
  });

  it('нові ідеї: цифра↔кількість (1), нуль (3), порівняння (4), автобус (7); перша нова гра — за грою демонстрації', () => {
    expect(W2_LEVELS.filter((l) => l.newIdea).map((l) => l.index)).toEqual([1, 3, 4, 7]);
    const first = (i: number) => W2_LEVELS[i - 1]?.tasks.find((t) => !t.review)?.game;
    expect(first(4)).toBe('ktoMaWiecej');
    expect(first(7)).toBe('autobusDziesiatka');
  });

  it('усі нові ігри M11 і нуль присутні: порівняння з «Tyle samo», підступ і цифри, автобус із миготінням, нуль у вагонах і наборах', () => {
    const all = W2_LEVELS.flatMap((l) => l.tasks);
    expect(all.some((t) => t.game === 'ktoMaWiecej' && (t.equal ?? 0) > 0)).toBe(true);
    expect(all.some((t) => t.game === 'ktoMaWiecej' && t.show === 'sizeTrick')).toBe(true);
    expect(all.some((t) => t.game === 'ktoMaWiecej' && t.show === 'digits')).toBe(true);
    expect(all.some((t) => t.game === 'ktoMaWiecej' && t.ask !== 'more')).toBe(true);
    expect(all.some((t) => t.game === 'autobusDziesiatka' && t.exposureMs > 0)).toBe(true);
    expect(all.some((t) => t.game === 'autobusDziesiatka' && t.ask !== 'full')).toBe(true);
    expect(all.some((t) => t.game === 'zgubionyWagonik' && t.range[0] === 0)).toBe(true);
    expect(all.some((t) => t.game === 'cyfraIObrazek' && t.numbers[0] === 0)).toBe(true);
  });

  it("«Tyle samo» з'являється лише після того, як порівняння вже знайоме (не раніше рівня 9)", () => {
    for (const l of W2_LEVELS) {
      const hasEqual = l.tasks.some((t) => t.game === 'ktoMaWiecej' && !t.review && (t.equal ?? 0) > 0);
      if (l.index < 9) expect(hasEqual, l.id).toBe(false);
    }
  });

  it('підсумковий рівень 12 (скриня): цифра↔кількість, вагони, порівняння цифр', () => {
    const last = W2_LEVELS[11];
    expect(last?.skills).toEqual(['digit-quantity', 'order-around', 'compare-10']);
    const games = new Set(last?.tasks.filter((t) => !t.review).map((t) => t.game));
    expect(games).toEqual(new Set(['cyfraIObrazek', 'zgubionyWagonik', 'ktoMaWiecej']));
  });
});

describe('W3 «Wyspa Dodawania» — 15 рівнів по 6 завдань', () => {
  const w3 = worldById('w3');

  it('15 рівнів, кожен — місія з 6 завдань', () => {
    expect(W3_LEVELS).toHaveLength(15);
    W3_LEVELS.forEach((l, i) => {
      expect(l.index, l.id).toBe(i + 1);
      expect(l.tasks, l.id).toHaveLength(6);
      expect(l.draft, l.id).toBe(false);
    });
  });

  it('спіральне повторення: у кожному рівні рівно 2 з 6 завдань (≈ 30 %)', () => {
    for (const l of W3_LEVELS) expect(l.tasks.filter((t) => t.review).length, l.id).toBe(2);
  });

  it('нові завдання — з ігор W3 і з навичкою, заявленою в рівні', () => {
    for (const l of W3_LEVELS) {
      for (const t of l.tasks.filter((x) => !x.review)) {
        expect(w3.games, `${l.id} ${t.game}`).toContain(t.game);
        expect(l.skills, `${l.id} ${t.skill}`).toContain(t.skill);
      }
    }
  });

  it('суми й цілі не виходять за 10; стрибки жабки — на прямій 0–10', () => {
    for (const l of W3_LEVELS) {
      for (const t of l.tasks) {
        if (t.game === 'ileRazem' || t.game === 'historyjki') expect(t.sum[1], l.id).toBeLessThanOrEqual(10);
        if (t.game === 'domekLiczb') expect(t.whole[1], l.id).toBeLessThanOrEqual(10);
        if (t.game === 'skokiZabki') expect(t.max, l.id).toBe(10);
      }
    }
  });

  it('усі ігри W3 зустрічаються; нові ідеї — обʼєднання (1), знаки (3), історії (4), лічба далі (5), жабка (6), склад (7, 9), подвоєння (11)', () => {
    const games = new Set(W3_LEVELS.flatMap((l) => l.tasks.filter((t) => !t.review).map((t) => t.game)));
    for (const g of ['ileRazem', 'historyjki', 'skokiZabki', 'domekLiczb', 'zrobDziesiatke']) expect(games.has(g as never), g).toBe(true);
    expect(W3_LEVELS.filter((l) => l.newIdea).map((l) => l.index)).toEqual([1, 3, 4, 5, 6, 7, 9, 11]);
  });

  it('кришка (лічба від числа) — не раніше рівня 5; «лише цифра» у «Zrób dziesiątkę» — не раніше рівня 10; кожна ідея спершу в простому вигляді', () => {
    for (const l of W3_LEVELS) {
      const fresh = l.tasks.filter((t) => !t.review);
      if (l.index < 5) expect(fresh.some((t) => t.game === 'ileRazem' && t.lid), l.id).toBe(false);
      if (l.index < 10) expect(fresh.some((t) => t.game === 'zrobDziesiatke' && t.show === 'digit'), l.id).toBe(false);
      if (l.index < 3) expect(fresh.some((t) => t.game === 'ileRazem' && t.symbols), l.id).toBe(false);
    }
  });

  it('підсумковий рівень 15 (скриня) перевіряє суми, історію, склад 10 і лічбу «від числа»', () => {
    const last = W3_LEVELS[14];
    expect(last?.skills).toEqual(['add-combine', 'count-on', 'bonds-5-10', 'doubles']);
    expect(new Set(last?.tasks.filter((t) => !t.review).map((t) => t.game))).toEqual(new Set(['ileRazem', 'historyjki', 'domekLiczb', 'skokiZabki']));
  });
});

describe('W4 «Most Dwudziestki» — 12 основних рівнів + ★-гілка з 4, по 6 завдань', () => {
  const w4 = worldById('w4');
  const main = W4_LEVELS.filter((l) => l.kind === 'main');
  const star = W4_LEVELS.filter((l) => l.kind === 'star');

  it('12 основних і 4 ★-рівні, кожен — місія з 6 завдань, 2 з них — повторення', () => {
    expect(main).toHaveLength(12);
    expect(star).toHaveLength(4);
    expect(star.map((l) => l.id)).toEqual(['w4-s1', 'w4-s2', 'w4-s3', 'w4-s4']);
    for (const l of W4_LEVELS) {
      expect(l.tasks, l.id).toHaveLength(6);
      expect(l.draft, l.id).toBe(false);
      expect(l.tasks.filter((t) => t.review).length, l.id).toBe(2);
    }
  });

  it('нові завдання — з ігор W4 і з навичкою, заявленою в рівні; ★-рівні вчать лише «через десяток»', () => {
    for (const l of W4_LEVELS) {
      for (const t of l.tasks.filter((x) => !x.review)) {
        expect(w4.games, `${l.id} ${t.game}`).toContain(t.game);
        expect(l.skills, `${l.id} ${t.skill}`).toContain(t.skill);
      }
    }
    for (const l of star) expect(l.skills, l.id).toEqual(['bridge-ten']);
  });

  it('числа нових завдань — 11–20 (суми й ціле до 20; жабка на прямій 0–20; автобус двоповерховий)', () => {
    for (const l of W4_LEVELS) {
      for (const t of l.tasks.filter((x) => !x.review)) {
        if (t.game === 'policzIDotknij') expect(t.count[0], l.id).toBeGreaterThanOrEqual(11);
        if (t.game === 'ileRazem' || t.game === 'historyjki') expect(t.sum[1], l.id).toBeLessThanOrEqual(20);
        if (t.game === 'domekLiczb') expect(t.whole[0], l.id).toBeGreaterThanOrEqual(11);
        if (t.game === 'skokiZabki') expect(t.max, l.id).toBe(20);
        if (t.game === 'autobusDziesiatka') expect(t.floors, l.id).toBe(2);
      }
    }
  });

  it('основний шлях без переходу через десяток: суми й історії — з noBridge; «через десяток» лише в ★', () => {
    for (const l of main) {
      for (const t of l.tasks.filter((x) => !x.review)) {
        if (t.game === 'ileRazem' || t.game === 'historyjki') expect(t.noBridge, l.id).toBe(true);
        expect(t.game === 'zrobDziesiatke', l.id).toBe(false);
      }
    }
    expect(star[0]!.tasks.filter((t) => !t.review).every((t) => t.game === 'zrobDziesiatke' && t.bridge === true)).toBe(true);
  });

  it('нові ідеї: «-naście» (1, 3), лічба з будь-якого числа (5), двоповерховий автобус (7), додавання без переходу (9); ★1 — через десяток', () => {
    expect(main.filter((l) => l.newIdea).map((l) => l.index)).toEqual([1, 3, 5, 7, 9]);
    expect(star.filter((l) => l.newIdea).map((l) => l.index)).toEqual([1]);
  });

  it('усі нові розкладки W4 присутні: блоки «десять і ще n», подвійна рамка, автобус на 20, лічба «від числа» з кришкою', () => {
    const fresh = main.flatMap((l) => l.tasks.filter((t) => !t.review));
    expect(fresh.some((t) => t.game === 'policzIDotknij' && t.arrangement === 'tens')).toBe(true);
    expect(fresh.some((t) => t.game === 'cyfraIObrazek' && t.set === 'tenFrame')).toBe(true);
    expect(fresh.some((t) => t.game === 'autobusDziesiatka' && t.ask === 'empty')).toBe(true);
    expect(fresh.some((t) => t.game === 'ileRazem' && t.lid)).toBe(true);
  });

  it('підсумковий рівень 12 (скриня) перевіряє суми, історію, склад до 20 й лічбу з будь-якого числа', () => {
    const last = main[11]!;
    expect(last.skills).toEqual(['add-no-bridge-20', 'teens', 'count-from-any']);
    expect(new Set(last.tasks.filter((t) => !t.review).map((t) => t.game))).toEqual(new Set(['ileRazem', 'historyjki', 'domekLiczb', 'zgubionyWagonik']));
  });
});

describe('W5 «Las Dziesiątek» — 12 рівнів по 6 завдань', () => {
  const w5 = worldById('w5');

  it('12 рівнів, кожен — місія з 6 завдань, 2 з них — повторення', () => {
    expect(W5_LEVELS).toHaveLength(12);
    W5_LEVELS.forEach((l, i) => {
      expect(l.index, l.id).toBe(i + 1);
      expect(l.tasks, l.id).toHaveLength(6);
      expect(l.draft, l.id).toBe(false);
      expect(l.tasks.filter((t) => t.review).length, l.id).toBe(2);
    });
  });

  it('нові завдання — з ігор W5 (вагони й пакування) і з навичкою, заявленою в рівні', () => {
    for (const l of W5_LEVELS) {
      for (const t of l.tasks.filter((x) => !x.review)) {
        expect(w5.games, `${l.id} ${t.game}`).toContain(t.game);
        expect(['zgubionyWagonik', 'paczkiPoDziesiec'], `${l.id} ${t.game}`).toContain(t.game);
        expect(l.skills, `${l.id} ${t.skill}`).toContain(t.skill);
      }
    }
  });

  it('вагони — з кроком 10; пакування в loose — до 59, у решті — до 99', () => {
    for (const l of W5_LEVELS) {
      for (const t of l.tasks.filter((x) => !x.review)) {
        if (t.game === 'zgubionyWagonik') expect(t.step, l.id).toBe(10);
        if (t.game === 'paczkiPoDziesiec') {
          expect(t.total[1], l.id).toBeLessThanOrEqual(t.mode === 'loose' ? 59 : 99);
          expect(t.total[0], l.id).toBeGreaterThanOrEqual(11);
        }
      }
    }
  });

  it('порядок ідей: десятки (1) → читання в коробках (3) → пакування (4) → «Zbuduj» (6) → контраст (9)', () => {
    expect(W5_LEVELS.filter((l) => l.newIdea).map((l) => l.index)).toEqual([1, 3, 4, 6, 9]);
    const firstOf = (pick: (t: TaskSpec) => boolean) => W5_LEVELS.find((l) => l.tasks.some((t) => !t.review && pick(t)))?.index;
    expect(firstOf((t) => t.game === 'paczkiPoDziesiec' && t.mode === 'packed')).toBe(3);
    expect(firstOf((t) => t.game === 'paczkiPoDziesiec' && t.mode === 'loose')).toBe(4);
    expect(firstOf((t) => t.game === 'paczkiPoDziesiec' && t.mode === 'build')).toBe(6);
    expect(firstOf((t) => t.game === 'paczkiPoDziesiec' && t.contrast)).toBe(9);
  });

  it('підсумковий рівень 12 (скриня): десятки, пакування, збирання, контраст', () => {
    const last = W5_LEVELS[11]!;
    expect(last.skills).toEqual(['count-by-tens', 'bundle-ten', 'compose-2digit']);
    const fresh = last.tasks.filter((t) => !t.review);
    expect(fresh.some((t) => t.game === 'zgubionyWagonik')).toBe(true);
    expect(fresh.some((t) => t.game === 'paczkiPoDziesiec' && t.mode === 'build')).toBe(true);
    expect(fresh.some((t) => t.game === 'paczkiPoDziesiec' && t.contrast)).toBe(true);
  });
});
