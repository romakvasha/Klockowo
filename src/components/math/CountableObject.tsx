import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { cx, cssVars } from '../ui/cx';
import { Digits } from '../ui/Digits';
import { ObjectArt } from './ObjectArt';
import type { ObjectId } from '../../speech/nouns';
import styles from './CountableObject.module.css';

/** idle · counted (номерок, підскок) · highlighted (підказка / показ разом) · dimmed (поза групою) · selected (перший дотик із двох) ·
 *  dragging (×1,1 + тінь). Стани — design etap2/07. */
export type ObjectState = 'idle' | 'counted' | 'highlighted' | 'dimmed' | 'selected' | 'dragging';

export interface CountableObjectProps {
  object: ObjectId;
  /** Сторона предмета, px (на сцені 84–96, телефон 64). */
  size: number;
  /** Лівий верхній кут предмета в координатах сцени. */
  x: number;
  y: number;
  state?: ObjectState;
  /** Номерок на лічбі: 1, 2, 3… */
  number?: number;
  /** Невеликі відмінності вигляду, щоб предмети відрізнялися (look: distinct): віддзеркалення, нахил, масштаб. */
  flip?: boolean;
  tilt?: number;
  scale?: number;
  /** Підпис для екранного диктора («biedronka, trzy»). */
  label: string;
  /** Усі предмети підстрибнули разом — правильна відповідь. */
  celebrate?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Зсув, коли предмет летить за вказівником (useDragTap().offset); стан dragging — окремо через `state`. */
  offset?: { x: number; y: number } | null;
  /** Додаткові пропси кнопки: Pointer Events з useDragTap().itemProps(id). */
  bind?: ButtonHTMLAttributes<HTMLButtonElement>;
}

/** Предмет лічби: кнопка з картинкою; зона дотику = предмет + 8 px (BRIEF §12, design etap2/07). Нічого не залежить від hover. */
export function CountableObject({ object, size, x, y, state = 'idle', number, flip = false, tilt = 0, scale = 1, label, celebrate = false, disabled = false, onPress, offset = null, bind }: CountableObjectProps) {
  const pad = 4;
  const badge = Math.round(size * 0.44);
  return (
    <button
      type="button"
      aria-label={label}
      {...bind}
      className={cx(styles.object)}
      data-state={state}
      data-celebrate={celebrate}
      disabled={disabled}
      style={cssVars(
        { '--size': `${size}px`, '--badge': `${badge}px` },
        {
          ...bind?.style,
          left: x - pad,
          top: y - pad,
          width: size + 2 * pad,
          height: size + 2 * pad,
          ...(offset ? { transform: `translate(${offset.x}px, ${offset.y}px)`, zIndex: 5, transition: 'none' } : {}),
        } as CSSProperties,
      )}
      onClick={onPress ?? bind?.onClick}
    >
      <span className={styles.art} style={{ transform: `rotate(${tilt}deg) scale(${flip ? -scale : scale}, ${scale})` }}>
        <ObjectArt object={object} size={size} className={styles.img} />
      </span>
      {number !== undefined && (
        <span className={styles.badge} aria-hidden="true">
          <Digits value={number} style={{ height: Math.round(badge * (number >= 10 ? 0.5 : 0.62)) }} />
        </span>
      )}
    </button>
  );
}
