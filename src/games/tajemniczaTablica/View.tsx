import { useEffect, useMemo, useRef, useState } from 'react';
import { ChartGrid, type ChartCell } from '../../components/math/ChartGrid';
import { MAGNIFIER_CELL, NAV_BUTTON, miniCell, pickChartLayout, rowNumbers, rowOf } from '../../components/math/chartLayout';
import { LABELS } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import type { SceneProps } from '../engine/types';
import { hintCells, hintTarget, paintedByHint } from './assist';
import { paintedCorrectly, type ChartInstance } from './generate';
import styles from './View.module.css';

/** Рядок, з якого починає лупа: для «що під листочком» і сусідів — рядок шуканого/базового числа, для решти — перший. */
export function startRow(i: Pick<ChartInstance, 'mode' | 'target'>): number {
  return i.mode === 'hidden' || i.mode === 'neighbors' ? rowOf(i.target) : 0;
}

function NavButton({ dir, disabled, onPress }: { dir: 'up' | 'down'; disabled: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      className={`kl-block ${styles.nav}`}
      aria-label={dir === 'up' ? LABELS.rowUp : LABELS.rowDown}
      disabled={disabled}
      onClick={onPress}
      style={{ width: NAV_BUTTON, height: NAV_BUTTON }}
    >
      <svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true" focusable="false">
        <path d={dir === 'up' ? 'M8 26L20 12L32 26' : 'M8 14L20 28L32 14'} />
      </svg>
    </button>
  );
}

/** Сцена «Tajemnicza tablica» (BRIEF §12, виняток для таблиці 100): мініатюра всієї таблиці (дитина лише дивиться) і лупа — один рядок із клітинками від 64 px; рядок перемикають кнопки
 *  «вгору/вниз» (80 px). find: дотик по клітинці вибирає число («Gotowe»); paint: дотики розфарбовують клітинки з цифрою на кінці; hidden і neighbors: відповідь — плитка. Підказки
 *  підсвічують ряд (десятки) і стовпчик (одиниці) на мініатюрі й у лупі. */
export function ChartScene({ instance, world, area, reserved, assist, phase, celebrating, last, onRespond, onTouch }: SceneProps<ChartInstance>) {
  const { layout, place } = useMemo(
    () => pickChartLayout(area, reserved, instance.rows),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, instance.rows, JSON.stringify(reserved)],
  );
  const { mode, max, leaves, target } = instance;
  const [row, setRow] = useState(startRow(instance));
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState<readonly number[]>([]);
  const [painted, setPainted] = useState<ReadonlySet<number>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selected;
  const interactive = phase === 'play' && assist.mode === 'none';
  const acts = mode === 'find' || mode === 'paint';

  // дія дитини → число для «Gotowe»: find — вибране число, paint — 1, коли розфарбовано рівно потрібні числа (інакше 0)
  useEffect(() => {
    if (!acts || phase !== 'play') return;
    if (mode === 'find') onRespond?.(selected);
    else onRespond?.(painted.size > 0 ? (paintedCorrectly(painted, instance.paintSet) ? 1 : 0) : null);
  }, [acts, phase, mode, selected, painted, instance.paintSet, onRespond]);

  // після хибної перевірки (find) вибір знімається, а число приглушується — «спробуй ще»
  useEffect(() => {
    if (mode !== 'find' || (last !== 'wrong1' && last !== 'wrong2')) return;
    const s = selectedRef.current;
    if (s !== null) {
      setWrong((w) => (w.includes(s) ? w : [...w, s]));
      setSelected(null);
    }
  }, [last, mode]);

  // допомога Kubika: лупа переходить на рядок шуканого числа; показ «разом» — вибирає/розкриває, розфарбовує по одному
  useEffect(() => {
    if (assist.mode === 'hint' && mode !== 'paint') setRow(rowOf(hintTarget(instance)));
    if (assist.mode === 'together') {
      if (mode === 'paint') setPainted(new Set(instance.paintSet.slice(0, assist.step)));
      else {
        setRow(rowOf(hintTarget(instance)));
        if (assist.step >= 1) {
          setRevealed(true);
          if (mode === 'find') setSelected(target);
        }
      }
    }
    if (assist.mode === 'hint' && mode === 'paint' && (assist.level ?? 1) >= 2 && assist.step > 0) {
      setPainted((p) => new Set([...p, ...instance.paintSet.slice(0, Math.min(assist.step, paintedByHint(instance.paintSet.length)))]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assist.mode, assist.step, assist.level]);

  const hints = assist.mode === 'hint' ? hintCells(instance, assist.level ?? 1) : assist.mode === 'together' && mode !== 'paint' ? hintCells(instance, 2) : null;
  const reveal = revealed || celebrating;

  const cellState = (n: number): ChartCell => {
    if (n > max) return 'dim';
    if (mode === 'hidden' && n === target) return reveal ? 'hl' : 'ask';
    if (leaves.includes(n) && !(mode === 'find' && (selected === n || (reveal && n === target)))) return 'leaf';
    if (mode === 'paint' && painted.has(n)) return 'painted';
    if (mode === 'find' && (selected === n || (celebrating && n === target))) return 'selected';
    if (mode === 'neighbors' && n === target) return 'hl';
    if (mode === 'neighbors' && reveal && n === target + instance.delta) return 'hl';
    if (wrong.includes(n)) return 'dim';
    if (hints?.has(n)) return 'hl';
    return 'normal';
  };

  const press = (n: number) => {
    if (!interactive || n > max) return;
    onTouch?.();
    sfx.play('tap');
    void tts.speak(numberWords(n), { interrupt: true });
    if (mode === 'find') {
      if (wrong.includes(n)) return;
      setSelected(selected === n ? null : n);
    } else if (mode === 'paint') {
      setPainted((p) => {
        const next = new Set(p);
        if (next.has(n)) next.delete(n);
        else next.add(n);
        return next;
      });
    }
  };

  const lastRow = instance.rows - 1;
  const go = (delta: number) => {
    onTouch?.();
    sfx.play('tap');
    setRow((r) => Math.max(0, Math.min(lastRow, r + delta)));
  };

  const mc = miniCell(layout.mini.size);
  const all = useMemo(() => Array.from({ length: instance.rows * 10 }, (_, i) => i + 1), [instance.rows]);
  const lineNumbers = rowNumbers(row);
  const labelOf = (n: number) => numberWords(n);

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div
        className={styles.stage}
        style={{ left: place.x, top: place.y, width: layout.design.w, height: layout.design.h, transform: `scale(${place.scale})` }}
      >
        <div className={styles.mini} style={{ left: layout.mini.x, top: layout.mini.y }}>
          <ChartGrid numbers={all} cols={10} cell={mc} world={world} state={cellState} showNumbers={mc >= 24} label={LABELS.chart} />
          <span className={styles.rowFrame} style={{ top: 3 + row * mc, height: mc, width: mc * 10 }} aria-hidden="true" />
        </div>
        <div className={styles.nav1} style={{ left: layout.up.x, top: layout.up.y }}>
          <NavButton dir="up" disabled={row <= 0} onPress={() => go(-1)} />
        </div>
        <div className={styles.nav1} style={{ left: layout.down.x, top: layout.down.y }}>
          <NavButton dir="down" disabled={row >= lastRow} onPress={() => go(1)} />
        </div>
        <div className={styles.magnifier} style={{ left: layout.magnifier.x, top: layout.magnifier.y }} data-celebrate={celebrating}>
          <ChartGrid
            numbers={lineNumbers}
            cols={layout.magnifier.cols}
            cell={MAGNIFIER_CELL}
            world={world}
            state={cellState}
            onPress={acts && interactive ? press : undefined}
            labelOf={labelOf}
            label={LABELS.chartRow}
          />
        </div>
      </div>
    </div>
  );
}
