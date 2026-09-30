> **Примітка:** довідник польських текстів і граматики, складений ДО остаточного дизайну. Рядки з BRIEF.md мають пріоритет і вставляються дослівно.
> Застаріле тут: імена маскота (Tupcio, Rudzia, Pestka…), wiewiórka/piesek у списку тварин (тепер: miś, jeżyk, kotek, lisek, zajączek, żabka, sowa, myszka), перемикач {g:Zrobiłeś|Zrobiłaś} — не використовувати: форми з -ł/-ła щодо дитини заборонені.
> Звідси беремо: граматичні правила (розділ 8), шаблони інструкцій, додаткові похвали й підказки (якщо вони без минулого часу).

# Polish UX copy for the math site (age 5–6)

## 1. Site name

| Name | Rationale |
|---|---|
| **Liczydełko** (top pick) | "Little abacus." A warm diminutive for a real object, so it doubles as a logo. It also echoes the 20-bead rack in the games. |
| Liczaki | "Little counters." Sounds like a friendly group of characters. |
| Do Stu! | "Up to a hundred!" Says the goal and is easy to shout. |
| Sto Kroków | "A hundred steps." Fits the path on the adventure map. |
| Liczykraina | "Counting Land." Has a fairy-tale feel. |
| Matmolandia | "Mathland." Fun, but "matma" is school slang that older kids use. |

## 2. Mascot

| Species | Name 1 | Name 2 |
|---|---|---|
| jeż (hedgehog, m) | **Tupcio**, from "tup-tup" footsteps, so he can hop along the number line | Igiełek, from "igły" (spikes you can count) |
| sowa (owl, f) | Cyferka ("little digit") | Pola (short and easy to say) |
| wiewiórka (squirrel, f) | Pestka ("seed") | Kitka (bushy tail; she collects nuts, which fits packing by 10) |

**Top pick: jeżyk Tupcio.** The name has two syllables, sounds like his footsteps and is easy for a child to say. A hedgehog curled into a ball also looks like a counter. Write his lines in the present tense ("Pokażę ci", "Patrz") so his grammatical gender (pokazałem) never matters.

## 3. Worlds (name + spoken intro)

| # | Name | Spoken intro |
|---|---|---|
| W1 | Łąka Liczenia | Witaj na Łące Liczenia! Tu liczymy biedronki i kwiatki. |
| W2 | Ogród Cyfr | To Ogród Cyfr. Każda cyfra ma tu swoją grządkę. |
| W3 | Wyspa Dodawania | Płyniemy na Wyspę Dodawania! Sprawdzimy, ile jest razem. |
| W4 | Most Dwudziestki | Przed nami Most Dwudziestki. Idziemy krok po kroku aż do dwudziestu! |
| W5 | Las Dziesiątek | W Lesie Dziesiątek pakujemy wszystko po dziesięć. |
| W6 | Miasto Setki | Witaj w Mieście Setki! Tu mieszkają liczby od jednego do stu. |
| W7 | **Kosmiczna Droga** (replaces "Kosmiczna Oś", because "oś" is too abstract for a 5-year-old) | Trzy, dwa, jeden… start! Lecimy rakietą aż do stu! |
| Hub | Plac Zabaw | Plac Zabaw! Tu bawisz się tym, co już umiesz. |

## 4. Core UI strings

The buttons show only icons. These strings are used as aria-labels and are spoken when the child taps or long-presses.

- Graj! (play)
- Dalej (next)
- Jeszcze raz (again)
- Posłuchaj (replay the voice)
- Wróć (back)
- Mapa (map)
- Naklejki (stickers)
- Album z naklejkami (sticker album)
- Dla rodzica (for the parent)
- Gotowe (check / done)
- Pauza (pause)
- Graj dalej (resume)
- Pomóż mi (hint, worded as the child asking)
- Tyle samo (the = button)
- Wsyp! (pour button in the basket game)
- Zapakuj (pack)
- Koniec na dziś (done for today)
- Kto dziś gra? (profile picker, spoken)
- Dodaj gracza (add player)
- Tak / Nie (yes / no)
- Zamknij (close)
- Dźwięk włączony / wyłączony (sound on / off)

## 5. Spoken templates per mini-game

**Placeholders:**
- `{n}` is the number as words, never as digits (see §8).
- `{obj.few}` is the nominative/accusative plural (biedronki).
- `{obj.many}` is the genitive plural (biedronek).
- `{qty(n,obj)}` is the number plus the correctly inflected noun.
- `{Jest|Są}` is the verb that agrees with the number (§8).

| Game | Templates |
|---|---|
| 1 Policz i dotknij | "Policz {obj.few}. Dotykaj po kolei." / "Ile jest {obj.many}?" / Correct: "{Jest\|Są} {qty}!" (Jest siedem biedronek! / Są trzy biedronki!). Each tap only says the number. |
| 2 Błysk! | "Patrz uważnie! Ile kropek?" / Reveal: "{a} i {b} to {n}." |
| 3 Cyfra i obrazek | "Połącz obrazek z liczbą." |
| 4 Zgubiony wagonik | "Jakiej liczby brakuje w pociągu?" / Hint: "…{n−2}, {n−1}… i co dalej?" / Counting back: "Pociąg jedzie do tyłu. Czego brakuje?" |
| 5 Nakarm zwierzaka | "Daj {animal.dat} {qtyAcc(n,obj)}." (Daj misiowi pięć jabłek / jedną gruszkę.) / "Gotowe? Dotknij tutaj." (the mascot points while the button pulses) |
| 6 Kto ma więcej? | "Kto ma więcej {obj.many}?" / "Kto ma mniej {obj.many}?" / "A może tyle samo?" |
| 7 Autobus dziesiątka | "Ile zwierzątek jedzie autobusem?" / "Ile miejsc jest wolnych?" / "{a} i {b} to dziesięć." |
| 8 Domek liczb | "{whole} to {part} i ile?" (Osiem to trzy i ile?) |
| 9 Ile razem? | "{qty(a)} i {qty(b)}. Ile razem?" / Reading the equation: "{a} dodać {b} równa się {sum}." |
| 10 Skoki żabki | "Żabka jest na liczbie {n}. Skacze {k} {raz\|razy}. Gdzie wyląduje?" / Rocket: "Rakieta jest na liczbie {n}. Leci o {k} dalej. Gdzie wyląduje?" |
| 11 Zrób dziesiątkę | "Ile brakuje do dziesięciu?" / "Dołóż tyle, żeby było dziesięć." |
| 12 Paczki po dziesięć | "Zapakuj {obj.few} po dziesięć." / "Ile jest {obj.many} razem?" / "Cztery dziesiątki i siedem jedności to czterdzieści siedem." / Reverse mode: "Zbuduj liczbę {n}." |
| 13 Tajemnicza tablica | "Znajdź liczbę {n}." / "Co kryje się pod listkiem?" / "Pomaluj liczby z {digit.instr} na końcu." / "Tu jest liczba {n}. Która liczba jest o dziesięć większa?" |
| 14 Historyjki | "Posłuchaj historyjki." + story, e.g. "Na gałęzi siedzą dwa ptaszki. Przylatują jeszcze trzy. Ile ptaszków jest teraz na gałęzi?" / "Które działanie pasuje?" |

**Gender of the child:** the present tense is gender-neutral ("Liczysz dalej!", "Nie poddajesz się!"), so use it by default. Where a past tense cannot be avoided, use `{g:Zrobiłeś|Zrobiłaś}`, and fall back to a neutral line when the profile has no gender set.

## 6. Feedback lines

**Praise (12)**
1. Brawo!
2. Świetnie!
3. Tak jest!
4. Właśnie tak!
5. Dobra robota!
6. Udało się!
7. Wszystko się zgadza!
8. Pięknie policzone!
9. Super liczysz!
10. Liczysz dalej od {n}, sprytnie! (names the counting-on strategy)
11. Od razu widzisz pięć, super! (subitizing)
12. Najpierw dziesiątki, potem jedności, świetnie! (place value)

**After a mistake (8)**
1. Spróbuj jeszcze raz.
2. Prawie! Jeszcze raz.
3. Popatrz jeszcze raz uważnie.
4. Policzmy jeszcze raz, powoli.
5. Hmm… sprawdźmy razem.
6. Nic nie szkodzi. Próbujemy dalej!
7. Każdy czasem się myli. Dasz radę!
8. Pomogę ci. Zrobimy to razem. (after the 2nd miss)

**Hints (6)**
1. Dotykaj po kolei i licz na głos.
2. Zacznij od {n} i licz dalej.
3. Pełny rząd to pięć. Policz resztę.
4. Ile brakuje do pełnej dziesiątki?
5. Najpierw policz paczki: dziesięć, dwadzieścia…
6. Patrz, pokażę ci.

**Level complete (5)**
1. Udało się! Ten poziom już umiesz.
2. Hurra! Na mapie świeci nowa ścieżka.
3. Brawo! Przybij piątkę!
4. Koniec poziomu! Zobacz, co się zmieniło.
5. Świetna robota! Wracamy na mapę.

**New sticker (3)**
1. Masz nową naklejkę!
2. Niespodzianka! Nowa naklejka do albumu.
3. Zobacz, jaka naklejka! Wklejmy ją do albumu.

**Break (3)**
1. Czas na przerwę! Podskocz dziesięć razy: raz, dwa, trzy…
2. Tupcio ziewa… Zróbmy przerwę! Wstań i klaśnij pięć razy.
3. Napij się wody i przeciągnij się.

**Welcome back (3)**
1. Cześć! Dobrze cię widzieć!
2. Hej, jesteś! Gramy?
3. Jesteś znowu! Tupcio już czeka.

**Goodbye:** Koniec na dziś. Do zobaczenia!

**Effort badge:** Nie poddajesz się!

## 7. Parent zone

**Gate**
- First screen: "Strefa rodzica. Przytrzymaj przycisk przez 3 sekundy."
- Second screen: "Rozwiąż działanie, aby wejść: {a} + {b} = ?" with the button [Wejdź].
- Wrong answer: "Niepoprawny wynik. Spróbuj ponownie."

**Sections:** Podsumowanie · Mapa umiejętności · Postępy · Trudności · Czas nauki · Ostatnia sesja · Ustawienia · Profile · Kopia zapasowa

**Skill states:** Nowa · W trakcie nauki · Opanowana · Do powtórki. "Umiejętność" is feminine, so these replace "nowe / ćwiczy / opanowane", which mixed grammatical forms.

**Stats:** Poprawnie za pierwszym razem (%) · Użyte podpowiedzi · Średni czas odpowiedzi · Minuty dziennie · Rozwiązane zadania · Ostatnia sesja: {data}, {min} min

**Trouble spots:**
- Liczy wszystko od początku zamiast dalej (counts all instead of counting on)
- Pomija lub liczy dwa razy ten sam przedmiot (skips or double-counts)
- Myli 13 i 30
- Myli 26 i 62
- Przy skokach liczy pole startowe (wynik o 1 za duży) (counts the starting pad, so the answer is 1 too big)

**Settings (label: description)**
- Długość sesji: Po tym czasie gra łagodnie się kończy. (domyślnie 15 min)
- Głos: Wybierz polski głos (pl-PL).
- Tempo mowy: Wolniej lub szybciej.
- Muzyka: Spokojna muzyka w tle.
- Efekty dźwiękowe: Dźwięki przy dotknięciu i nagrodach.
- Mniej animacji: Ogranicza ruch na ekranie.
- Zadania dodatkowe ★: Trudniejsze ścieżki poboczne. Nie blokują gry.
- Odblokuj świat ręcznie: Pozwala wejść do świata bez ukończenia poprzedniego.
- Profile: Dodaj dziecko, zmień imię lub zwierzątko.
- Język panelu: Polski / Українська.
- Eksportuj postępy: Zapisuje plik JSON z postępami.
- Importuj postępy: Wczytuje zapisany plik.
- Wyczyść postępy: Usuwa postępy wybranego profilu.

**Reset confirmation:** "Usunąć wszystkie postępy profilu „{imię}”? Tego nie da się cofnąć. Najpierw możesz zapisać kopię (Eksportuj postępy)." Buttons: [Anuluj] [Tak, usuń]. Putting the name in quotes after "profilu" means the child's name never has to be declined.

## 8. Grammar notes for the developer

**Plural categories.** `new Intl.PluralRules('pl').select(n)` returns:
- `one` for 1.
- `few` for 2–4, 22–24, 32–34… (but not 12–14).
- `many` for 0, 5–21, 25–31…

A compound number ending in 1 still takes the `many` form: "dwadzieścia jeden jabłek".

**Verb agreement.** Use "jest" for one, "są" for few and "jest" for many: Jest jedno jabłko / Są dwa jabłka / Jest pięć jabłek.

**Gender of numerals**
- 1 is jeden (m), jedna (f), jedno (n).
- 2 is dwa (m, n) and dwie (f). This also applies inside compounds: "dwadzieścia dwie gruszki".
- 3 and 4 do not change.

**Reusing the stored forms**
- The `few` form is also the nominative/accusative plural: "Policz gruszki".
- The `many` form is also the genitive plural, used after ile, więcej, mniej and brakuje: "Ile jest gruszek?"

**Accusative after "Daj / Policz / Znajdź" + number.** For n ≥ 2 it is the same as the nominative for these nouns. Only n = 1 differs, so store `acc1` for each object: "jedną gruszkę", "jednego motyla".

**Never pass digits to the TTS**
- "2 gruszki" is read aloud as "dwa gruszki", which is wrong.
- "1 jabłko" is read as "jeden jabłko", which is also wrong.
- "3+2=5" is not read reliably.
- Generate the words in code instead.

**Avoid declining numerals.** Put the number right after "liczba": "Znajdź liczbę czterdzieści siedem", "na liczbie cztery". Keep a few fixed genitive forms for the phrases that need them: do dziesięciu, do dwudziestu, do stu, od jednego.

**Other words that change with the number**
- raz: raz (1, just "raz", not "jeden raz"), razy (2–4), razy (5+).
- dziesiątka: dziesiątka / dziesiątki / dziesiątek.
- jedność: jedność / jedności / jedności.

**Digit names in the instrumental** (for "z … na końcu"): zerem, jedynką, dwójką, trójką, czwórką, piątką, szóstką, siódemką, ósemką, dziewiątką.

**Animal names in the dative** (for "Daj …"): misiowi, jeżykowi, kotkowi, pieskowi, zajączkowi, żabce, sowie, wiewiórce.

```ts
const PR = new Intl.PluralRules('pl');
const ONE = { m: 'jeden', f: 'jedna', n: 'jedno' } as const;
type Obj = { g: 'm'|'f'|'n'; one: string; acc1: string; few: string; many: string };

function qty(n: number, o: Obj, acc = false): string {
  if (n === 1) return acc ? o.acc1 : `${ONE[o.g]} ${o.one}`;
  const noun = PR.select(n) === 'few' ? o.few : o.many;
  return `${numWords(n, o.g)} ${noun}`; // numWords: 'dwie' if g==='f' && n%10===2 && n!==12
}
const isAre = (n: number) => (PR.select(n) === 'few' ? 'Są' : 'Jest');
```

**15 countable objects (1 / 2–4 / 5+)**

| Noun (gender) | 1 | 2–4 | 5+ | acc1 |
|---|---|---|---|---|
| jabłko (n) | jabłko | jabłka | jabłek | jedno jabłko |
| gruszka (f) | gruszka | gruszki | gruszek | jedną gruszkę |
| truskawka (f) | truskawka | truskawki | truskawek | jedną truskawkę |
| marchewka (f) | marchewka | marchewki | marchewek | jedną marchewkę |
| biedronka (f) | biedronka | biedronki | biedronek | jedną biedronkę |
| rybka (f) | rybka | rybki | rybek | jedną rybkę |
| kaczuszka (f) | kaczuszka | kaczuszki | kaczuszek | jedną kaczuszkę |
| gwiazdka (f) | gwiazdka | gwiazdki | gwiazdek | jedną gwiazdkę |
| muszelka (f) | muszelka | muszelki | muszelek | jedną muszelkę |
| żabka (f) | żabka | żabki | żabek | jedną żabkę |
| jajko (n) | jajko | jajka | jajek | jedno jajko |
| auto (n) | auto | auta | aut | jedno auto |
| kwiatek (m) | kwiatek | kwiatki | kwiatków | jeden kwiatek |
| balonik (m) | balonik | baloniki | baloników | jeden balonik |
| motyl (m, animate) | motyl | motyle | motyli | jednego motyla |

**Numbers that need a listening check or special care**
- piętnaście and dziewiętnaście: the "ę" is pronounced like "e".
- pięćdziesiąt, sześćdziesiąt (sounds like "szeździesiąt") and dziewięćdziesiąt: listen to each one with the chosen voice.
- szesnaście is spelled with "s" in the middle, not "sz".
- Easily confused pairs: trzynaście / trzydzieści and czternaście / czterdzieści. Say them more slowly (rate about 0.85) and add a short pause in the items that contrast them.
- Listen to 0–100 with the chosen voice at rate about 0.9. If any number sounds wrong, use pre-recorded audio instead.

**Wording for addition**
- **With objects:** "{a} i {b} to {suma}" and "Ile jest razem?" In stories, use present-tense verbs: "Przylatują jeszcze trzy."
- **With symbols:** read "+" as "dodać" and "=" as "równa się": "Trzy dodać dwa równa się pięć." "Plus" is also correct and common at home. Use "dodać" consistently in the voice, and accept "plus" if the child says it.
- **Questions:** "Ile razem?", "Ile to jest {a} dodać {b}?", and the casual "Ile wyszło?"
- **Words to keep out of the child's view:** "suma", "składnik" and "wynik działania". These are fine in the parent panel.