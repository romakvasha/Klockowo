import { useState } from 'react';
import { Link } from 'react-router';
import { BlockCube } from '../../components/math/BlockCube';
import { BlockPlate } from '../../components/math/BlockPlate';
import { BlockRod } from '../../components/math/BlockRod';
import { PlaceValueMat } from '../../components/math/PlaceValueMat';
import { StickBundle } from '../../components/math/StickBundle';
import { Slider } from '../../components/ui/Slider';

/** /#/dev/blocks — блоки розрядів (етап M17): кубик, стовпчик-десяток, плита 10×10, пучок із 10 паличок, мат «dziesiątki | jedności». */
export function BlocksPage() {
  const [n, setN] = useState(47);
  return (
    <main style={{ padding: 24, minHeight: '100dvh', background: 'var(--kl-w5-50)' }}>
      <Link to="/dev">← Dev</Link>
      <h1 style={{ fontSize: 28 }}>Блоки розрядів</h1>
      <Slider label="Число" min={0} max={99} step={1} value={n} onChange={setN} valueText={String(n)} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end', marginTop: 16 }}>
        <PlaceValueMat tens={Math.floor(n / 10)} ones={n % 10} cell={20} />
        <PlaceValueMat tens={Math.floor(n / 10)} ones={n % 10} cell={14} highlight="tens" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <BlockCube size={40} tone="ones" />
          <BlockCube size={40} tone="tens" />
          <BlockCube size={40} tone="plain" />
          <BlockRod cell={20} />
          <BlockRod cell={20} length={6} />
          <StickBundle height={120} />
          <StickBundle height={120} count={6} />
          <BlockPlate size={150} />
        </div>
      </div>
    </main>
  );
}
