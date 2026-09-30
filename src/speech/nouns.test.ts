import { describe, expect, it } from 'vitest';
import {
  ANIMALS, ANIMAL_IDS, DZIESIATKA, JEDNOSC, OBJECTS, WORLD_OBJECT_IDS, worldObjects,
  type Noun, type ObjectId,
} from './nouns';

const ALL_NOUNS: readonly [string, Noun][] = [
  ...Object.entries(OBJECTS),
  ...Object.entries(ANIMALS),
  ['dziesiatka', DZIESIATKA],
  ['jednosc', JEDNOSC],
];

describe('словник іменників: склад', () => {
  it('7 світів × 4 предмети = 28 унікальних предметів, кожен має запис', () => {
    const ids = Object.values(WORLD_OBJECT_IDS).flat();
    expect(ids).toHaveLength(28);
    expect(new Set(ids).size).toBe(28);
    expect(Object.keys(OBJECTS).sort()).toEqual([...ids].sort());
  });

  it('набори предметів збігаються з BRIEF §10', () => {
    expect(worldObjects('w1')).toEqual(['biedronka', 'motyl', 'kwiatek', 'kaczuszka']);
    expect(worldObjects('w4')).toEqual(['auto', 'rower', 'balonik', 'jajko']);
    expect(worldObjects('w7')).toEqual(['gwiazdka', 'planeta', 'rakieta', 'kometa']);
  });

  it('8 тваринок: miś, jeżyk, kotek, lisek, zajączek, żabka, sowa, myszka', () => {
    expect(ANIMAL_IDS).toHaveLength(8);
    expect(ANIMAL_IDS.map((id) => ANIMALS[id].one)).toEqual(
      ['miś', 'jeżyk', 'kotek', 'lisek', 'zajączek', 'żabka', 'sowa', 'myszka'],
    );
  });

  it('давальний відмінок тваринок — POLISH_COPY §8', () => {
    expect(ANIMAL_IDS.map((id) => ANIMALS[id].dat)).toEqual(
      ['misiowi', 'jeżykowi', 'kotkowi', 'liskowi', 'zajączkowi', 'żabce', 'sowie', 'myszce'],
    );
  });

  it('форми з POLISH_COPY §8 (таблиця 15 предметів) збігаються дослівно', () => {
    const fromDoc: Partial<Record<ObjectId, [string, string, string, string]>> = {
      jablko: ['jabłko', 'jabłka', 'jabłek', 'jedno jabłko'],
      gruszka: ['gruszka', 'gruszki', 'gruszek', 'jedną gruszkę'],
      truskawka: ['truskawka', 'truskawki', 'truskawek', 'jedną truskawkę'],
      marchewka: ['marchewka', 'marchewki', 'marchewek', 'jedną marchewkę'],
      biedronka: ['biedronka', 'biedronki', 'biedronek', 'jedną biedronkę'],
      rybka: ['rybka', 'rybki', 'rybek', 'jedną rybkę'],
      kaczuszka: ['kaczuszka', 'kaczuszki', 'kaczuszek', 'jedną kaczuszkę'],
      gwiazdka: ['gwiazdka', 'gwiazdki', 'gwiazdek', 'jedną gwiazdkę'],
      muszelka: ['muszelka', 'muszelki', 'muszelek', 'jedną muszelkę'],
      jajko: ['jajko', 'jajka', 'jajek', 'jedno jajko'],
      auto: ['auto', 'auta', 'aut', 'jedno auto'],
      kwiatek: ['kwiatek', 'kwiatki', 'kwiatków', 'jeden kwiatek'],
      balonik: ['balonik', 'baloniki', 'baloników', 'jeden balonik'],
      motyl: ['motyl', 'motyle', 'motyli', 'jednego motyla'],
    };
    for (const [id, [one, few, many, acc1]] of Object.entries(fromDoc) as [ObjectId, [string, string, string, string]][]) {
      expect(OBJECTS[id], id).toMatchObject({ one, few, many, acc1 });
    }
    expect(ANIMALS.zabka).toMatchObject({ one: 'żabka', few: 'żabki', many: 'żabek', acc1: 'jedną żabkę' });
  });
});

describe('словник іменників: внутрішня узгодженість', () => {
  it.each(ALL_NOUNS)('%s: усі форми непорожні, NFC, без цифр і пробілів у формах', (_id, noun) => {
    for (const form of [noun.one, noun.few, noun.many]) {
      expect(form).toMatch(/^[a-ząćęłńóśźż]+$/);
      expect(form).toBe(form.normalize('NFC'));
    }
    expect(noun.acc1).toBe(noun.acc1.normalize('NFC'));
  });

  it.each(ALL_NOUNS)('%s: acc1 = «jeden/jedna/jedno» у правильному роді + знахідний', (_id, noun) => {
    if (noun.g === 'f') {
      // жіночий рід на -a: знахідний на -ę («gruszka» → «jedną gruszkę»); «jedność» — без змін
      const accSg = noun.one.endsWith('a') ? `${noun.one.slice(0, -1)}ę` : noun.one;
      expect(noun.acc1).toBe(`jedną ${accSg}`);
    } else if (noun.g === 'n') {
      expect(noun.acc1).toBe(`jedno ${noun.one}`);
    } else if (noun.acc1.startsWith('jeden ')) {
      // чоловічий неживий: знахідний = називний («jeden kwiatek»)
      expect(noun.acc1).toBe(`jeden ${noun.one}`);
    } else {
      // чоловічий живий (motyl, miś…): знахідний = родовий («jednego motyla»), основа та сама
      expect(noun.acc1).toMatch(new RegExp(`^jednego ${noun.one.slice(0, 2)}`));
    }
  });

  it('множина (few) і родовий множини (many) не збігаються з однином, окрім «jedności»', () => {
    for (const [id, noun] of ALL_NOUNS) {
      if (id === 'jednosc') continue;
      expect(noun.few, id).not.toBe(noun.one);
      expect(noun.many, id).not.toBe(noun.one);
    }
  });

  it('тваринки: acc1 — «jednego/jedną» + знахідний, dat — непорожній', () => {
    for (const id of ANIMAL_IDS) {
      const a = ANIMALS[id];
      expect(a.acc1, id).toBe(`${a.g === 'f' ? 'jedną' : 'jednego'} ${a.acc}`);
      expect(a.dat, id).toMatch(/^[a-ząćęłńóśźż]+$/);
    }
  });
});
