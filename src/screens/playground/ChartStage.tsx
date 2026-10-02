import { useMemo } from 'react';
import { useElementSize } from '../../app/useElementSize';
import { ChartGrid, type ChartCell } from '../../components/math/ChartGrid';
import { MAGNIFIER_CELL, NAV_BUTTON, miniCell, pickChartLayout, rowNumbers } from '../../components/math/chartLayout';
import type { WorldKey } from '../../curriculum/types';
import { LABELS } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import styles from './Playground.module.css';

export interface ChartStageProps {
  world: WorldKey;
  /** Активний рядок (0–9): лупа показує його; рамка на мініатюрі. */
  row: number;
  onRow: (row: number) => void;
  state: (n: number) => ChartCell;
  paint?: (n: number) => number;
  /** Дотик по клітинці лупи; без нього лупа тільки показує. */
  onPress?: (n: number) => void;
}

/** Таблиця 100 у «Plac Zabaw» (вільна гра й лічба): мініатюра + лупа-рядок і кнопки «вгору/вниз», ті самі розкладки, що й у грі «Tajemnicza tablica» (BRIEF §12). Займає весь вільний простір. */
export function ChartStage({ world, row, onRow, state, paint, onPress }: ChartStageProps) {
  const [ref, area] = useElementSize<HTMLDivElement>();
  const { layout, place } = useMemo(() => pickChartLayout(area.w > 0 ? area : { w: 800, h: 360 }, [], 10), [area]);
  const mc = miniCell(layout.mini.size);
  const all = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), []);
  const arrow = (dir: 'up' | 'down') => (
    <button
      type="button"
      className={`kl-block ${styles.nav}`}
      aria-label={dir === 'up' ? LABELS.rowUp : LABELS.rowDown}
      disabled={dir === 'up' ? row <= 0 : row >= 9}
      onClick={() => onRow(row + (dir === 'up' ? -1 : 1))}
      style={{ width: NAV_BUTTON, height: NAV_BUTTON }}
    >
      <svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true" focusable="false">
        <path d={dir === 'up' ? 'M8 26L20 12L32 26' : 'M8 14L20 28L32 14'} />
      </svg>
    </button>
  );
  return (
    <div ref={ref} className={styles.stageArea}>
      <div className={styles.stage} style={{ left: place.x, top: place.y, width: layout.design.w, height: layout.design.h, transform: `scale(${place.scale})` }}>
        <div className={styles.mini} style={{ left: layout.mini.x, top: layout.mini.y }}>
          <ChartGrid numbers={all} cols={10} cell={mc} world={world} state={state} paint={paint} showNumbers={mc >= 24} label={LABELS.chart} />
          <span className={styles.rowFrame} style={{ top: 3 + row * mc, height: mc, width: mc * 10 }} aria-hidden="true" />
        </div>
        <div className={styles.abs} style={{ left: layout.up.x, top: layout.up.y }}>{arrow('up')}</div>
        <div className={styles.abs} style={{ left: layout.down.x, top: layout.down.y }}>{arrow('down')}</div>
        <div className={styles.abs} style={{ left: layout.magnifier.x, top: layout.magnifier.y }}>
          <ChartGrid
            numbers={rowNumbers(row)}
            cols={layout.magnifier.cols}
            cell={MAGNIFIER_CELL}
            world={world}
            state={state}
            paint={paint}
            onPress={onPress}
            labelOf={numberWords}
            label={LABELS.chartRow}
          />
        </div>
      </div>
    </div>
  );
}
