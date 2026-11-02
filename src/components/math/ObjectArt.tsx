import type { CSSProperties } from 'react';
import type { ObjectId } from '../../speech/nouns';
import { itemUrl } from './art';

export interface ObjectArtProps {
  object: ObjectId;
  /** Сторона квадрата, px. */
  size: number;
  className?: string;
  style?: CSSProperties;
}

/** Малюнок предмета лічби (BRIEF §10): картинка v2, вписана в квадрат. */
export function ObjectArt({ object, size, className, style }: ObjectArtProps) {
  return <img className={className} src={itemUrl(object)} alt="" draggable={false} style={{ width: size, height: size, ...style }} />;
}
