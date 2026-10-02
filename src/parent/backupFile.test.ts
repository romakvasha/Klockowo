import { describe, expect, it } from 'vitest';
import { backupFileName } from './backupFile';

describe('backupFileName', () => {
  it('klockowo-<ім\'я>-<день>.json; польські літери лишаються, пробіли й знаки стають дефісами', () => {
    expect(backupFileName({ name: 'Ola' }, '2026-10-03')).toBe('klockowo-Ola-2026-10-03.json');
    expect(backupFileName({ name: 'Zosia Łąkowska' }, '2026-10-03')).toBe('klockowo-Zosia-Łąkowska-2026-10-03.json');
    expect(backupFileName({ name: '  Ola / Ala!  ' }, '2026-10-03')).toBe('klockowo-Ola-Ala-2026-10-03.json');
  });

  it('без імені чи з самим сміттям — «profil»; довге ім\'я обрізається; жодних слешів і крапок у середині', () => {
    expect(backupFileName({ name: null }, '2026-10-03')).toBe('klockowo-profil-2026-10-03.json');
    expect(backupFileName({ name: '///' }, '2026-10-03')).toBe('klockowo-profil-2026-10-03.json');
    expect(backupFileName({ name: '../../etc/passwd' }, '2026-10-03')).toBe('klockowo-etc-passwd-2026-10-03.json');
    expect(backupFileName({ name: 'x'.repeat(60) }, '2026-10-03')).toBe(`klockowo-${'x'.repeat(24)}-2026-10-03.json`);
  });
});
