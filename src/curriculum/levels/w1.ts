// W1 «Łąka Liczenia» (1–10): 12 рівнів по 6 завдань, описано повністю (PLAN M5). Прогресія за PEDAGOGY §1–§2:
// рядок → коло → розсип; крапки кубика → випадкові; експозиція 2 с → 1 с; у кожному рівні ≈ 30 % повторення (2 з 6).
// Відповіді-плитки в W1 — цифра з крапками (BRIEF §7). Ігри: «Policz i dotknij», «Błysk!», «Nakarm zwierzaka».
import { levelId } from '../worlds';
import type { AnswerStyle, Arrangement, CountTask, FeedTask, FlashTask, Level, Range, SkillId, TaskSpec } from '../types';

const ANSWERS: AnswerStyle = 'digitDots';

const count = (skill: SkillId, range: Range, arrangement: Arrangement, look: CountTask['look'] = 'distinct'): CountTask => ({
  game: 'policzIDotknij', skill, count: range, arrangement, look, answers: ANSWERS,
});
const flash = (range: Range, pattern: FlashTask['pattern'], exposureMs: number): FlashTask => ({
  game: 'blysk', skill: 'subitize-5', count: range, pattern, exposureMs, answers: ANSWERS,
});
const feed = (range: Range, slots = false): FeedTask => ({ game: 'nakarmZwierzaka', skill: 'give-n', count: range, slots });

/** Позначає завдання як спіральне повторення раніше вивченого. */
const again = (task: TaskSpec): TaskSpec => ({ ...task, review: true });
const times = (n: number, task: TaskSpec): TaskSpec[] => Array.from({ length: n }, () => task);

interface Draft {
  newIdea: boolean;
  skills: readonly SkillId[];
  tasks: readonly TaskSpec[];
}

const DRAFTS: readonly Draft[] = [
  // 1. Лічба до 3 в рядку — перша ідея: «один дотик — один предмет» (Kubik показує)
  { newIdea: true, skills: ['count-line'], tasks: times(6, count('count-line', [1, 3], 'line')) },
  // 2. До 5 в рядку
  {
    newIdea: false, skills: ['count-line'],
    tasks: [...times(4, count('count-line', [1, 5], 'line')), ...times(2, again(count('count-line', [1, 3], 'line')))],
  },
  // 3. «Błysk!»: крапки кубика 1–3 на 2 с — нова гра, нова ідея (бачити кількість одразу)
  {
    newIdea: true, skills: ['subitize-5'],
    tasks: [...times(4, flash([1, 3], 'dice', 2000)), ...times(2, again(count('count-line', [1, 5], 'line')))],
  },
  // 4. «Nakarm zwierzaka»: дати 1–3 — нова ідея (дати N)
  {
    newIdea: true, skills: ['give-n'],
    tasks: [...times(4, feed([1, 3])), again(count('count-line', [1, 5], 'line')), again(flash([1, 3], 'dice', 2000))],
  },
  // 5. Лічба до 7 по колу
  {
    newIdea: false, skills: ['count-line'],
    tasks: [...times(4, count('count-line', [1, 7], 'circle')), again(feed([1, 3])), again(flash([1, 3], 'dice', 2000))],
  },
  // 6. Розсип до 6 — нова ідея: порахувати розсипане, нічого не пропустивши
  {
    newIdea: true, skills: ['count-scatter'],
    tasks: [...times(4, count('count-scatter', [1, 6], 'scatter')), again(count('count-line', [1, 5], 'line')), again(flash([1, 3], 'dice', 2000))],
  },
  // 7. «Błysk!» 1–5, кубик, 1,5 с
  {
    newIdea: false, skills: ['subitize-5'],
    tasks: [...times(4, flash([1, 5], 'dice', 1500)), ...times(2, again(count('count-scatter', [1, 6], 'scatter')))],
  },
  // 8. Дати 1–5
  {
    newIdea: false, skills: ['give-n'],
    tasks: [...times(4, feed([1, 5])), again(count('count-scatter', [1, 6], 'scatter')), again(flash([1, 5], 'dice', 1500))],
  },
  // 9. Розсип до 8, схожі предмети
  {
    newIdea: false, skills: ['count-scatter'],
    tasks: [...times(4, count('count-scatter', [1, 8], 'scatter', 'similar')), again(feed([1, 5])), again(flash([1, 5], 'dice', 1500))],
  },
  // 10. «Błysk!» випадкові візерунки 1–5, 1,2 с
  {
    newIdea: false, skills: ['subitize-5'],
    tasks: [...times(4, flash([1, 5], 'random', 1200)), again(count('count-scatter', [1, 8], 'scatter')), again(feed([1, 5]))],
  },
  // 11. Дати 4–8
  {
    newIdea: false, skills: ['give-n'],
    tasks: [...times(4, feed([4, 8])), again(count('count-scatter', [1, 8], 'scatter')), again(flash([1, 5], 'random', 1200))],
  },
  // 12. Підсумок світу (скриня): розсип до 10, дати 6–10, «Błysk!» 1 с — перевірка майстерності W1
  {
    newIdea: false, skills: ['count-scatter', 'give-n', 'subitize-5'],
    tasks: [
      count('count-scatter', [6, 10], 'scatter', 'similar'),
      count('count-scatter', [6, 10], 'scatter'),
      feed([6, 10]),
      feed([6, 10]),
      again(count('count-scatter', [1, 10], 'scatter')),
      again(flash([1, 5], 'random', 1000)),
    ],
  },
];

export const W1_LEVELS: readonly Level[] = DRAFTS.map(
  (d, i): Level => ({ id: levelId('w1', i + 1), world: 'w1', index: i + 1, kind: 'main', draft: false, ...d }),
);
