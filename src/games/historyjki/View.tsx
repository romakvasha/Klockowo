import { useMemo, type ReactNode } from 'react';
import { ObjectArt } from '../../components/math/ObjectArt';
import { TenFrame } from '../../components/math/TenFrame';
import { fitGrid, gridCell } from '../../components/math/fitGrid';
import { Digits } from '../../components/ui/Digits';
import { Operator } from '../../components/ui/Operator';
import { cssVars } from '../../components/ui/cx';
import { LABELS } from '../../speech/lines';
import type { ObjectId } from '../../speech/nouns';
import { placeContent } from '../engine/placeContent';
import type { SceneKind, SceneProps } from '../engine/types';
import { storyFrame, storyMarks } from './assist';
import { storyAnswer, type StoryInstance } from './generate';
import styles from './View.module.css';

/** Три кадри історії: «було» → «прийшло ще» → «?». У альбомі — в ряд, у портреті — стовпчиком (design-px). */
export const ROW = { panel: { w: 200, h: 200 }, gap: 32, design: { w: 3 * 200 + 2 * 32, h: 200 } } as const;
export const COLUMN = { panel: { w: 300, h: 124 }, gap: 34, design: { w: 300, h: 3 * 124 + 2 * 34 } } as const;
const PAD = 12;
const OBJECT_MAX = 56;

export const storyLayout = (kind: SceneKind) => (kind === 'portrait' ? COLUMN : ROW);

function Panel({ x, y, w, h, label, children }: { x: number; y: number; w: number; h: number; label: string; children: ReactNode }) {
  return (
    <div className={styles.panel} role="group" aria-label={label} style={{ left: x, top: y, width: w, height: h }}>
      {children}
    </div>
  );
}

/** Стрілка між кадрами: вправо (альбом) чи вниз (портрет). */
function Arrow({ x, y, down }: { x: number; y: number; down: boolean }) {
  return (
    <svg className={styles.arrow} style={{ left: x, top: y }} width={30} height={30} viewBox="0 0 30 30" aria-hidden="true">
      <path d={down ? 'M15 3V25M5 16L15 26L25 16' : 'M3 15H25M16 6L26 15L16 24'} />
    </svg>
  );
}

function Group({ object, count, marks, delay, panel }: { object: ObjectId; count: number; marks: readonly (number | null)[]; delay: number; panel: { w: number; h: number } }) {
  const w = panel.w - 2 * PAD;
  const h = panel.h - 2 * PAD;
  const fit = useMemo(() => fitGrid(count, w, h, 6, OBJECT_MAX), [count, w, h]);
  return (
    <div className={styles.group} style={{ left: PAD, top: PAD, width: w, height: h }}>
      {Array.from({ length: count }, (_, i) => {
        const p = gridCell(fit, i, count, w, h);
        const mark = marks[i] ?? null;
        return (
          <span key={i} className={styles.item} style={{ left: p.x, top: p.y, width: fit.size, height: fit.size, animationDelay: `${delay + i * 130}ms` }}>
            <ObjectArt object={object} size={Math.round(fit.size * 0.88)} />
            {mark !== null && (
              <span className={styles.badge} style={{ width: Math.round(fit.size * 0.6), height: Math.round(fit.size * 0.6) }}>
                <Digits value={mark} style={{ height: Math.round(fit.size * (mark >= 10 ? 0.26 : 0.34)) }} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Сцена «Historyjki»: три кадри — «було» (a предметів), «прийшло ще» (b предметів; з'являються по одному) і «?». Підказка 1 нумерує предмети лічбою, підказка 2 малює
 *  в третьому кадрі рамку-десятку й веде лічбу «від числа». Після правильної відповіді в третьому кадрі з'являється картка з прикладом «2 + 3 = 5». */
export function StoryScene({ instance, world, kind, area, reserved, assist, celebrating }: SceneProps<StoryInstance>) {
  const layout = storyLayout(kind);
  const place = useMemo(
    () => placeContent(area, reserved, layout.design, { maxScale: 1.4 }),
    // reserved береться за вмістом: його ідентичність щоразу нова
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area.w, area.h, kind, JSON.stringify(reserved)],
  );
  const { a, b } = instance;
  const sum = storyAnswer(instance);
  const column = kind === 'portrait';
  const { panel, gap } = layout;
  const at = (i: number) => (column ? { x: 0, y: i * (panel.h + gap) } : { x: i * (panel.w + gap), y: 0 });
  const [p1, p2, p3] = [at(0), at(1), at(2)];
  const arrowAt = (p: { x: number; y: number }) => ({
    x: column ? p.x + panel.w / 2 - 15 : p.x + panel.w + (gap - 30) / 2,
    y: column ? p.y + panel.h + (gap - 30) / 2 : p.y + panel.h / 2 - 15,
  });

  const counting = assist.mode === 'hint' && (assist.level ?? 1) <= 1 ? assist.step : 0;
  const marks = storyMarks(a, b, counting);
  const frameOn = (assist.mode === 'hint' && (assist.level ?? 1) >= 2) || assist.mode === 'together';
  const step = frameOn ? assist.step : 0;
  const cells = sum > 10 ? 20 : 10;
  const frameCell = column ? 22 : 30;
  const frameMarks = Array.from({ length: cells }, (_, i) => (i >= a && i < step ? i + 1 : null));
  const digitH = column ? 34 : 38;
  const opH = column ? 28 : 32;

  return (
    <div className={styles.scene} style={{ width: area.w, height: area.h }}>
      <div
        className={styles.stage}
        style={{
          left: place.x, top: place.y, width: layout.design.w, height: layout.design.h, transform: `scale(${place.scale})`,
          ...cssVars({ '--st-100': `var(--kl-${world}-100)`, '--st-700': `var(--kl-${world}-700)` }),
        }}
      >
        <Panel {...p1} w={panel.w} h={panel.h} label={LABELS.storyFirst}>
          <Group object={instance.object} count={a} marks={marks.first} delay={0} panel={panel} />
        </Panel>
        <Arrow {...arrowAt(p1)} down={column} />
        <Panel {...p2} w={panel.w} h={panel.h} label={LABELS.storySecond}>
          <Group object={instance.other} count={b} marks={marks.second} delay={700} panel={panel} />
        </Panel>
        <Arrow {...arrowAt(p2)} down={column} />
        <Panel {...p3} w={panel.w} h={panel.h} label={LABELS.storyQuestion}>
          <div className={styles.answer} data-celebrate={celebrating}>
            {celebrating ? (
              <span className={styles.equation} role="img" aria-label={LABELS.equation}>
                <Digits value={a} style={{ height: digitH }} />
                <Operator kind="plus" style={{ height: opH }} />
                <Digits value={b} style={{ height: digitH }} />
                <Operator kind="equals" style={{ height: opH }} />
                <Digits value={sum} style={{ height: digitH }} />
              </span>
            ) : frameOn ? (
              <TenFrame cells={cells} state={storyFrame(a, sum, step)} world={world} cell={frameCell} marks={frameMarks} />
            ) : (
              <b className={styles.question}>?</b>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
