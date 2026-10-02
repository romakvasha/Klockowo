import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setLanguage } from '../../language';
import {
  BREAK_EXERCISES, BUTTONS, NO_VOICE_MESSAGE, PUPS, WORLD_NAMES, bonesLabel, breakLine, bridgeTen, countLabel, countOnPraise, countTouch, feedAnimal,
  flashReveal, frogJump, houseQuestion, howManyMissing, missionLine, neighborAnswer, neighborQuestion, pairSum, paintDigit, placeValue, praiseCorrect,
  rocketFlight, startFrom, sumQuestion, thereIs, tileLabel, twoGroups, wagonLabel,
} from '../../lines';
import { ANIMALS, OBJECTS } from '../../nouns';
import { numberWords } from '../../numberWords';
import { STORY_INTRO, storyCombine, storyJoin } from '../../stories';
import { UK_LINES } from './lines';

beforeAll(() => setLanguage('uk'));
afterAll(() => setLanguage('pl'));

/** Усі рядки таблиці (вкладені об'єкти й масиви). */
function allStrings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => allStrings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => allStrings(v, path ? `${path}.${k}` : k));
  return [];
}

describe('українська: таблиці', () => {
  it('живі прив\'язки показують українські рядки', () => {
    expect(BUTTONS.play).toBe('Грай!');
    expect(WORLD_NAMES.w5).toBe('Ліс Десятків');
    expect(PUPS.map((p) => p.id)).toEqual(['pon', 'nowofundland', 'pudel', 'chart', 'papillon', 'shihtzu', 'sharpei', 'akita']);
    expect(STORY_INTRO).toBe('Послухай історію.');
    expect(NO_VOICE_MESSAGE).toMatch(/українського голосу/);
    expect(numberWords(21, 'f')).toBe('двадцять одна');
  });

  it('усі рядки — кирилицею (без латиниці й польських літер), у NFC, без зайвих пробілів; цифри — лише в підписі шестерні', () => {
    for (const [path, text] of allStrings(UK_LINES)) {
      if (path.endsWith('.id')) continue; // id цуценят — однакові в усіх мовах
      expect(text, path).not.toMatch(/[A-Za-ząćęłńóśźż]/);
      expect(text, path).toBe(text.normalize('NFC'));
      expect(text, path).not.toMatch(/ {2}|^\s|\s$/);
      if (path !== 'PARENT_GEAR_LABEL') expect(text, path).not.toMatch(/\d/);
    }
  });

  it('жодного минулого часу щодо дитини', () => {
    const texts = allStrings(UK_LINES).map(([, t]) => t).join(' | ');
    expect(texts).not.toMatch(/(зробив|зробила|полічив|полічила|знайшов|знайшла|рахував|рахувала|впорався|впоралася|склав|склала)/i);
  });
});

describe('українська: шаблони', () => {
  it('«Дай…»: давальний тваринки й знахідний кількості', () => {
    expect(feedAnimal(ANIMALS.mis, 5, OBJECTS.jablko)).toBe("Дай ведмедикові п'ять яблук.");
    expect(feedAnimal(ANIMALS.sowa, 1, OBJECTS.gruszka)).toBe('Дай сові одну грушу.');
    expect(feedAnimal(ANIMALS.kotek, 21, OBJECTS.marchewka)).toBe('Дай котикові двадцять одну морквинку.');
    expect(feedAnimal(ANIMALS.zabka, 2, OBJECTS.truskawka)).toBe('Дай жабці дві полуниці.');
  });

  it('кількість і лічба', () => {
    expect(thereIs(3, OBJECTS.biedronka)).toBe('Тут три сонечка!');
    expect(thereIs(7, OBJECTS.biedronka)).toBe('Тут сім сонечок!');
    expect(thereIs(0, OBJECTS.jablko)).toBe('Тут немає яблук.');
    expect(countTouch(OBJECTS.motyl)).toBe('Скільки тут метеликів? Торкайся по черзі й лічи.');
    expect(countLabel(OBJECTS.kwiatek)).toBe('Скільки тут квіточок');
    expect(praiseCorrect(5, OBJECTS.jablko, 'Браво!')).toBe("Браво! П'ять яблук.");
    expect(missionLine('kaczuszka', OBJECTS.kaczuszka)).toBe('Качечки загубилися! Допоможеш їх полічити?');
    expect(missionLine('motyl', OBJECTS.motyl)).toBe('Метелики чекають на тебе! Допоможеш їх полічити?');
  });

  it('додавання: милозвучність «і / й», родовий після «від/з/до»', () => {
    expect(pairSum(2, 3)).toBe("Два й три — це п'ять.");
    expect(pairSum(7, 3)).toBe('Сім і три — це десять.');
    expect(flashReveal([1, 2])).toBe('Один і два — це три.');
    expect(flashReveal([4])).toBe('Чотири.');
    expect(bridgeTen(8, 5)).toBe('Вісім і два — це десять. І ще три — тринадцять.');
    expect(houseQuestion(8, 3)).toBe('Вісім — це три й скільки?');
    expect(twoGroups(2, 1, OBJECTS.rybka)).toBe('Дві рибки й одна рибка. Скільки разом?');
    expect(sumQuestion(3, 2)).toBe('Скільки буде три додати два?');
    expect(startFrom(5)).toBe("Почни з п'яти й лічи далі.");
    expect(startFrom(3)).toBe('Почни з трьох і лічи далі.');
    expect(countOnPraise(5)).toBe("Лічиш далі від п'яти — кмітливо!");
    expect(howManyMissing(10)).toBe('Скільки бракує до десяти?');
    expect(howManyMissing(100)).toBe('Скільки бракує до ста?');
  });

  it('десятки, сотня, ракета, жабка, перерва', () => {
    expect(placeValue(47)).toBe('Чотири десятки й сім одиниць — це сорок сім.');
    expect(placeValue(21)).toBe('Два десятки й одна одиниця — це двадцять один.');
    expect(paintDigit(5)).toBe("Розфарбуй числа, які закінчуються на п'ять.");
    expect(neighborQuestion(34, 10)).toBe('Ось число тридцять чотири. Яке число на десять більше?');
    expect(neighborAnswer(34, -1)).toBe('Тридцять чотири, на один менше — це тридцять три.');
    expect(rocketFlight(34, 10)).toBe('Ракета на числі тридцять чотири. Вона летить на десять далі. Де вона приземлиться?');
    expect(frogJump(4, 3)).toBe('Жабка на числі чотири. Вона стрибає три рази. Де вона опиниться?');
    expect(BREAK_EXERCISES.map((e) => breakLine(e.verb, e.n))).toEqual(['Підстрибни десять разів!', "Плесни в долоні п'ять разів!", 'Тупни ногою вісім разів!']);
  });

  it('підписи: плитка, вагон, кісточки', () => {
    expect(tileLabel(7)).toBe('сім');
    expect(tileLabel(7, 'correct')).toBe('сім — правильно');
    expect(tileLabel(7, 'retry')).toBe('сім — спробуй ще раз');
    expect(wagonLabel(5)).toBe("вагон п'ять");
    expect(bonesLabel(3, 6)).toBe('кісточки: 3 з 6');
  });
});

describe('українська: історії', () => {
  it('додали ще: дієслово за числом, рід «ще два / ще дві», знахідний після «приносить»', () => {
    expect(storyJoin('rybka', 2, 3).full).toBe('Послухай історію. У ставку плавають дві рибки. Припливають ще три. Скільки рибок тепер у ставку?');
    expect(storyJoin('rybka', 1, 1).setup).toBe('У ставку плаває одна рибка.');
    expect(storyJoin('rybka', 1, 1).arrival).toBe('Припливає ще одна.');
    expect(storyJoin('lodka', 1, 2).arrival).toBe('Підпливають ще два.');
    expect(storyJoin('muszelka', 2, 1).arrival).toBe('Хвиля приносить ще одну.');
    expect(storyJoin('rozgwiazda', 5, 2).setup).toBe("На камені сидять п'ять морських зірок.");
  });

  it('разом: «На малюнку дві рибки й три мушлі»', () => {
    expect(storyCombine('rybka', 'muszelka', 2, 3)).toBe('Послухай історію. На малюнку дві рибки й три мушлі. Скільки всього?');
  });
});
