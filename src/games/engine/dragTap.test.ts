import { describe, expect, it } from 'vitest';
import { DRAG_THRESHOLD, IDLE, dragOffset, dragStep, zoneAt, type DragEvent, type DragState, type DragStep } from './dragTap';

type Id = 'a' | 'b';
const run = (events: readonly DragEvent<Id>[], from: DragState<Id> = IDLE as DragState<Id>): { state: DragState<Id>; drops: NonNullable<DragStep<Id>['drop']>[] } => {
  let state = from;
  const drops: NonNullable<DragStep<Id>['drop']>[] = [];
  for (const e of events) {
    const step = dragStep(state, e);
    state = step.state;
    if (step.drop) drops.push(step.drop);
  }
  return { state, drops };
};
const at = (x: number, y: number) => ({ x, y });

describe('перетягування', () => {
  it('рух за порогом — перетягування; відпустили над місцем — предмет там', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(10, 10) },
      { type: 'move', at: at(10 + DRAG_THRESHOLD + 1, 10), over: null },
      { type: 'move', at: at(80, 60), over: 'plate' },
      { type: 'up', at: at(80, 60), over: 'plate' },
    ]);
    expect(r.drops).toEqual([{ id: 'a', zone: 'plate' }]);
    expect(r.state).toEqual(IDLE);
  });

  it('відпустили поза місцем — предмет повертається, нічого не кладеться', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(0, 0) },
      { type: 'move', at: at(50, 50), over: null },
      { type: 'up', at: at(50, 50), over: null },
    ]);
    expect(r.drops).toEqual([]);
    expect(r.state).toEqual(IDLE);
  });

  it('до порогу це ще не перетягування: рух на 5 px і відпускання — тап', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(0, 0) },
      { type: 'move', at: at(5, 0), over: null },
      { type: 'up', at: at(5, 0), over: 'plate' },
    ]);
    expect(r.drops).toEqual([]);
    expect(r.state).toEqual({ mode: 'idle', selected: 'a' });
  });

  it('під час перетягування видно зсув від місця захоплення', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(10, 10) },
      { type: 'move', at: at(40, 30), over: null },
    ]);
    expect(dragOffset(r.state)).toEqual({ x: 30, y: 20 });
    expect(dragOffset(IDLE)).toBeNull();
  });

  it('скасування під час перетягування (cancel) — без падіння предмета', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(0, 0) },
      { type: 'move', at: at(30, 30), over: 'plate' },
      { type: 'cancel' },
    ]);
    expect(r.drops).toEqual([]);
    expect(r.state).toEqual(IDLE);
  });
});

describe('заміна двома дотиками (BRIEF §7)', () => {
  it('тап по предмету вибирає його, тап по місцю ставить: предмет сам стає на місце', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(0, 0) },
      { type: 'up', at: at(0, 0), over: null },
      { type: 'tapZone', zone: 'plate' },
    ]);
    expect(r.drops).toEqual([{ id: 'a', zone: 'plate' }]);
    expect(r.state).toEqual(IDLE);
  });

  it('повторний тап по тому самому предмету знімає вибір', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(0, 0) }, { type: 'up', at: at(0, 0), over: null },
      { type: 'down', id: 'a', at: at(0, 0) }, { type: 'up', at: at(0, 0), over: null },
    ]);
    expect(r.state).toEqual({ mode: 'idle', selected: null });
  });

  it('тап по іншому предмету змінює вибір', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(0, 0) }, { type: 'up', at: at(0, 0), over: null },
      { type: 'down', id: 'b', at: at(40, 0) }, { type: 'up', at: at(40, 0), over: null },
    ]);
    expect(r.state).toEqual({ mode: 'idle', selected: 'b' });
  });

  it('тап по місцю без вибраного предмета нічого не робить', () => {
    expect(run([{ type: 'tapZone', zone: 'plate' }])).toEqual({ state: IDLE, drops: [] });
  });

  it('клавіатура: tapItem вибирає, tapZone ставить', () => {
    const r = run([{ type: 'tapItem', id: 'b' }, { type: 'tapZone', zone: 'basket' }]);
    expect(r.drops).toEqual([{ id: 'b', zone: 'basket' }]);
  });

  it('після перетягування вибір скинуто', () => {
    const r = run([
      { type: 'down', id: 'a', at: at(0, 0) }, { type: 'up', at: at(0, 0), over: null }, // вибрали a
      { type: 'down', id: 'b', at: at(40, 0) },
      { type: 'move', at: at(90, 40), over: 'plate' },
      { type: 'up', at: at(90, 40), over: 'plate' },
    ]);
    expect(r.drops).toEqual([{ id: 'b', zone: 'plate' }]);
    expect(r.state).toEqual(IDLE);
  });

  it('під час перетягування тап по місцю ігнорується, новий «down» теж', () => {
    const dragging = run([{ type: 'down', id: 'a', at: at(0, 0) }, { type: 'move', at: at(30, 0), over: null }]).state;
    expect(run([{ type: 'tapZone', zone: 'plate' }, { type: 'down', id: 'b', at: at(5, 5) }], dragging).state).toEqual(dragging);
  });
});

describe('zoneAt', () => {
  const zones = new Map([
    ['big', { left: 0, top: 0, right: 300, bottom: 200 }],
    ['small', { left: 100, top: 50, right: 160, bottom: 100 }],
  ]);

  it('знаходить місце під точкою; при вкладених — менше', () => {
    expect(zoneAt({ x: 120, y: 70 }, zones)).toBe('small');
    expect(zoneAt({ x: 250, y: 150 }, zones)).toBe('big');
  });

  it('запас навколо місця полегшує влучання; далі — нічого', () => {
    expect(zoneAt({ x: 308, y: 100 }, zones)).toBe('big');
    expect(zoneAt({ x: 340, y: 100 }, zones)).toBeNull();
    expect(zoneAt({ x: 308, y: 100 }, zones, 0)).toBeNull();
  });
});
