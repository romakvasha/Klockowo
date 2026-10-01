import { describe, expect, it } from 'vitest';
import { PUPS } from '../speech/lines';
import { ACCESSORY_SVG, KUBIK_SVG, PUP_URL, SILHOUETTE_URL, TEAM_SVG, VEHICLE_URL } from './art';
import { cardMarkup, kubikMarkup, teamMarkup } from './markup';
import {
  ACCESSORY_WORLDS, KUBIK_POSES, MASCOT_STATES, MOUTH_SHAPES, TEAM, TEAM_MEMBERS, TEAM_POSES, VEHICLES, VEHICLE_SIZE, mascotPose, motionOf,
} from './poses';
import { PUP_IDS, PUP_TINTS, pupLabel } from './pups';

const count = (s: string, part: string) => s.split(part).length - 1;

describe('арт із дизайну: нічого не загубилось', () => {
  it('Kubik: 17 поз + 3 форми рота; 7 аксесуарів світів', () => {
    expect(KUBIK_POSES).toHaveLength(17);
    for (const pose of KUBIK_POSES) expect(KUBIK_SVG.has(pose), pose).toBe(true);
    for (const m of MOUTH_SHAPES) expect(KUBIK_SVG.has(`talking-${m}`), m).toBe(true);
    expect(KUBIK_SVG.size).toBe(KUBIK_POSES.length + MOUTH_SHAPES.length);
    for (const w of ACCESSORY_WORLDS) expect(ACCESSORY_SVG.has(w), w).toBe(true);
    expect(ACCESSORY_SVG.size).toBe(7);
  });

  it('команда: 4 цуценяти × 3 пози, 4 транспорти, 5 силуетів', () => {
    for (const m of TEAM_MEMBERS) for (const p of TEAM_POSES) expect(TEAM_SVG.has(`${m}-${p}`), `${m}-${p}`).toBe(true);
    expect(TEAM_SVG.size).toBe(12);
    for (const v of VEHICLES) expect(VEHICLE_URL.has(v), v).toBe(true);
    expect([...SILHOUETTE_URL.keys()].sort()).toEqual(['iskra', 'kubik', 'latka', 'pufka', 'tofik']);
    for (const m of TEAM_MEMBERS) expect(VEHICLES, m).toContain(TEAM[m].vehicle);
  });

  it('8 цуценят для вибору: id збігаються з PUPS і з файлами, пастелі різні', () => {
    expect(PUP_IDS).toEqual(PUPS.map((p) => p.id));
    expect([...PUP_URL.keys()].sort()).toEqual([...PUP_IDS].sort());
    const tints = PUP_IDS.map((id) => PUP_TINTS[id]);
    expect(new Set(tints).size).toBe(8);
  });

  it('підпис цуценяти — репліка без знака оклику', () => {
    expect(pupLabel('pudel')).toBe('Piesek w loczkach');
    expect(pupLabel('pon')).toBe('Kudłaty piesek');
    for (const id of PUP_IDS) expect(pupLabel(id), id).not.toMatch(/!/);
  });
});

describe('kubikMarkup', () => {
  it('кожна поза збирається: viewBox 0 −30 200 250, шари, без id, чотири рота', () => {
    for (const pose of KUBIK_POSES) {
      const { viewBox, inner } = kubikMarkup(pose);
      expect(viewBox, pose).toBe('0 -30 200 250');
      expect(inner, pose).not.toMatch(/ id="/);
      // sleepy — Kubik у будці: видно лише голову й лапи, тіла немає
      const parts = ['kubik', 'headwrap', 'head', 'eyes', 'mouth', 'ears', 'accessory', 'paw-l', 'paw-r', ...(pose === 'sleepy' ? [] : ['body'])];
      for (const part of parts) expect(inner, `${pose} ${part}`).toContain(`data-part="${part}"`);
      for (const m of ['base', 'a', 'o', 'e']) expect(count(inner, `data-m="${m}"`), `${pose} ${m}`).toBe(1);
    }
  });

  it('три рота «talking» різні між собою й не збігаються зі спокійним', () => {
    const { inner } = kubikMarkup('idle');
    const layer = (m: string) => new RegExp(`<g data-m="${m}">(.*?)</g>`).exec(inner)?.[1] ?? '';
    const shapes = ['base', 'a', 'o', 'e'].map(layer);
    expect(new Set(shapes).size).toBe(4);
    for (const s of shapes) expect(s.length).toBeGreaterThan(20);
  });

  it('аксесуар світу лягає всередину #headwrap (іде за головою) і лише коли він заданий', () => {
    const bare = kubikMarkup('idle').inner;
    const hat = kubikMarkup('idle', { accessory: 'w1' }).inner;
    expect(hat.length).toBeGreaterThan(bare.length);
    expect(hat).toContain('#7BCB5A'); // капелюшок W1
    const from = hat.indexOf('data-part="headwrap"');
    const to = hat.indexOf('data-part="paw-l"');
    expect(hat.indexOf('data-part="accessory"')).toBeGreaterThan(from);
    expect(hat.indexOf('data-part="accessory"')).toBeLessThan(to);
    for (const w of ACCESSORY_WORLDS) expect(kubikMarkup('idle', { accessory: w }).inner.length, w).toBeGreaterThan(bare.length);
  });

  it('картка з числом — лише в позі with-card, між тілом і лапами', () => {
    const { inner } = kubikMarkup('with-card', { card: 7 });
    expect(inner).toContain('data-part="card"');
    expect(inner.indexOf('data-part="card"')).toBeLessThan(inner.indexOf('data-part="paw-l"'));
    expect(inner.indexOf('data-part="card"')).toBeGreaterThan(inner.indexOf('data-part="body"'));
    expect(kubikMarkup('with-card').inner).not.toContain('data-part="card"');
    expect(kubikMarkup('idle', { card: 7 }).inner).not.toContain('data-part="card"');
    expect(kubikMarkup('with-card', { card: 8 }).inner).not.toBe(inner); // кеш не змішує різні картки
  });

  it('картка: одне- і двоцифрове число, цифри ink; поза межами 0–999 — помилка', () => {
    expect(count(cardMarkup(7), '<path')).toBe(2); // «7» має два штрихи
    expect(count(cardMarkup(47), 'translate(')).toBe(2);
    expect(cardMarkup(47)).toContain('viewBox="0 0 190 140"');
    expect(() => cardMarkup(-1)).toThrow(RangeError);
  });

  it('хвіст має обгортку для виляння (крім пози sleepy — у будці хвоста не видно)', () => {
    for (const pose of KUBIK_POSES) {
      const { inner } = kubikMarkup(pose);
      expect(count(inner, 'data-wag'), pose).toBe(pose === 'sleepy' ? 0 : 1);
    }
  });

  it('кліпають лише пози з відкритими очима', () => {
    expect(kubikMarkup('idle').blink).toBe(true);
    expect(kubikMarkup('pointing-left').blink).toBe(true);
    for (const pose of ['happy', 'celebrating', 'sleepy'] as const) expect(kubikMarkup(pose).blink, pose).toBe(false);
  });

  it('кольори BRIEF §9: хутро, мордочка, вушка, жилет, жетон', () => {
    const { inner } = kubikMarkup('idle');
    for (const color of ['#D98C4A', '#FFF7E8', '#7A4E36', '#FF8A3D', '#FFC21A', '#2D2A4A']) {
      expect(inner.toUpperCase(), color).toContain(color);
    }
  });
});

describe('teamMarkup', () => {
  it('усі 12 поз збираються без id; спорядження — колір першого світу гостя', () => {
    for (const m of TEAM_MEMBERS) {
      for (const p of TEAM_POSES) {
        const { viewBox, inner } = teamMarkup(m, p);
        expect(viewBox, `${m}-${p}`).toBe('0 -30 200 250');
        expect(inner, `${m}-${p}`).not.toMatch(/ id="/);
        expect(inner, `${m}-${p}`).toContain(`data-part="${m}"`);
        expect(inner.toUpperCase(), `${m}-${p} vest`).toContain(TEAM[m].vest);
        expect(count(inner, 'data-wag'), `${m}-${p} tail`).toBe(m === 'iskra' ? 0 : 1); // Iskra — без хвоста
      }
    }
  });
});

describe('арт без зовнішніх залежностей (BRIEF §13: жодних зовнішніх посилань)', () => {
  it('жодних скриптів, посилань і url() у розмітці', () => {
    const all = [
      ...KUBIK_POSES.map((p) => kubikMarkup(p, { accessory: 'w6', card: 12 }).inner),
      ...TEAM_MEMBERS.flatMap((m) => TEAM_POSES.map((p) => teamMarkup(m, p).inner)),
    ];
    for (const markup of all) expect(markup).not.toMatch(/<script|href=|url\(|https?:|onload|onclick/i);
  });
});

describe('рух і стани стейджа', () => {
  it('motionOf: радість — стрибок, «статичні» пози — без руху, решта — дихає', () => {
    expect(motionOf('happy')).toBe('hop');
    expect(motionOf('celebrating')).toBe('hop');
    for (const pose of ['surprised', 'on-kart', 'break-jump', 'break-clap', 'break-stomp']) expect(motionOf(pose), pose).toBe('none');
    for (const pose of ['idle', 'thinking', 'with-card', 'pointing-down', 'sleepy']) expect(motionOf(pose), pose).toBe('breathe');
  });

  it('mascotPose: 7 станів борда etap2/06', () => {
    expect(MASCOT_STATES).toHaveLength(7);
    expect(mascotPose('idle')).toBe('idle');
    expect(mascotPose('talking')).toBe('idle');
    expect(mascotPose('pointing')).toBe('pointing-down');
    expect(mascotPose('pointing', 'left')).toBe('pointing-left');
    expect(mascotPose('pointing', 'right')).toBe('pointing-right');
    expect(mascotPose('hint')).toBe('demonstrating');
    expect(mascotPose('retry')).toBe('encouraging');
    expect(mascotPose('together')).toBe('with-card');
    expect(mascotPose('correct')).toBe('happy');
    for (const s of MASCOT_STATES) expect(KUBIK_POSES).toContain(mascotPose(s));
  });

  it('розміри транспорту з борда дизайну', () => {
    expect(VEHICLE_SIZE.balon).toEqual([124, 148]);
    expect(VEHICLE_SIZE.pociag).toEqual([300, 133]);
  });
});
