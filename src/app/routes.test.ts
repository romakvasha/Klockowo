import { describe, expect, it } from 'vitest';
import { DEV_PAGES } from '../dev/pages';
import { HOME_PATH, SCREENS, SCREEN_IDS, screenById, type ScreenId } from './routes';

/** Перетворює шаблон шляху на регулярний вираз: /world/:worldId → /world/[^/]+ */
function patternToRegExp(path: string): RegExp {
  return new RegExp(`^${path.replace(/:[A-Za-z]+/g, '[^/]+')}$`);
}

describe('таблиця екранів', () => {
  it('містить кожен екран рівно один раз', () => {
    const ids = SCREENS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...SCREEN_IDS].sort());
  });

  it('має унікальні шляхи, що починаються з «/» і не заходять у /dev', () => {
    const paths = SCREENS.map((s) => s.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of paths) {
      expect(p.startsWith('/')).toBe(true);
      expect(p.startsWith('/dev')).toBe(false);
    }
  });

  it('дає приклад адреси для кожного шаблону з параметрами', () => {
    for (const s of SCREENS) {
      if (s.path.includes(':')) {
        expect(s.example, s.id).toBeDefined();
        expect(s.example).toMatch(patternToRegExp(s.path));
      } else {
        expect(s.example, s.id).toBeUndefined();
      }
    }
  });

  it('вказує етап і розділ BRIEF для кожного екрана', () => {
    for (const s of SCREENS) {
      expect(s.stage, s.id).toMatch(/^M\d+b?$/);
      expect(s.brief, s.id).toMatch(/^§6/);
    }
  });

  it('веде з домашньої адреси на наявний екран', () => {
    expect(SCREENS.some((s) => s.path === HOME_PATH)).toBe(true);
  });

  it('screenById кидає помилку для невідомого екрана', () => {
    expect(screenById('start').name).toBe('Start');
    expect(() => screenById('nope' as ScreenId)).toThrow();
  });
});

describe('dev-сторінки', () => {
  it('мають унікальні шляхи в просторі /dev/', () => {
    const paths = DEV_PAGES.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of paths) expect(p.startsWith('/dev/')).toBe(true);
  });
});
