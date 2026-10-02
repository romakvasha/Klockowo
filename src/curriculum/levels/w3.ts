// W3 «Wyspa Dodawania» (суми до 10): 15 рівнів по 6 завдань (PLAN M15). Прогресія за PEDAGOGY §1–§2: об'єднання наборів («Ile razem?») → знаки + і = → «Historyjki» →
// лічба «від числа» (кришка, «Skoki żabki») → склад 5 і 10 («Domek liczb», «Zrób dziesiątkę») → подвоєння → історії й змішані завдання → підсумок. У кожному рівні 2 з 6
// завдань — повторення (≈ 30 %): W2 (порівняння, вагони, автобус, цифри) і раніше вивчене в W3. Навичка автобуса 'bonds-5-10' уже зустрілась у W2.
import { levelId } from '../worlds';
import type {
  AnswerStyle, BusTask, CompareTask, HouseTask, JumpTask, Level, MatchTask, SkillId, StoryTask, SumTask, TaskSpec, TenTask, TrainTask,
} from '../types';

const answers: AnswerStyle = 'digit';

const sum = (over: Partial<SumTask> = {}): SumTask => ({
  game: 'ileRazem', skill: 'add-combine', sum: [2, 5], lid: false, order: 'bigFirst', doubles: false, symbols: false, answers, ...over,
});
const house = (over: Partial<HouseTask> = {}): HouseTask => ({
  game: 'domekLiczb', skill: 'bonds-5-10', whole: [3, 5], missing: 'right', show: 'pictures', answers, ...over,
});
const jump = (over: Partial<JumpTask> = {}): JumpTask => ({
  game: 'skokiZabki', skill: 'count-on', max: 10, start: [0, 6], jumps: [1, 3], pads: 'numbered', tapJumps: true, answers, ...over,
});
const ten = (over: Partial<TenTask> = {}): TenTask => ({ game: 'zrobDziesiatke', skill: 'bonds-5-10', known: [5, 9], show: 'frame', ...over });
const story = (over: Partial<StoryTask> = {}): StoryTask => ({ game: 'historyjki', skill: 'add-combine', sum: [2, 5], kind: 'join', answers, ...over });

// повторення (W2 і раніше вивчене в W3)
const compare = (): CompareTask => ({ game: 'ktoMaWiecej', skill: 'compare-10', count: [0, 8], diff: [1, 3], equal: 0.3, ask: 'mixed', show: 'objects' });
const bus = (ask: BusTask['ask'] = 'mixed'): BusTask => ({ game: 'autobusDziesiatka', skill: 'bonds-5-10', count: [1, 9], ask, exposureMs: 0, answers });
const train = (): TrainTask => ({ game: 'zgubionyWagonik', skill: 'order-around', range: [0, 10], length: 6, gap: 'any', step: 1, answers });
const match = (): MatchTask => ({ game: 'cyfraIObrazek', skill: 'digit-quantity', pairs: 3, numbers: [0, 8], set: 'mixed' });

const again = (task: TaskSpec): TaskSpec => ({ ...task, review: true });
const times = (n: number, task: TaskSpec): TaskSpec[] => Array.from({ length: n }, () => task);

interface Draft {
  newIdea: boolean;
  skills: readonly SkillId[];
  tasks: readonly TaskSpec[];
}

const DRAFTS: readonly Draft[] = [
  // 1. Об'єднання наборів — перша ідея: два кошики, «Wsyp!», разом; суми 2–5, більший доданок першим
  { newIdea: true, skills: ['add-combine'], tasks: [...times(4, sum()), again(compare()), again(bus('full'))] },
  // 2. Суми 3–7, доданки навмання
  {
    newIdea: false, skills: ['add-combine'],
    tasks: [sum({ sum: [3, 6], order: 'any' }), sum({ sum: [3, 6], order: 'any' }), sum({ sum: [4, 7], order: 'any' }), sum({ sum: [4, 7], order: 'any' }), again(train()), again(match())],
  },
  // 3. Знаки + і =: рівняння «3 + 2 = ?» вже на екрані; два завдання лише із символів («Ile to jest trzy dodać dwa?»)
  {
    newIdea: true, skills: ['plus-equals', 'add-combine'],
    tasks: [
      sum({ sum: [4, 8], order: 'any' }), sum({ sum: [4, 8], order: 'any' }),
      sum({ skill: 'plus-equals', sum: [3, 6], order: 'any', symbols: true }), sum({ skill: 'plus-equals', sum: [4, 7], order: 'any', symbols: true }),
      again(bus('empty')), again(compare()),
    ],
  },
  // 4. «Historyjki» — нова гра: «прийшло ще»; суми 2–5 (і одне завдання з кошиками для зв'язку з рівнянням)
  {
    newIdea: true, skills: ['add-combine'],
    tasks: [...times(3, story()), sum({ sum: [3, 7], order: 'any' }), again(sum({ skill: 'plus-equals', sum: [3, 6], symbols: true })), again(bus('full'))],
  },
  // 5. Лічба «від числа»: кришка на першому кошику (його предметів не видно, лише число)
  {
    newIdea: true, skills: ['count-on'],
    tasks: [...times(4, sum({ skill: 'count-on', sum: [5, 8], lid: true })), again(story({ sum: [3, 6] })), again(compare())],
  },
  // 6. «Skoki żabki»: жабка стрибає по прямій (лічимо стрибки, не листки)
  {
    newIdea: true, skills: ['count-on'],
    tasks: [...times(3, jump()), sum({ skill: 'count-on', sum: [5, 9], lid: true, order: 'any' }), again(sum({ skill: 'plus-equals', sum: [4, 7], symbols: true })), again(bus('empty'))],
  },
  // 7. Склад 5 і 10: «Domek liczb» — ціле 3–5, предмети під будиночком
  {
    newIdea: true, skills: ['bonds-5-10'],
    tasks: [...times(4, house()), again(sum({ sum: [4, 7], order: 'any' })), again(train())],
  },
  // 8. «Domek liczb»: ціле 5–10, спершу з предметами, потім лише цифри; віконце навмання
  {
    newIdea: false, skills: ['bonds-5-10'],
    tasks: [
      house({ whole: [5, 8], missing: 'any' }), house({ whole: [5, 8], missing: 'any' }),
      house({ whole: [6, 10], missing: 'any', show: 'digits' }), house({ whole: [6, 10], missing: 'any', show: 'digits' }),
      again(sum({ skill: 'count-on', sum: [5, 8], lid: true })), again(jump({ jumps: [2, 3] })),
    ],
  },
  // 9. «Zrób dziesiątkę»: доповнити рамку до десяти — відомі фішки видно
  {
    newIdea: true, skills: ['bonds-5-10'],
    tasks: [...times(4, ten()), again(house({ whole: [5, 8], missing: 'any' })), again(bus('empty'))],
  },
  // 10. Склад 10: рамка з відомими фішками, потім — лише цифра; «Domek liczb» 6–10 з порожнім лівим віконцем
  {
    newIdea: false, skills: ['bonds-5-10'],
    tasks: [
      ten({ known: [3, 9] }), ten({ known: [3, 9] }), ten({ known: [2, 9], show: 'digit' }), house({ whole: [6, 10], missing: 'left', show: 'digits' }),
      again(story({ sum: [4, 8], kind: 'mixed' })), again(jump({ jumps: [2, 4] })),
    ],
  },
  // 11. Подвоєння (3 + 3): суми 2–6
  {
    newIdea: true, skills: ['doubles'],
    tasks: [...times(4, sum({ skill: 'doubles', sum: [2, 6], doubles: true })), again(ten({ show: 'digit' })), again(sum({ skill: 'count-on', sum: [5, 9], lid: true }))],
  },
  // 12. Подвоєння до 10 + суми до 10
  {
    newIdea: false, skills: ['doubles', 'add-combine'],
    tasks: [
      sum({ skill: 'doubles', sum: [4, 10], doubles: true }), sum({ skill: 'doubles', sum: [4, 10], doubles: true }),
      sum({ sum: [6, 10], order: 'any' }), sum({ sum: [6, 10], order: 'any' }),
      again(house({ whole: [6, 10], missing: 'any', show: 'digits' })), again(story({ sum: [4, 8], kind: 'mixed' })),
    ],
  },
  // 13. Історії: «прийшло ще» і два набори на картинці
  {
    newIdea: false, skills: ['add-combine', 'count-on'],
    tasks: [
      story({ sum: [3, 7], kind: 'mixed' }), story({ sum: [3, 7], kind: 'mixed' }), story({ sum: [5, 8], kind: 'join' }),
      jump({ jumps: [2, 5], start: [0, 6], tapJumps: false }),
      again(ten({ known: [2, 9], show: 'digit' })), again(sum({ skill: 'doubles', sum: [4, 10], doubles: true })),
    ],
  },
  // 14. Змішані: історія, склад 10, лічба
  {
    newIdea: false, skills: ['add-combine', 'bonds-5-10'],
    tasks: [
      story({ sum: [4, 9], kind: 'combine' }), story({ sum: [5, 10], kind: 'mixed' }),
      house({ whole: [6, 10], missing: 'left', show: 'digits' }), ten({ known: [2, 9], show: 'digit' }),
      again(sum({ skill: 'doubles', sum: [4, 10], doubles: true })), again(jump({ jumps: [2, 5], tapJumps: false })),
    ],
  },
  // 15. Підсумок світу (скриня): суми, історія, склад 10, лічба «від числа» — перевірка майстерності W3
  {
    newIdea: false, skills: ['add-combine', 'count-on', 'bonds-5-10', 'doubles'],
    tasks: [
      sum({ sum: [6, 10], order: 'any' }),
      story({ sum: [6, 10], kind: 'mixed' }),
      house({ whole: [7, 10], missing: 'any', show: 'digits' }),
      jump({ jumps: [2, 5], start: [0, 5], pads: 'landmarks', tapJumps: false }),
      again(sum({ skill: 'doubles', sum: [4, 10], doubles: true })), again(ten({ known: [2, 9], show: 'digit' })),
    ],
  },
];

export const W3_LEVELS: readonly Level[] = DRAFTS.map(
  (d, i): Level => ({ id: levelId('w3', i + 1), world: 'w3', index: i + 1, kind: 'main', draft: false, ...d }),
);
