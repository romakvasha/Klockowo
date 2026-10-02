// W2 «Ogród Cyfr» (0–10): 12 рівнів по 6 завдань (PLAN M11). Прогресія за PEDAGOGY §1–§2: цифра ↔ кількість → нуль → порівняння → порядок (перед/після) →
// автобус-десятка → «Tyle samo» → цифри замість купок; плитки W2 — лише цифри (крапки лишаються на перших рівнях). У кожному рівні (крім 1-го з повторенням W1)
// ≈ 30 % повторення (2 з 6). Навичка автобуса — 'bonds-5-10' (її світ W3, але гра «Autobus dziesiątka» вчить складу 10 уже тут: рамка-десятка з опорою на 5).
import { levelId } from '../worlds';
import type {
  AnswerStyle, BusTask, CompareTask, CountTask, FeedTask, FlashTask, Level, MatchTask, Range, SetStyle, SkillId, TaskSpec, TrainGap, TrainTask,
} from '../types';

const count = (range: Range, answers: AnswerStyle = 'digit', arrangement: CountTask['arrangement'] = 'scatter'): CountTask => ({
  game: 'policzIDotknij', skill: 'digit-quantity', count: range, arrangement, look: 'distinct', answers,
});
const match = (pairs: number, numbers: Range, set: SetStyle, skill: SkillId = 'digit-quantity'): MatchTask => ({
  game: 'cyfraIObrazek', skill, pairs, numbers, set,
});
const train = (gap: TrainGap, range: Range, length = 5): TrainTask => ({
  game: 'zgubionyWagonik', skill: 'order-around', range, length, gap, step: 1, answers: 'digit',
});
const compare = (over: Partial<CompareTask> = {}): CompareTask => ({
  game: 'ktoMaWiecej', skill: 'compare-10', count: [1, 6], diff: [3, 5], ask: 'more', show: 'objects', ...over,
});
const bus = (over: Partial<BusTask> = {}): BusTask => ({
  game: 'autobusDziesiatka', skill: 'bonds-5-10', count: [1, 9], ask: 'full', exposureMs: 0, answers: 'digit', ...over,
});

// повторення раніше вивченого (W1 і попередні рівні W2)
const w1count = (range: Range): CountTask => ({
  game: 'policzIDotknij', skill: 'count-scatter', count: range, arrangement: 'scatter', look: 'distinct', answers: 'digit',
});
const w1flash = (range: Range, exposureMs: number): FlashTask => ({
  game: 'blysk', skill: 'subitize-5', count: range, pattern: 'dice', exposureMs, answers: 'digit',
});
const w1feed = (range: Range): FeedTask => ({ game: 'nakarmZwierzaka', skill: 'give-n', count: range, slots: false });

const again = (task: TaskSpec): TaskSpec => ({ ...task, review: true });
const times = (n: number, task: TaskSpec): TaskSpec[] => Array.from({ length: n }, () => task);

interface Draft {
  newIdea: boolean;
  skills: readonly SkillId[];
  tasks: readonly TaskSpec[];
}

const DRAFTS: readonly Draft[] = [
  // 1. Цифра ↔ кількість — перша ідея: цифра — «ім'я» кількості (Kubik лічить предмети й показує цифру); 2 пари, 1–5
  {
    newIdea: true, skills: ['digit-quantity'],
    tasks: [...times(4, match(2, [1, 5], 'objects')), again(w1count([1, 8])), again(w1feed([1, 5]))],
  },
  // 2. 3 пари, крапки й предмети; лічба з плитками-цифрами (без крапок)
  {
    newIdea: false, skills: ['digit-quantity'],
    tasks: [
      match(3, [1, 5], 'objects'), match(3, [1, 6], 'dots'), count([1, 8], 'digitDots'), count([1, 10], 'digit'),
      again(w1flash([1, 5], 1500)), again(w1feed([1, 5])),
    ],
  },
  // 3. Нуль: «Tu nic nie ma.» — порожній набір (пунктирне коло, кулак, порожня рамка)
  {
    newIdea: true, skills: ['zero', 'digit-quantity'],
    tasks: [
      ...times(3, match(3, [0, 5], 'mixed', 'zero')), match(3, [0, 6], 'fingers', 'zero'),
      again(match(3, [1, 5], 'objects')), again(count([1, 10], 'digit')),
    ],
  },
  // 4. «Kto ma więcej?» — перша гра порівняння: різниця велика (3–5), без «Tyle samo»
  {
    newIdea: true, skills: ['compare-10'],
    tasks: [...times(4, compare()), again(match(3, [0, 5], 'mixed', 'zero')), again(count([1, 10], 'digit'))],
  },
  // 5. Порядок: «Zgubiony wagonik» — бракує останнього вагона (що ПІСЛЯ), 1–10
  {
    newIdea: false, skills: ['order-around'],
    tasks: [...times(4, train('end', [1, 10])), again(compare({ diff: [3, 5] })), again(match(3, [0, 5], 'mixed', 'zero'))],
  },
  // 6. «Kto ma więcej?» і «Kto ma mniej?», різниця 2–4
  {
    newIdea: false, skills: ['compare-10'],
    tasks: [...times(4, compare({ count: [1, 8], diff: [2, 4], ask: 'mixed' })), again(train('end', [1, 10])), again(match(3, [0, 8], 'mixed', 'zero'))],
  },
  // 7. «Autobus dziesiątka»: скільки їде (відкритий автобус, перший ряд — опора «п'ять»)
  {
    newIdea: true, skills: ['bonds-5-10'],
    tasks: [...times(4, bus()), again(compare({ ask: 'mixed' })), again(train('middle', [1, 10]))],
  },
  // 8. Вагони з нулем (0–10): бракує посередині й на початку (що ПЕРЕД)
  {
    newIdea: false, skills: ['order-around', 'zero'],
    tasks: [
      train('middle', [0, 10], 6), train('start', [0, 10]), train('any', [0, 10], 6), train('middle', [0, 10]),
      again(bus({ ask: 'empty' })), again(compare({ ask: 'mixed' })),
    ],
  },
  // 9. «Tyle samo» — нова ідея: купки бувають рівні (кнопка «=» у лотку), у купці може бути 0; різниця 1–3
  {
    newIdea: false, skills: ['compare-10', 'zero'],
    tasks: [
      ...times(4, compare({ count: [0, 8], diff: [1, 3], equal: 0.3, ask: 'mixed' })),
      again(bus({ ask: 'empty' })), again(train('start', [0, 10])),
    ],
  },
  // 10. Автобус: «Ile miejsc jest wolnych?», 0–10; два завдання з миготінням автобуса (2,5 с)
  {
    newIdea: false, skills: ['bonds-5-10'],
    tasks: [
      bus({ count: [0, 10], ask: 'empty' }), bus({ count: [1, 9], ask: 'mixed' }),
      bus({ count: [1, 9], ask: 'mixed', exposureMs: 2500 }), bus({ count: [0, 10], ask: 'empty', exposureMs: 2500 }),
      again(compare({ count: [0, 8], diff: [1, 3], equal: 0.3, ask: 'mixed' })), again(match(4, [0, 8], 'mixed', 'zero')),
    ],
  },
  // 11. Порівняння цифр (купок нема, поки Kubik їх не покаже) і підступ «більші предмети — менше їх»; з «Tyle samo»
  {
    newIdea: false, skills: ['compare-10'],
    tasks: [
      compare({ count: [0, 10], diff: [2, 5], equal: 0.2, ask: 'mixed', show: 'digits' }),
      compare({ count: [0, 10], diff: [1, 4], equal: 0.2, ask: 'mixed', show: 'digits' }),
      compare({ count: [1, 8], diff: [1, 3], equal: 0.2, ask: 'mixed', show: 'sizeTrick' }),
      compare({ count: [1, 8], diff: [2, 4], equal: 0.2, ask: 'mixed', show: 'sizeTrick' }),
      again(bus({ count: [0, 10], ask: 'mixed' })), again(match(4, [0, 10], 'fingers', 'zero')),
    ],
  },
  // 12. Підсумок світу (скриня): цифра ↔ кількість 0–10, «що після» (вагони з нулем), порівняння цифр — перевірка майстерності W2
  {
    newIdea: false, skills: ['digit-quantity', 'order-around', 'compare-10'],
    tasks: [
      match(4, [0, 10], 'mixed'),
      train('any', [0, 10], 6),
      train('end', [0, 10], 6),
      compare({ count: [0, 10], diff: [1, 4], equal: 0.2, ask: 'mixed', show: 'digits' }),
      again(bus({ count: [0, 10], ask: 'mixed' })), again(w1feed([6, 10])),
    ],
  },
];

export const W2_LEVELS: readonly Level[] = DRAFTS.map(
  (d, i): Level => ({ id: levelId('w2', i + 1), world: 'w2', index: i + 1, kind: 'main', draft: false, ...d }),
);
