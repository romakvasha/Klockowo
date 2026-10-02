import { useEffect, useMemo, useState } from 'react';
import { BusFrame } from '../../components/math/BusFrame';
import { busGeometry, busWidthFor } from '../../components/math/busLayout';
import type { Rect } from '../engine/layoutObjects';
import type { SceneProps } from '../engine/types';
import { helpCountSeats, seatMarks, usesRowHint } from './assist';
import { BUS_CAPACITY, seatsTaken, type BusInstance } from './generate';
import styles from './View.module.css';

const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Де стоїть автобус на сцені: по центру, а коли він зачіпає ділянку Kubika (reserved) — зсувається праворуч за неї; без перекриття зі смугою кісточок (телефон). */
export function busPlacement(area: { w: number; h: number }, reserved: readonly Rect[], rows = 2): { x: number; y: number; width: number } {
  const topStrip = reserved.filter((r) => r.y === 0 && r.w >= area.w).reduce((m, r) => Math.max(m, r.h), 0);
  const free = { w: area.w, h: area.h - topStrip };
  const width = busWidthFor(free, rows);
  const g = busGeometry(width, rows);
  const y = Math.round(topStrip + (free.h - g.height) / 2);
  let x = Math.round((area.w - width) / 2);
  const box = (left: number): Rect => ({ x: left, y, w: width, h: g.height });
  const hit = reserved.find((r) => !(r.y === 0 && r.w >= area.w) && intersects(box(x), r));
  if (hit) x = Math.min(Math.max(x, hit.x + hit.w + 8), Math.max(0, area.w - width - 8));
  return { x, y, width };
}

/** Сцена «Autobus dziesiątka»: автобус по центру. Місця закриті «завісою», якщо в завданні вступний показ (exposureMs): автобус відкривається на мить після інструкції.
 *  Підказки: перший ряд пульсує як «5» або Kubik позначає місця числами 1, 2, 3…; правильна відповідь — тваринки радіють. */
export function BusScene({ instance, world, area, reserved, assist, celebrating }: SceneProps<BusInstance>) {
  const place = useMemo(
    () => busPlacement(area, reserved),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, JSON.stringify(reserved)],
  );
  const [pinned, setPinned] = useState(false);
  // 2-га підказка лишає автобус відкритим до кінця завдання
  useEffect(() => {
    if (assist.mode === 'hint' && (assist.level ?? 1) >= 2) setPinned(true);
  }, [assist.mode, assist.level]);

  const helping = assist.mode === 'hint' || assist.mode === 'together';
  const flashing = assist.mode === 'intro' && assist.step === 1;
  const revealed = instance.exposureMs <= 0 || flashing || helping || pinned || celebrating;
  const marks = helping ? seatMarks(helpCountSeats(instance, assist), assist.step) : undefined;
  const rowHint = assist.mode === 'hint' && (assist.level ?? 1) <= 1 && usesRowHint(instance) && assist.step >= 1;
  const taken = seatsTaken(instance.passengers);
  const seats = Array.from({ length: BUS_CAPACITY }, (_, i) => (taken[i] ? instance.riders[i] ?? null : null));

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div className={styles.bus} style={{ left: place.x, top: place.y }}>
        <BusFrame
          seats={seats}
          world={world}
          width={place.width}
          covered={!revealed}
          pulseRow={rowHint ? { row: 0, value: 5 } : null}
          marks={marks}
          celebrate={celebrating}
        />
      </div>
    </div>
  );
}
