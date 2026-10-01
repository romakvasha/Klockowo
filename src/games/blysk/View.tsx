import { useEffect, useMemo, useState } from 'react';
import { DotCard } from '../../components/math/DotCard';
import { LABELS } from '../../speech/lines';
import type { SceneProps } from '../engine/types';
import type { FlashInstance } from './generate';
import { flashLayout } from './generate';
import styles from './View.module.css';

/** Розмір картки на сцені: до 70 % меншої сторони, 120…260 px. */
export function cardSize(area: { w: number; h: number }): number {
  return Math.round(Math.min(260, Math.max(120, Math.min(area.w * 0.6, area.h * 0.78))));
}

/** Сцена «Błysk!»: картка в центрі. Спершу вона лежить зворотом; після інструкції спалахує на `exposureMs` (вступний показ), потім знову зворотом.
 *  Після 2-ї підказки картка лишається видимою з групами; правильна відповідь повертає її з обведеними групами. */
export function FlashScene({ instance, world, area, assist, celebrating }: SceneProps<FlashInstance>) {
  const layout = useMemo(() => flashLayout(instance), [instance]);
  const [pinned, setPinned] = useState(false);

  // 2-га підказка закріплює картку лицем із групами до кінця завдання
  useEffect(() => {
    if (assist.mode === 'hint' && (assist.level ?? 1) >= 2) setPinned(true);
  }, [assist.mode, assist.level]);

  const flashing = assist.mode === 'intro' && assist.step === 1;
  const helping = assist.mode === 'together' || (assist.mode === 'hint' && assist.step >= 1);
  const showGroups = celebrating || pinned || assist.mode === 'together';
  const front = flashing || helping || pinned || celebrating;
  return (
    <div className={styles.scene} data-front={front}>
      <DotCard layout={layout} face={front ? 'front' : 'back'} groups={showGroups} size={cardSize(area)} world={world} label={LABELS.dotCard} />
    </div>
  );
}
