// W5 «Las Dziesiątek» (десятки до 100): 12 рівнів по 6 завдань (PLAN M17). Прогресія за PEDAGOGY §1–§2: лічба десятками (вагони 10, 20, 30…) → пучки й коробки по 10
// («Paczki po dziesięć»: прочитати, потім упакувати) → складання числа з десятків і одиниць (зворотний режим «Zbuduj liczbę…») → контраст 26 ↔ 62 → змішане → підсумок.
// Предмети W5 — jagoda, szyszka, grzybek, patyczek. У кожному рівні 2 з 6 завдань — повторення (W4 і раніше). «Nakarm zwierzaka» з коробками по 10 — окремий етап M17b.
import { levelId } from '../worlds';
import type {
  AnswerStyle, HouseTask, Level, PackMode, PackTask, SkillId, StoryTask, SumTask, TaskSpec, TrainTask,
} from '../types';
import type { Range } from '../types';

const answers: AnswerStyle = 'digit';

const tens = (over: Partial<TrainTask> = {}): TrainTask => ({
  game: 'zgubionyWagonik', skill: 'count-by-tens', range: [10, 100], length: 5, gap: 'end', step: 10, answers, ...over,
});
const pack = (mode: PackMode, total: Range, over: Partial<PackTask> = {}): PackTask => ({
  game: 'paczkiPoDziesiec', skill: mode === 'build' ? 'compose-2digit' : 'bundle-ten', total, mode, contrast: false, answers, ...over,
});

// повторення (W4 і раніше)
const w4sum = (): SumTask => ({
  game: 'ileRazem', skill: 'add-no-bridge-20', sum: [12, 18], lid: false, order: 'bigFirst', doubles: false, symbols: false, noBridge: true, answers,
});
const w4house = (): HouseTask => ({ game: 'domekLiczb', skill: 'teens', whole: [11, 20], missing: 'any', show: 'digits', answers });
const w4train = (): TrainTask => ({ game: 'zgubionyWagonik', skill: 'count-from-any', range: [11, 20], length: 6, gap: 'any', step: 1, answers });
const w3story = (): StoryTask => ({ game: 'historyjki', skill: 'add-combine', sum: [4, 9], kind: 'mixed', answers });

const again = (task: TaskSpec): TaskSpec => ({ ...task, review: true });
const times = (n: number, task: TaskSpec): TaskSpec[] => Array.from({ length: n }, () => task);

interface Draft {
  newIdea: boolean;
  skills: readonly SkillId[];
  tasks: readonly TaskSpec[];
}

const DRAFTS: readonly Draft[] = [
  // 1. Лічба десятками: «Zgubiony wagonik» з кроком 10 (10, 20, 30…), бракує останнього вагона
  { newIdea: true, skills: ['count-by-tens'], tasks: [...times(4, tens()), again(w4sum()), again(w4house())] },
  // 2. Те саме: прогалина посередині й на початку, потяг із 6 вагонів
  {
    newIdea: false, skills: ['count-by-tens'],
    tasks: [tens({ gap: 'middle', length: 6 }), tens({ gap: 'middle', length: 6 }), tens({ gap: 'start' }), tens({ gap: 'any', length: 6 }), again(w4train()), again(w3story())],
  },
  // 3. Прочитати: предмети вже в коробках по 10 і поштучно («Ile jest razem?»), 11–29
  { newIdea: true, skills: ['bundle-ten'], tasks: [...times(4, pack('packed', [11, 29])), again(tens()), again(w4sum())] },
  // 4. Упакувати: розсипані предмети, кнопка «Zapakuj», лічба «dziesięć, dwadzieścia…» і далі поштучно, 11–29
  { newIdea: true, skills: ['bundle-ten'], tasks: [...times(4, pack('loose', [11, 29])), again(pack('packed', [11, 29])), again(w4house())] },
  // 5. Більші числа: упакувати 21–49, прочитати 30–69; лічба десятками
  {
    newIdea: false, skills: ['bundle-ten', 'count-by-tens'],
    tasks: [pack('loose', [21, 49]), pack('loose', [21, 49]), pack('packed', [30, 69]), tens({ gap: 'any', length: 6 }), again(w4train()), again(w3story())],
  },
  // 6. Зворотний режим: «Zbuduj liczbę…» кнопками «+10» і «+1» на мату «dziesiątki | jedności», 11–29
  { newIdea: true, skills: ['compose-2digit'], tasks: [...times(4, pack('build', [11, 29])), again(pack('loose', [11, 29])), again(tens())] },
  // 7. Збирати 20–59, читати 30–79
  {
    newIdea: false, skills: ['compose-2digit', 'bundle-ten'],
    tasks: [pack('build', [20, 59]), pack('build', [20, 59]), pack('packed', [30, 79]), pack('packed', [30, 79]), again(pack('loose', [21, 49])), again(w4sum())],
  },
  // 8. Усі числа до 99: читати 21–99, збирати 30–89
  {
    newIdea: false, skills: ['compose-2digit', 'bundle-ten'],
    tasks: [pack('packed', [21, 99]), pack('packed', [21, 99]), pack('build', [30, 89]), pack('build', [30, 89]), again(tens({ gap: 'any', length: 6 })), again(pack('loose', [31, 59]))],
  },
  // 9. Контраст 26 ↔ 62: серед плиток — число з переставленими цифрами
  {
    newIdea: true, skills: ['compose-2digit', 'bundle-ten'],
    tasks: [
      pack('packed', [21, 69], { contrast: true }), pack('packed', [21, 69], { contrast: true }),
      pack('loose', [31, 59], { contrast: true }), pack('loose', [31, 59], { contrast: true }),
      again(pack('build', [30, 89])), again(w4house()),
    ],
  },
  // 10. Контраст і збирання: «Zbuduj liczbę…» з близькими числами
  {
    newIdea: false, skills: ['compose-2digit', 'bundle-ten'],
    tasks: [
      pack('build', [21, 99]), pack('build', [21, 99]), pack('packed', [21, 99], { contrast: true }), pack('packed', [21, 99], { contrast: true }),
      again(pack('loose', [21, 59], { contrast: true })), again(tens({ gap: 'any', length: 6 })),
    ],
  },
  // 11. Змішане: лічба десятками, упакувати, прочитати, зібрати
  {
    newIdea: false, skills: ['count-by-tens', 'bundle-ten', 'compose-2digit'],
    tasks: [
      tens({ gap: 'any', length: 6 }), pack('loose', [21, 59], { contrast: true }), pack('packed', [21, 99], { contrast: true }), pack('build', [21, 99]),
      again(w4sum()), again(w4train()),
    ],
  },
  // 12. Підсумок світу (скриня): десятки, коробки, складання числа, контраст — перевірка майстерності W5
  {
    newIdea: false, skills: ['count-by-tens', 'bundle-ten', 'compose-2digit'],
    tasks: [
      tens({ gap: 'any', length: 6 }), pack('loose', [21, 59]), pack('build', [30, 99]), pack('packed', [21, 99], { contrast: true }),
      again(w4house()), again(pack('build', [20, 59])),
    ],
  },
];

export const W5_LEVELS: readonly Level[] = DRAFTS.map(
  (d, i): Level => ({ id: levelId('w5', i + 1), world: 'w5', index: i + 1, kind: 'main', draft: false, ...d }),
);
