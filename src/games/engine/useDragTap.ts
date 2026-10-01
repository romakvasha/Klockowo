import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { IDLE, dragOffset, dragStep, zoneAt, type DragEvent, type DragState, type Point } from './dragTap';

export interface UseDragTapOptions<Id extends string> {
  /** Предмет `id` поставлено на місце `zone` (перетягуванням чи двома дотиками). */
  onDrop: (id: Id, zone: string) => void;
  disabled?: boolean;
}

export interface DragTap<Id extends string> {
  state: DragState<Id>;
  /** Вибраний першим дотиком предмет (чекає дотику до місця). */
  selectedId: Id | null;
  draggingId: Id | null;
  /** Зсув предмета, що летить за вказівником, px. */
  offset: Point | null;
  /** Над яким місцем зараз предмет, що летить; або місце вважається «цільовим», коли щось вибрано. */
  overZone: string | null;
  /** Пропси кнопки-предмета: Pointer Events (миша й дотик), клавіатура (Enter/Space = дотик). */
  itemProps(id: Id): {
    onPointerDown(e: PointerEvent<HTMLElement>): void;
    onPointerMove(e: PointerEvent<HTMLElement>): void;
    onPointerUp(e: PointerEvent<HTMLElement>): void;
    onPointerCancel(): void;
    onKeyDown(e: KeyboardEvent<HTMLElement>): void;
    style: { touchAction: 'none' };
  };
  /** Пропси місця: реєстрація для влучання й дотик «предмет → місце». */
  zoneProps(zone: string): { ref(el: HTMLElement | null): void; onClick(): void };
}

/** Перетягування на Pointer Events із заміною «дотик по предмету → дотик по місцю» (BRIEF §7). Усю логіку веде чистий автомат dragStep:
 *  хук лише переводить події браузера й знаходить місце під вказівником. Нічого не залежить від hover. */
export function useDragTap<Id extends string>({ onDrop, disabled = false }: UseDragTapOptions<Id>): DragTap<Id> {
  const [state, setState] = useState<DragState<Id>>(IDLE as DragState<Id>);
  const stateRef = useRef(state);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;
  const zones = useRef(new Map<string, HTMLElement>());

  const apply = useCallback((event: DragEvent<Id>) => {
    const step = dragStep(stateRef.current, event);
    stateRef.current = step.state;
    setState(step.state);
    if (step.drop) dropRef.current(step.drop.id, step.drop.zone);
  }, []);

  const over = (e: PointerEvent<HTMLElement>): string | null => {
    const rects = new Map<string, { left: number; top: number; right: number; bottom: number }>();
    zones.current.forEach((el, id) => rects.set(id, el.getBoundingClientRect()));
    return zoneAt({ x: e.clientX, y: e.clientY }, rects);
  };

  const itemProps: DragTap<Id>['itemProps'] = (id) => ({
    onPointerDown(e) {
      if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId); // рух і відпускання приходять, навіть коли палець зійшов з предмета
      } catch {
        /* вказівник уже не активний чи захоплення недоступне — працюємо без нього */
      }
      apply({ type: 'down', id, at: { x: e.clientX, y: e.clientY } });
    },
    onPointerMove(e) {
      if (stateRef.current.mode === 'idle') return;
      apply({ type: 'move', at: { x: e.clientX, y: e.clientY }, over: over(e) });
    },
    onPointerUp(e) {
      if (stateRef.current.mode === 'idle') return;
      apply({ type: 'up', at: { x: e.clientX, y: e.clientY }, over: over(e) });
    },
    onPointerCancel() {
      apply({ type: 'cancel' });
    },
    onKeyDown(e) {
      if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      apply({ type: 'tapItem', id });
    },
    style: { touchAction: 'none' },
  });

  const zoneProps: DragTap<Id>['zoneProps'] = (zone) => ({
    ref(el) {
      if (el) zones.current.set(zone, el);
      else zones.current.delete(zone);
    },
    onClick() {
      if (!disabled) apply({ type: 'tapZone', zone });
    },
  });

  return {
    state,
    selectedId: state.mode === 'dragging' ? null : state.selected,
    draggingId: state.mode === 'dragging' ? state.id : null,
    offset: dragOffset(state),
    overZone: state.mode === 'dragging' ? state.over : null,
    itemProps,
    zoneProps,
  };
}
