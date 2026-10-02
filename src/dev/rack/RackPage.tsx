import { useState } from 'react';
import { Link } from 'react-router';
import { BeadRack20 } from '../../components/math/BeadRack20';
import { Slider } from '../../components/ui/Slider';

/** /#/dev/rack — рахівниця на 20 (етап M16): повзунок «скільки відсунуто», усі світи. */
export function RackPage() {
  const [moved, setMoved] = useState(13);
  return (
    <main style={{ padding: 24, minHeight: '100dvh', background: 'var(--kl-w4-50)' }}>
      <Link to="/dev">← Dev</Link>
      <h1 style={{ fontSize: 28 }}>Рахівниця на 20</h1>
      <p>Відсунуто: {moved}</p>
      <Slider label="Відсунуто" min={0} max={20} step={1} value={moved} onChange={setMoved} />
      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        {(['w3', 'w4', 'w5'] as const).map((w) => (
          <BeadRack20 key={w} moved={moved} world={w} />
        ))}
        <BeadRack20 moved={moved} world="w4" bead={26} />
      </div>
    </main>
  );
}
