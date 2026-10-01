import { describe, expect, it } from 'vitest';
import { SCREENS } from './routes';
import { musicRoute } from './musicRoute';

describe('musicRoute', () => {
  it('гра → сцена game зі світом із id рівня; усі решта екрани → menu', () => {
    expect(musicRoute('/play/w1-1')).toEqual({ scene: 'game', world: 'w1', dev: false });
    expect(musicRoute('/play/w7-12')).toEqual({ scene: 'game', world: 'w7', dev: false });
    expect(musicRoute('/mission/w3-1')).toEqual({ scene: 'menu', world: 'w3', dev: false });
    expect(musicRoute('/world/w4')).toEqual({ scene: 'menu', world: 'w4', dev: false });
    expect(musicRoute('/done/w2-5')).toEqual({ scene: 'menu', world: 'w2', dev: false });
  });

  it('екрани без світу (старт, мапа, альбом, Plac Zabaw…) → хаб', () => {
    for (const path of ['/', '/start', '/map', '/album', '/playground', '/parent', '/end']) {
      expect(musicRoute(path)).toEqual({ scene: 'menu', world: 'hub', dev: false });
    }
  });

  it('невідомий або «не-світовий» параметр → хаб; w8 і w10 — не світи', () => {
    for (const param of ['abc', 'w8', 'w10', 'w0', '']) {
      expect(musicRoute(`/play/${param}`).world).toBe('hub');
    }
  });

  it('dev-сторінки не запускають музику самі', () => {
    expect(musicRoute('/dev/speech').dev).toBe(true);
    expect(musicRoute('/dev').dev).toBe(true);
    expect(musicRoute('/start').dev).toBe(false);
  });

  it('лише маршрут гри дає сцену game: на прикладах із таблиці екранів', () => {
    for (const s of SCREENS) {
      const path = s.example ?? s.path;
      expect(musicRoute(path).scene, path).toBe(s.id === 'game' ? 'game' : 'menu');
    }
  });
});
