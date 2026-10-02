import { describe, expect, it } from 'vitest';
import { SKILLS } from '../curriculum/skills';
import { levelsOfWorld } from '../curriculum/levels';
import { SKILL_NAMES } from '../speech/lines';
import { emptyProgress, emptySkill } from '../store/defaults';
import type { AnswerEntry, ProfileProgress } from '../store/types';
import { COUNT_ON_MIN, MIN_CONFUSIONS, confusablePair, difficulties, lastSession, overview, progressStats, skillRows } from './report';
import { PANEL_TEXT, SKILL_NAMES_UK, panelText, skillName } from './text';

const entry = (over: Partial<AnswerEntry> = {}): AnswerEntry => ({
  t: 1, day: '2026-10-05', skill: 'count-line', game: 'policzIDotknij', level: 'w1-1', firstTry: true, attempts: 1, hints: 0, together: false, ms: 1000, ...over,
});
const progress = (over: Partial<ProfileProgress> = {}): ProfileProgress => ({ ...emptyProgress(), ...over });
const done = (ids: readonly string[]): ProfileProgress['levels'] =>
  Object.fromEntries(ids.map((id) => [id, { completedAt: '2026-10-05T10:00:00.000Z', plays: 1, togetherUsed: false, firstTry: 6 }]));

describe('overview', () => {
  it('порожній прогрес: нулі; усього 87 основних рівнів і 7 світів', () => {
    expect(overview(progress())).toEqual({ levelsDone: 0, levelsTotal: 87, worldsDone: 0, worldsTotal: 7, stickers: 0, badges: 0, minutes: 0 });
  });

  it('пройдений W1: 12 рівнів, 1 світ, 12 наліпок; ★-рівні не лізуть у загальну кількість', () => {
    const ids = levelsOfWorld('w1').map((l) => l.id);
    const o = overview(progress({ levels: done(ids), minutesByDay: { '2026-10-05': 10.4, '2026-10-06': 5 } }));
    expect(o.levelsDone).toBe(12);
    expect(o.worldsDone).toBe(1);
    expect(o.stickers).toBe(12);
    expect(o.minutes).toBe(15);
    const withStar = overview(progress({ levels: done([...levelsOfWorld('w4').filter((l) => l.kind === 'star').map((l) => l.id)]) }));
    expect(withStar.levelsDone).toBe(0);
    expect(withStar.stickers).toBe(4);
  });

  it('значки: рівні, де було «разом»', () => {
    const levels = { ...done(['w1-1', 'w1-2']) };
    levels['w1-2'] = { ...levels['w1-2']!, togetherUsed: true };
    expect(overview(progress({ levels })).badges).toBe(1);
  });
});

describe('lastSession', () => {
  it('нічого не було — null', () => {
    expect(lastSession(progress())).toBeNull();
  });

  it('останній день із хвилинами, його хвилини й скільки рівнів пройдено того дня', () => {
    const levels = done(['w1-1', 'w1-2']);
    levels['w1-2'] = { ...levels['w1-2']!, completedAt: new Date(2026, 9, 6, 12).toISOString() };
    levels['w1-1'] = { ...levels['w1-1']!, completedAt: new Date(2026, 9, 5, 12).toISOString() };
    const s = lastSession(progress({ levels, minutesByDay: { '2026-10-05': 8, '2026-10-06': 12.34, '2026-10-04': 0 } }));
    expect(s).toEqual({ day: '2026-10-06', minutes: 12.3, levels: 1 });
  });

  it('лише історія (без хвилин): день останньої відповіді', () => {
    expect(lastSession(progress({ history: [entry({ day: '2026-10-03' })] }))?.day).toBe('2026-10-03');
  });
});

describe('skillRows', () => {
  it('29 рядків у порядку програми; нова навичка — «new»; ★-навички позначені', () => {
    const rows = skillRows(progress());
    expect(rows).toHaveLength(SKILLS.length);
    expect(rows.every((r) => r.state === 'new')).toBe(true);
    expect(rows.filter((r) => r.star).map((r) => r.id)).toEqual(['bridge-ten', 'add-with-bridge']);
  });

  it('стани: «у процесі», «Do powtórki»', () => {
    const learning = { ...emptySkill(), attempts: 3, firstTry: 1 };
    const review = { ...emptySkill(), attempts: 5, firstTry: 2, needsReview: true };
    const rows = skillRows(progress({ skills: { 'count-line': learning, zero: review } }));
    expect(rows.find((r) => r.id === 'count-line')!.state).toBe('learning');
    expect(rows.find((r) => r.id === 'zero')!.state).toBe('review');
  });
});

describe('progressStats', () => {
  it('% з першого разу, підказки, хвилини за 7 днів (від давнього до сьогодні, з нулями)', () => {
    const history = [entry({ firstTry: true }), entry({ firstTry: false, hints: 2 }), entry({ firstTry: true }), entry({ firstTry: false, hints: 1 })];
    const s = progressStats(progress({ history, minutesByDay: { '2026-10-05': 6.04, '2026-10-02': 3 } }), '2026-10-07');
    expect(s.firstTryPct).toBe(50);
    expect(s.hints).toBe(3);
    expect(s.answers).toBe(4);
    expect(s.minutes.map((m) => m.day)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07']);
    expect(s.minutes.map((m) => m.minutes)).toEqual([0, 3, 0, 0, 6, 0, 0]);
  });

  it('без відповідей — null', () => {
    expect(progressStats(progress(), '2026-10-07').firstTryPct).toBeNull();
  });
});

describe('confusablePair', () => {
  it('13 ↔ 30 … 19 ↔ 90; 26 ↔ 62; решта — null', () => {
    expect(confusablePair(13, 30)).toEqual([13, 30]);
    expect(confusablePair(30, 13)).toEqual([13, 30]);
    expect(confusablePair(19, 90)).toEqual([19, 90]);
    expect(confusablePair(26, 62)).toEqual([26, 62]);
    expect(confusablePair(62, 26)).toEqual([26, 62]);
    expect(confusablePair(14, 40)).toEqual([14, 40]);
    expect(confusablePair(12, 20)).toBeNull(); // «dwanaście» — не плутають із двадцятьма за звучанням (PEDAGOGY: -naście від 13)
    expect(confusablePair(33, 33)).toBeNull();
    expect(confusablePair(30, 3)).toBeNull();
    expect(confusablePair(20, 2)).toBeNull();
    expect(confusablePair(25, 36)).toBeNull();
  });
});

describe('difficulties', () => {
  it('плутанина з’являється з MIN_CONFUSIONS разів; пара в обидва боки рахується разом', () => {
    const h = [entry({ answer: 13, wrong: [30] }), entry({ answer: 30, wrong: [13] })];
    expect(difficulties(progress({ history: [h[0]!] }))).toEqual([]);
    expect(MIN_CONFUSIONS).toBe(2);
    expect(difficulties(progress({ history: h }))).toEqual([{ kind: 'confuse', a: 13, b: 30, count: 2 }]);
  });

  it('кілька пар: за спаданням частоти', () => {
    const h = [
      entry({ answer: 26, wrong: [62] }), entry({ answer: 26, wrong: [62] }), entry({ answer: 62, wrong: [26] }),
      entry({ answer: 13, wrong: [30] }), entry({ answer: 13, wrong: [30] }),
    ];
    expect(difficulties(progress({ history: h })).map((d) => (d.kind === 'confuse' ? `${d.a}-${d.b}:${d.count}` : d.kind))).toEqual(['26-62:3', '13-30:2']);
  });

  it('«лічить усе спочатку»: за прапорцем у записах або за слабкими відповідями в навичках «лічба далі»', () => {
    expect(difficulties(progress({ history: [entry({ countedAll: true }), entry({ countedAll: true })] })).some((d) => d.kind === 'countsAll')).toBe(true);
    const weak = Array.from({ length: COUNT_ON_MIN }, () => entry({ skill: 'count-on', firstTry: false }));
    expect(difficulties(progress({ history: weak })).some((d) => d.kind === 'countsAll')).toBe(true);
    const strong = Array.from({ length: 6 }, () => entry({ skill: 'count-on', firstTry: true }));
    expect(difficulties(progress({ history: strong })).some((d) => d.kind === 'countsAll')).toBe(false);
    const few = [entry({ skill: 'count-on', firstTry: false })];
    expect(difficulties(progress({ history: few })).some((d) => d.kind === 'countsAll')).toBe(false);
  });

  it('навички з прапорцем flagged', () => {
    const d = difficulties(progress({ skills: { zero: { ...emptySkill(), flagged: true }, 'count-line': emptySkill() } }));
    expect(d).toEqual([{ kind: 'flagged', skill: 'zero' }]);
  });

  it('нічого тривожного — порожньо', () => {
    expect(difficulties(progress({ history: [entry(), entry()] }))).toEqual([]);
  });
});

describe('двомовний словник панелі', () => {
  it('польські рядки з BRIEF дослівно', () => {
    const pl = PANEL_TEXT.pl;
    expect(pl.sections).toEqual({
      summary: 'Podsumowanie', lastSession: 'Ostatnia sesja', skills: 'Mapa umiejętności', progress: 'Postępy', difficulties: 'Trudności', settings: 'Ustawienia', profiles: 'Profile', backup: 'Kopia zapasowa',
    });
    expect(pl.skillStates).toEqual({ new: 'Nowa', learning: 'W trakcie nauki', mastered: 'Opanowana', review: 'Do powtórki' });
    expect(pl.progress.firstTry).toBe('Poprawnie za pierwszym razem');
    expect(pl.progress.hints).toBe('Użyte podpowiedzi');
    expect(pl.progress.minutesPerDay).toBe('Minuty dziennie');
    expect(pl.difficulties.confuses(13, 30)).toBe('Myli 13 i 30');
    expect(pl.difficulties.countsAll).toBe('Liczy wszystko od początku, zamiast liczyć dalej');
    expect(pl.gateEnter).toBe('Wejdź');
    expect(pl.gateWrong).toBe('Niepoprawny wynik. Spróbuj ponownie.');
    expect(pl.gateInstruction(7, 8)).toBe('Wpisz wynik: siedem razy osiem');
    expect(pl.backup.confirm('Ola')).toBe('Usunąć wszystkie postępy profilu „Ola”? Tego nie da się cofnąć.');
    expect(pl.backup.cancel).toBe('Anuluj');
    expect(pl.backup.confirmYes).toBe('Tak, usuń');
    expect(pl.settings.reduceMotion).toBe('Mniej animacji');
    expect(pl.settings.extraTasks).toBe('Zadania dodatkowe ★');
    expect(pl.settings.unlockWorld).toBe('Odblokuj świat ręcznie');
    expect(pl.backup.export).toBe('Eksportuj postępy');
    expect(pl.backup.import).toBe('Importuj postępy');
    expect(pl.backup.clear).toBe('Wyczyść postępy');
  });

  it('українська версія має ті самі ключі, що й польська (рекурсивно), без порожніх рядків', () => {
    const keys = (v: unknown, prefix = ''): string[] =>
      typeof v === 'function' ? [prefix] : typeof v === 'object' && v !== null ? Object.entries(v).flatMap(([k, x]) => keys(x, `${prefix}.${k}`)) : [prefix];
    expect(keys(PANEL_TEXT.uk).sort()).toEqual(keys(PANEL_TEXT.pl).sort());
    const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : typeof v === 'object' && v !== null ? Object.values(v).flatMap(strings) : []);
    for (const s of strings(PANEL_TEXT.uk)) expect(s.length).toBeGreaterThan(0);
    expect(PANEL_TEXT.uk.gateInstruction(7, 8)).toBe('Введіть результат: сім помножити на вісім');
    expect(PANEL_TEXT.uk.difficulties.confuses(26, 62)).toBe('Плутає 26 і 62');
    expect(PANEL_TEXT.uk.backup.confirm('Ola')).toContain('«Ola»');
  });

  it('названі всі 29 навичок обома мовами; panelText — типова польська для сміття', () => {
    for (const s of SKILLS) {
      expect(SKILL_NAMES[s.id].length, s.id).toBeGreaterThan(3);
      expect(SKILL_NAMES_UK[s.id].length, s.id).toBeGreaterThan(3);
      expect(skillName(s.id, 'uk')).toBe(SKILL_NAMES_UK[s.id]);
      expect(skillName(s.id, 'pl')).toBe(SKILL_NAMES[s.id]);
    }
    expect(panelText('xx' as never)).toBe(PANEL_TEXT.pl);
  });
});
