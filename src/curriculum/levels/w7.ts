// W7 «Kosmiczna Oś» (додавання до 100): 12 основних рівнів + ★-гілка з 4 рівнів «через десяток», по 6 завдань (PLAN M19). Прогресія за PEDAGOGY §1–§2: десятки (30 + 20) → +10 від будь-якого
// числа (34 + 10: «клітинка під числом») → двоцифрове й одноцифрове без переходу (42 + 5) → історії з двоцифровими числами → змішане → підсумок. Ракета летить по прямій 0–100
// зупинками (десятки по +10, потім одиниці), у «Historyjki» кадри показують стовпчики й кубики. ★: 38 + 5 — спершу до десятка (40), потім решта. У кожному рівні 2 з 6 завдань — повторення.
import { levelId } from '../worlds';
import type {
  AnswerStyle, ChartTask, CompareTask, JumpTask, Level, PackTask, SkillId, StoryTask, SumTask, TaskSpec, TenTask,
} from '../types';

const answers: AnswerStyle = 'digit';
type Addend = 'tens' | 'ten' | 'ones' | 'bridge';

const SKILL_OF: Record<Addend, SkillId> = { tens: 'add-tens', ten: 'plus-ten', ones: 'add-2digit-1digit', bridge: 'add-with-bridge' };

const rocket = (addend: Addend, over: Partial<JumpTask> = {}): JumpTask => ({
  game: 'skokiZabki', skill: SKILL_OF[addend], vehicle: 'rocket', addend, max: 100, start: [11, 99], jumps: [1, 1], pads: 'numbered', tapJumps: true, answers, ...over,
});
const story = (addend: Addend, over: Partial<StoryTask> = {}): StoryTask => ({
  game: 'historyjki', skill: 'story-problems', sum: [21, 99], kind: 'join', addend, answers, ...over,
});
const plusTen = (over: Partial<ChartTask> = {}): ChartTask => ({
  game: 'tajemniczaTablica', skill: 'plus-ten', mode: 'neighbors', range: [1, 100], leaves: 0, step: 'ten', direction: 'more', answers, ...over,
});
const bridgeTen = (over: Partial<TenTask> = {}): TenTask => ({
  game: 'zrobDziesiatke', skill: 'add-with-bridge', known: [6, 9], show: 'frame', bridge: true, add: [3, 9], ...over,
});

// повторення (W6 і раніше)
const w6neighbors = (): ChartTask => ({
  game: 'tajemniczaTablica', skill: 'neighbors', mode: 'neighbors', range: [2, 100], leaves: 0, step: 'mixed', direction: 'mixed', answers,
});
const w6hidden = (): ChartTask => ({
  game: 'tajemniczaTablica', skill: 'chart-patterns', mode: 'hidden', range: [1, 100], leaves: 2, step: 'one', direction: 'more', answers,
});
const w6compare = (): CompareTask => ({
  game: 'ktoMaWiecej', skill: 'compare-2digit', count: [21, 99], diff: [1, 15], equal: 0.15, ask: 'mixed', show: 'digits',
});
const w5pack = (): PackTask => ({ game: 'paczkiPoDziesiec', skill: 'compose-2digit', total: [21, 99], mode: 'packed', contrast: true, answers });
const w4sum = (): SumTask => ({
  game: 'ileRazem', skill: 'add-no-bridge-20', sum: [12, 18], lid: false, order: 'bigFirst', doubles: false, symbols: false, noBridge: true, answers,
});

const again = (task: TaskSpec): TaskSpec => ({ ...task, review: true });
const times = (n: number, task: TaskSpec): TaskSpec[] => Array.from({ length: n }, () => task);

interface Draft {
  newIdea: boolean;
  skills: readonly SkillId[];
  tasks: readonly TaskSpec[];
}

const MAIN: readonly Draft[] = [
  // 1. Десятки: «Rakieta jest na liczbie trzydzieści. Leci o dwadzieścia dalej.» — ракета летить десятками (30 + 20)
  { newIdea: true, skills: ['add-tens'], tasks: [...times(4, rocket('tens')), again(w6neighbors()), again(w5pack())] },
  // 2. Десятки без дотиків до ракети (дитина передбачає); на таблиці «+10» — клітинка під числом
  {
    newIdea: false, skills: ['add-tens', 'plus-ten'],
    tasks: [rocket('tens', { tapJumps: false }), rocket('tens', { tapJumps: false }), plusTen({ range: [1, 60] }), plusTen({ range: [1, 60] }), again(w6hidden()), again(w6compare())],
  },
  // 3. +10 від будь-якого числа: 34 + 10 (десятки змінюються, одиниці — ні)
  { newIdea: true, skills: ['plus-ten'], tasks: [...times(4, rocket('ten')), again(rocket('tens')), again(w6neighbors())] },
  // 4. +10 і −10 на таблиці; ракета без дотиків
  {
    newIdea: false, skills: ['plus-ten'],
    tasks: [rocket('ten', { tapJumps: false }), rocket('ten', { tapJumps: false }), plusTen(), plusTen({ direction: 'mixed' }), again(w5pack()), again(rocket('tens'))],
  },
  // 5. Двоцифрове й одноцифрове без переходу: 42 + 5 (ракета летить по одиниці)
  { newIdea: true, skills: ['add-2digit-1digit'], tasks: [...times(4, rocket('ones')), again(rocket('ten')), again(w6compare())] },
  // 6. Те саме без дотиків; одиниці до 9
  {
    newIdea: false, skills: ['add-2digit-1digit'],
    tasks: [rocket('ones', { tapJumps: false }), rocket('ones', { tapJumps: false }), rocket('ones', { start: [21, 98], tapJumps: false }), rocket('ones', { start: [21, 98], tapJumps: false }), again(plusTen()), again(w6hidden())],
  },
  // 7. «Historyjki» з двоцифровими числами: десятки (кадри — стовпчики й кубики)
  { newIdea: true, skills: ['story-problems'], tasks: [...times(4, story('tens')), again(rocket('ones')), again(w4sum())] },
  // 8. Історії: +10 і одиниці без переходу
  {
    newIdea: false, skills: ['story-problems'],
    tasks: [story('ten'), story('ten'), story('ones'), story('ones'), again(rocket('tens', { tapJumps: false })), again(plusTen({ direction: 'mixed' }))],
  },
  // 9. Змішане: ракета — десятки, +10 і одиниці без підказки в умові
  {
    newIdea: false, skills: ['add-tens', 'plus-ten', 'add-2digit-1digit'],
    tasks: [rocket('tens', { tapJumps: false }), rocket('ten', { tapJumps: false }), rocket('ones', { tapJumps: false }), rocket('ten', { tapJumps: false }), again(story('ten')), again(w6neighbors())],
  },
  // 10. Історії різних видів («прийшло ще» і «разом») і ракета
  {
    newIdea: false, skills: ['story-problems', 'add-2digit-1digit'],
    tasks: [story('ones', { kind: 'mixed' }), story('ten', { kind: 'mixed' }), story('tens', { kind: 'mixed' }), rocket('ones', { tapJumps: false }), again(plusTen()), again(w5pack())],
  },
  // 11. Змішане: ракета, історія, «+10» на таблиці
  {
    newIdea: false, skills: ['add-tens', 'plus-ten', 'add-2digit-1digit', 'story-problems'],
    tasks: [rocket('tens', { tapJumps: false }), rocket('ones', { tapJumps: false }), story('ones', { kind: 'mixed' }), plusTen({ direction: 'mixed' }), again(w6hidden()), again(w6compare())],
  },
  // 12. Підсумок світу (скриня): 40 + 30, 34 + 10, 52 + 4, історія — перевірка майстерності W7
  {
    newIdea: false, skills: ['add-tens', 'plus-ten', 'add-2digit-1digit', 'story-problems'],
    tasks: [rocket('tens', { tapJumps: false }), rocket('ten', { tapJumps: false }), rocket('ones', { tapJumps: false }), story('ten', { kind: 'mixed' }), again(w6neighbors()), again(w4sum())],
  },
];

/** ★-гілка «через десяток» (38 + 5 = 38 + 2 + 3): відкривається після 10-го основного рівня (worlds.ts), на проходження основного шляху не впливає. */
const STAR: readonly Draft[] = [
  // ★1. 38 + 5: ракета спершу летить до десятка (40), далі решта
  { newIdea: true, skills: ['add-with-bridge'], tasks: [...times(4, rocket('bridge')), again(rocket('ones', { tapJumps: false })), again(plusTen())] },
  // ★2. Без дотиків і через рамку-десятку (8 + 5): спершу добити першу рамку до десяти
  {
    newIdea: false, skills: ['add-with-bridge'],
    tasks: [rocket('bridge', { tapJumps: false }), rocket('bridge', { tapJumps: false }), bridgeTen(), bridgeTen(), again(rocket('ten', { tapJumps: false })), again(w4sum())],
  },
  // ★3. Історії через десяток
  {
    newIdea: false, skills: ['add-with-bridge', 'story-problems'],
    tasks: [story('bridge', { skill: 'add-with-bridge' }), story('bridge', { skill: 'add-with-bridge' }), rocket('bridge', { tapJumps: false }), rocket('bridge', { tapJumps: false }), again(story('ones')), again(bridgeTen())],
  },
  // ★4. Змішане
  {
    newIdea: false, skills: ['add-with-bridge', 'story-problems'],
    tasks: [
      rocket('bridge', { tapJumps: false }), story('bridge', { skill: 'add-with-bridge', kind: 'mixed' }), bridgeTen(), rocket('bridge', { tapJumps: false }),
      again(rocket('ones', { tapJumps: false })), again(story('ten')),
    ],
  },
];

export const W7_LEVELS: readonly Level[] = [
  ...MAIN.map((d, i): Level => ({ id: levelId('w7', i + 1), world: 'w7', index: i + 1, kind: 'main', draft: false, ...d })),
  ...STAR.map((d, i): Level => ({ id: levelId('w7', i + 1, 'star'), world: 'w7', index: i + 1, kind: 'star', draft: false, ...d })),
];
