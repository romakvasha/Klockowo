// W4 «Most Dwudziestki» (11–20): 12 основних рівнів + ★-гілка з 4 рівнів «через десяток» (PLAN M16), по 6 завдань. Прогресія за PEDAGOGY §1–§2: «-naście» = десять + n
// (лічба блоками «десять і ще n», подвійна рамка-десятка) → лічба з будь-якого числа (вагони, жабка 0–20) → двоповерховий автобус на 20 → «Domek liczb» до 20 →
// додавання без переходу через десяток (13 + 4) → підсумок. ★: 8 + 5 — добити до десяти, решту докласти. У кожному рівні 2 з 6 завдань — повторення (W3 і раніше в W4).
import { levelId } from '../worlds';
import type {
  AnswerStyle, BusTask, CompareTask, CountTask, HouseTask, JumpTask, Level, MatchTask, SkillId, StoryTask, SumTask, TaskSpec, TenTask, TrainTask,
} from '../types';

const answers: AnswerStyle = 'digit';

const teens = (range: readonly [number, number], arrangement: CountTask['arrangement'] = 'tens'): CountTask => ({
  game: 'policzIDotknij', skill: 'teens', count: range, arrangement, look: 'distinct', answers,
});
const match = (pairs: number, set: MatchTask['set'] = 'tenFrame', numbers: readonly [number, number] = [11, 20]): MatchTask => ({
  game: 'cyfraIObrazek', skill: 'teens', pairs, numbers, set,
});
const train = (over: Partial<TrainTask> = {}): TrainTask => ({
  game: 'zgubionyWagonik', skill: 'count-from-any', range: [11, 20], length: 5, gap: 'end', step: 1, answers, ...over,
});
const jump = (over: Partial<JumpTask> = {}): JumpTask => ({
  game: 'skokiZabki', skill: 'count-from-any', max: 20, start: [10, 16], jumps: [1, 3], pads: 'numbered', tapJumps: true, answers, ...over,
});
const bus = (over: Partial<BusTask> = {}): BusTask => ({
  game: 'autobusDziesiatka', skill: 'bonds-5-10', count: [11, 19], ask: 'full', exposureMs: 0, answers, floors: 2, ...over,
});
const house = (over: Partial<HouseTask> = {}): HouseTask => ({
  game: 'domekLiczb', skill: 'teens', whole: [11, 15], missing: 'right', show: 'pictures', answers, ...over,
});
const sum = (over: Partial<SumTask> = {}): SumTask => ({
  game: 'ileRazem', skill: 'add-no-bridge-20', sum: [12, 16], lid: false, order: 'bigFirst', doubles: false, symbols: false, noBridge: true, answers, ...over,
});
const story = (over: Partial<StoryTask> = {}): StoryTask => ({
  game: 'historyjki', skill: 'add-no-bridge-20', sum: [12, 18], kind: 'join', noBridge: true, answers, ...over,
});
const ten = (over: Partial<TenTask> = {}): TenTask => ({
  game: 'zrobDziesiatke', skill: 'bridge-ten', known: [8, 9], show: 'frame', bridge: true, add: [3, 5], ...over,
});

// повторення (W3 і раніше вивчене в W4)
const w3sum = (): SumTask => ({ game: 'ileRazem', skill: 'add-combine', sum: [4, 10], lid: false, order: 'any', doubles: false, symbols: false, answers });
const w3house = (): HouseTask => ({ game: 'domekLiczb', skill: 'bonds-5-10', whole: [6, 10], missing: 'any', show: 'digits', answers });
const w3story = (): StoryTask => ({ game: 'historyjki', skill: 'add-combine', sum: [4, 9], kind: 'mixed', answers });
const w3jump = (): JumpTask => ({ game: 'skokiZabki', skill: 'count-on', max: 10, start: [0, 6], jumps: [2, 4], pads: 'numbered', tapJumps: true, answers });
const w3ten = (): TenTask => ({ game: 'zrobDziesiatke', skill: 'bonds-5-10', known: [2, 9], show: 'digit' });
const w2compare = (): CompareTask => ({ game: 'ktoMaWiecej', skill: 'compare-10', count: [0, 10], diff: [1, 4], equal: 0.2, ask: 'mixed', show: 'digits' });
const w2match = (): MatchTask => ({ game: 'cyfraIObrazek', skill: 'digit-quantity', pairs: 3, numbers: [0, 10], set: 'mixed' });

const again = (task: TaskSpec): TaskSpec => ({ ...task, review: true });
const times = (n: number, task: TaskSpec): TaskSpec[] => Array.from({ length: n }, () => task);

interface Draft {
  newIdea: boolean;
  skills: readonly SkillId[];
  tasks: readonly TaskSpec[];
}

const MAIN: readonly Draft[] = [
  // 1. «Десять і ще n»: перша десятка блоком, решта поруч (13 = 10 + 3); числа 11–14
  { newIdea: true, skills: ['teens'], tasks: [...times(4, teens([11, 14])), again(w3sum()), again(w3house())] },
  // 2. Те саме до 17; одне завдання в рядок (без блоків) — щоб лічити «через десять»
  {
    newIdea: false, skills: ['teens'],
    tasks: [teens([12, 17]), teens([12, 17]), teens([13, 17]), teens([12, 16], 'line'), again(w3story()), again(w3jump())],
  },
  // 3. «Cyfra i obrazek» з подвійною рамкою-десяткою (11–20): повна рамка й ще n
  { newIdea: true, skills: ['teens'], tasks: [...times(4, match(2)), again(w3ten()), again(w2compare())] },
  // 4. Числа до 20: блоки, пари з рамками, змішаний показ
  {
    newIdea: false, skills: ['teens'],
    tasks: [teens([13, 20]), teens([13, 20]), match(3), match(3, 'mixed'), again(w3house()), again(w2match())],
  },
  // 5. Лічба з будь-якого числа: «Zgubiony wagonik» 11–20, бракує останнього вагона
  { newIdea: true, skills: ['count-from-any'], tasks: [...times(4, train()), again(teens([11, 17])), again(w3sum())] },
  // 6. Вагони з прогалиною посередині й на початку; «Skoki żabki» на прямій 0–20 (стартуємо з «-nastu»)
  {
    newIdea: false, skills: ['count-from-any'],
    tasks: [
      train({ gap: 'middle', length: 6 }), train({ gap: 'start' }), train({ gap: 'any', length: 6 }), jump(),
      again(w2compare()), again(match(3)),
    ],
  },
  // 7. Двоповерховий автобус на 20: скільки їде, скільки вільних
  {
    newIdea: true, skills: ['bonds-5-10', 'teens'],
    tasks: [bus(), bus(), bus({ ask: 'empty' }), bus({ ask: 'empty' }), again(teens([13, 20])), again(w3ten())],
  },
  // 8. «Domek liczb» до 20: предмети під будиночком, потім лише цифри
  {
    newIdea: false, skills: ['teens'],
    tasks: [
      house({ whole: [11, 15] }), house({ whole: [12, 17], missing: 'any' }),
      house({ whole: [14, 20], missing: 'any', show: 'digits' }), house({ whole: [14, 20], missing: 'any', show: 'digits' }),
      again(bus({ ask: 'mixed' })), again(train({ skill: 'count-from-any' })),
    ],
  },
  // 9. Додавання без переходу: 13 + 4 (перший доданок «-nastu», кошики); суми 12–16
  { newIdea: true, skills: ['add-no-bridge-20'], tasks: [...times(4, sum()), again(house({ whole: [12, 17], missing: 'any' })), again(w3sum())] },
  // 10. Суми до 20; кришка на першому кошику (лічба від «-nastu»)
  {
    newIdea: false, skills: ['add-no-bridge-20'],
    tasks: [
      sum({ sum: [12, 20] }), sum({ sum: [12, 20] }), sum({ sum: [14, 19], lid: true }), sum({ sum: [14, 19], lid: true }),
      again(bus({ ask: 'empty' })), again(w3story()),
    ],
  },
  // 11. «Historyjki» з «-nastu»; «Skoki żabki» від -nastu; один приклад із кошиками
  {
    newIdea: false, skills: ['add-no-bridge-20', 'count-from-any'],
    tasks: [
      story(), story({ sum: [13, 19] }), jump({ skill: 'count-from-any', jumps: [2, 4] }), sum({ sum: [13, 20] }),
      again(teens([13, 20])), again(w3ten()),
    ],
  },
  // 12. Підсумок світу (скриня): суми, історія, склад до 20, лічба з будь-якого числа — перевірка майстерності W4
  {
    newIdea: false, skills: ['add-no-bridge-20', 'teens', 'count-from-any'],
    tasks: [
      sum({ sum: [13, 20] }), story({ sum: [13, 20], kind: 'mixed' }), house({ whole: [14, 20], missing: 'any', show: 'digits' }),
      train({ gap: 'any', length: 6 }), again(bus({ ask: 'mixed' })), again(teens([13, 20])),
    ],
  },
];

/** ★-гілка «через десяток» (8 + 5 = 8 + 2 + 3): відкривається після 6-го основного рівня (worlds.ts), на проходження основного шляху не впливає. */
const STAR: readonly Draft[] = [
  // ★1. 8 + 5, 9 + 4: спершу добити першу рамку до десяти («Osiem i dwa to dziesięć»), решту докласти в другу
  { newIdea: true, skills: ['bridge-ten'], tasks: [...times(4, ten()), again(w3ten()), again(sum())] },
  // ★2. Відомих 7–9, докласти 4–7
  { newIdea: false, skills: ['bridge-ten'], tasks: [...times(4, ten({ known: [7, 9], add: [4, 7] })), again(w3house()), again(sum({ sum: [14, 19] }))] },
  // ★3. Відомих 6–9, докласти 3–9; один приклад із кошиками (без обмеження «-nastu»)
  {
    newIdea: false, skills: ['bridge-ten'],
    tasks: [
      ten({ known: [6, 9], add: [3, 9] }), ten({ known: [6, 9], add: [3, 9] }), ten({ known: [6, 9], add: [3, 9] }),
      sum({ skill: 'bridge-ten', sum: [11, 15], noBridge: false, order: 'any' }), again(w3story()), again(bus({ ask: 'empty' })),
    ],
  },
  // ★4. Змішане: через десяток у рамці, кошиках і в історії
  {
    newIdea: false, skills: ['bridge-ten'],
    tasks: [
      ten({ known: [6, 9], add: [3, 9] }), ten({ known: [6, 9], add: [3, 9] }),
      sum({ skill: 'bridge-ten', sum: [11, 18], noBridge: false, order: 'any' }), story({ skill: 'bridge-ten', sum: [11, 18], noBridge: false, kind: 'mixed' }),
      again(sum({ sum: [14, 19], lid: true })), again(w3ten()),
    ],
  },
];

export const W4_LEVELS: readonly Level[] = [
  ...MAIN.map((d, i): Level => ({ id: levelId('w4', i + 1), world: 'w4', index: i + 1, kind: 'main', draft: false, ...d })),
  ...STAR.map((d, i): Level => ({ id: levelId('w4', i + 1, 'star'), world: 'w4', index: i + 1, kind: 'star', draft: false, ...d })),
];
