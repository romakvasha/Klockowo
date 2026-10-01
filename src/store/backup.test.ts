import { describe, expect, it } from 'vitest';
import { BACKUP_APP, BACKUP_KIND, createBackup, parseBackup, serializeBackup } from './backup';
import { emptyProgress } from './defaults';
import { SCHEMA_VERSION } from './migrate';
import { completeLevel, recordAnswer } from './progress';
import type { Profile } from './types';

const now = new Date('2026-10-01T10:00:00.000Z');
const profile: Profile = { id: 'p1', name: 'Ola', pup: 'pudel', createdAt: '2026-09-30T08:00:00.000Z' };

function sampleProgress() {
  let p = completeLevel(emptyProgress(), 'w1-1', { firstTry: 5, togetherUsed: true }, now);
  p = recordAnswer(p, { t: 1, day: '2026-10-01', skill: 'count-line', game: 'policzIDotknij', level: 'w1-1', firstTry: true, attempts: 1, hints: 0, together: false, ms: 900 });
  return { ...p, manualUnlocks: ['w3' as const], minutesByDay: { '2026-10-01': 11.5 } };
}

describe('копія прогресу (JSON)', () => {
  it('експорт → імпорт повертає той самий профіль і прогрес', () => {
    const text = serializeBackup(createBackup(profile, sampleProgress(), now));
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.profile).toEqual(profile);
      expect(parsed.progress).toEqual(sampleProgress());
    }
  });

  it('файл читабельний людиною й має мітки застосунку, виду, версії та часу', () => {
    const text = serializeBackup(createBackup(profile, emptyProgress(), now));
    expect(text).toContain('\n  "app": "klockowo"');
    const raw = JSON.parse(text) as Record<string, unknown>;
    expect(raw).toMatchObject({ app: BACKUP_APP, kind: BACKUP_KIND, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString() });
  });

  it('не JSON, не наш файл, чужий вид — зрозумілі помилки', () => {
    expect(parseBackup('це не json')).toEqual({ ok: false, error: 'not-json' });
    expect(parseBackup('')).toEqual({ ok: false, error: 'not-json' });
    expect(parseBackup('[1,2]')).toEqual({ ok: false, error: 'not-klockowo' });
    expect(parseBackup('"x"')).toEqual({ ok: false, error: 'not-klockowo' });
    expect(parseBackup(JSON.stringify({ app: 'other', kind: BACKUP_KIND }))).toEqual({ ok: false, error: 'not-klockowo' });
    expect(parseBackup(JSON.stringify({ app: BACKUP_APP, kind: 'settings' }))).toEqual({ ok: false, error: 'not-klockowo' });
  });

  it('версія з майбутнього — не імпортуємо (щоб не зіпсувати); без версії чи профілю — invalid', () => {
    const base = { app: BACKUP_APP, kind: BACKUP_KIND, exportedAt: now.toISOString(), profile, progress: {} };
    expect(parseBackup(JSON.stringify({ ...base, schemaVersion: SCHEMA_VERSION + 1 }))).toEqual({ ok: false, error: 'unsupported-version' });
    expect(parseBackup(JSON.stringify({ ...base }))).toEqual({ ok: false, error: 'invalid' });
    expect(parseBackup(JSON.stringify({ ...base, schemaVersion: 0 }))).toEqual({ ok: false, error: 'invalid' });
    expect(parseBackup(JSON.stringify({ ...base, schemaVersion: 1.5 }))).toEqual({ ok: false, error: 'invalid' });
    expect(parseBackup(JSON.stringify({ ...base, schemaVersion: 1, profile: undefined }))).toEqual({ ok: false, error: 'invalid' });
    expect(parseBackup(JSON.stringify({ ...base, schemaVersion: 1, profile: { name: 'x' } }))).toEqual({ ok: false, error: 'invalid' });
  });

  it('зіпсований вміст усередині правильної обгортки нормалізується, а не ламає імпорт', () => {
    const dirty = {
      app: BACKUP_APP, kind: BACKUP_KIND, schemaVersion: 1, exportedAt: now.toISOString(),
      profile: { ...profile, name: '  Ola  ', pup: 'nieistniejący' },
      progress: { levels: { 'w1-1': { plays: 2 }, 'w9-9': { plays: 1 } }, minutesByDay: { 'x': 5 } },
    };
    const parsed = parseBackup(JSON.stringify(dirty));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.profile.name).toBe('Ola');
      expect(Object.keys(parsed.progress.levels)).toEqual(['w1-1']);
      expect(parsed.progress.minutesByDay).toEqual({});
    }
  });
});
