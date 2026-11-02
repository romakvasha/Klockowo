import { describe, expect, it } from 'vitest';
import { PUPS } from '../speech/lines';
import { CARD_BOX, KUBIK_URL, MOUTH_BOX, MOUTH_URL, PUP_URL, TEAM_URL, VEHICLE_URL, artOf } from './art';
import {
  ACCESSORY_WORLDS, KUBIK_POSES, MASCOT_STATES, MOUTH_SHAPES, TEAM, TEAM_MEMBERS, TEAM_POSES, VEHICLES, VEHICLE_SIZE, kubikImage, mascotPose,
  motionOf,
} from './poses';
import { PUP_IDS, PUP_TINTS, pupLabel } from './pups';

describe('арт із дизайну: нічого не загубилось', () => {
  it('Kubik: 17 поз + 3 кадри рота; спокій і радість у кожному з 7 світів', () => {
    expect(KUBIK_POSES).toHaveLength(17);
    for (const pose of KUBIK_POSES) expect(KUBIK_URL.has(pose), pose).toBe(true);
    for (const m of MOUTH_SHAPES) expect(KUBIK_URL.has(`talking-${m}`), m).toBe(true);
    for (const w of ACCESSORY_WORLDS) for (const p of ['idle', 'happy']) expect(KUBIK_URL.has(`${w}-${p}`), `${w}-${p}`).toBe(true);
    expect(KUBIK_URL.size).toBe(KUBIK_POSES.length + MOUTH_SHAPES.length + 14);
  });

  it('команда: 4 цуценяти × 3 пози, 4 транспорти', () => {
    for (const m of TEAM_MEMBERS) for (const p of TEAM_POSES) expect(TEAM_URL.has(`${m}-${p}`), `${m}-${p}`).toBe(true);
    expect(TEAM_URL.size).toBe(12);
    for (const v of VEHICLES) expect(VEHICLE_URL.has(v), v).toBe(true);
    for (const m of TEAM_MEMBERS) expect(VEHICLES, m).toContain(TEAM[m].vehicle);
  });

  it('кожна картинка персонажа має розмір (sizes.json), фігури — висотою 768', () => {
    for (const pose of KUBIK_POSES) expect(artOf(KUBIK_URL, pose, `kubik-${pose}`).h, pose).toBe(768);
    for (const m of TEAM_MEMBERS) for (const p of TEAM_POSES) expect(artOf(TEAM_URL, `${m}-${p}`, `team-${m}-${p}`).w, `${m}-${p}`).toBeGreaterThan(300);
    for (const id of PUP_IDS) expect(artOf(PUP_URL, id, `pup-${id}`).h, id).toBe(768);
    expect(() => artOf(KUBIK_URL, 'idle', 'kubik-nope')).toThrow();
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

describe('картинка пози Kubika', () => {
  it('аксесуар світу — лише в спокої й радості; без світу — сама поза', () => {
    expect(kubikImage('idle')).toBe('idle');
    expect(kubikImage('idle', 'w3')).toBe('w3-idle');
    expect(kubikImage('happy', 'w7')).toBe('w7-happy');
    expect(kubikImage('celebrating', 'w1')).toBe('w1-happy');
    expect(kubikImage('pointing-left', 'w4')).toBe('pointing-left');
    expect(kubikImage('with-card', 'w2')).toBe('with-card');
    for (const pose of KUBIK_POSES) for (const w of [null, ...ACCESSORY_WORLDS]) expect(KUBIK_URL.has(kubikImage(pose, w)), `${pose} ${w}`).toBe(true);
  });

  it('рот A/O/E: латки для спокою без аксесуара й у кожному світі, усередині картинки, на мордочці', () => {
    const bases = ['idle', ...ACCESSORY_WORLDS.map((w) => `${w}-idle`)];
    expect(Object.keys(MOUTH_BOX).sort()).toEqual([...bases].sort());
    for (const base of bases) {
      for (const m of MOUTH_SHAPES) expect(MOUTH_URL.has(`${base}-${m}`), `${base}-${m}`).toBe(true);
      const box = MOUTH_BOX[base];
      expect(box, base).toBeDefined();
      if (!box) continue;
      expect(box.x, base).toBeGreaterThan(0.15);
      expect(box.x + box.w, base).toBeLessThan(0.85);
      expect(box.y, base).toBeGreaterThan(0.2); // нижче очей
      expect(box.y + box.h, base).toBeLessThan(0.55); // вище нашийника
    }
    expect(MOUTH_URL.size).toBe(bases.length * MOUTH_SHAPES.length);
  });

  it('поле картки в лапах — усередині картинки with-card', () => {
    expect(CARD_BOX.x).toBeGreaterThan(0);
    expect(CARD_BOX.x + CARD_BOX.w).toBeLessThan(1);
    expect(CARD_BOX.w / CARD_BOX.h).toBeGreaterThan(1); // картка лежить боком
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
