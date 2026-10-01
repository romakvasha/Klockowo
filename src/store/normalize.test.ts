import { describe, expect, it } from 'vitest';
import { PUP_IDS } from '../characters/pups';
import { defaultSettings, emptyData, emptyProgress } from './defaults';
import { normalizeData, normalizeProfile, normalizeProgress, normalizeSettings } from './normalize';
import { MAX_HISTORY } from './progress';
import { MAX_NAME_LENGTH, MAX_PROFILES } from './types';

const profile = (id: string, over: Record<string, unknown> = {}) => ({ id, name: 'Ola', pup: 'pudel', createdAt: '2026-10-01T10:00:00.000Z', ...over });

describe('нормалізація сміття: застосунок не падає', () => {
  it("будь-яке необ'єктне значення → порожні дані", () => {
    for (const junk of [undefined, null, 'x', 42, true, [], [1, 2]]) {
      expect(normalizeData(junk), String(junk)).toEqual(emptyData());
      expect(normalizeProgress(junk), String(junk)).toEqual(emptyProgress());
      expect(normalizeSettings(junk), String(junk)).toEqual(defaultSettings());
    }
  });

  it('ідемпотентність: повторна нормалізація нічого не змінює', () => {
    const messy = {
      profiles: [profile('a', { name: '  Staś  ', pup: 'nope' }), profile('b')],
      activeProfileId: 'b',
      settings: { sessionMinutes: 20, speechRate: 5, volumes: { speech: 2, music: -1 }, panelLanguage: 'uk' },
      progress: { a: { levels: { 'w1-1': { plays: 3 } }, minutesByDay: { '2026-10-01': 12 } } },
    };
    const once = normalizeData(messy);
    expect(normalizeData(once)).toEqual(once);
  });
});

describe('налаштування', () => {
  it('значення обмежуються діапазонами; невідомі — типові', () => {
    const s = normalizeSettings({ sessionMinutes: 12, speechRate: 9, volumes: { speech: 3, effects: -1, music: 0.5 }, reduceMotion: 'yes', panelLanguage: 'de' });
    expect(s.sessionMinutes).toBe(15);
    expect(s.speechRate).toBe(1.2);
    expect(s.volumes).toEqual({ speech: 1, effects: 0, music: 0.5 });
    expect(s.reduceMotion).toBe(false);
    expect(s.panelLanguage).toBe('pl');
  });

  it('дозволені значення проходять; voiceURI "" → null', () => {
    const s = normalizeSettings({ sessionMinutes: 10, voiceURI: 'urn:voice', speechRate: 0.7, reduceMotion: true, extraTasks: false, panelLanguage: 'uk' });
    expect(s).toMatchObject({ sessionMinutes: 10, voiceURI: 'urn:voice', speechRate: 0.7, reduceMotion: true, extraTasks: false, panelLanguage: 'uk' });
    expect(normalizeSettings({ voiceURI: '' }).voiceURI).toBeNull();
  });

  it('base: неприпустиме значення лишає поточне, а не типове', () => {
    const current = { ...defaultSettings(), sessionMinutes: 20 as const };
    expect(normalizeSettings({ sessionMinutes: 12 }, current).sessionMinutes).toBe(20);
  });
});

describe('профілі', () => {
  it("ім'я обрізається й обмежується; порожнє → null; невідоме цуценя → типове", () => {
    expect(normalizeProfile(profile('a', { name: '  Staś  ' }))?.name).toBe('Staś');
    expect(normalizeProfile(profile('a', { name: 'x'.repeat(100) }))?.name).toHaveLength(MAX_NAME_LENGTH);
    expect(normalizeProfile(profile('a', { name: '   ' }))?.name).toBeNull();
    expect(normalizeProfile(profile('a', { name: 42 }))?.name).toBeNull();
    expect(PUP_IDS).toContain(normalizeProfile(profile('a', { pup: 'dalmatyńczyk' }))?.pup);
  });

  it("без id чи не об'єкт — null", () => {
    expect(normalizeProfile({ name: 'x' })).toBeNull();
    expect(normalizeProfile(profile(''))).toBeNull();
    expect(normalizeProfile('x')).toBeNull();
  });

  it('до 4 профілів, дублікати id відкидаються, активний мусить існувати', () => {
    const data = normalizeData({
      profiles: [profile('a'), profile('a'), profile('b'), profile('c'), profile('d'), profile('e')],
      activeProfileId: 'zzz',
    });
    expect(data.profiles.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(data.profiles).toHaveLength(MAX_PROFILES);
    expect(data.activeProfileId).toBeNull();
    expect(normalizeData({ profiles: [profile('a')], activeProfileId: 'a' }).activeProfileId).toBe('a');
  });

  it('прогрес є рівно для кожного профілю; зайвий прогрес без профілю відкидається', () => {
    const data = normalizeData({ profiles: [profile('a'), profile('b')], progress: { a: { minutesByDay: { '2026-10-01': 5 } }, ghost: { minutesByDay: {} } } });
    expect(Object.keys(data.progress).sort()).toEqual(['a', 'b']);
    expect(data.progress.a?.minutesByDay).toEqual({ '2026-10-01': 5 });
    expect(data.progress.b).toEqual(emptyProgress());
  });
});

describe('прогрес', () => {
  it('недійсні рівні, навички, світи й дні відкидаються', () => {
    const p = normalizeProgress({
      levels: { 'w1-1': { plays: 2, togetherUsed: true, firstTry: 5 }, 'w9-1': {}, 'w1-99': {}, constructor: {}, __proto__: {} },
      runs: { 'w1-2': { seed: 3, results: ['first', 'oops', 'retry'] }, bad: {} },
      skills: { 'count-line': { attempts: 5, firstTry: 9, recent: [{ ok: true, day: '2026-10-01' }, { ok: true, day: 'вчора' }] }, zzz: { attempts: 1 } },
      minutesByDay: { '2026-10-01': 9999, 'сьогодні': 3, '2026-10-02': -4 },
      manualUnlocks: ['w4', 'w4', 'w8', 7],
      lastSession: { day: '2026-10-01', minutes: 12, levels: ['w1-1', 'nope'] },
    });
    expect(Object.keys(p.levels)).toEqual(['w1-1']);
    expect(p.levels['w1-1']).toMatchObject({ plays: 2, togetherUsed: true, firstTry: 5 });
    expect(Object.keys(p.runs)).toEqual(['w1-2']);
    expect(p.runs['w1-2']?.results).toEqual(['first', 'retry']);
    expect(Object.keys(p.skills)).toEqual(['count-line']);
    expect(p.skills['count-line']?.firstTry).toBe(5); // не більше за спроби
    expect(p.skills['count-line']?.recent).toEqual([{ ok: true, day: '2026-10-01' }]);
    expect(p.minutesByDay).toEqual({ '2026-10-01': 1440, '2026-10-02': 0 });
    expect(p.manualUnlocks).toEqual(['w4']);
    expect(p.lastSession).toEqual({ day: '2026-10-01', minutes: 12, levels: ['w1-1'] });
  });

  it('історія: недійсні записи відкидаються, дійсні нормалізуються, довжина обмежена', () => {
    const good = { t: 5, day: '2026-10-01', skill: 'give-n', game: 'nakarmZwierzaka', level: 'w1-4', firstTry: false, attempts: 2, hints: 1, together: false, ms: 900, answer: 3, wrong: [2, 4, 'x'], countedAll: true };
    const p = normalizeProgress({ history: [good, { ...good, skill: 'nope' }, { ...good, game: 'nope' }, { ...good, day: 'x' }, null, 5] });
    expect(p.history).toHaveLength(1);
    expect(p.history[0]).toMatchObject({ skill: 'give-n', level: 'w1-4', answer: 3, wrong: [2, 4], countedAll: true });
    const many = Array.from({ length: MAX_HISTORY + 20 }, (_, i) => ({ ...good, t: i }));
    expect(normalizeProgress({ history: many }).history).toHaveLength(MAX_HISTORY);
  });

  it('рівень поза програмою (старий формат id) відкидається, а не ламає розблокування', () => {
    expect(normalizeProgress({ levels: { 'w1-13': {}, 'W1-1': {}, 'w1-1 ': {} } }).levels).toEqual({});
  });
});
