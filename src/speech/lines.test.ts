import { describe, expect, it } from 'vitest';
import {
  ANIMALS, OBJECTS,
} from './nouns';
import {
  BREAK_EXERCISES, BUTTONS, FEEDBACK_LINES, FROM_COPY_9, GAME_PROMPTS, LEVEL_LINES, MISSION_LINES, PARENT, PRAISE, PUPS,
  SESSION_LINES, SPOKEN_LINES, START_LINES, WORLD_NAMES,
  addSentence, bonesLabel, breakLine, bridgeTen, confirmClear, confuses, countByTens, countOnPraise, countTouch, feedAnimal,
  findNumber, frogJump, gateQuestion, houseQuestion, howManyMissing, pairSum, placeValue, praiseCorrect, praiseEcho,
  CHEST_LABELS, NODE_LABELS, flashReveal, quantityLine, WORLD_INTROS, changePlayerLabel, islandLabel, missionLine, profileMapLabel, stickerLabel, thereIs, tileLabel,
  twoGroups, whoHasMore,
} from './lines';

describe('шаблони дають дослівно приклади з BRIEF', () => {
  it('§4: Jest / Są / Nie ma', () => {
    expect(thereIs(1, OBJECTS.biedronka)).toBe('Jest jedna biedronka!');
    expect(thereIs(3, OBJECTS.biedronka)).toBe('Są trzy biedronki!');
    expect(thereIs(7, OBJECTS.biedronka)).toBe('Jest siedem biedronek!');
    expect(thereIs(22, OBJECTS.gruszka)).toBe('Są dwadzieścia dwie gruszki!');
    expect(thereIs(0, OBJECTS.jablko)).toBe('Nie ma jabłek.');
  });

  it('§4: «Liczysz dalej od pięciu — sprytnie!» (od trzech, od siedmiu)', () => {
    expect(countOnPraise(5)).toBe('Liczysz dalej od pięciu — sprytnie!');
    expect(countOnPraise(3)).toBe('Liczysz dalej od trzech — sprytnie!');
    expect(countOnPraise(7)).toBe('Liczysz dalej od siedmiu — sprytnie!');
  });

  it('§7: «Brawo! Pięć jabłek.»', () => {
    expect(praiseCorrect(5, OBJECTS.jablko)).toBe('Brawo! Pięć jabłek.');
    expect(praiseCorrect(1, OBJECTS.gruszka)).toBe('Brawo! Jedna gruszka.');
    expect(praiseCorrect(2, OBJECTS.gruszka, 'Świetnie!')).toBe('Świetnie! Dwie gruszki.');
    expect(praiseEcho('siedem')).toBe('Brawo! Siedem.');
  });

  it('§7, ігри 1–14', () => {
    expect(countTouch(OBJECTS.biedronka)).toBe('Policz biedronki. Dotykaj po kolei. Ile jest biedronek?');
    expect(feedAnimal(ANIMALS.mis, 5, OBJECTS.jablko)).toBe('Daj misiowi pięć jabłek.');
    expect(feedAnimal(ANIMALS.kotek, 1, OBJECTS.gruszka)).toBe('Daj kotkowi jedną gruszkę.');
    expect(feedAnimal(ANIMALS.zabka, 1, OBJECTS.jablko)).toBe('Daj żabce jedno jabłko.');
    expect(feedAnimal(ANIMALS.sowa, 2, OBJECTS.gruszka)).toBe('Daj sowie dwie gruszki.');
    expect(whoHasMore(OBJECTS.marchewka)).toBe('Kto ma więcej marchewek?');
    expect(pairSum(7, 3)).toBe('Siedem i trzy to dziesięć.');
    expect(houseQuestion(8, 3)).toBe('Osiem to trzy i ile?');
    expect(twoGroups(3, 2, OBJECTS.jablko)).toBe('Trzy jabłka i dwa jabłka. Ile razem?');
    expect(addSentence(3, 2)).toBe('Trzy dodać dwa równa się pięć.');
    expect(frogJump(4, 3)).toBe('Żabka jest na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?');
    expect(howManyMissing(10)).toBe('Ile brakuje do dziesięciu?');
    expect(placeValue(47)).toBe('Cztery dziesiątki i siedem jedności to czterdzieści siedem.');
    expect(countByTens(2)).toBe('dziesięć, dwadzieścia');
    expect(countByTens(1)).toBe('dziesięć');
    expect(countByTens(10)).toBe('dziesięć, dwadzieścia, trzydzieści, czterdzieści, pięćdziesiąt, sześćdziesiąt, siedemdziesiąt, osiemdziesiąt, dziewięćdziesiąt, sto');
    expect(() => countByTens(0)).toThrow(RangeError);
    expect(() => countByTens(11)).toThrow(RangeError);
    expect(findNumber(47)).toBe('Znajdź liczbę czterdzieści siedem.');
  });

  it('§7: граматика у крайніх випадках', () => {
    expect(frogJump(0, 1)).toBe('Żabka jest na liczbie zero. Skacze raz. Gdzie wyląduje?');
    expect(placeValue(21)).toBe('Dwie dziesiątki i jedna jedność to dwadzieścia jeden.');
    expect(placeValue(10)).toBe('Jedna dziesiątka i zero jedności to dziesięć.');
    expect(howManyMissing(20)).toBe('Ile brakuje do dwudziestu?');
    expect(howManyMissing(100)).toBe('Ile brakuje do stu?');
    expect(twoGroups(1, 2, OBJECTS.gruszka)).toBe('Jedna gruszka i dwie gruszki. Ile razem?');
  });

  it('§6.11: вправи перерви', () => {
    expect(BREAK_EXERCISES.map((e) => breakLine(e.verb, e.n))).toEqual([
      'Podskocz dziesięć razy!', 'Klaśnij pięć razy!', 'Tupnij osiem razy!',
    ]);
    expect(breakLine('Klaśnij', 1)).toBe('Klaśnij raz!');
  });

  it('§6.14–15: бар’єр і панель батьків', () => {
    expect(gateQuestion(7, 8)).toBe('Wpisz wynik: siedem razy osiem');
    expect(confirmClear('Ola')).toBe('Usunąć wszystkie postępy profilu „Ola”? Tego nie da się cofnąć.');
    expect(confuses(13, 30)).toBe('Myli 13 i 30');
    expect(confuses(26, 62)).toBe('Myli 26 i 62');
  });

  it('POLISH_COPY §9: W4 ★ через десяток', () => {
    expect(bridgeTen(8, 5)).toBe('Osiem i dwa to dziesięć. I jeszcze trzy — trzynaście.');
    expect(bridgeTen(9, 4)).toBe('Dziewięć i jeden to dziesięć. I jeszcze trzy — trzynaście.');
    expect(() => bridgeTen(5, 3)).toThrow(RangeError);
    expect(() => bridgeTen(10, 3)).toThrow(RangeError);
  });
});

describe('статичні рядки — дослівно з BRIEF і POLISH_COPY §9', () => {
  it('§4: кнопки', () => {
    expect(Object.values(BUTTONS)).toEqual([
      'Graj!', 'Dalej', 'Jeszcze raz', 'Posłuchaj', 'Mapa', 'Naklejki', 'Gotowe', 'Pomóż mi', 'Tyle samo', 'Wsyp!', 'Zapakuj', 'Zamknij',
    ]);
  });

  it('§4: місія, похвала, помилка, кінець рівня, перерва', () => {
    expect(MISSION_LINES.slogan).toBe('Łapki w górę, liczymy!');
    expect(MISSION_LINES.ducklings).toBe('Kaczuszki się zgubiły! Pomożesz je policzyć?');
    expect([...PRAISE]).toEqual(['Brawo!', 'Świetnie!', 'Udało się!', 'Pięknie policzone!']);
    expect(FEEDBACK_LINES).toEqual({
      retry: 'Spróbujmy jeszcze raz!', almost: 'Prawie!', together: 'Pomogę ci. Zrobimy to razem.', show: 'Patrz, pokażę ci.',
    });
    expect(LEVEL_LINES.missionDone).toBe('Misja wykonana! Ten poziom za nami!');
    expect(LEVEL_LINES.newSticker).toBe('Masz nową naklejkę!');
    expect(LEVEL_LINES.worldDone).toBe('Wszystkie misje w tym świecie wykonane!');
    expect(LEVEL_LINES.diligence).toBe('Nie poddajesz się!');
    expect(SESSION_LINES.breakTime).toBe('Czas na przerwę!');
    expect(SESSION_LINES.endOfDay).toBe('Koniec na dziś. Do zobaczenia!');
  });

  it('§6: Start і «Twój piesek»', () => {
    expect(START_LINES).toEqual({ whoPlays: 'Kto dziś gra?', choosePup: 'Wybierz swojego pieska!', welcome: 'Witaj w drużynie!' });
  });

  it('§7: незмінні репліки ігор', () => {
    expect(GAME_PROMPTS.blink).toBe('Patrz uważnie! Ile kropek?');
    expect(GAME_PROMPTS.match).toBe('Połącz obrazki z liczbami.');
    expect(GAME_PROMPTS.wagon).toBe('Jakiej liczby brakuje w pociągu?');
    expect(GAME_PROMPTS.busFree).toBe('Ile miejsc jest wolnych?');
    expect(GAME_PROMPTS.storyExample).toBe('Na gałęzi siedzą dwa ptaszki. Przylatują jeszcze trzy. Ile ptaszków jest teraz?');
  });

  it('§5: назви світів', () => {
    expect(WORLD_NAMES).toEqual({
      w1: 'Łąka Liczenia', w2: 'Ogród Cyfr', w3: 'Wyspa Dodawania', w4: 'Most Dwudziestki',
      w5: 'Las Dziesiątek', w6: 'Miasto Setki', w7: 'Kosmiczna Droga', hub: 'Plac Zabaw',
    });
  });

  it('§6.15: панель батьків', () => {
    expect(PARENT.gate.wrong).toBe('Niepoprawny wynik. Spróbuj ponownie.');
    expect(PARENT.settings.extraTasks).toBe('Zadania dodatkowe ★');
    expect(PARENT.backup.confirmYes).toBe('Tak, usuń');
  });

  it('POLISH_COPY §9: 8 описів цуценят (Pudel — «Piesek w loczkach!»)', () => {
    expect(PUPS.map((p) => p.line)).toEqual([
      'Kudłaty piesek!', 'Czarny piesek!', 'Piesek w loczkach!', 'Szybki piesek!',
      'Piesek z uszkami jak motylek!', 'Piesek z kokardką!', 'Pomarszczony piesek!', 'Piesek w paski!',
    ]);
    expect(PUPS.map((p) => p.breed)).toEqual([
      'Polski owczarek nizinny', 'Nowofundland', 'Pudel', 'Chart polski', 'Papillon', 'Shih tzu', 'Shar-pei', 'Akita pręgowana',
    ]);
    expect(PUPS.map((p) => p.id)).toEqual(['pon', 'nowofundland', 'pudel', 'chart', 'papillon', 'shihtzu', 'sharpei', 'akita']);
  });

  it('POLISH_COPY §9: інші рядки', () => {
    expect(MISSION_LINES.fish).toBe('Rybki zgubiły drogę do domu! Pomożesz?');
    expect(GAME_PROMPTS.hiddenNumber).toBe('Jaka liczba się schowała?');
  });

  it('рядки §9 позначені для прослуховування (6 цуценят + 2 рядки + W4 ★)', () => {
    expect(FROM_COPY_9.size).toBe(9);
    expect(FROM_COPY_9.has('Piesek w loczkach!')).toBe(true);
    expect(FROM_COPY_9.has('Kudłaty piesek!')).toBe(false);
  });
});

describe('охоронні перевірки всіх озвучуваних рядків', () => {
  const spoken = SPOKEN_LINES.map((l) => l.text);

  it('збирає всі групи без порожніх рядків', () => {
    expect(spoken.length).toBeGreaterThan(40);
    for (const t of spoken) expect(t.trim().length, t).toBeGreaterThan(0);
  });

  it('числа лише словами: жодної цифри (TTS не читає цифри правильно)', () => {
    for (const t of spoken) expect(t, t).not.toMatch(/\d/);
  });

  it('усі рядки в нормалізованій формі NFC, без зайвих пробілів', () => {
    for (const t of spoken) {
      expect(t, t).toBe(t.normalize('NFC'));
      expect(t, t).toBe(t.trim().replace(/\s{2,}/g, ' '));
    }
  });

  it('жодного минулого часу щодо дитини (-łeś/-łaś), жодного «będziesz», «plus» замість «dodać»', () => {
    for (const t of spoken) {
      expect(t, t).not.toMatch(/łeś|łaś|będziesz|\bplus\b/i);
    }
  });

  it('шаблони теж без цифр для всіх чисел 0–100', () => {
    for (let n = 0; n <= 100; n++) {
      for (const noun of [OBJECTS.jablko, OBJECTS.gruszka, OBJECTS.motyl]) {
        expect(thereIs(n, noun)).not.toMatch(/\d/);
        expect(praiseCorrect(n, noun)).not.toMatch(/\d/);
        expect(twoGroups(n, 1, noun)).not.toMatch(/\d/);
      }
      expect(placeValue(n)).not.toMatch(/\d/);
      expect(findNumber(n)).not.toMatch(/\d/);
      expect(frogJump(n, (n % 9) + 1)).not.toMatch(/\d/);
      expect(countOnPraise(n)).not.toMatch(/\d/);
      expect(howManyMissing(n)).not.toMatch(/\d/);
    }
  });
});

describe('aria-підписи компонентів (design etap1/07, 08, 10)', () => {
  it('плитка: число словами; correct/retry — зі станом; locked — лише «zablokowane»', () => {
    expect(tileLabel(6)).toBe('sześć');
    expect(tileLabel(7, 'selected')).toBe('siedem');
    expect(tileLabel(7, 'correct')).toBe('siedem — dobrze');
    expect(tileLabel(8, 'retry')).toBe('osiem — spróbuj jeszcze raz');
    expect(tileLabel(47)).toBe('czterdzieści siedem');
    expect(tileLabel(0)).toBe('zero');
    expect(tileLabel(30, 'locked')).toBe('zablokowane');
  });

  it('кісточки: «kosteczki: 3 z 6»', () => {
    expect(bonesLabel(3, 6)).toBe('kosteczki: 3 z 6');
    expect(bonesLabel(0, 6)).toBe('kosteczki: 0 z 6');
  });

  it('аватар: «Ola — mapa»', () => {
    expect(profileMapLabel('Ola')).toBe('Ola — mapa');
  });
});

describe('aria-підписи мапи (design etap1/17)', () => {
  it('острови: замок, пройдено, «тут ми»; відкритий — лише назва', () => {
    expect(islandLabel('Kosmiczna Droga', 'locked')).toBe('Kosmiczna Droga — zablokowane');
    expect(islandLabel('Ogród Cyfr', 'completed')).toBe('Ogród Cyfr — ukończone');
    expect(islandLabel('Wyspa Dodawania', 'current')).toBe('Wyspa Dodawania — tutaj jesteśmy');
    expect(islandLabel('Plac Zabaw', 'open')).toBe('Plac Zabaw');
  });

  it('аватар на мапі: з іменем і без', () => {
    expect(changePlayerLabel('Ola')).toBe('Ola — zmień gracza');
    expect(changePlayerLabel(null)).toBe('Profil bez imienia — zmień gracza');
  });
});

describe('стежка світу, місія, кінець рівня (M7)', () => {
  it('підписи вузлів і скрині — дослівно з бордів дизайну', () => {
    expect(NODE_LABELS.done).toBe('Poziom ukończony — zagraj jeszcze raz');
    expect(NODE_LABELS.next).toBe('Następny poziom');
    expect(NODE_LABELS.locked).toBe('Poziom zablokowany');
    expect(NODE_LABELS.star).toBe('Zadanie dodatkowe');
    expect(NODE_LABELS.starLocked).toBe('Zadanie dodatkowe — zablokowane');
    expect(NODE_LABELS.review).toBe('Do powtórki');
    expect(CHEST_LABELS).toEqual({ locked: 'Skrzynia zamknięta', ready: 'Skrzynia gotowa', open: 'Skrzynia otwarta' });
  });

  it('вступи до світів — POLISH_COPY §3, для всіх 7 світів і хаба', () => {
    expect(Object.keys(WORLD_INTROS).sort()).toEqual(['hub', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7']);
    expect(WORLD_INTROS.w1).toBe('Witaj na Łące Liczenia! Tu liczymy biedronki i kwiatki.');
    expect(WORLD_INTROS.w7).toBe('Trzy, dwa, jeden… start! Lecimy rakietą aż do stu!');
    expect(SPOKEN_LINES.filter((l) => l.group === 'WORLD')).toHaveLength(8);
  });

  it('місія: kaczuszki й rybki — дослівно BRIEF/POLISH_COPY, решта — шаблон у теперішньому часі', () => {
    expect(missionLine('kaczuszka', OBJECTS.kaczuszka)).toBe('Kaczuszki się zgubiły! Pomożesz je policzyć?');
    expect(missionLine('rybka', OBJECTS.rybka)).toBe('Rybki zgubiły drogę do domu! Pomożesz?');
    expect(missionLine('biedronka', OBJECTS.biedronka)).toBe('Biedronki czekają na ciebie! Pomożesz je policzyć?');
    expect(missionLine('jablko', OBJECTS.jablko)).toBe('Jabłka czekają na ciebie! Pomożesz je policzyć?');
    expect(missionLine('rakieta', OBJECTS.rakieta)).toBe('Rakiety czekają na ciebie! Pomożesz je policzyć?');
  });

  it('жодна місія не звертається до дитини в минулому часі (-ł/-ła щодо дитини)', () => {
    for (const id of Object.keys(OBJECTS) as (keyof typeof OBJECTS)[]) {
      expect(missionLine(id, OBJECTS[id]), id).not.toMatch(/(łeś|łaś)/);
    }
  });

  it('підпис наліпки', () => {
    expect(stickerLabel(ANIMALS.mis)).toBe('Naklejka — miś');
  });
});

describe('«Błysk!» і «Nakarm zwierzaka» (M9)', () => {
  it('flashReveal: «{a} i {b} to {n}.» (POLISH_COPY §5)', () => {
    expect(flashReveal([3, 2])).toBe('Trzy i dwa to pięć.');
    expect(flashReveal([2, 2])).toBe('Dwa i dwa to cztery.');
    expect(flashReveal([5, 3])).toBe('Pięć i trzy to osiem.');
    expect(flashReveal([1, 2])).toBe('Jeden i dwa to trzy.');
    expect(flashReveal([4])).toBe('Cztery.');
    expect(flashReveal([])).toBe('');
  });

  it('quantityLine: «Pięć jabłek.», «Jedna gruszka.», «Dwie gruszki.»', () => {
    expect(quantityLine(5, OBJECTS.jablko)).toBe('Pięć jabłek.');
    expect(quantityLine(1, OBJECTS.gruszka)).toBe('Jedna gruszka.');
    expect(quantityLine(2, OBJECTS.gruszka)).toBe('Dwie gruszki.');
  });

  it('feedAnimal: «Daj misiowi pięć jabłek.» (BRIEF §7 гра 5)', () => {
    expect(feedAnimal(ANIMALS.mis, 5, OBJECTS.jablko)).toBe('Daj misiowi pięć jabłek.');
  });
});
