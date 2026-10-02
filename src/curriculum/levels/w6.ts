// W6 «Miasto Setki» (1–100): 12 рівнів по 6 завдань (PLAN M18). Прогресія за PEDAGOGY §1–§2: знайти число на таблиці 100 (лічба з будь-якого числа) → сусіди ±1 → сусіди ±10
// («на 10 більше» — клітинка під цим числом) → закономірності (розфарбувати числа з цифрою на кінці, що під листочком) → порівняння двоцифрових → змішане → підсумок.
// У кожному рівні 2 з 6 завдань — повторення (W5 і раніше). Предмети W6 (parasolka, tramwaj, piłka, lizak) у цих іграх не потрібні: числа — на таблиці й на матах розрядів.
import { levelId } from '../worlds';
import type {
  AnswerStyle, ChartMode, ChartTask, CompareTask, HouseTask, Level, PackMode, PackTask, Range, SkillId, SumTask, TaskSpec, TrainTask,
} from '../types';

const answers: AnswerStyle = 'digit';

const chart = (mode: ChartMode, range: Range, over: Partial<ChartTask> = {}): ChartTask => ({
  game: 'tajemniczaTablica',
  skill: mode === 'find' ? 'count-on-100' : mode === 'neighbors' ? 'neighbors' : 'chart-patterns',
  mode, range, leaves: 0, step: 'one', direction: 'more', answers, ...over,
});
const compare = (count: Range, diff: Range, over: Partial<CompareTask> = {}): CompareTask => ({
  game: 'ktoMaWiecej', skill: 'compare-2digit', count, diff, equal: 0, ask: 'mixed', show: 'digits', ...over,
});
const wagon = (over: Partial<TrainTask> = {}): TrainTask => ({
  game: 'zgubionyWagonik', skill: 'count-on-100', range: [1, 100], length: 5, gap: 'end', step: 1, answers, ...over,
});

// повторення (W5 і раніше)
const tens = (): TrainTask => ({ game: 'zgubionyWagonik', skill: 'count-by-tens', range: [10, 100], length: 6, gap: 'any', step: 10, answers });
const pack = (mode: PackMode, total: Range, over: Partial<PackTask> = {}): PackTask => ({
  game: 'paczkiPoDziesiec', skill: mode === 'build' ? 'compose-2digit' : 'bundle-ten', total, mode, contrast: false, answers, ...over,
});
const w4sum = (): SumTask => ({
  game: 'ileRazem', skill: 'add-no-bridge-20', sum: [12, 18], lid: false, order: 'bigFirst', doubles: false, symbols: false, noBridge: true, answers,
});
const w4house = (): HouseTask => ({ game: 'domekLiczb', skill: 'teens', whole: [11, 20], missing: 'any', show: 'digits', answers });

const again = (task: TaskSpec): TaskSpec => ({ ...task, review: true });
const times = (n: number, task: TaskSpec): TaskSpec[] => Array.from({ length: n }, () => task);

interface Draft {
  newIdea: boolean;
  skills: readonly SkillId[];
  tasks: readonly TaskSpec[];
}

const DRAFTS: readonly Draft[] = [
  // 1. Знайти число на таблиці (мініатюра + лупа-рядок): числа 1–30
  { newIdea: true, skills: ['count-on-100'], tasks: [...times(4, chart('find', [1, 30])), again(pack('packed', [21, 59])), again(tens())] },
  // 2. Лічба з будь-якого числа: вагони 1–100 і таблиця до 60
  {
    newIdea: false, skills: ['count-on-100'],
    tasks: [wagon(), wagon({ gap: 'middle', length: 6 }), chart('find', [1, 60]), chart('find', [1, 60]), again(pack('build', [20, 59])), again(w4house())],
  },
  // 3. Сусіди: «Która liczba jest o jeden większa?», 2–30
  { newIdea: true, skills: ['neighbors'], tasks: [...times(4, chart('neighbors', [2, 30])), again(chart('find', [1, 60])), again(pack('packed', [21, 59]))] },
  // 4. Сусіди «на 1» більші й менші, до 60
  {
    newIdea: false, skills: ['neighbors'],
    tasks: [...times(4, chart('neighbors', [2, 60], { direction: 'mixed' })), again(wagon()), again(tens())],
  },
  // 5. «На 10 більше» — клітинка під цим числом (лупа переходить на наступний рядок)
  {
    newIdea: true, skills: ['neighbors'],
    tasks: [...times(4, chart('neighbors', [1, 60], { step: 'ten' })), again(chart('neighbors', [2, 60], { direction: 'mixed' })), again(pack('build', [30, 89]))],
  },
  // 6. Сусіди ±10 і ±1 до 100, більше й менше
  {
    newIdea: false, skills: ['neighbors'],
    tasks: [
      chart('neighbors', [11, 100], { step: 'ten', direction: 'mixed' }), chart('neighbors', [11, 100], { step: 'ten', direction: 'mixed' }),
      chart('neighbors', [2, 100], { step: 'mixed', direction: 'mixed' }), chart('neighbors', [2, 100], { step: 'mixed', direction: 'mixed' }),
      again(wagon({ gap: 'any', length: 6 })), again(tens()),
    ],
  },
  // 7. Закономірності: розфарбувати числа з цифрою на кінці («Pomaluj liczby z piątką na końcu.»), до 50; одне «що під листочком»
  {
    newIdea: true, skills: ['chart-patterns'],
    tasks: [...times(3, chart('paint', [1, 50])), chart('hidden', [1, 50]), again(chart('neighbors', [1, 60], { step: 'ten' })), again(pack('packed', [21, 99]))],
  },
  // 8. «Co kryje się pod listkiem?» до 100, з листочками-пастками; розфарбування до 100
  {
    newIdea: false, skills: ['chart-patterns'],
    tasks: [
      chart('hidden', [1, 100], { leaves: 1 }), chart('hidden', [1, 100], { leaves: 2 }), chart('paint', [1, 100]), chart('paint', [1, 100]),
      again(chart('neighbors', [2, 100], { step: 'mixed', direction: 'mixed' })), again(wagon({ gap: 'any', length: 6 })),
    ],
  },
  // 9. Порівняння двоцифрових (мат розрядів: спершу десятки): десятки відрізняються
  {
    newIdea: true, skills: ['compare-2digit'],
    tasks: [...times(4, compare([21, 69], [10, 30])), again(chart('hidden', [1, 100])), again(pack('packed', [21, 99], { contrast: true }))],
  },
  // 10. Близькі числа: 34 і 43; «Tyle samo» також буває
  {
    newIdea: false, skills: ['compare-2digit'],
    tasks: [
      compare([21, 99], [1, 12]), compare([21, 99], [1, 12]), compare([21, 99], [1, 12], { equal: 0.2 }), compare([21, 99], [1, 12], { equal: 0.2 }),
      again(chart('paint', [1, 100])), again(chart('neighbors', [11, 100], { step: 'ten', direction: 'mixed' })),
    ],
  },
  // 11. Змішане: знайти з листочками, сусіди, порівняння, вагони
  {
    newIdea: false, skills: ['count-on-100', 'neighbors', 'compare-2digit'],
    tasks: [
      chart('find', [1, 100], { leaves: 3 }), chart('neighbors', [2, 100], { step: 'mixed', direction: 'mixed' }), compare([21, 99], [1, 15], { equal: 0.15 }),
      wagon({ gap: 'any', length: 7 }), again(chart('hidden', [1, 100], { leaves: 2 })), again(pack('build', [21, 99])),
    ],
  },
  // 12. Підсумок світу (скриня): таблиця, сусіди, закономірності, порівняння — перевірка майстерності W6
  {
    newIdea: false, skills: ['count-on-100', 'neighbors', 'chart-patterns', 'compare-2digit'],
    tasks: [
      chart('find', [1, 100], { leaves: 2 }), chart('neighbors', [11, 100], { step: 'ten', direction: 'mixed' }), chart('hidden', [1, 100], { leaves: 1 }),
      compare([21, 99], [1, 15], { equal: 0.15 }), again(w4sum()), again(pack('build', [30, 99])),
    ],
  },
];

export const W6_LEVELS: readonly Level[] = DRAFTS.map(
  (d, i): Level => ({ id: levelId('w6', i + 1), world: 'w6', index: i + 1, kind: 'main', draft: false, ...d }),
);
