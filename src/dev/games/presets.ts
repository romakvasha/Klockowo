// Пресети dev-вітрини /#/dev/games: готові TaskSpec для ігор (службові підписи українською — для власника).
// Кожен пресет — один вигаданий рівень із 6 однакових завдань; ще не реалізованих ігор тут нема.
import type { TaskSpec, WorldKey } from '../../curriculum/types';

export interface GamePreset {
  id: string;
  title: string;
  world: WorldKey;
  spec: TaskSpec;
}

const train = (over: Partial<Extract<TaskSpec, { game: 'zgubionyWagonik' }>> = {}): TaskSpec => ({
  game: 'zgubionyWagonik', skill: 'order-around', range: [1, 10], length: 5, gap: 'any', step: 1, answers: 'digit', ...over,
});
const match = (over: Partial<Extract<TaskSpec, { game: 'cyfraIObrazek' }>> = {}): TaskSpec => ({
  game: 'cyfraIObrazek', skill: 'digit-quantity', pairs: 3, numbers: [1, 5], set: 'objects', ...over,
});

const compare = (over: Partial<Extract<TaskSpec, { game: 'ktoMaWiecej' }>> = {}): TaskSpec => ({
  game: 'ktoMaWiecej', skill: 'compare-10', count: [1, 6], diff: [3, 5], ask: 'more', show: 'objects', ...over,
});
const bus = (over: Partial<Extract<TaskSpec, { game: 'autobusDziesiatka' }>> = {}): TaskSpec => ({
  game: 'autobusDziesiatka', skill: 'bonds-5-10', count: [1, 9], ask: 'full', exposureMs: 0, answers: 'digit', ...over,
});

const house = (over: Partial<Extract<TaskSpec, { game: 'domekLiczb' }>> = {}): TaskSpec => ({
  game: 'domekLiczb', skill: 'bonds-5-10', whole: [5, 10], missing: 'any', show: 'digits', answers: 'digit', ...over,
});
const sum = (over: Partial<Extract<TaskSpec, { game: 'ileRazem' }>> = {}): TaskSpec => ({
  game: 'ileRazem', skill: 'add-combine', sum: [3, 8], lid: false, order: 'any', doubles: false, symbols: false, answers: 'digit', ...over,
});

const jump = (over: Partial<Extract<TaskSpec, { game: 'skokiZabki' }>> = {}): TaskSpec => ({
  game: 'skokiZabki', skill: 'count-on', max: 10, start: [0, 7], jumps: [1, 3], pads: 'numbered', tapJumps: true, answers: 'digit', ...over,
});
const ten = (over: Partial<Extract<TaskSpec, { game: 'zrobDziesiatke' }>> = {}): TaskSpec => ({
  game: 'zrobDziesiatke', skill: 'bonds-5-10', known: [4, 9], show: 'frame', ...over,
});

const story = (over: Partial<Extract<TaskSpec, { game: 'historyjki' }>> = {}): TaskSpec => ({
  game: 'historyjki', skill: 'add-combine', sum: [3, 6], kind: 'join', answers: 'digit', ...over,
});

const pack = (over: Partial<Extract<TaskSpec, { game: 'paczkiPoDziesiec' }>> = {}): TaskSpec => ({
  game: 'paczkiPoDziesiec', skill: 'bundle-ten', total: [21, 49], mode: 'loose', contrast: false, answers: 'digit', ...over,
});

export const PRESETS: readonly GamePreset[] = [
  { id: 'wagon-end', title: 'Wagonik: бракує останнього, 1–10, 5 вагонів', world: 'w2', spec: train({ gap: 'end' }) },
  { id: 'wagon-mid', title: 'Wagonik: бракує посередині, 1–10, 6 вагонів', world: 'w2', spec: train({ gap: 'middle', length: 6 }) },
  { id: 'wagon-start', title: 'Wagonik: бракує першого, 0–10', world: 'w2', spec: train({ gap: 'start', range: [0, 10] }) },
  { id: 'wagon-long', title: 'Wagonik: 7 вагонів, 1–20 (W4)', world: 'w4', spec: train({ range: [1, 20], length: 7 }) },
  { id: 'wagon-tens', title: 'Wagonik: десятки, 10–100, 6 вагонів (W5)', world: 'w5', spec: train({ range: [10, 100], length: 6, step: 10 }) },
  { id: 'wagon-back', title: 'Wagonik ★: лічба назад, 1–20', world: 'w4', spec: train({ range: [1, 20], length: 6, gap: 'middle', backwards: true }) },
  { id: 'wagon-hundred', title: 'Wagonik: 7 вагонів, 1–100 (W6)', world: 'w6', spec: train({ range: [1, 100], length: 7 }) },
  { id: 'match-2', title: 'Cyfra: 2 пари, предмети, 1–5', world: 'w2', spec: match({ pairs: 2 }) },
  { id: 'match-3', title: 'Cyfra: 3 пари, предмети, 1–5', world: 'w2', spec: match() },
  { id: 'match-zero', title: 'Cyfra: 3 пари з нулем, 0–5, змішані', world: 'w2', spec: match({ skill: 'zero', numbers: [0, 5], set: 'mixed' }) },
  { id: 'match-4', title: 'Cyfra: 4 пари, змішані, 0–10', world: 'w2', spec: match({ pairs: 4, numbers: [0, 10], set: 'mixed' }) },
  { id: 'match-dots', title: 'Cyfra: 3 пари, крапки, 1–6', world: 'w2', spec: match({ numbers: [1, 6], set: 'dots' }) },
  { id: 'match-fingers', title: 'Cyfra: 3 пари, пальці, 0–10', world: 'w2', spec: match({ numbers: [0, 10], set: 'fingers' }) },
  { id: 'match-frame', title: 'Cyfra: 3 пари, рамка-десятка, 1–10', world: 'w2', spec: match({ numbers: [1, 10], set: 'tenFrame' }) },
  { id: 'kto-more', title: 'Kto ma więcej?: «więcej», різниця 3–5, без «Tyle samo»', world: 'w2', spec: compare() },
  { id: 'kto-mixed', title: 'Kto ma więcej?: «więcej»/«mniej», різниця 2–4', world: 'w2', spec: compare({ count: [1, 8], diff: [2, 4], ask: 'mixed' }) },
  { id: 'kto-same', title: 'Kto ma więcej?: з «Tyle samo» і нулем, різниця 1–3', world: 'w2', spec: compare({ count: [0, 8], diff: [1, 3], equal: 0.4, ask: 'mixed' }) },
  { id: 'kto-digits', title: 'Kto ma więcej?: цифри замість купок, 0–10', world: 'w2', spec: compare({ count: [0, 10], diff: [1, 4], equal: 0.3, ask: 'mixed', show: 'digits' }) },
  { id: 'kto-trick', title: 'Kto ma więcej?: підступ (більші предмети — менша купка)', world: 'w2', spec: compare({ count: [1, 8], diff: [1, 3], equal: 0.2, ask: 'mixed', show: 'sizeTrick' }) },
  { id: 'bus-full', title: 'Autobus: скільки їде, 1–9', world: 'w2', spec: bus() },
  { id: 'bus-free', title: 'Autobus: скільки вільних, 0–10', world: 'w2', spec: bus({ count: [0, 10], ask: 'empty' }) },
  { id: 'bus-small', title: 'Autobus: їде менше за п’ять (лічба тваринок)', world: 'w2', spec: bus({ count: [1, 4], ask: 'mixed' }) },
  { id: 'bus-flash', title: 'Autobus: миготіння 2,5 с, цифра з крапками', world: 'w2', spec: bus({ ask: 'mixed', exposureMs: 2500, answers: 'digitDots' }) },
  { id: 'house-5', title: 'Domek liczb: ціле 3–5, предмети під будиночком', world: 'w3', spec: house({ whole: [3, 5], show: 'pictures', missing: 'right' }) },
  { id: 'house-10', title: 'Domek liczb: ціле 5–10, лише цифри', world: 'w3', spec: house() },
  { id: 'house-left', title: 'Domek liczb: ціле 6–10, порожнє віконце ліворуч', world: 'w3', spec: house({ whole: [6, 10], missing: 'left' }) },
  { id: 'house-20', title: 'Domek liczb: ціле 11–20, дві рамки (W4)', world: 'w4', spec: house({ skill: 'teens', whole: [11, 20] }) },
  { id: 'sum-5', title: 'Ile razem?: сума 3–5, предмети, «Wsyp!»', world: 'w3', spec: sum({ sum: [3, 5], order: 'bigFirst' }) },
  { id: 'sum-10', title: 'Ile razem?: сума 4–10', world: 'w3', spec: sum({ sum: [4, 10] }) },
  { id: 'sum-lid', title: 'Ile razem?: кришка на першому кошику (лічба від числа)', world: 'w3', spec: sum({ skill: 'count-on', sum: [5, 10], lid: true, order: 'bigFirst' }) },
  { id: 'sum-doubles', title: 'Ile razem?: подвоєння 2–10', world: 'w3', spec: sum({ skill: 'doubles', sum: [2, 10], doubles: true }) },
  { id: 'sum-symbols', title: 'Ile razem?: лише символи «3 + 2 = ?»', world: 'w3', spec: sum({ skill: 'plus-equals', symbols: true }) },
  { id: 'sum-20', title: 'Ile razem?: сума 11–20, без переходу (W4)', world: 'w4', spec: sum({ skill: 'add-no-bridge-20', sum: [11, 20], order: 'bigFirst' }) },
  { id: 'jump-easy', title: 'Skoki żabki: 0–10, 1–3 стрибки, жабка стрибає від дотику', world: 'w3', spec: jump() },
  { id: 'jump-5', title: 'Skoki żabki: 0–10, до 5 стрибків', world: 'w3', spec: jump({ jumps: [2, 5], start: [0, 8] }) },
  { id: 'jump-mental', title: 'Skoki żabki: «в думці» (стрибки лише як підказка)', world: 'w3', spec: jump({ jumps: [2, 4], tapJumps: false }) },
  { id: 'jump-landmarks', title: 'Skoki żabki: цифри лише на віхах 0, 5, 10', world: 'w3', spec: jump({ jumps: [2, 4], pads: 'landmarks' }) },
  { id: 'jump-20', title: 'Skoki żabki: 0–20, два ряди листків (W4)', world: 'w4', spec: jump({ max: 20, start: [0, 14], jumps: [2, 6], skill: 'count-from-any' }) },
  { id: 'ten-frame', title: 'Zrób dziesiątkę: відомі фішки видно, відомих 4–9', world: 'w3', spec: ten() },
  { id: 'ten-easy', title: 'Zrób dziesiątkę: бракує 1–3', world: 'w3', spec: ten({ known: [7, 9] }) },
  { id: 'ten-digit', title: 'Zrób dziesiątkę: рамка порожня, лише цифра', world: 'w3', spec: ten({ known: [2, 9], show: 'digit' }) },
  { id: 'story-join', title: 'Historyjki: «прийшло ще», сума 3–6', world: 'w3', spec: story() },
  { id: 'story-10', title: 'Historyjki: «прийшло ще», сума 4–10', world: 'w3', spec: story({ sum: [4, 10] }) },
  { id: 'story-combine', title: 'Historyjki: два набори на картинці, сума 3–8', world: 'w3', spec: story({ sum: [3, 8], kind: 'combine' }) },
  { id: 'story-mixed', title: 'Historyjki: навмання, сума 4–10', world: 'w3', spec: story({ sum: [4, 10], kind: 'mixed' }) },
  { id: 'story-20', title: 'Historyjki: сума 11–20 (W4, рамка з двох десяток)', world: 'w4', spec: story({ sum: [11, 20], skill: 'add-no-bridge-20' }) },
  { id: 'teens-tens', title: 'Policz i dotknij: «десять і ще n», 11–17 (W4)', world: 'w4', spec: { game: 'policzIDotknij', skill: 'teens', count: [11, 17], arrangement: 'tens', look: 'distinct', answers: 'digit' } },
  { id: 'teens-20', title: 'Policz i dotknij: «десять і ще n», 13–20 (W4)', world: 'w4', spec: { game: 'policzIDotknij', skill: 'teens', count: [13, 20], arrangement: 'tens', look: 'distinct', answers: 'digit' } },
  { id: 'match-frame-20', title: 'Cyfra: подвійні рамки-десятки 11–20 (W4)', world: 'w4', spec: match({ pairs: 3, numbers: [11, 20], set: 'tenFrame' }) },
  { id: 'bus-20', title: 'Autobus: двоповерховий, скільки їде 11–19 (W4)', world: 'w4', spec: bus({ count: [11, 19], floors: 2 }) },
  { id: 'bus-20-free', title: 'Autobus: двоповерховий, скільки вільних (W4)', world: 'w4', spec: bus({ count: [11, 19], ask: 'empty', floors: 2 }) },
  { id: 'sum-nobridge', title: 'Ile razem?: 13 + 4, перший доданок «-nastu» (W4)', world: 'w4', spec: sum({ skill: 'add-no-bridge-20', sum: [12, 18], noBridge: true }) },
  { id: 'sum-nobridge-lid', title: 'Ile razem?: 13 + 4 із кришкою на першому кошику (W4)', world: 'w4', spec: sum({ skill: 'add-no-bridge-20', sum: [14, 19], noBridge: true, lid: true }) },
  { id: 'story-nobridge', title: 'Historyjki: 13 + 4 без переходу (W4)', world: 'w4', spec: story({ skill: 'add-no-bridge-20', sum: [12, 19], noBridge: true, kind: 'mixed' }) },
  { id: 'ten-bridge', title: 'Zrób dziesiątkę ★: 8 + 5 через десяток, відомих 8–9 (W4★)', world: 'w4', spec: ten({ skill: 'bridge-ten', bridge: true, known: [8, 9], add: [3, 5] }) },
  { id: 'ten-bridge-wide', title: 'Zrób dziesiątkę ★: через десяток, відомих 6–9, докласти 3–9', world: 'w4', spec: ten({ skill: 'bridge-ten', bridge: true, known: [6, 9], add: [3, 9] }) },
  { id: 'pack-loose', title: 'Paczki: розсипані, «Zapakuj», 11–29 (W5)', world: 'w5', spec: pack({ total: [11, 29] }) },
  { id: 'pack-loose-big', title: 'Paczki: розсипані, 31–59 (W5)', world: 'w5', spec: pack({ total: [31, 59] }) },
  { id: 'pack-packed', title: 'Paczki: уже в коробках, прочитати 21–69 (W5)', world: 'w5', spec: pack({ mode: 'packed', total: [21, 69] }) },
  { id: 'pack-contrast', title: 'Paczki: контраст 26 ↔ 62 (W5)', world: 'w5', spec: pack({ mode: 'packed', total: [21, 69], contrast: true, skill: 'compose-2digit' }) },
  { id: 'pack-build', title: 'Paczki: «Zbuduj liczbę…», +10 / +1, 11–49 (W5)', world: 'w5', spec: pack({ mode: 'build', total: [11, 49], skill: 'compose-2digit' }) },
  { id: 'pack-build-99', title: 'Paczki: «Zbuduj liczbę…» до 99 (W5)', world: 'w5', spec: pack({ mode: 'build', total: [30, 99], skill: 'compose-2digit' }) },
  { id: 'match-teens', title: 'Cyfra: 4 пари, предмети 11–20 (W4)', world: 'w4', spec: match({ pairs: 4, numbers: [11, 20] }) },
];

export const DEFAULT_PRESET = PRESETS[0]!;

export function presetById(id: string | null): GamePreset {
  return PRESETS.find((p) => p.id === id) ?? DEFAULT_PRESET;
}
