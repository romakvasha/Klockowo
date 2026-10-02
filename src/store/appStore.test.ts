import { describe, expect, it } from 'vitest';
import { nodeState } from '../curriculum/progression';
import { STORAGE_KEY, createAppStore, memoryStorage, type StoreEnv } from './appStore';
import { SCHEMA_VERSION } from './migrate';
import { MAX_PROFILES, type AnswerEntry } from './types';

function setup(initial: Record<string, string> = {}) {
  const storage = memoryStorage(initial);
  const clock = { now: new Date(2026, 9, 1, 10, 0, 0) };
  let n = 0;
  const env: StoreEnv = { now: () => clock.now, newId: () => `id${++n}` };
  const open = () => createAppStore(storage, env);
  return { storage, clock, env, open, store: open() };
}

const answer = (over: Partial<AnswerEntry> = {}): AnswerEntry => ({
  t: 1, day: '2026-10-01', skill: 'count-line', game: 'policzIDotknij', level: 'w1-1', firstTry: true, attempts: 1, hints: 0, together: false, ms: 800, ...over,
});

describe('профілі', () => {
  it('перший профіль стає активним; більше 4 не додається', () => {
    const { store } = setup();
    const a = store.getState().addProfile({ pup: 'pudel' });
    expect(a).toBe('id1');
    expect(store.getState().activeProfileId).toBe('id1');
    expect(store.getState().progress.id1).toBeDefined();
    for (let i = 0; i < MAX_PROFILES - 1; i++) expect(store.getState().addProfile({ pup: 'pon' })).not.toBeNull();
    expect(store.getState().addProfile({ pup: 'akita' })).toBeNull();
    expect(store.getState().profiles).toHaveLength(MAX_PROFILES);
    expect(store.getState().activeProfileId).toBe('id1'); // наступні профілі активного не міняють
  });

  it("ім'я обрізається; невідоме цуценя при оновленні ігнорується", () => {
    const { store } = setup();
    const id = store.getState().addProfile({ name: '  Staś ', pup: 'nowofundland' }) ?? '';
    expect(store.getState().profiles[0]?.name).toBe('Staś');
    store.getState().updateProfile(id, { name: '', pup: 'nieznany' as never });
    expect(store.getState().profiles[0]).toMatchObject({ name: null, pup: 'nowofundland' });
    store.getState().updateProfile(id, { pup: 'akita' });
    expect(store.getState().profiles[0]?.pup).toBe('akita');
  });

  it('selectProfile приймає лише наявні id або null; removeProfile скидає активного й прибирає прогрес', () => {
    const { store } = setup();
    const a = store.getState().addProfile({ pup: 'pudel' }) ?? '';
    const b = store.getState().addProfile({ pup: 'pon' }) ?? '';
    store.getState().selectProfile('nonexistent');
    expect(store.getState().activeProfileId).toBe(a);
    store.getState().selectProfile(b);
    expect(store.getState().activeProfileId).toBe(b);
    store.getState().removeProfile(b);
    expect(store.getState().activeProfileId).toBeNull();
    expect(store.getState().progress[b]).toBeUndefined();
    expect(store.getState().profiles.map((p) => p.id)).toEqual([a]);
    store.getState().selectProfile(null);
    expect(store.getState().activeProfileId).toBeNull();
  });
});

describe('налаштування', () => {
  it('частковий патч зливається, гучності обмежуються, неприпустиме лишає поточне', () => {
    const { store } = setup();
    store.getState().updateSettings({ sessionMinutes: 20, volumes: { music: 0.1 } });
    store.getState().updateSettings({ volumes: { speech: 5 }, speechRate: 1.1 });
    store.getState().updateSettings({ sessionMinutes: 12 as never });
    const s = store.getState().settings;
    expect(s.sessionMinutes).toBe(20);
    expect(s.volumes).toEqual({ speech: 1, effects: 0.6, music: 0.1 });
    expect(s.speechRate).toBe(1.1);
  });
});

describe('прогрес активного профілю', () => {
  it('без активного профілю дії нічого не змінюють', () => {
    const { store } = setup();
    store.getState().recordAnswer(answer());
    store.getState().completeLevel('w1-1', { firstTry: 6, togetherUsed: false });
    store.getState().addPlayTime(5);
    expect(store.getState().progress).toEqual({});
  });

  it('відповіді, рівень, час гри (за місцевим днем) і ручне відкриття світу — у прогрес активного', () => {
    const { store, clock } = setup();
    const a = store.getState().addProfile({ pup: 'pudel' }) ?? '';
    const b = store.getState().addProfile({ pup: 'pon' }) ?? '';
    store.getState().recordAnswer(answer());
    store.getState().completeLevel('w1-1', { firstTry: 5, togetherUsed: true });
    store.getState().addPlayTime(7.5);
    clock.now = new Date(2026, 9, 2, 9, 0, 0);
    store.getState().addPlayTime(2);
    store.getState().setWorldUnlocked('w4', true);
    const pa = store.getState().progress[a];
    expect(pa?.history).toHaveLength(1);
    expect(pa?.levels['w1-1']).toMatchObject({ plays: 1, togetherUsed: true, firstTry: 5 });
    expect(pa?.minutesByDay).toEqual({ '2026-10-01': 7.5, '2026-10-02': 2 });
    expect(pa?.manualUnlocks).toEqual(['w4']);
    expect(store.getState().progress[b]).toMatchObject({ levels: {}, history: [], manualUnlocks: [] });
    store.getState().setWorldUnlocked('w4', false);
    expect(store.getState().progress[a]?.manualUnlocks).toEqual([]);
  });

  it('забіг рівня: зберегти → продовжити → завершення його знімає; розблокування йде далі', () => {
    const { store } = setup();
    const a = store.getState().addProfile({ pup: 'pudel' }) ?? '';
    store.getState().saveRun('w1-1', { seed: 42, results: ['first', 'first', 'retry'], startedAt: '2026-10-01T10:00:00.000Z', swaps: [], warmup: false });
    expect(store.getState().progress[a]?.runs['w1-1']?.results).toHaveLength(3);
    store.getState().completeLevel('w1-1', { firstTry: 5, togetherUsed: false });
    const p = store.getState().progress[a];
    expect(p?.runs['w1-1']).toBeUndefined();
    if (p) expect(nodeState(p, 'w1-2', { extraTasks: true })).toBe('next');
  });

  it('resetProgress обнуляє прогрес, профіль лишається', () => {
    const { store } = setup();
    const a = store.getState().addProfile({ name: 'Ola', pup: 'pudel' }) ?? '';
    store.getState().completeLevel('w1-1', { firstTry: 6, togetherUsed: false });
    store.getState().resetProgress(a);
    expect(store.getState().progress[a]?.levels).toEqual({});
    expect(store.getState().profiles[0]?.name).toBe('Ola');
  });
});

describe('збереження між запусками', () => {
  it('другий запуск на тому самому сховищі бачить усе, що зроблено в першому', () => {
    const { store, open, storage } = setup();
    store.getState().addProfile({ name: 'Ola', pup: 'pudel' });
    store.getState().updateSettings({ reduceMotion: true, volumes: { music: 0 } });
    store.getState().completeLevel('w1-1', { firstTry: 6, togetherUsed: false });
    expect(storage.getItem(STORAGE_KEY)).toContain(`"version":${SCHEMA_VERSION}`);

    const second = open().getState();
    expect(second.profiles.map((p) => p.name)).toEqual(['Ola']);
    expect(second.activeProfileId).toBe('id1');
    expect(second.settings).toMatchObject({ reduceMotion: true, volumes: { speech: 0.8, effects: 0.6, music: 0 } });
    expect(Object.keys(second.progress.id1?.levels ?? {})).toEqual(['w1-1']);
  });

  it('у сховищі лише дані (без функцій), версія схеми записана', () => {
    const { store, storage } = setup();
    store.getState().addProfile({ pup: 'pudel' });
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as { state: Record<string, unknown>; version: number };
    expect(saved.version).toBe(SCHEMA_VERSION);
    expect(Object.keys(saved.state).sort()).toEqual(['activeProfileId', 'profiles', 'progress', 'settings']);
  });

  it('зіпсований запис у сховищі — застосунок стартує з порожніх даних, не падає', () => {
    for (const bad of ['не json', '{"state":"x","version":1}', '{"state":{"profiles":"x","settings":7},"version":1}', 'null']) {
      const { open } = setup({ [STORAGE_KEY]: bad });
      const state = open().getState();
      expect(state.profiles, bad).toEqual([]);
      expect(state.settings.sessionMinutes, bad).toBe(15);
    }
  });

  it('напівзіпсований запис: добре лишається, погане нормалізується', () => {
    const raw = JSON.stringify({
      version: SCHEMA_VERSION,
      state: {
        profiles: [{ id: 'p1', name: 'Ola', pup: 'pudel', createdAt: '2026-10-01T10:00:00.000Z' }, { name: 'без id' }],
        activeProfileId: 'p1',
        settings: { sessionMinutes: 99, volumes: { music: 0.2 } },
        progress: { p1: { levels: { 'w1-1': { plays: 2 }, 'zzz': {} } } },
      },
    });
    const state = setup({ [STORAGE_KEY]: raw }).open().getState();
    expect(state.profiles.map((p) => p.id)).toEqual(['p1']);
    expect(state.settings).toMatchObject({ sessionMinutes: 15, volumes: { speech: 0.8, music: 0.2 } });
    expect(Object.keys(state.progress.p1?.levels ?? {})).toEqual(['w1-1']);
  });

  it('дані від старої версії схеми без кроку міграції не ламають запуск', () => {
    const raw = JSON.stringify({ version: 0, state: { profiles: [] } });
    expect(() => setup({ [STORAGE_KEY]: raw }).open().getState()).not.toThrow();
  });
});

describe('експорт і імпорт', () => {
  it('експорт профілю → імпорт у новий профіль іншого пристрою зберігає прогрес', () => {
    const one = setup();
    const a = one.store.getState().addProfile({ name: 'Ola', pup: 'pudel' }) ?? '';
    one.store.getState().completeLevel('w1-1', { firstTry: 5, togetherUsed: true });
    one.store.getState().recordAnswer(answer());
    const text = one.store.getState().exportProfile(a);
    expect(text).toContain('"app": "klockowo"');

    const two = setup();
    const result = two.store.getState().importProfile(text ?? '', { type: 'new' });
    expect(result.ok).toBe(true);
    const id = result.ok ? result.profileId : '';
    expect(two.store.getState().profiles[0]).toMatchObject({ id, name: 'Ola', pup: 'pudel' });
    expect(two.store.getState().progress[id]?.levels['w1-1']).toMatchObject({ plays: 1, togetherUsed: true });
    expect(two.store.getState().progress[id]?.history).toHaveLength(1);
    expect(two.store.getState().activeProfileId).toBe(id);
  });

  it('імпорт «замість» замінює лише прогрес наявного профілю', () => {
    const { store } = setup();
    const a = store.getState().addProfile({ name: 'Ola', pup: 'pudel' }) ?? '';
    store.getState().completeLevel('w1-1', { firstTry: 6, togetherUsed: false });
    const text = store.getState().exportProfile(a) ?? '';
    store.getState().resetProgress(a);
    expect(store.getState().importProfile(text, { type: 'replace', profileId: a })).toEqual({ ok: true, profileId: a });
    expect(Object.keys(store.getState().progress[a]?.levels ?? {})).toEqual(['w1-1']);
    expect(store.getState().profiles).toHaveLength(1);
  });

  it('помилки імпорту: сміття, немає місця, немає профілю, чужий файл', () => {
    const { store } = setup();
    for (let i = 0; i < MAX_PROFILES; i++) store.getState().addProfile({ pup: 'pon' });
    const id = store.getState().profiles[0]?.id ?? '';
    const valid = store.getState().exportProfile(id) ?? '';
    expect(store.getState().importProfile(valid, { type: 'new' })).toEqual({ ok: false, error: 'too-many-profiles' });
    expect(store.getState().importProfile(valid, { type: 'replace', profileId: 'ghost' })).toEqual({ ok: false, error: 'no-profile' });
    expect(store.getState().importProfile('сміття', { type: 'new' })).toEqual({ ok: false, error: 'not-json' });
    expect(store.getState().importProfile('{"app":"other"}', { type: 'new' })).toEqual({ ok: false, error: 'not-klockowo' });
    expect(store.getState().exportProfile('ghost')).toBeNull();
    expect(store.getState().profiles).toHaveLength(MAX_PROFILES);
  });
});
