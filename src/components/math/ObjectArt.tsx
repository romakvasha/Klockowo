import type { CSSProperties } from 'react';
import type { WorldKey } from '../../curriculum/types';
import { WORLD_OBJECT_IDS, type ObjectId } from '../../speech/nouns';
import { Icon } from '../ui/Icon';
import { itemUrl } from './art';

/** Світ, якому належить предмет (для значка-заміни, коли малюнка ще немає). */
export function worldOfObject(object: ObjectId): WorldKey {
  for (const [world, ids] of Object.entries(WORLD_OBJECT_IDS) as [WorldKey, readonly string[]][]) {
    if (ids.includes(object)) return world;
  }
  return 'w1';
}

export interface ObjectArtProps {
  object: ObjectId;
  /** Сторона квадрата, px. */
  size: number;
  className?: string;
  style?: CSSProperties;
}

/** Малюнок предмета лічби (BRIEF §10): картинка з дизайну; предмети W4–W7, яких ще не намальовано, замінює значок їхнього світу. */
export function ObjectArt({ object, size, className, style }: ObjectArtProps) {
  const src = itemUrl(object);
  const box: CSSProperties = { width: size, height: size, ...style };
  if (src) return <img className={className} src={src} alt="" draggable={false} style={box} />;
  return <Icon name={worldOfObject(object)} className={className} style={{ ...box, color: 'var(--kl-ink)' }} />;
}
