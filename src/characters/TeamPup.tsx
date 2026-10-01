import { useMemo } from 'react';
import { teamMarkup } from './markup';
import { motionOf, type TeamMember, type TeamPose } from './poses';
import { Rig, type RigProps } from './Rig';

export interface TeamPupProps extends Pick<RigProps, 'animate' | 'size' | 'label' | 'className' | 'style'> {
  member: TeamMember;
  pose?: TeamPose;
  /** Дзеркально: у pointing команда показує вправо, вліво — flip. */
  flip?: boolean;
}

/** Гість місії: Łatka, Pufka, Tofik або Iskra (BRIEF §9). Ті самі групи SVG, що й у Kubika; без рота «talking» —
 *  гість говорить лише у Wprowadzenie, і там його показано в pointing. */
export function TeamPup({ member, pose = 'idle', flip = false, ...rest }: TeamPupProps) {
  const art = useMemo(() => teamMarkup(member, pose), [member, pose]);
  return <Rig key={`${member}-${pose}`} art={art} pose={`${member}-${pose}`} motion={motionOf(pose)} flip={flip} {...rest} />;
}
