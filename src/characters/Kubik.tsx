import { useMemo } from 'react';
import type { WorldKey } from '../speech/nouns';
import { kubikMarkup } from './markup';
import { motionOf, type KubikPose } from './poses';
import { Rig, type RigProps } from './Rig';

export interface KubikProps extends Pick<RigProps, 'talking' | 'animate' | 'size' | 'label' | 'className' | 'style'> {
  pose?: KubikPose;
  /** Аксесуар світу на голові (W1 капелюшок … W7 шолом); у хабі й на мапі — без нього. */
  accessory?: WorldKey | null;
  /** Число на картці в лапах — лише для пози with-card. */
  card?: number;
}

/** «Kubik» — провідник дитини (BRIEF §9). Поза — окремий SVG із шарами; рот говорить (A/O/E) на будь-якій позі, коли `talking`
 *  (зазвичай `useTts().speaking`). Лапками не рахує «на пальцях»: кількість — кубиками (demonstrating) чи карткою (with-card). */
export function Kubik({ pose = 'idle', accessory = null, card, ...rest }: KubikProps) {
  const art = useMemo(() => kubikMarkup(pose, { accessory, card }), [pose, accessory, card]);
  return <Rig key={pose} art={art} pose={pose} motion={motionOf(pose)} {...rest} />;
}
