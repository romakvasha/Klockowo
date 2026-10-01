import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../curriculum/levels';
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

  it('репліки без цифр і без минулого часу щодо дитини', () => {
    for (const kind of ['count', 'flash', 'plate', 'sum'] as DemoKind[]) {
      for (const s of demoSteps(kind, noun)) {
        if (s.say) {
          expect(s.say).not.toMatch(/\d/);
          expect(s.say).not.toMatch(/(łeś|łaś)/);
        }
      }
    }
  });

  it('паузи між кроками коротші за 4 с — решту часу забирає голос (вступ ≤ 20 с)', () => {
    for (const kind of ['count', 'flash', 'plate', 'sum'] as DemoKind[]) {
      expect(demoPausesMs(demoSteps(kind, noun))).toBeLessThan(4000);
    }
  });
});
