import type { SceneProps } from '../engine/types';
import type { JumpInstance } from './generate';
import { RocketScene } from './RocketView';
import { PondScene } from './View';

/** Сцена «Skoki żabki»: жабка на листках (W3–W4) або ракета на прямій 0–100 (W7). */
export function JumpScene(props: SceneProps<JumpInstance>) {
  return props.instance.vehicle === 'rocket' ? <RocketScene {...props} /> : <PondScene {...props} />;
}
