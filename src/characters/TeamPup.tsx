import { TEAM_URL, artOf } from './art';
import { Figure, type FigureProps } from './Figure';
import { motionOf, type TeamMember, type TeamPose } from './poses';

export interface TeamPupProps extends Pick<FigureProps, 'animate' | 'size' | 'label' | 'className' | 'style'> {
  member: TeamMember;
  pose?: TeamPose;
  /** Дзеркально: у pointing команда показує вправо, вліво — flip. */
  flip?: boolean;
}

/** Гість місії: Łatka, Pufka, Tofik або Iskra (BRIEF §9), картинки v2. Без рота «talking» — гість говорить лише у Wprowadzenie,
 *  і там його показано в pointing. */
export function TeamPup({ member, pose = 'idle', flip = false, ...rest }: TeamPupProps) {
  const key = `${member}-${pose}`;
  return <Figure key={key} art={artOf(TEAM_URL, key, `team-${key}`)} pose={key} motion={motionOf(pose)} flip={flip} {...rest} />;
}
