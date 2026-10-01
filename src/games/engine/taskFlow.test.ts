import { describe, expect, it } from 'vitest';
import { INITIAL_TASK, canCheck, hintAvailable, taskOutcome, taskReducer, tileView, type TaskEvent, type TaskState } from './taskFlow';

const run = (events: readonly TaskEvent[], from: TaskState = INITIAL_TASK): TaskState => events.reduce(taskReducer, from);
const OK = { type: 'check', verdict: { ok: true } } as const;
const BAD = { type: 'check', verdict: { ok: false, almost: false } } as const;
const ALMOST = { type: 'check', verdict: { ok: false, almost: true } } as const;

describe('вибір відповіді', () => {
  it('дотик вибирає плитку, інший дотик — змінює вибір; перевірки ще немає', () => {
    const s = run([{ type: 'select', value: 7 }, { type: 'select', value: 8 }]);
    expect(s.selected).toBe(8);
    expect(s.phase).toBe('play');
    expect(s.mistakes).toBe(0);
  });

  it('«Gotowe» активна лише з вибором', () => {
    expect(canCheck(INITIAL_TASK)).toBe(false);
    expect(canCheck(run([{ type: 'select', value: 3 }]))).toBe(true);
  });

  it('check без вибору нічого не робить', () => {
    expect(run([OK])).toEqual(INITIAL_TASK);
  });
});

describe('правильно', () => {
  it('check ok → відгук, після нього завдання розв’язано; помилок нема → first', () => {
    const s = run([{ type: 'select', value: 7 }, OK]);
    expect(s.phase).toBe('feedback');
    expect(s.last).toBe('correct');
    const done = run([{ type: 'feedbackDone' }], s);
    expect(done.phase).toBe('done');
    expect(taskOutcome(done)).toBe('first');
  });

  it('під час відгуку дотики й повторні перевірки ігноруються', () => {
    const s = run([{ type: 'select', value: 7 }, OK]);
    expect(run([{ type: 'select', value: 8 }, OK, { type: 'hint' }], s)).toEqual(s);
  });
});

describe('1-ша помилка', () => {
  it('рахується, хибна плитка запам’ятовується й не вибирається знову; вибір скинуто; після відгуку знову грає дитина', () => {
    const s = run([{ type: 'select', value: 8 }, BAD]);
    expect(s).toMatchObject({ phase: 'feedback', mistakes: 1, wrong: [8], selected: null, last: 'wrong1', together: false });
    const again = run([{ type: 'feedbackDone' }, { type: 'select', value: 8 }], s);
    expect(again.phase).toBe('play');
    expect(again.selected).toBeNull(); // хибна плитка неактивна
    expect(run([{ type: 'select', value: 7 }], again).selected).toBe(7);
  });

  it('після неї з’являється лампочка «Pomóż mi»; раніше її нема', () => {
    expect(hintAvailable(INITIAL_TASK)).toBe(false);
    expect(hintAvailable(run([{ type: 'select', value: 8 }, BAD]))).toBe(true);
  });

  it('розв’язано після однієї помилки → retry', () => {
    const s = run([{ type: 'select', value: 8 }, ALMOST, { type: 'feedbackDone' }, { type: 'select', value: 7 }, OK, { type: 'feedbackDone' }]);
    expect(s.phase).toBe('done');
    expect(taskOutcome(s)).toBe('retry');
  });
});

describe('2-га помилка: показ разом', () => {
  const afterTwo = run([
    { type: 'select', value: 8 }, BAD, { type: 'feedbackDone' },
    { type: 'select', value: 6 }, BAD,
  ]);

  it('друга помилка → показ «разом»; кісточку дитина теж отримає (outcome together)', () => {
    expect(afterTwo).toMatchObject({ mistakes: 2, wrong: [8, 6], last: 'wrong2', together: true });
    const done = run([{ type: 'feedbackDone' }, { type: 'select', value: 7 }, OK, { type: 'feedbackDone' }], afterTwo);
    expect(done.phase).toBe('done');
    expect(taskOutcome(done)).toBe('together');
  });

  it('третя помилка (у іграх без обмеження плитками) повторює показ, а together лишається', () => {
    const three = run([{ type: 'feedbackDone' }, { type: 'select', value: 5 }, BAD], afterTwo);
    expect(three).toMatchObject({ mistakes: 3, last: 'wrong2', together: true });
  });
});

describe('підказка «Pomóż mi»', () => {
  it('до першої помилки ігнорується; після — рахується й дає відгук без помилки', () => {
    expect(run([{ type: 'hint' }])).toEqual(INITIAL_TASK);
    const s = run([{ type: 'select', value: 8 }, BAD, { type: 'feedbackDone' }, { type: 'hint' }]);
    expect(s).toMatchObject({ phase: 'feedback', hints: 1, mistakes: 1, last: 'hint' });
    const back = run([{ type: 'feedbackDone' }], s);
    expect(back.phase).toBe('play');
    expect(back.hints).toBe(1);
  });

  it('підказка не заважає outcome: після неї з однією помилкою — retry', () => {
    const s = run([
      { type: 'select', value: 8 }, BAD, { type: 'feedbackDone' }, { type: 'hint' }, { type: 'feedbackDone' },
      { type: 'select', value: 7 }, OK, { type: 'feedbackDone' },
    ]);
    expect(taskOutcome(s)).toBe('retry');
    expect(s.hints).toBe(1);
  });
});

describe('вигляд плитки', () => {
  it('хибна — retry, вибрана — selected, інша — default', () => {
    const s = run([{ type: 'select', value: 8 }, BAD, { type: 'feedbackDone' }, { type: 'select', value: 7 }]);
    expect(tileView(s, 8, 7)).toBe('retry');
    expect(tileView(s, 7, 7)).toBe('selected');
    expect(tileView(s, 6, 7)).toBe('default');
  });

  it('після правильної відповіді вибрана плитка стає correct', () => {
    const s = run([{ type: 'select', value: 7 }, OK]);
    expect(tileView(s, 7, 7)).toBe('correct');
    expect(tileView(s, 6, 7)).toBe('default');
  });

  it('після показу «разом» правильна плитка підсвічена', () => {
    const s = run([{ type: 'select', value: 8 }, BAD, { type: 'feedbackDone' }, { type: 'select', value: 6 }, BAD, { type: 'feedbackDone' }]);
    expect(tileView(s, 7, 7)).toBe('highlighted');
    expect(tileView(s, 8, 7)).toBe('retry');
    expect(tileView(s, 6, 7)).toBe('retry');
  });
});
