import { useState } from 'react';
import { Link } from 'react-router';
import { CountableObject } from '../../components/math/CountableObject';
import { DropZone } from '../../components/math/DropZone';
import { ObjectArt } from '../../components/math/ObjectArt';
import { useDragTap } from '../../games/engine/useDragTap';
import styles from '../path/Path.module.css';

const SPOTS = [
  { id: 'a', x: 40, y: 40 }, { id: 'b', x: 160, y: 90 }, { id: 'c', x: 290, y: 30 }, { id: 'd', x: 70, y: 190 }, { id: 'e', x: 230, y: 200 },
] as const;

/** /#/dev/drag — перетягування яблук на тарілку: мишею й дотиком, або двома дотиками (яблуко → тарілка), або Tab + Enter. Етап M8 (хук для M9). */
export function DragPage() {
  const [onPlate, setOnPlate] = useState<string[]>([]);
  const drag = useDragTap<string>({ onDrop: (id) => setOnPlate((list) => (list.includes(id) ? list : [...list, id])) });
  const zone = drag.zoneProps('plate');
  const state = drag.overZone === 'plate' || drag.selectedId !== null ? 'target' : onPlate.length > 0 ? 'filled' : 'empty';
  return (
    <main style={{ padding: 24, minHeight: '100dvh', background: 'var(--kl-w2-50)' }}>
      <Link to="/dev" style={{ position: 'relative', zIndex: 2 }}>← Dev</Link>
      <h1 style={{ fontSize: 28 }}>Перетягування + два дотики</h1>
      <p style={{ maxWidth: 560 }}>На тарілці: {onPlate.length}. Вибрано: {drag.selectedId ?? '—'}. Яблуко можна перетягнути або торкнутися, а потім торкнутися тарілки.</p>
      <div style={{ position: 'relative', width: 420, height: 300, background: '#fff', borderRadius: 24, touchAction: 'none' }}>
        {SPOTS.filter((s) => !onPlate.includes(s.id)).map((s) => (
          <CountableObject
            key={s.id} object="jablko" size={84} x={s.x} y={s.y}
            state={drag.draggingId === s.id ? 'dragging' : drag.selectedId === s.id ? 'selected' : 'idle'}
            label="jabłko" offset={drag.draggingId === s.id ? drag.offset : null} bind={drag.itemProps(s.id)}
          />
        ))}
      </div>
      <DropZone label="talerz" state={state} zoneRef={zone.ref} onPress={zone.onClick} style={{ width: 280, height: 110, marginTop: 24 }}>
        {onPlate.map((id) => <ObjectArt key={id} object="jablko" size={54} />)}
      </DropZone>
      <button type="button" className={styles.panel} style={{ position: 'static', transform: 'none', marginTop: 16 }} onClick={() => setOnPlate([])}>Скинути</button>
    </main>
  );
}
