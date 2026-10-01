import type { WorldKey } from '../speech/nouns';

/** 17 поз Kubika (design etap1/11); `talking` — не поза, а прапор (рот A/O/E) на будь-якій позі. */
export const KUBIK_POSES = [
  'idle', 'pointing-left', 'pointing-right', 'pointing-down', 'demonstrating', 'thinking', 'happy', 'celebrating',
  'encouraging', 'waving', 'surprised', 'with-card', 'on-kart', 'sleepy', 'break-jump', 'break-clap', 'break-stomp',
] as const;
export type KubikPose = (typeof KUBIK_POSES)[number];

/** Три форми рота «talking» — окремі файли kubik-talking-a|o|e (відрізняються від idle лише #mouth). */
export const MOUTH_SHAPES = ['a', 'o', 'e'] as const;

/** Аксесуар світу: капелюшок W1, пов'язка W2, окуляри W3, каска W4, бінокль W5, кепка W6, шолом W7. У хабі аксесуара немає. */
export const ACCESSORY_WORLDS: readonly WorldKey[] = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'];

/** Команда — гості місій (BRIEF §9): по 3 пози й власний транспорт. */
export const TEAM_MEMBERS = ['latka', 'pufka', 'tofik', 'iskra'] as const;
export type TeamMember = (typeof TEAM_MEMBERS)[number];
export const TEAM_POSES = ['idle', 'happy', 'pointing'] as const;
export type TeamPose = (typeof TEAM_POSES)[number];

export const VEHICLES = ['balon', 'zaglowka', 'pociag', 'rakieta'] as const;
export type VehicleKind = (typeof VEHICLES)[number];

export interface TeamInfo {
  /** Порода (для дорослого й aria). */
  breed: string;
  /** Світи, де цуценя — гість. */
  worlds: string;
  /** Колір спорядження = колір першого світу, де цуценя — гість. */
  vest: string;
  vehicle: VehicleKind;
}

export const TEAM: Readonly<Record<TeamMember, TeamInfo>> = {
  latka: { breed: 'jack russell terrier', worlds: 'W1–W2', vest: '#7BCB5A', vehicle: 'balon' },
  pufka: { breed: 'samoyed', worlds: 'W3', vest: '#3FA9F5', vehicle: 'zaglowka' },
  tofik: { breed: 'scottish terrier', worlds: 'W4–W5', vest: '#FF6B6B', vehicle: 'pociag' },
  iskra: { breed: 'corgi', worlds: 'W7', vest: '#6C63FF', vehicle: 'rakieta' },
};

/** Розмір транспорту на борді дизайну (etap2/13), px: ширина × висота. */
export const VEHICLE_SIZE: Readonly<Record<VehicleKind, readonly [number, number]>> = {
  balon: [124, 148],
  zaglowka: [180, 147],
  pociag: [300, 133],
  rakieta: [91, 148],
};

/** Рух за позою: breathe — «дихання» 3 с у спокої; hop — стрибок 12 px + хвіст ±15° (350 мс), раз при появі пози; none — поза сама рух. */
export type Motion = 'breathe' | 'hop' | 'none';

const HOP: ReadonlySet<string> = new Set(['happy', 'celebrating']);
const STATIC: ReadonlySet<string> = new Set(['surprised', 'on-kart', 'break-jump', 'break-clap', 'break-stomp']);

export function motionOf(pose: string): Motion {
  if (HOP.has(pose)) return 'hop';
  if (STATIC.has(pose)) return 'none';
  return 'breathe';
}

/** Стани MascotStage (design etap2/06) → поза Kubika. */
export const MASCOT_STATES = ['idle', 'talking', 'pointing', 'hint', 'retry', 'together', 'correct'] as const;
export type MascotState = (typeof MASCOT_STATES)[number];

export type PointingDirection = 'left' | 'right' | 'down';

export function mascotPose(state: MascotState, pointing: PointingDirection = 'down'): KubikPose {
  switch (state) {
    case 'idle':
    case 'talking':
      return 'idle';
    case 'pointing':
      return `pointing-${pointing}`;
    case 'hint':
      return 'demonstrating';
    case 'retry':
      return 'encouraging';
    case 'together':
      return 'with-card';
    case 'correct':
      return 'happy';
  }
}
