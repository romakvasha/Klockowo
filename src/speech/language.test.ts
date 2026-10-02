import { afterEach, describe, expect, it } from 'vitest';
import { normalizeSettings } from '../store/normalize';
import { defaultSettings } from '../store/defaults';
import { availableLanguages, getLanguage, setLanguage } from './language';
import { LANGS, isLang } from './langCode';
import { BUTTONS, PL_LINES, PRAISE, setLineTables, setLineTemplates, thereIs, type LineTemplates } from './lines';
import { OBJECTS, PL_NOUNS, setNounTables } from './nouns';
import { numberWords, setNumberWords } from './numberWords';
import { STORY_INTRO, setStoryTemplates, storyJoin } from './stories';
import { isVoiceFor, pickVoiceFor, voicesFor, type VoiceLike } from './voices';

afterEach(() => {
  setLineTables(PL_LINES);
  setLineTemplates(null);
  setNounTables(PL_NOUNS);
  setNumberWords(null);
  setStoryTemplates(null);
  setLanguage('pl');
});

describe('мова гри: польська за замовчуванням', () => {
  it('без вибору — польська, і рядки ті самі', () => {
    expect(getLanguage()).toBe('pl');
    expect(BUTTONS.play).toBe('Graj!');
    expect(PRAISE[0]).toBe('Brawo!');
    expect(numberWords(21)).toBe('dwadzieścia jeden');
    expect(thereIs(3, OBJECTS.biedronka)).toBe('Są trzy biedronki!');
  });

  it('мова, якої ще немає в пакетах, лишає польську', () => {
    const missing = LANGS.filter((l) => !availableLanguages().includes(l));
    for (const lang of missing) {
      setLanguage(lang);
      expect(getLanguage()).toBe('pl');
      expect(BUTTONS.play).toBe('Graj!');
    }
    expect(availableLanguages()[0]).toBe('pl');
  });

  it('isLang: лише pl, uk, en', () => {
    expect(['pl', 'uk', 'en'].every(isLang)).toBe(true);
    expect(['', 'ua', 'PL', null, 1].some(isLang)).toBe(false);
  });
});

describe('живі прив\'язки: інша мова підміняє таблиці й шаблони, польська повертається без змін', () => {
  it('таблиці рядків', () => {
    setLineTables({ ...PL_LINES, BUTTONS: { ...PL_LINES.BUTTONS, play: 'Play!' } });
    expect(BUTTONS.play).toBe('Play!');
    setLineTables(PL_LINES);
    expect(BUTTONS.play).toBe('Graj!');
  });

  it('шаблони, числа, іменники, історії', () => {
    setLineTemplates({ thereIs: (n: number) => `There are ${numberWords(n)}!` } as unknown as LineTemplates);
    setNumberWords((n) => (n === 3 ? 'three' : String(n)));
    expect(thereIs(3, OBJECTS.biedronka)).toBe('There are three!');
    setNounTables({ ...PL_NOUNS, OBJECTS: { ...PL_NOUNS.OBJECTS, biedronka: { g: 'f', one: 'ladybird', acc1: 'one ladybird', few: 'ladybirds', many: 'ladybirds' } } });
    expect(OBJECTS.biedronka.one).toBe('ladybird');
    setStoryTemplates({ intro: 'Listen.', storyJoin: () => ({ setup: 's', arrival: 'a', question: 'q', full: 'full' }), storyCombine: () => 'c' });
    expect(STORY_INTRO).toBe('Listen.');
    expect(storyJoin('rybka', 2, 3).full).toBe('full');

    setLineTemplates(null);
    setNumberWords(null);
    setNounTables(PL_NOUNS);
    setStoryTemplates(null);
    expect(thereIs(3, OBJECTS.biedronka)).toBe('Są trzy biedronki!');
    expect(STORY_INTRO).toBe('Posłuchaj historyjki.');
    expect(storyJoin('rybka', 2, 3).full).toBe('Posłuchaj historyjki. W stawie pływają dwie rybki. Przypływają jeszcze trzy. Ile rybek jest teraz w stawie?');
  });
});

describe('налаштування мови', () => {
  it('за замовчуванням — польська; старі дані без поля — польська', () => {
    expect(defaultSettings().language).toBe('pl');
    expect(normalizeSettings({ sessionMinutes: 15 }).language).toBe('pl');
    expect(normalizeSettings({ language: 'xx' }).language).toBe('pl');
  });

  it('pl, uk, en зберігаються; мова панелі — теж три', () => {
    for (const lang of ['pl', 'uk', 'en'] as const) {
      expect(normalizeSettings({ language: lang }).language).toBe(lang);
      expect(normalizeSettings({ panelLanguage: lang }).panelLanguage).toBe(lang);
    }
    expect(normalizeSettings({ panelLanguage: 'de' }).panelLanguage).toBe('pl');
  });
});

describe('голоси за мовою', () => {
  const V = (lang: string, name = lang, extra: Partial<VoiceLike> = {}): VoiceLike => ({ name, lang, voiceURI: `${lang}-${name}`, ...extra });
  const all = [V('pl-PL', 'Paulina'), V('uk-UA', 'Lesya'), V('uk', 'Ostap'), V('en-US', 'Samantha'), V('en-GB', 'Daniel'), V('ru-RU'), V('ug-CN'), V('pt-PT')];

  it('мова голосу: pl, uk (не ug), en', () => {
    expect(all.filter((v) => isVoiceFor(v, 'pl')).map((v) => v.lang)).toEqual(['pl-PL']);
    expect(all.filter((v) => isVoiceFor(v, 'uk')).map((v) => v.lang)).toEqual(['uk-UA', 'uk']);
    expect(all.filter((v) => isVoiceFor(v, 'en')).map((v) => v.lang)).toEqual(['en-US', 'en-GB']);
  });

  it('найкращий голос мови; без голосу мови — undefined', () => {
    expect(pickVoiceFor(all, 'uk')?.name).toBe('Lesya');
    expect(pickVoiceFor(all, 'en')?.name).toBe('Samantha');
    expect(pickVoiceFor([V('pl-PL')], 'uk')).toBeUndefined();
    expect(voicesFor(all, 'en', 'en-GB-Daniel')[0]?.name).toBe('Daniel'); // обраний батьками — першим
  });
});
