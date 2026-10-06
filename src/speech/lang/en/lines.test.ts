import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setLanguage } from '../../language';
import {
  BREAK_EXERCISES, BUTTONS, NO_VOICE_MESSAGE, WORLD_NAMES, animalHas, breakLine, bridgeTen, compareAnswer, countLabel, countTouch, feedAnimal, frogJump,
  houseQuestion, howManyMissing, missionLine, neighborAnswer, neighborQuestion, pairSum, paintDigit, placeValue, praiseCorrect, rocketFlight, startFrom,
  sumQuestion, thereIs, tileLabel, twoGroups,
} from '../../lines';
import { ANIMALS, OBJECTS } from '../../nouns';
import { numberWords } from '../../numberWords';
import { STORY_INTRO, storyCombine, storyJoin } from '../../stories';
import { EN_LINES } from './lines';
import { numberWords as en } from './numbers';

beforeAll(() => setLanguage('en'));
afterAll(() => setLanguage('pl'));

function allStrings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => allStrings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => allStrings(v, path ? `${path}.${k}` : k));
  return [];
}

describe('англійська: числа', () => {
  it('0–100', () => {
    expect([0, 1, 7, 10, 11, 13, 19, 20, 21, 34, 40, 99, 100].map((n) => en(n))).toEqual(
      ['zero', 'one', 'seven', 'ten', 'eleven', 'thirteen', 'nineteen', 'twenty', 'twenty-one', 'thirty-four', 'forty', 'ninety-nine', 'one hundred'],
    );
    for (let k = 0; k <= 100; k++) expect(en(k)).toMatch(/^[a-z]+([- ][a-z]+)?$/);
    expect(() => en(101)).toThrow(RangeError);
  });
});

describe('англійська: таблиці', () => {
  it('живі прив\'язки показують англійські рядки', () => {
    expect(BUTTONS.play).toBe('Play!');
    expect(WORLD_NAMES.w6).toBe('Hundred City');
    expect(STORY_INTRO).toBe('Listen to the story.');
    expect(NO_VOICE_MESSAGE).toMatch(/English voice/);
    expect(numberWords(21, 'f')).toBe('twenty-one');
  });

  it('усі рядки — латиницею без польських літер і кирилиці, у NFC, без зайвих пробілів; цифри — лише в підписі шестерні', () => {
    for (const [path, text] of allStrings(EN_LINES)) {
      expect(text, path).not.toMatch(/[Ѐ-ӿąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/);
      expect(text, path).toBe(text.normalize('NFC'));
      expect(text, path).not.toMatch(/ {2}|^\s|\s$/);
      if (path !== 'PARENT_GEAR_LABEL') expect(text, path).not.toMatch(/\d/);
    }
  });
});

describe('англійська: шаблони', () => {
  it('однина лише для 1', () => {
    expect(thereIs(1, OBJECTS.biedronka)).toBe('There is one ladybird!');
    expect(thereIs(3, OBJECTS.biedronka)).toBe('There are three ladybirds!');
    expect(thereIs(0, OBJECTS.jablko)).toBe('There are no apples.');
    expect(feedAnimal(ANIMALS.mis, 5, OBJECTS.jablko)).toBe('Give the bear five apples.');
    expect(feedAnimal(ANIMALS.sowa, 1, OBJECTS.gruszka)).toBe('Give the owl one pear.');
    expect(feedAnimal(ANIMALS.kotek, 21, OBJECTS.truskawka)).toBe('Give the kitten twenty-one strawberries.');
    expect(praiseCorrect(5, OBJECTS.rybka, 'Well done!')).toBe('Well done! Five fish.');
  });

  it('лічба, порівняння, місія', () => {
    expect(countTouch(OBJECTS.motyl)).toBe('Count the butterflies. Touch them one by one. How many butterflies are there?');
    expect(countLabel(OBJECTS.kwiatek)).toBe('Count the flowers');
    expect(compareAnswer(ANIMALS.lisek, false, OBJECTS.marchewka)).toBe('the fox has fewer carrots');
    expect(compareAnswer(null, true, OBJECTS.marchewka)).toBe('the same');
    expect(animalHas(ANIMALS.myszka, 7)).toBe('The mouse has seven.');
    expect(missionLine('kaczuszka', OBJECTS.kaczuszka)).toBe('The ducklings are lost! Will you help count them?');
    expect(missionLine('motyl', OBJECTS.motyl)).toBe('The butterflies are waiting for you! Will you help count them?');
  });

  it('додавання, десятки, ракета, жабка, перерва', () => {
    expect(pairSum(7, 3)).toBe('Seven and three make ten.');
    expect(bridgeTen(8, 5)).toBe('Eight and two make ten. And three more — thirteen.');
    expect(houseQuestion(8, 3)).toBe('Eight is three and how many more?');
    expect(twoGroups(2, 1, OBJECTS.rybka)).toBe('Two fish and one fish. How many altogether?');
    expect(sumQuestion(3, 2)).toBe('What is three plus two?');
    expect(startFrom(5)).toBe('Start from five and count on.');
    expect(howManyMissing(10)).toBe('How many more to make ten?');
    expect(placeValue(47)).toBe('Four tens and seven ones make forty-seven.');
    expect(paintDigit(5)).toBe('Colour the numbers that end in five.');
    expect(neighborQuestion(34, 10)).toBe('Here is thirty-four. Which number is ten more?');
    expect(neighborAnswer(34, -1)).toBe('Thirty-four, one less is thirty-three.');
    expect(rocketFlight(34, 10)).toBe('The rocket is on number thirty-four. It flies ten further. Where will it land?');
    expect(frogJump(4, 1)).toBe('The frog is on number four. It jumps once. Where will it land?');
    expect(frogJump(4, 3)).toBe('The frog is on number four. It jumps three times. Where will it land?');
    expect(BREAK_EXERCISES.map((e) => breakLine(e.verb, e.n))).toEqual(['Jump ten times!', 'Clap five times!', 'Stamp your feet eight times!']);
    expect(tileLabel(7, 'retry')).toBe('seven — try again');
  });
});

describe('англійська: історії', () => {
  it('однина й множина дієслова', () => {
    expect(storyJoin('rybka', 2, 3).full).toBe('Listen to the story. Two fish are swimming in the pond. Three more swim up. How many fish are in the pond now?');
    expect(storyJoin('rybka', 1, 1).setup).toBe('One fish is swimming in the pond.');
    expect(storyJoin('rybka', 1, 1).arrival).toBe('One more swims up.');
    expect(storyJoin('muszelka', 2, 1).arrival).toBe('A wave brings one more.');
    expect(storyCombine('rybka', 'muszelka', 2, 3)).toBe('Listen to the story. In the picture you can see two fish and three shells. How many are there altogether?');
  });
});
