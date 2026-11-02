import { describe, expect, it } from 'vitest';
import { SONG } from '../speech/lines';
import { DANCE_POSES, SONG_END, SONG_SECOND_FIVE, SONG_PARTS, SONG_SCENES, dancePose, songAt, songProgress } from './breakSong';

describe('пісенька на перерві', () => {
  it('розділи йдуть за часом і сценами: село → цифри → мама-качка → космос → свято, приспів між куплетами', () => {
    const starts = SONG_PARTS.map((p) => p.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(starts.at(-1)).toBeLessThan(SONG_END);
    expect(SONG_PARTS.map((p) => p.scene)).toEqual(['village', 'numbers', 'duck', 'numbers', 'space', 'numbers', 'party']);
    expect([...new Set(SONG_PARTS.map((p) => p.scene))]).toEqual(SONG_SCENES);
    expect(SONG_PARTS.filter((p) => p.scene === 'numbers').every((p) => p.lines === SONG.chorus)).toBe(true);
  });

  it('вступ: сцена першого розділу без рядка, наступний — перший рядок пісні', () => {
    expect(songAt(0)).toMatchObject({ scene: 'village', line: null, next: SONG.village[0], part: -1 });
  });

  it('рядки ділять розділ порівну; наступний рядок переходить у наступний розділ', () => {
    const [first, second] = SONG_PARTS;
    if (!first || !second) throw new Error('song parts');
    const step = (second.start - first.start) / first.lines.length;
    expect(songAt(first.start).line).toBe(first.lines[0]);
    expect(songAt(first.start + step * 2.5)).toMatchObject({ line: first.lines[2], index: 2, next: first.lines[3] });
    expect(songAt(second.start - 0.01)).toMatchObject({ line: first.lines.at(-1), next: second.lines[0] });
    expect(songAt(second.start)).toMatchObject({ scene: 'numbers', line: SONG.chorus[0], part: 1, index: 0 });
  });

  it('після співу лишається останній рядок, наступного немає', () => {
    expect(songAt(SONG_END + 5)).toMatchObject({ scene: 'party', line: SONG.party.at(-1), next: null });
  });

  it('кожен рядок тексту колись з’являється на екрані', () => {
    const seen = new Set<string>();
    for (let t = 0; t <= 150; t += 0.1) {
      const line = songAt(t).line;
      if (line) seen.add(line);
    }
    expect(seen).toEqual(new Set(SONG_PARTS.flatMap((p) => p.lines)));
  });

  it('у приспіві цифри 6…10 з’являються з рядка «Sześć i siedem…», до нього — 1…5', () => {
    expect(SONG.chorus[SONG_SECOND_FIVE]).toMatch(/^Sześć/);
    expect(SONG.chorus.slice(0, SONG_SECOND_FIVE).join(' ')).toContain('pięć');
  });

  it('смужка — частка тривалості в межах 0–1', () => {
    expect(songProgress(75, 150)).toBe(0.5);
    expect(songProgress(200, 150)).toBe(1);
    expect(songProgress(10, 0)).toBe(0);
  });

  it('танець іде по колу поз', () => {
    expect(DANCE_POSES.map((_, k) => dancePose(k))).toEqual([...DANCE_POSES]);
    expect(dancePose(DANCE_POSES.length)).toBe(DANCE_POSES[0]);
  });
});
