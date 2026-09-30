# design/INDEX.md — карта дизайну «Klockowo» (Етапи 1–2 з 6)

Не відкривай `Klockowo*.html` і `*.pdf` (7–16 МБ кожен) — усе потрібне вже розпаковано в `design/extracted/`. Читай лише борд, названий у етапі: `extracted/pages/<etap>/NN-….html` (7–36 КБ, HTML з inline-стилями; **числа й CSS для верстки брати звідти**). Повний список бордів — `extracted/boards.json`. Новий експорт дизайну → `node design/tools/unpack.mjs` (нові SVG додай у `design/tools/names.json`).

## 1. Що лежить у `design/`
| Файл | Зміст |
|---|---|
| `Klockowo1.html` (+ `Klockowo.pdf`, 18 стор.) | **Етап 1**: система, компоненти, Kubik, цуценята, екрани входу → `extracted/pages/etap1/` |
| `Klockowo.html` (+ `Klockowo2.pdf`, 19 стор.) | **Етап 2**: ігровий шаблон, математичні компоненти, предмети, команда, стежки, місія → `pages/etap2/` |
| `extracted/tokens.css` | готові токени `--kl-*` (дослівно з борда etap1/02) — для `src/styles/tokens.css` |
| `extracted/svg/` | 121 SVG з бандлів + 25 іконок + 10 цифр + логотип, названі осмислено (§6) |
| `tools/` | `unpack.mjs` (розпаковка), `names.json` (хеш → назва файлу) |

Назви переплутані: `Klockowo1.html` = Етап 1, `Klockowo.html` = Етап 2 (PDF — навпаки). PDF — друк тих самих бордів, текст у них частково зіпсований шрифтами; джерело істини — HTML. Кожен борд — вкладений бандл: React + `<x-dc>` (інструмент Claude Design), шрифти й рантайм у `extracted/` **не** винесені.

## 2. Токени (`extracted/tokens.css`, 100 рядків) — збігаються з BRIEF §8
- **Кольори**: base (bg, surface, surface-2, ink, ink-soft); семантика fill/edge (primary, secondary, success, retry, reward, locked + `--kl-locked-edge #A39DB5`); розряди `tens/ones` + `*-digit`; 7 блоків рельєфу; шкали світів `--kl-w1…w7-{50,100,500,700}` і `--kl-hub-*` (50 = тло сцени світу, 700 = підписи й краї).
- **Форма й рух**: `space-1…8` (сітка 8), `radius-{chip 12, tile 20, panel 24, round}`, `shadow-block` (потрібна змінна `--edge`), `shadow-pressed`, `highlight`, `press`, `ease-pop`, `ease-out`, `dur-*` (tap 90 … confetti 1500, reduced 150), `target 64/80`, `gap-min 16`, `edge-safe 24`, `focus`, `selected`.
- **Типографіка**: `--kl-font-display` Fredoka, `--kl-font-ui` Nunito, `--kl-font-digit-fallback` Andika; `--kl-fs-*` як `clamp()` (digit-hero 96–160, digit-tile 56–72, h1 36–56, button 22–28, count-label 24–32, parent 18).
- **Шрифти в дизайні**: Fredoka 500/600/700, Nunito 600/700/800, Andika 400/700 (latin, latin-ext). Реально в UI потрібні Fredoka 600/700, Nunito 600/700, Andika 400/700; 800 і Fredoka 500 — лише підписи бордів. **Nunito треба ще й з cyrillic** (панель батьків PL/UA).
- **Цифри**: SVG 0–9, `viewBox 0 0 100 140`, штрих 15 round, колір `currentColor`; розміри 160/96/72/56 (≥48 на телефоні); двоцифрові — проміжок −8 од. viewBox, розряди кольорові лише на світлому тлі.
- **Немає в tokens.css, але вжито в дизайні** (додати в M1): `#E3CFA8` — нейтральний «край» кнопок/плиток surface і лотка (77×) → `--kl-neutral-edge`; `#EDEAF3` — заливка вимкненої «Gotowe» (рамка `--kl-locked-edge`) → `--kl-disabled`. Решта позатокенних кольорів — фарби ілюстрацій (хутро, шкіра рук `#F0BE94`, рукав `#3AA0FF`) — лишаються в SVG.

## 3. Борди Етапу 1 (`pages/etap1/NN-…`)
| NN | Борд | Що всередині |
|---|---|---|
| 00 | Logo «Klockowo» | 33×5 кубиків, літери в кольорах W1–W7, «K» primary; на темному, монохром, значок «K» (`svg/logo/`) |
| 01 | Kolory i skale światów | палітра, блоки, розряди, шкали світів + контрасти (W7-500 лише для іконок; на 500 W5–W7 без дрібного тексту) |
| 02 | Tokeny | відступи, радіуси, «блоковий» об'єм (демо 90 мс), easing, **блок tokens.css** |
| 03 | Typografia i diakrytyki | Fredoka/Nunito/Andika + рядок діакритики, шкала розмірів ПК→телефон |
| 04 | Cyfry SVG 0–9 | шкільні форми («1» з довгим штрихом, «4» відкрита, «7» перекреслена, «9» пряма), кольори/розміри |
| 05 | Ikony | 17 дій + 8 орієнтирів світів (квітка, грядка, острів, міст, ялинка, будинки, ракета, гойдалка) |
| 06 | PlayButton · IconButton · CheckButton | PlayButton 160/120/96 (default, pressed, focus, idle «дихання» 2,4 с); IconButton 72/80 (neutral, secondary+pulse, primary, hint, retry); CheckButton 120×88 (disabled, default, pressed, focus); шестерня батьків (hold 3 с, кільце) |
| 07 | AnswerTile · DigitCard | AnswerTile 120×120: default, pressed, selected, correct, retry, locked, dragging, focus; варіанти цифра+крапки (W1), розряди (W4–W7), розміри під 5 в'юпортів; DigitCard 120×160: default, highlighted, selected, correct, retry |
| 08 | HUD · ProgressBones · SpeechBubble · Overlay | HUD 1280×104, телефон 390 (2×3 кісточки, 112+safe-area), 844×390 (бічна смуга); кісточка: empty/filled/arriving/compact; бульбашка: число, іконка, thinking, talking; Overlay (затемнення 55 %, панель r24) |
| 09 | WorldIsland · LevelNode | 7 островів + хаб + locked + «Baza Drużyny» (SVG 208×228); стани locked, current (світіння+Kubik на картингу), completed (прапорець), pressed; вузол 96 px: locked, next, completed, ★, «Do powtórki», open |
| 10 | AvatarButton · PupPicker · Toggle · Slider | аватар 160/72; PupPicker 4×2 (картка 176, цуценя 144; телефон 2×4, 150), default/pressed/selected/focus; Toggle 56×32; Slider: Mowa/Efekty/Muzyka + Tempo mowy |
| 11 | Kubik — arkusz póz | 20 поз + 7 аксесуарів світів, шари SVG, правила анімації частин |
| 12 | 8 piesków | 8 порід + голосові підписи, як аватар 72 |
| 13 | Ładowanie | вежа з кубиків (Kubik demonstrating) + смужка з кубиків |
| 14, 15 | Start — «Graj!» / «Kto dziś gra?» | тло Baza Drużyny, PlayButton 160, аватари 160 (Ola, Staś, безіменний «—»), шестерня в куті |
| 16 | Twój piesek | сітка 4×2 + Kubik із бульбашкою «лапка ?» + зелена «Gotowe»; ⚠ картинки в експорті зламані (§7) |
| 17 | Mapa przygody | 7 островів + Plac Zabaw + Baza на стежці з блоків; аватар 72, «Naklejki», шестерня 48 |

## 4. Борди Етапу 2 (`pages/etap2/NN-…`)
| NN | Борд | Що всередині |
|---|---|---|
| 00 | Gra — szablon 1280×720 | **шаблон гри (M8)**: HUD 104 (Mapa 72 @24,24; 6 слотів 60×48, gap 12, по центру; Posłuchaj @1184,24); сцена y104 h432 (тло світу-50, ґрунт y536, декор по краях); Kubik 147×184 @(22,512) + `acc-wN`; бульбашка 150×96 @(140,424); «Pomóż mi» 72 @(196,612); лоток 456×148 @(412,556) (surface-2, r24; 3 плитки 120, gap 24); «Gotowe» 120×88 @(1136,608). Зразок: «Policz i dotknij» (biedronki, плитки 6/7/8, 8 = retry) |
| 01–05 | ті самі кадри 1440×900, 1024×768, 768×1024, 390×844, 844×390 | 844×390: Kubik прихований (з'являється лише на hint/together), лоток — стовпець 3×88 праворуч, кісточки 28 px угорі сцени |
| 06 | MascotStage · HintButton · MissionCard · TreasureChest | MascotStage: idle, talking, pointing, hint, retry, together, correct (+репліки); HintButton: hidden, idle, pressed, active, focus; скриня 132 px: locked, ready, open; MissionCard 640×360: appear, shown, compact 380×214, solved |
| 07 | CountableObject · DropZone · DotCard · руки | предмет: idle, counted (номерок), highlighted, dimmed, dragging, selected; ряд/розсип/п'ятірки; DropZone: empty, target, filled, correct; DotCard: 1–6, доміно, сорочка, групи; руки 0–10 |
| 08 | TenFrame · BeadRack20 | рамка: empty, 7, 3+4 (двоколірна), full (золотий спалах), hint, target, подвійна (20, ★ 8+5); рахівниця: start, 8, 13 |
| 09 | NumberLine · JumpArc | листки латаття 0–10/0–20 («Skoki żabki»), пряма 0–20 і 0–100 (ракета W7, збільшення 40–50), дуга: drawing/done/highlighted/стрибок на десяток |
| 10 | HundredChart | клітинка 56: normal, під листочком, highlighted, selected, correct, retry; 4 кольори розфарбування; збільшення по рядках (планшет 10×64, телефон 2×5) |
| 11 | BlockCube · Rod · Plate · StickBundle · PlaceValueMat | кубик 28+8; стовпчик forming/complete/idle; плита 10×10; палички: розсип/пучок/коробка відкрита/закрита; мат: empty, filled, target, counted |
| 12 | Przedmioty W1–W3 i zwierzątka | 12 предметів + 8 тваринок × idle/happy; відмінки в голосі |
| 13 | Drużyna | Łatka, Pufka, Tofik, Iskra × idle/happy/pointing, транспорт, силуети без кольору, W6 уся команда, репліки гостей |
| 14, 15, 16 | Ścieżka świata: W1 (12), W3 (15), W4 (12 + ★-гілка з 4) | вузли, стежка (пісок/камінь), скриня, чип світу вгорі, «Mapa» 72, Kubik біля наступного вузла |
| 17, 18 | Wprowadzenie / «nowa idea» | W1: MissionCard + гість Łatka + Kubik + PlayButton 120; W3: compact-картка з новою ідеєю |

## 5. Компоненти з BRIEF §8 → де
- **Етап 1**: PlayButton, IconButton, CheckButton → 06 · AnswerTile, DigitCard → 07 · HUD, ProgressBones, SpeechBubble, Overlay → 08 · WorldIsland, LevelNode → 09 · AvatarButton, PupPicker, Toggle, Slider → 10.
- **Етап 2**: MascotStage, HintButton, MissionCard, TreasureChest → 06 · CountableObject, DropZone, DotCard → 07 · TenFrame (+подвійна) BeadRack20 → 08 · NumberLine, JumpArc → 09 · HundredChart → 10 · BlockCube, BlockRod, BlockPlate, StickBundle, PlaceValueMat → 11.
- **Ще не намальовано** (Етапи 3–6): Basket, BusFrame (скін TenFrame), Confetti, TrainWagon, NumberHouse, StoryPanel, StickerSlot, Subtitle, ParentGate, HoldToConfirm (є ескіз шестерні, etap1/06), NumericKeypad, ConfirmDialog.

## 6. SVG (`extracted/svg/<група>/`)
| Група | Файли | viewBox |
|---|---|---|
| `kubik/` (27) | `kubik-{idle, talking-a/o/e, pointing-left/right/down, demonstrating, thinking, happy, celebrating, encouraging, waving, surprised, with-card, on-kart, sleepy, break-jump/clap/stomp}`; `acc-w1…w7` (W1 капелюшок, W2 пов'язка з паростком, W3 окуляри, W4 каска, W5 бінокль, W6 кепка, W7 шолом) | `0 -30 200 250` |
| `team/` (21) | `team-{latka,pufka,tofik,iskra}-{idle,happy,pointing}`; `veh-{balon,zaglowka,pociag,rakieta}`; `sil-*` ×5 | 200×250; veh — власні |
| `pups/` (8) | `pup-{pon,nowofundland,pudel,chart,papillon,shihtzu,sharpei,akita}` (порядок у пікері саме такий) | 160×160 |
| `animals/` (16) | `animal-{mis,jezyk,kotek,lisek,zajaczek,zabka,sowa,myszka}` + `-happy` | 120×136 |
| `items/` (12) | `w1-{biedronka,motyl,kwiatek,kaczuszka}`, `w2-{jablko,gruszka,truskawka,marchewka}`, `w3-{rybka,muszelka,rozgwiazda,lodka}` | 96×96 |
| `hands/` (6) | `hand-0…5` (6–10 = дві руки) | 100×124 |
| `world/` (31) | `island-w1…w7`, `island-hub`, `island-locked`, `base-druzyna` (208×228); `node-{locked,star}`, `node-w1-*`, `node-w3-*` (open/next/done/review), `node-w4-{next,done}` (104×112); `chest-{locked,ready,open}`; `deco-*` (декор сцен) | різні |
| `icons/` (25) | `icon-{play,home,speaker,speaker-off,bulb,next,retry,check,equal,pour,pack,close,stickers,lock,gear,star,bone}`, `icon-w1…w7`, `icon-hub`; `currentColor` | 48×48 |
| `digits/` (10) | `digit-0…9`; `stroke=currentColor` | 100×140 |
| `logo/` (3) | `klockowo`, `klockowo-mono`, `klockowo-k` | різні |
- Пози Kubika — окремі файли; рот `talking` = перемикання A/O/E (8–10 разів/с), не морфінг. Шари: `#kubik › #tail, #legs, #body, #headwrap › (#head, #eyes, #mouth, #ears, #accessory), #paw-l, #paw-r`; лапи крутяться навколо (50,134)/(150,134), голова — (100,120). Команда: pointing дивиться вправо, вліво — `scaleX(-1)`.
- **Inline у бордах, окремо не винесені** (брати з шаблону етапу, переписувати як параметричні React-компоненти): DotCard, TenFrame, BeadRack20, NumberLine, JumpArc, HundredChart, BlockCube/Rod/Plate, StickBundle, PlaceValueMat, значки станів, кісточка, екран Ładowanie, мапа-стежка.
- Вузли/острови намальовані лише для W1, W3, W4 — решту світів перефарбувати параметром (верх = `--kl-wN-500`), краще одним компонентом.

## 7. Розбіжності й застереження
1. **Twój piesek (etap1/16)**: картки цуценят в експорті порожні (`/_blob/…`) — беремо `svg/pups/`; фони карток = пастелі `--kl-w1,w3,—,w2,w6,w4,w7,w5-50`, 3-тя (Pudel) має `#FFFFFF`, а не пастель — уточнити.
2. **Репліки, яких нема в BRIEF** (дизайн позначив `[do sprawdzenia]`: 6 описів цуценят, W4 ★ «Osiem i dwa…», «Jaka liczba się schowała?», місія W3): **перевірено 2026-09-30, затверджені тексти — `POLISH_COPY` §9** (брати звідти, не з бордів). Єдина правка: Pudel → «Piesek w loczkach!» (у дизайні «Kręcony piesek!»). У BRIEF є лише «Kudłaty piesek!», «Czarny piesek!» і «Kaczuszki się zgubiły!…».
3. Дизайн містить понад сотню польських `aria-label`/alt, яких нема в BRIEF (напр. «Poziom zablokowany», «Zadanie dodatkowe», «Tablica stu», «kosteczki: 2 z 6», «Strefa rodzica — przytrzymaj 3 sekundy») — брати з бордів за потреби й класти в `lines.ts`.
4. **Музика**: повзунок «Muzyka» (BRIEF §6.15, дизайн) залишаємо — музика буде синтезована через Web Audio, без файлів (PLAN M2b). Не сподобається на прослуховуванні — сховати повзунок прапором `MUSIC_ENABLED`.
5. `POLISH_COPY` §8: список давальних виправлено під 8 тваринок BRIEF §10 (дизайн збігається з BRIEF).
6. Не копіювати в `src/` артефакти інструмента: `<x-dc>`, `<helmet>`, `DCLogic`, `sc-camel-view-box` (= `viewBox`), `<html lang="uk">`, українські анотації в бордах.
7. Kubik у грі ~184 px заввишки (BRIEF: 160–200) — узгоджено. Усі інші числа (панель 104, плитки 120/gap 24, кнопки 72/80, радіуси, easing) збігаються з BRIEF §7–8, §11.

## 8. Чого бракує (Етапи 3–6 дизайну ще не експортовано)
- Екрани BRIEF §6: Koniec poziomu, Świat ukończony, Album z naklejkami + «Odznaki», Czas na przerwę!, Koniec na dziś, Plac Zabaw, Bramka rodzica, Strefa rodzica, службові стани — є лише пози Kubika, скриня й Toggle/Slider. До їх появи M20–M22 спираються на BRIEF §6 і наявні компоненти.
- 14 ігор у станах (завдання/підказка/правильно/спробуй ще/показ разом): є лише зразок «Policz i dotknij» у шаблоні etap2/00 (+ TenFrame, стрибки, рахівниця, таблиця 100 як компоненти).
- Предмети W4–W7 (16): auto, rower, balonik, jajko · jagoda, szyszka, grzybek, patyczek · parasolka, tramwaj, piłka, lizak · gwiazdka, planeta, rakieta, kometa.
- Ścieżka лише для W1, W3, W4★; Wprowadzenie лише для W1 і W3; W7 ★-гілка, W2/W5/W6/W7 — за зразком і кількістю вузлів із BRIEF §5.
- Миска Kubika (Koniec poziomu), кадр «solved» MissionCard, сторінки альбому, наліпки — не намальовані.
