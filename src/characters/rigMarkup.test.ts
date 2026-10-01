import { describe, expect, it } from 'vitest';
import {
  eyesOpen, extractGroup, groupContent, idsToParts, injectAccessory, insertBefore, replaceGroup, withMouths, wrapTail,
} from './rigMarkup';

const NESTED = '<g id="a"><g id="b"><rect/></g><g><circle/></g></g><g id="c"><path/></g>';

describe('extractGroup / groupContent', () => {
  it('виймає групу разом із вкладеними <g>, не заходячи в сусідню', () => {
    expect(extractGroup(NESTED, 'a')).toBe('<g id="a"><g id="b"><rect/></g><g><circle/></g></g>');
    expect(extractGroup(NESTED, 'b')).toBe('<g id="b"><rect/></g>');
    expect(extractGroup(NESTED, 'c')).toBe('<g id="c"><path/></g>');
  });

  it('групи, якої немає, і незбалансованої групи — null', () => {
    expect(extractGroup(NESTED, 'zzz')).toBeNull();
    expect(extractGroup('<g id="a"><g></g>', 'a')).toBeNull();
  });

  it('не плутає <g з іншими тегами на «g» (напр. <glyph>)', () => {
    expect(extractGroup('<g id="a"><glyph></glyph></g>', 'a')).toBe('<g id="a"><glyph></glyph></g>');
  });

  it('groupContent — без власного тегу групи, з атрибутами в тезі', () => {
    expect(groupContent('<g id="a" transform="rotate(5 1 1)"><rect/><g></g></g>')).toBe('<rect/><g></g>');
    expect(groupContent('<g id="a"></g>')).toBe('');
  });
});

describe('replaceGroup / insertBefore', () => {
  it('замінює лише потрібну групу; символи $ у заміні лишаються буквально', () => {
    expect(replaceGroup(NESTED, 'c', '<g id="c">$&</g>')).toBe('<g id="a"><g id="b"><rect/></g><g><circle/></g></g><g id="c">$&</g>');
  });

  it('відсутня група — помилка', () => {
    expect(() => replaceGroup(NESTED, 'zzz', '')).toThrow('#zzz');
    expect(() => insertBefore(NESTED, 'zzz', '')).toThrow('#zzz');
  });

  it('insertBefore ставить розмітку перед групою-якорем', () => {
    expect(insertBefore('<g id="body"></g><g id="paw-l"></g>', 'paw-l', '<g id="card"></g>')).toBe(
      '<g id="body"></g><g id="card"></g><g id="paw-l"></g>',
    );
  });
});

describe('injectAccessory', () => {
  const pose = '<g id="headwrap"><g id="head"></g><g id="accessory"></g></g>';
  const accessorySvgInner = '<g id="accessory"><circle r="5"/><g><rect/></g></g>';

  it('наповнює порожній шар #accessory вмістом аксесуара (id лишається на місці)', () => {
    expect(injectAccessory(pose, accessorySvgInner)).toBe(
      '<g id="headwrap"><g id="head"></g><g id="accessory"><circle r="5"/><g><rect/></g></g></g>',
    );
  });

  it('SVG аксесуара без #accessory — помилка', () => {
    expect(() => injectAccessory(pose, '<g id="hat"></g>')).toThrow('#accessory');
  });
});

describe('withMouths', () => {
  it('рот стає чотирма шарами: base (як у позі), a, o, e', () => {
    const out = withMouths('<g id="mouth"><path d="base"/></g>', { a: '<path d="A"/>', o: '<path d="O"/>', e: '<path d="E"/>' });
    expect(out).toBe(
      '<g id="mouth"><g data-m="base"><path d="base"/></g><g data-m="a"><path d="A"/></g><g data-m="o"><path d="O"/></g><g data-m="e"><path d="E"/></g></g>',
    );
  });

  it('без #mouth — помилка', () => {
    expect(() => withMouths('<g id="head"></g>', { a: '', o: '', e: '' })).toThrow('#mouth');
  });
});

describe('wrapTail', () => {
  it('обгортає групу хвоста в <g data-wag>, власний transform хвоста не чіпає', () => {
    expect(wrapTail('<g id="tail" transform="rotate(25 146 166)"><rect/></g><g id="legs"></g>')).toBe(
      '<g data-wag><g id="tail" transform="rotate(25 146 166)"><rect/></g></g><g id="legs"></g>',
    );
  });

  it('позам без хвоста (sleepy, Iskra) нічого не робить', () => {
    expect(wrapTail('<g id="legs"></g>')).toBe('<g id="legs"></g>');
  });

  it('символи $ у розмітці лишаються буквально', () => {
    expect(wrapTail('<g id="tail"><text>$&</text></g>')).toBe('<g data-wag><g id="tail"><text>$&</text></g></g>');
  });
});

describe('eyesOpen', () => {
  it('еліпси — очі відкриті; дуги («щасливі», заплющені) — ні; без очей — ні', () => {
    expect(eyesOpen('<g id="eyes"><ellipse cx="1"/></g>')).toBe(true);
    expect(eyesOpen('<g id="eyes"><path d="M57 60 Q70 42 83 60"/></g>')).toBe(false);
    expect(eyesOpen('<g id="head"></g>')).toBe(false);
  });
});

describe('idsToParts', () => {
  it('id → data-part: кілька персонажів на сторінці не дублюють id', () => {
    const out = idsToParts('<g id="kubik" transform="translate(0 0)"><g id="paw-l"></g><rect id="x"/></g>');
    expect(out).toBe('<g data-part="kubik" transform="translate(0 0)"><g data-part="paw-l"></g><rect data-part="x"/></g>');
    expect(out).not.toMatch(/ id="/);
  });
});
