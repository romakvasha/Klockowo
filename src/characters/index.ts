// Персонажі (M4): Kubik, команда-гості, 8 цуценят для вибору, MascotStage. Рух — styles/motion.css (--kl-anim-*),
// розмір Kubika за в'юпортом — styles/responsive.css (--kl-kubik-h).
export { Kubik, type KubikProps } from './Kubik';
export { MascotStage, type MascotStageProps } from './MascotStage';
export { PlayerPup, type PlayerPupProps } from './PlayerPup';
export {
  ACCESSORY_WORLDS, KUBIK_POSES, MASCOT_STATES, TEAM, TEAM_MEMBERS, TEAM_POSES, VEHICLES, mascotPose, motionOf,
  type KubikPose, type MascotState, type PointingDirection, type TeamMember, type TeamPose, type VehicleKind,
} from './poses';
export { PUP_IDS, PUP_TINTS, pupLabel, type PupId } from './pups';
export { TeamPup, type TeamPupProps } from './TeamPup';
export { Vehicle, type VehicleProps } from './Vehicle';
