// Перетягування з обов'язковою заміною двома дотиками (BRIEF §7: «Перетягування завжди можна замінити двома дотиками: предмет, потім місце;
// предмет сам стає на місце»). Чистий автомат без DOM: хук useDragTap подає йому події Pointer Events (миша й дотик однаково).
export interface Point {
  x: number;
  y: number;
}

/** Скільки px треба пройти від місця дотику, щоб дотик став перетягуванням, а не «тапом». */
export const DRAG_THRESHOLD = 8;

export type DragState<Id extends string = string> =
  | { mode: 'idle'; selected: Id | null }
  | { mode: 'pressed'; id: Id; start: Point; selected: Id | null }
  | { mode: 'dragging'; id: Id; start: Point; at: Point; over: string | null };

export type DragEvent<Id extends string = string> =
  | { type: 'down'; id: Id; at: Point }
  | { type: 'move'; at: Point; over: string | null }
  | { type: 'up'; at: Point; over: string | null }
  | { type: 'tapZone'; zone: string }
  | { type: 'tapItem'; id: Id }
  | { type: 'cancel' };

export interface DragStep<Id extends string = string> {
  state: DragState<Id>;
  /** Предмет поставлено на місце (перетягуванням або двома дотиками). */
  drop?: { id: Id; zone: string };
}

export const IDLE: DragState = { mode: 'idle', selected: null };

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Перший дотик вибирає предмет (selected), повторний — знімає вибір; дотик до місця при вибраному предметі ставить його туди.
 *  Рух далі за поріг — перетягування: відпустили над місцем — предмет там, поза місцем — повертається. */
export function dragStep<Id extends string>(state: DragState<Id>, event: DragEvent<Id>): DragStep<Id> {
  switch (event.type) {
    case 'down':
      if (state.mode === 'dragging') return { state };
      return { state: { mode: 'pressed', id: event.id, start: event.at, selected: state.selected } };

    case 'move':
      if (state.mode === 'pressed') {
        if (distance(state.start, event.at) < DRAG_THRESHOLD) return { state };
        return { state: { mode: 'dragging', id: state.id, start: state.start, at: event.at, over: event.over } };
      }
      if (state.mode === 'dragging') return { state: { ...state, at: event.at, over: event.over } };
      return { state };

    case 'up':
      if (state.mode === 'pressed') {
        // «тап» по предмету: вибрати чи зняти вибір
        return { state: { mode: 'idle', selected: state.selected === state.id ? null : state.id } };
      }
      if (state.mode === 'dragging') {
        const zone = event.over;
        return zone === null ? { state: IDLE as DragState<Id> } : { state: IDLE as DragState<Id>, drop: { id: state.id, zone } };
      }
      return { state };

    case 'tapItem': {
      // тап по предмету з клавіатури (Enter / Space): те саме, що й дотик
      if (state.mode !== 'idle') return { state };
      return { state: { mode: 'idle', selected: state.selected === event.id ? null : event.id } };
    }

    case 'tapZone':
      if (state.mode === 'idle' && state.selected !== null) {
        return { state: IDLE as DragState<Id>, drop: { id: state.selected, zone: event.zone } };
      }
      return { state };

    case 'cancel':
      return { state: { mode: 'idle', selected: state.mode === 'dragging' ? null : state.selected } };
  }
}

/** Зсув предмета, що летить за вказівником (відносно місця, де його взяли). */
export function dragOffset(state: DragState): Point | null {
  if (state.mode !== 'dragging') return null;
  return { x: state.at.x - state.start.x, y: state.at.y - state.start.y };
}

/** Яке місце (за прямокутниками в координатах сторінки) під точкою; `slop` — запас навколо місця, щоб влучити пальцем було легше. */
export function zoneAt(point: Point, zones: ReadonlyMap<string, { left: number; top: number; right: number; bottom: number }>, slop = 12): string | null {
  let best: { id: string; area: number } | null = null;
  for (const [id, r] of zones) {
    if (point.x >= r.left - slop && point.x <= r.right + slop && point.y >= r.top - slop && point.y <= r.bottom + slop) {
      const area = (r.right - r.left) * (r.bottom - r.top);
      if (!best || area < best.area) best = { id, area }; // при вкладених місцях — найменше
    }
  }
  return best?.id ?? null;
}
