import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../curriculum/levels';
import type { TaskSpec } from '../../curriculum/types';
import { OBJECTS } from '../../speech/nouns';
import { DEMO_COUNT, demoKindFor, demoPausesMs, demoSteps, type DemoKind } from './ideaDemo';

describe('вид демонстрації', () => {
  it('за першою навичкою: Błysk! → flash, «дати N» → plate, додавання → sum, решта → count', () => {
    expect(demoKindFor(['subitize-5'])).toBe('flash');
    expect(demoKindFor(['give-n'])).toBe('plate');
    expect(demoKindFor(['add-combine'])).toBe('sum');
    expect(demoKindFor(['count-on'])).toBe('sum');
    expect(demoKindFor(['count-line'])).toBe('count');
    expect(demoKindFor(['count-scatter'])).toBe('count');
    expect(demoKindFor([])).toBe('count');
  });

  it('гра нового завдання важливіша за навичку: «Kto ma więcej?» → compare, «Autobus dziesiątka» → bus (навіть із навичкою bonds-5-10)', () => {
    const task = (game: 'ktoMaWiecej' | 'autobusDziesiatka', review = false) => ({ game, skill: 'compare-10', review }) as unknown as TaskSpec;
    expect(demoKindFor(['compare-10'], [task('ktoMaWiecej')])).toBe('compare');
    expect(demoKindFor(['bonds-5-10'], [task('autobusDziesiatka')])).toBe('bus');
    // перше НОВЕ завдання: повторення (review) не рахується
    expect(demoKindFor(['count-line'], [task('ktoMaWiecej', true)])).toBe('count');
    expect(demoKindFor(['bonds-5-10'], [])).toBe('sum');
  });

  it('усі рівні W1 з новою ідеєю мають зрозумілу демонстрацію', () => {
    const kinds = LEVELS.filter((l) => l.world === 'w1' && l.newIdea).map((l) => demoKindFor(l.skills));
    expect(kinds.length).toBeGreaterThan(0);
    for (const k of kinds) expect(['count', 'flash', 'plate']).toContain(k);
  });
});

describe('кроки демонстрації', () => {
  const noun = OBJECTS.kaczuszka;

  it('лічба: пауза, «jeden, dwa, trzy», підсумок «Są trzy kaczuszki!»', () => {
    const steps = demoSteps('count', noun);
    expect(steps.map((s) => s.say)).toEqual([undefined, 'jeden', 'dwa', 'trzy', 'Są trzy kaczuszki!']);
    expect(steps.map((s) => s.stage)).toEqual([0, 1, 2, 3, DEMO_COUNT + 1]);
  });

  it('тарілка — ті самі кроки, що й лічба', () => {
    expect(demoSteps('plate', noun)).toEqual(demoSteps('count', noun));
  });

  it('Błysk!: питання, крапки на мить, відповідь словом', () => {
    const steps = demoSteps('flash', noun);
    expect(steps.map((s) => s.say)).toEqual(['Patrz uważnie! Ile kropek?', undefined, 'trzy']);
    expect(steps.map((s) => s.stage)).toEqual([0, 1, 2]);
  });

  it('разом: дві групи, знаки, «Trzy dodać dwa równa się pięć.»', () => {
    const steps = demoSteps('sum', OBJECTS.jablko);
    expect(steps[0]?.say).toBe('Trzy jabłka i dwa jabłka. Ile razem?');
    expect(steps[2]?.say).toBe('Trzy dodać dwa równa się pięć.');
  });

  it('Kto ma więcej?: питання, пари, «Miś ma więcej jabłek.»', () => {
    const steps = demoSteps('compare', OBJECTS.jablko);
    expect(steps.map((s) => s.say)).toEqual(['Kto ma więcej jabłek?', undefined, 'Miś ma więcej jabłek.']);
    expect(steps.map((s) => s.stage)).toEqual([0, 1, 2]);
  });

  it('Autobus: питання про вільні місця, лічба, «Siedem i trzy to dziesięć.»', () => {
    const steps = demoSteps('bus', OBJECTS.jablko);
    expect(steps.map((s) => s.say)).toEqual(['Ile miejsc jest wolnych?', undefined, 'Siedem i trzy to dziesięć.']);
  });

  it('репліки без цифр і без минулого часу щодо дитини', () => {
    for (const kind of ['count', 'flash', 'plate', 'sum', 'compare', 'bus'] as DemoKind[]) {
      for (const s of demoSteps(kind, noun)) {
        if (s.say) {
          expect(s.say).not.toMatch(/\d/);
          expect(s.say).not.toMatch(/(łeś|łaś)/);
        }
      }
    }
  });

  it('паузи між кроками коротші за 4 с — решту часу забирає голос (вступ ≤ 20 с)', () => {
    for (const kind of ['count', 'flash', 'plate', 'sum', 'compare', 'bus'] as DemoKind[]) {
      expect(demoPausesMs(demoSteps(kind, noun))).toBeLessThan(4000);
    }
  });
});
