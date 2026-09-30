> **Примітка:** цей документ — методика, складена ДО остаточного дизайну. Актуальні персонажі, стиль, назви й тексти — у BRIEF.md (там пріоритет).
> Застаріле тут: маскот-білочка Rudzia / їжачок Tupcio, горіхи як нагорода, «Kosmiczna Oś» (тепер «Kosmiczna Droga»), бар'єр із додаванням (тепер множення), «Liczyłeś…» (форми з -ł/-ła щодо дитини заборонені), «ніколи не нумеруй листки» (у BRIEF: листки пронумеровані + номери на дугах стрибків).
> Звідси беремо: рівні світів, варіанти складності ігор, підказки, адаптивність, інтервальні повторення, труднощі для батьківської панелі.

# Learning design: Polish math site for a 5–6-year-old

## 0. Core principles
- **CPA in every skill.** Work moves from objects to structured pictures (ten-frame, dots, bundles) to digits and the number line. Each level removes one layer of support.
- **No reading needed.** Every prompt is spoken in Polish (pl-PL), with a replay-voice button. Answers are pictures or digits, and tapping one also plays its sound.
- **Polish grammar in the voice layer.** Counted nouns change form: 1 jabłko, 2–4 jabłka, 5+ jabłek, 22 jabłka. Use `Intl.PluralRules('pl')` (one/few/many) and store 3 forms for each object. Feminine nouns take "dwie" (dwie gwiazdki). Avoid masculine-personal nouns (chłopcy, piraci) because of "dwóch/ilu". Count animals, fruit and things instead.
- **Polish number words help with place value.** "Dwadzieścia trzy" says the tens first, the same order as the digits. The teens are irregular (jedenaście…dziewiętnaście, "-naście" means "on ten"), so they need extra practice. "Trzynaście" and "trzydzieści" are easy to confuse and should be tracked.
- **Audio.** If the TTS voice sounds poor, pre-record the numbers 0–100 and the praise lines. Use TTS for everything else.
- **Curriculum fit.** Worlds W1–W3 match the end of preschool (podstawa programowa: counting objects, digits 0–10, adding on concrete sets). W4–W7 are klasa 1 content and are stretch goals. Expect this to take months.

## 1. Learning path (7 worlds + review hub)

| # | World | Range | Skill goals | Prereq | Representations | Levels | Mastery |
|---|---|---|---|---|---|---|---|
| W1 | **Łąka Liczenia** (Counting Meadow) | 1–5 → 1–10 | Count sequence to 10 (oral to 20); one-to-one tagging; cardinality; subitize 1–5; give-N | — | Objects in a line, then scattered; dice dots; fingers | 12 | Counts 10 scattered objects with no skips or doubles; gives 8 on request; names 1–4 dots instantly |
| W2 | **Ogród Cyfr** (Digit Garden) | 0–10 | Digit↔quantity; zero; order; before/after; more/less/equal | W1 | Digit cards, ten-frame (5 as anchor), number track 1–10 | 12 | Matches digit↔set 0–10; answers "what comes after 7?"; compares two numbers up to 10 |
| W3 | **Wyspa Dodawania** (Addition Island) | sums ≤10 | Combining sets; + and = symbols; counting on; bonds of 5 and 10; doubles | W2 | Two-colour ten-frame, number-bond house, fingers, track | 15 | 80% right first try; counts on instead of recounting; knows bonds to 10 visually |
| W4 | **Most Dwudziestki** (Bridge of 20) | 11–20 | Teen = 10 + n; counting from any number; adding without bridging (13+4); ★ optional branch: make-ten bridging (8+5) | W3 | Double ten-frame, 20-bead rack, track 0–20 | 12 + ★4 | Builds and reads 11–20 as a full frame plus ones; solves 12+5 without counting all |
| W5 | **Las Dziesiątek** (Forest of Tens) | tens to 100 | Counting by tens; bundling 10 ones into a ten; composing 2-digit numbers (4 tens + 7 = 47) | W4 | Stick bundles, boxes of 10, rods and cubes, place-value mat | 12 | Counts 10…100 by tens; builds any number 20–99; tells 26 from 62 |
| W6 | **Miasto Setki** (Hundred City) | 1–100 | Counting on from any number; ±1 and ±10 neighbours; chart patterns; comparing 2-digit numbers | W5 | Hundred chart, number tiles | 12 | Finds any number on the chart; knows that "10 more" is the cell below |
| W7 | **Kosmiczna Oś** (Space Line) | sums ≤100 | Adding tens (30+20); +10 from any number (34+10); 2-digit + 1-digit without regrouping (42+5); ★ branch: 38+5; story problems | W6, W3 | Number line 0–100 with tens landmarks, rods and cubes | 12 + ★4 | Solves 40+30 and 52+4 |

- **Plac Zabaw** (review hub) opens after W1. It offers mixed review of mastered skills plus free play: hundred-chart painting and counting songs to 100. Rote counting often runs ahead of understanding, and that is fine.
- A level is 6–8 items, about 2–3 minutes.
- ★ branches are optional and never block the path.
- Each level's items are 70% the current skill and 30% earlier skills (spiral review).

## 2. Mini-game catalog
**Global rules**
- Tap targets are at least 64px (80px on phones).
- Any drag also works as tap-to-select then tap-the-target, and dropped items snap into place.
- Answers have no time limit.
- A mistake gets a gentle wobble and "Spróbuj jeszcze raz". There is never a red X or a buzzer.
- After the 2nd mistake the game shows the solution, the child finishes it, and the item comes back 2–3 items later.

1. **Policz i dotknij** (count 1–20; W1, W2, W4)
   - Screen: 3–20 bugs in a scene and 3 answer tiles.
   - Play: tapping a bug makes it bounce, puts a number badge on it and says the number. Then the child picks an answer.
   - Voice: "Policz biedronki. Dotknij każdej po kolei. Ile jest biedronek?"
   - Correct: all the bugs jump and the voice says "Jest siedem biedronek!"
   - Hints: 1st, badges reset and counting is slower. 2nd, guided count together.
   - Difficulty: line → circle → scattered; how similar the objects look; answers as dots or digits.
2. **Błysk!** (subitizing; W1–W3)
   - Screen and play: a dot card flashes, then the child picks from 3 choices.
   - Voice: "Patrz uważnie! Ile kropek?"
   - Correct: the card comes back with its groups outlined ("trzy i dwa to pięć").
   - Hints: 1st, a longer flash. 2nd, the card stays visible with groups outlined.
   - Difficulty: exposure 2s → 0.8s; dice → random → ten-frame 6–10.
3. **Cyfra i obrazek** (digit↔quantity; W2, W4)
   - Play: match 2–4 set cards to digits by tapping one and then the other.
   - Voice: "Połącz obrazek z liczbą."
   - Hints: 1st, the set is highlighted with a "count aloud" button. 2nd, guided count.
   - Difficulty: objects, dots, fingers or ten-frame; including 0.
4. **Zgubiony wagonik** (sequence, before/after; W2, W4, W5, W6)
   - Screen and play: a numbered train with a gap. The child taps the missing wagon and it rolls in.
   - Voice: "Jakiej liczby brakuje w pociągu?"
   - Hints: 1st, the train reads up to the gap ("…pięć, sześć…?"). 2nd, only 2 options remain.
   - Difficulty: range; gap at the end, middle or start; steps of 1 or 10; counting backwards (★).
5. **Nakarm zwierzaka** (give-N; W1, W2, W5)
   - Screen and play: the animal's speech bubble shows N. The child taps food onto a plate (tapping the plate removes one), then taps the check button.
   - Voice: "Daj misiowi pięć jabłek."
   - Hints: 1st, the plate is counted aloud. 2nd, the plate shows ten-frame slots.
   - Difficulty: N; loose food or slots. W5 variant: boxes of 10 plus singles ("Daj 34 jabłka").
6. **Kto ma więcej?** (compare; W2, W4, W6)
   - Play: two animals with piles. The child taps the bigger pile or the "tyle samo" (=) button.
   - Voice: "Kto ma więcej marchewek?"
   - Correct: the items line up 1-to-1 and the extras glow.
   - Hints: 1st, the items pair up. 2nd, the extras glow.
   - Difficulty: difference from big down to 1; a trick where bigger objects mean fewer of them; pictures → digits → 34 vs 43.
7. **Autobus dziesiątka** (ten-frame, bonds to 10; W2, W3)
   - Screen: a bus with 2×5 seats.
   - Voice: "Ile zwierzątek jedzie autobusem? Ile miejsc jest wolnych?"
   - Correct: "Siedem i trzy to dziesięć."
   - Hints: 1st, the top row pulses as "5". 2nd, count the empty seats together.
   - Difficulty: bus shown or flashed; asking about full or empty seats; a double-decker for 20 (W4).
8. **Domek liczb** (part-part-whole; W3, W4)
   - Screen: the roof shows the whole, and one of the two windows is empty.
   - Voice: "Osiem to trzy i ile?"
   - Hints: 1st, objects appear under the windows. 2nd, a ten-frame with dimmed counters.
   - Difficulty: whole 5 → 10 → 20; pictures → digits only; which part is missing.
9. **Ile razem?** (addition with objects, counting on; W3, W4)
   - Screen and play: two baskets over "3 + 2 = ?". Tapping the pour button merges them, then the child answers.
   - Voice: "Trzy jabłka i dwa jabłka. Ile jest razem?"
   - Correct: the voice reads "trzy dodać dwa równa się pięć".
   - Hints: 1st, badges continue from the first set ("cztery, pięć"). 2nd, guided counting on.
   - Difficulty: sum range; the first basket gets a lid showing its number (forces counting on); bigger addend first or second; doubles; symbols only.
10. **Skoki żabki** (number-line addition; W3, W4, W7)
    - Screen: lily pads 0–10 or 0–20. In W7 it becomes a rocket on a 0–100 line with tens landmarks.
    - Play: each tap makes one jump.
    - Voice: "Żabka siedzi na liczbie cztery. Skacze trzy razy. Gdzie wyląduje?"
    - Number the jump arcs, never the pads. This prevents the classic error of counting the starting pad.
    - Hints: 1st, jumps replay one by one. 2nd, the child taps each arc.
    - Difficulty: range; steps of 1 or +10; unlabelled pads.
11. **Zrób dziesiątkę** (make ten; W3, W4★, W7★)
    - Screen and play: a partly filled ten-frame. The child taps counters to fill it. In bridging mode (8+5) the child fills to 10, then places the rest.
    - Voice: "Ile brakuje do dziesięciu?"
    - Correct: the full frame flashes gold.
    - Hints: 1st, the empty cells pulse. 2nd, count the empty cells together.
    - Difficulty: frame visible, flashed, or digits only.
12. **Paczki po dziesięć** (tens and ones; W5, W6)
    - Screen and play: loose apples. The child packs them into boxes of 10. Tapping boxes says "dziesięć, dwadzieścia, trzydzieści…", then the singles are counted on.
    - Voice: "Zapakuj jabłka po dziesięć. Ile jest wszystkich jabłek?"
    - Correct: the number is shown with the tens digit and ones digit colour-coded.
    - Hints: 1st, count the tens together. 2nd, show "4 dziesiątki i 7 jedności = 47".
    - Difficulty: range; reverse mode (build 47 with +10/+1 buttons); 26 vs 62 contrast items.
13. **Tajemnicza tablica** (hundred chart; W6, W7, hub)
    - Modes: find a number; guess what is hiding under a leaf; paint patterns ("wszystkie z piątką na końcu"); ±1 and ±10 neighbours.
    - Voice: "Znajdź liczbę czterdzieści siedem." / "Co kryje się pod listkiem?"
    - Hints: 1st, the correct row (the tens) is highlighted. 2nd, the column is highlighted too.
    - Difficulty: range 1–30 → 100; full chart → partly hidden → fragment puzzle.
14. **Historyjki** (story problems; W3, W4, W7)
    - Screen: a 2–3 panel animated story.
    - Voice: "Na gałęzi siedzą dwa ptaszki. Przylatują jeszcze trzy. Ile ptaszków jest teraz na gałęzi?"
    - Play: the child picks an answer tile, and later the matching equation card.
    - Hints: 1st, the story replays with counters. 2nd, a ten-frame model.
    - Difficulty: numbers; problem type (join, combine, compare).

## 3. Session and motivation
- **Session:** 8–12 minutes (parent-set cap, default 15). The child only taps the glowing next node on the map.
  1. **Rozgrzewka** (1–2 min): 3–4 items from the spaced-review queue, or a round of Błysk.
  2. **Nowe** (2 min): the mascot shows the new idea ("Patrz, pokażę ci"), then 2 guided items.
  3. **Ćwiczenie** (4–6 min): 2 mini-games of 6 items each, 70% new and 30% review.
  4. **Świętowanie** (1 min): sticker reveal, the map node lights up, the mascot dances, and a clear "Koniec na dziś" end point.
- **Rewards are fixed and predictable.**
  - Each finished level gives one sticker for the album, and a world collectible grows (a garden, a rocket).
  - Stars mark "done", not accuracy. No 1–3 star grading, so there is no fear of mistakes.
  - Effort badges, e.g. "Nie poddajesz się!" after the child fixes a mistake.
- **No dark patterns:** no streaks to lose, no random loot, no currency, no countdowns, no "we miss you" prompts, no autoplay into the next lesson.
- **Mistakes:** the child never loses progress. Mistakes get a neutral sound, the hint ladder, then a demonstration and a retry. The item is re-queued in this session and in the next warm-up. Praise names the strategy ("Liczyłeś dalej od pięciu!").
- **Adaptive difficulty** (per skill and number range; tracks first-try correctness, hints used and response time):
  - **Level up:** 5 correct first try in a row moves one difficulty step up (bigger range or less support).
  - **Step down:** 2 errors in the last 3 items moves back one step and adds support. If that fails too, switch to another game for the same skill, then flag it for the parent.
  - **Mastery:** at least 80% right first try over the last 10 items, on 2 or more different days, without visual support.
  - **Frustration signals:** random rapid taps, 3 errors in a row or a long idle lead to an easier item, free play, or a break prompt.
- **Spaced review:** mastered skills return after 1, 3, 7, 14 and 30 days. A failed review marks the skill "do powtórki".
- **Break:** at about 10 minutes the mascot yawns: "Zrób przerwę! Podskocz dziesięć razy!" (a movement break with counting). At the cap, a friendly goodbye screen.
- **Parent panel** (behind a gate: hold for 3 seconds plus an adult sum like 17+25; Polish, with an optional Ukrainian toggle):
  - Skill map with states: nowe / ćwiczy / opanowane / do powtórki.
  - Accuracy trend, hints used and time spent, per skill.
  - Auto-detected trouble spots: counting all instead of counting on; skipping objects; 13↔30; 26↔62; off-by-one jumps on the number line.
  - Minutes played per day and a summary of the last session.
  - Settings: session length, voice and speed, music and sound effects, reduced motion, ★ branches, manual world unlock, profiles (for a sibling later), progress export/import (JSON), reset.

## 4. Design implications (what the designer must provide)
1. **Mascot guide** with about 8 poses: talking, pointing, demonstrating, cheering, encouraging, thinking, yawning, goodbye.
2. **Countable object library:** 3–4 sets per world (at least 25 items).
   - Each item is a single SVG with a distinct silhouette, readable at 40px, in a consistent size family, never overlapping others.
   - States: idle, counted (bounce and number badge), highlighted, dimmed.
3. **Structured quantities:** dice and domino dot patterns 1–10; hands showing 0–10; ten-frame, single and double, with 2 counter colours and empty, filled and pulsing cells; 20-bead rack.
4. **Base-ten set:** cube, rod, stick bundle, box of 10, 2-column place-value mat. One fixed colour code for tens vs ones, used on the digits too, across the whole app.
5. **Number track and line:**
   - Lily pads 1–10 and 1–20; lines 0–20 and 0–100 with tens landmarks and zoomable segments.
   - Numbered jump arcs, with frog and rocket markers.
6. **Hundred chart (10×10):**
   - Tile states: default, hidden under a leaf, highlighted, painted in 4 colours, row/column highlight.
   - A fragment/puzzle-piece variant.
   - A phone layout with tap-to-zoom by row, because tiles are small.
7. **Digits:** school-style numerals (a clear "1" with its upstroke and a crossed "7"), digit cards 0–9, number tiles up to 100, and the + and = symbols.
8. **Answer controls:**
   - 2–4 big tiles with states: idle, pressed, correct, try-again (never red-only), disabled.
   - A small speaker icon on tiles for tap-to-hear.
   - A large check button labelled "Gotowe".
   - Drop zones that glow and snap.
9. **Game scenes:** train, bus (2×5), number-bond house, baskets with the pour button, animal with a plate, conveyor with boxes, and 3-panel story frames.
10. **Persistent icon-only chrome in fixed positions:** replay voice, map/home, pause, and a discreet parent-gate button.
11. **Adventure map:** 7 worlds plus the Plac Zabaw hub. Level nodes show locked, glowing next, done, ★ branch, and review due. Includes the path animation and the child's avatar.
12. **Feedback motion kit:** correct sparkle, try-again wobble, hint pulse/spotlight/dimmed distractors, level complete, sticker reveal. Every effect needs a reduced-motion variant.
13. **Collections:** sticker album with pages per world, and the growing world collectibles.
14. **Screens:**
    - Profile picker with animal avatars and no text.
    - Break screen and goodbye screen.
    - Parent dashboard in a calmer, adult style.
15. **Look and accessibility:**
    - A calm palette per world, no neon.
    - At most one animated element besides the focus of the task.
    - Colour-blind safe.
    - Portrait and landscape layouts, 360px up to desktop, with safe areas.
16. **Audio list:** numbers 0–100, instruction lines, praise lines, sound effects, and optional calm music per world.