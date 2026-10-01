import { describe, expect, it } from 'vitest';
import {
  BARS_PER_PHRASE, BEATS_PER_BAR, DEFAULT_VOLUME, DUCK_LEVEL, MUSIC_WORLDS, SCENE_LEVEL, TAU, WORLD_MUSIC,
  generateBar, midiToHz, mixSeed, mulberry32, musicGain, scaleNote, type GainInput, type MusicWorld,
} from './musicTheory';

const BARS = 64;
const SEEDS = [1, 42, 20260930, 2 ** 31 - 1];
const pitchClass = (world: MusicWorld, midi: number): number => (((midi - WORLD_MUSIC[world].root) % 12) + 12) % 12;

describe('лад і висота', () => {
  it('scaleNote: ступінь 0 — тоніка, ступінь 5 — тоніка октавою вище, від’ємні — нижче', () => {
    expect(scaleNote('hub', 0)).toBe(60);
    expect(scaleNote('hub', 5)).toBe(72);
    expect(scaleNote('hub', -5)).toBe(48);
    expect(scaleNote('hub', 1)).toBe(62); // C D E G A
    expect(scaleNote('hub', 4)).toBe(69);
    expect(scaleNote('hub', -1)).toBe(57); // A3
  });

  it('усі світи мають п’ятиступеневий лад, що починається з тоніки, і повільний темп', () => {
    for (const w of MUSIC_WORLDS) {
      const { scale, bpm, root } = WORLD_MUSIC[w];
      expect(scale).toHaveLength(5);
      expect(scale[0]).toBe(0);
      expect([...scale]).toEqual([...scale].sort((a, b) => a - b));
      expect(Math.max(...scale)).toBeLessThan(12);
      expect(bpm).toBeGreaterThanOrEqual(50);
      expect(bpm).toBeLessThanOrEqual(80); // «повільний темп»
      expect(root).toBeGreaterThanOrEqual(55);
      expect(root).toBeLessThanOrEqual(65);
    }
  });

  it('кожен світ звучить по-своєму: різні пари (лад, тоніка, темп)', () => {
    const keys = MUSIC_WORLDS.map((w) => `${WORLD_MUSIC[w].scale.join()}|${WORLD_MUSIC[w].root}|${WORLD_MUSIC[w].bpm}`);
    expect(new Set(keys).size).toBe(MUSIC_WORLDS.length);
  });

  it('midiToHz: A4 = 440, октава = ×2', () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(81)).toBeCloseTo(880, 6);
    expect(midiToHz(60)).toBeCloseTo(261.626, 2);
  });
});

describe('випадковість за seed', () => {
  it('mulberry32: однаковий seed — однакова послідовність, значення в [0, 1)', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const xs = Array.from({ length: 200 }, () => a());
    expect(xs).toEqual(Array.from({ length: 200 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(new Set(xs).size).toBeGreaterThan(190);
  });

  it('mixSeed: залежить від кожного числа і від порядку', () => {
    expect(mixSeed(1, 2, 3)).toBe(mixSeed(1, 2, 3));
    expect(mixSeed(1, 2, 3)).not.toBe(mixSeed(1, 2, 4));
    expect(mixSeed(1, 2, 3)).not.toBe(mixSeed(3, 2, 1));
  });
});

describe('generateBar: послідовність нот', () => {
  it('детермінована: той самий (світ, seed, такт) — ті самі ноти; різні seed — різна музика', () => {
    for (const w of MUSIC_WORLDS) {
      expect(generateBar(w, 42, 9)).toEqual(generateBar(w, 42, 9));
    }
    const run = (seed: number): string =>
      JSON.stringify(Array.from({ length: BARS }, (_, bar) => generateBar('w1', seed, bar)));
    expect(run(1)).not.toBe(run(2));
  });

  it('такт не залежить від попередніх: порядок генерації не має значення', () => {
    const forward = Array.from({ length: 12 }, (_, bar) => generateBar('w3', 5, bar));
    const backward = Array.from({ length: 12 }, (_, i) => generateBar('w3', 5, 11 - i)).reverse();
    expect(backward).toEqual(forward);
  });

  it('усі ноти — з ладу світу (пентатоніка), у межах «скриньки», позиції — в такті', () => {
    for (const w of MUSIC_WORLDS) {
      const scale = WORLD_MUSIC[w].scale;
      for (const seed of SEEDS) {
        for (let bar = 0; bar < BARS; bar++) {
          for (const ev of generateBar(w, seed, bar)) {
            expect(scale).toContain(pitchClass(w, ev.midi));
            expect(ev.beat).toBeGreaterThanOrEqual(0);
            expect(ev.beat).toBeLessThan(BEATS_PER_BAR);
            expect(ev.dur).toBeGreaterThan(0);
            expect(ev.gain).toBeGreaterThan(0);
            expect(ev.gain).toBeLessThanOrEqual(1);
            if (ev.voice === 'melody') {
              expect(ev.midi).toBeGreaterThanOrEqual(WORLD_MUSIC[w].root + 5); // не нижче бас-регістру
              expect(ev.midi).toBeLessThanOrEqual(86);
            } else {
              expect(ev.midi).toBeLessThan(WORLD_MUSIC[w].root); // бас — нижче тоніки
            }
          }
        }
      }
    }
  });

  it('у кожному такті є бас на першій долі й принаймні одна нота мелодії (теж на першій долі такту фрази)', () => {
    for (const seed of SEEDS) {
      for (let bar = 0; bar < BARS; bar++) {
        const evs = generateBar('hub', seed, bar);
        expect(evs.filter((e) => e.voice === 'bass')).toHaveLength(1);
        expect(evs.find((e) => e.voice === 'bass')?.beat).toBe(0);
        const melody = evs.filter((e) => e.voice === 'melody');
        expect(melody.length).toBeGreaterThanOrEqual(1);
        expect(melody[0]?.gain).toBe(1); // перша нота такту — найгучніша
        if (bar % BARS_PER_PHRASE === 0) expect(melody[0]?.beat).toBe(0);
      }
    }
  });

  it('кожна фраза закінчується тонікою: бас і остання нота мелодії останнього такту', () => {
    for (const w of MUSIC_WORLDS) {
      for (const seed of SEEDS) {
        for (let phrase = 0; phrase < 8; phrase++) {
          const evs = generateBar(w, seed, phrase * BARS_PER_PHRASE + BARS_PER_PHRASE - 1);
          const melody = evs.filter((e) => e.voice === 'melody');
          const bass = evs.find((e) => e.voice === 'bass');
          expect(pitchClass(w, melody[melody.length - 1]?.midi ?? -1)).toBe(0);
          expect(pitchClass(w, bass?.midi ?? -1)).toBe(0);
          // кінцева нота дзвенить до кінця такту
          const last = melody[melody.length - 1];
          expect((last?.beat ?? 0) + (last?.dur ?? 0)).toBeCloseTo(BEATS_PER_BAR, 6);
        }
      }
    }
  });

  it('мелодія «дихає»: світ із більшою імовірністю пауз грає менше нот (W7 рідше за W4)', () => {
    const count = (w: MusicWorld): number => {
      let n = 0;
      for (const seed of SEEDS) {
        for (let bar = 0; bar < 128; bar++) n += generateBar(w, seed, bar).filter((e) => e.voice === 'melody').length;
      }
      return n;
    };
    expect(WORLD_MUSIC.w7.rest).toBeGreaterThan(WORLD_MUSIC.w4.rest);
    expect(count('w7')).toBeLessThan(count('w4'));
  });
});

describe('musicGain: повзунок, сцена, ducking', () => {
  const base: GainInput = { volume: 0.5, scene: 'menu', speaking: false, hidden: false, playing: true };

  it('за замовчуванням «Muzyka» ≈ 30 %', () => {
    expect(DEFAULT_VOLUME).toBeCloseTo(0.3, 6);
    expect(musicGain({ ...base, volume: DEFAULT_VOLUME })).toBeCloseTo(0.3, 6);
  });

  it('під голосом гучність падає до DUCK_LEVEL, після голосу повертається', () => {
    expect(musicGain({ ...base, speaking: true })).toBeCloseTo(0.5 * DUCK_LEVEL, 6);
    expect(musicGain({ ...base, speaking: true })).toBeLessThan(musicGain(base));
    expect(musicGain({ ...base, speaking: false })).toBeCloseTo(0.5, 6);
  });

  it('у завданнях (game) тихіше, ніж у меню; ducking і сцена множаться', () => {
    expect(SCENE_LEVEL.game).toBeLessThan(SCENE_LEVEL.menu);
    expect(musicGain({ ...base, scene: 'game' })).toBeLessThan(musicGain(base));
    expect(musicGain({ ...base, scene: 'game', speaking: true })).toBeCloseTo(0.5 * SCENE_LEVEL.game * DUCK_LEVEL, 6);
  });

  it('тиша: не грає, вкладка прихована або повзунок на нулі; повзунок поза 0–1 обмежується', () => {
    expect(musicGain({ ...base, playing: false })).toBe(0);
    expect(musicGain({ ...base, hidden: true })).toBe(0);
    expect(musicGain({ ...base, volume: 0 })).toBe(0);
    expect(musicGain({ ...base, volume: 7 })).toBe(1);
    expect(musicGain({ ...base, volume: -3 })).toBe(0);
  });

  it('музика ніколи не гучніша за голос: навіть на 100 % під голосом ≤ 20 %', () => {
    expect(musicGain({ ...base, volume: 1, speaking: true })).toBeLessThanOrEqual(0.2);
  });

  it('стихає швидко, повертається повільно', () => {
    expect(TAU.duckAttack).toBeLessThan(TAU.duckRelease);
    expect(TAU.user).toBeLessThan(TAU.duckRelease);
  });
});
