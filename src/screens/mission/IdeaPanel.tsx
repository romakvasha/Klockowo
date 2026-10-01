import type { CSSProperties } from 'react';
import { itemUrl } from '../../components/math/art';
import { Digits } from '../../components/ui/Digits';
import { Icon } from '../../components/ui/Icon';
import type { WorldKey } from '../../curriculum/types';
import type { ObjectId } from '../../speech/nouns';
import { DEMO_COUNT, DEMO_SUM, type DemoKind } from './ideaDemo';
import styles from './IdeaPanel.module.css';

export interface IdeaPanelProps {
  world: WorldKey;
  kind: DemoKind;
  /** Стадія демонстрації: її задає сценарій Mission за кроками demoSteps (див. ideaDemo.ts). */
  stage: number;
  object: ObjectId;
  /** Лічба: предмети в рядку чи розсипом (W1 рівень 6 — «порахувати розсипане»). */
  scatter?: boolean;
}

interface Spot {
  x: number;
  y: number;
}

const LINE: readonly Spot[] = [{ x: 160, y: 40 }, { x: 310, y: 40 }, { x: 460, y: 40 }];
const SCATTER: readonly Spot[] = [{ x: 110, y: 30 }, { x: 290, y: 110 }, { x: 470, y: 35 }];
const PLATE: readonly Spot[] = [{ x: 190, y: 96 }, { x: 310, y: 112 }, { x: 430, y: 96 }];

const at = (spot: Spot): CSSProperties => ({ left: spot.x, top: spot.y });

/** Малюнок предмета; ще не намальованим предметам (W4–W7) відповідає значок світу. */
function Token({ object, size, world, ghost = false }: { object: ObjectId; size: number; world: WorldKey; ghost?: boolean }) {
  const src = itemUrl(object);
  const style: CSSProperties = { width: size, height: size, opacity: ghost ? 0.35 : undefined };
  return src ? <img src={src} alt="" draggable={false} style={style} /> : <Icon name={world} style={style} />;
}

function Plus({ style }: { style: CSSProperties }) {
  return (
    <svg className={styles.sign} viewBox="0 0 36 38" aria-hidden="true" focusable="false" style={style}>
      <rect x="3" y="15.5" width="30" height="7" rx="3.5" />
      <rect x="14.5" y="4" width="7" height="30" rx="3.5" />
    </svg>
  );
}

function Equals({ style }: { style: CSSProperties }) {
  return (
    <svg className={styles.sign} viewBox="0 0 36 38" aria-hidden="true" focusable="false" style={style}>
      <rect x="3" y="9" width="30" height="7" rx="3.5" />
      <rect x="3" y="22" width="30" height="7" rx="3.5" />
    </svg>
  );
}

function Count({ object, world, stage, scatter }: Omit<IdeaPanelProps, 'kind'>) {
  const n = DEMO_COUNT;
  const spots = scatter ? SCATTER : LINE;
  return (
    <>
      {spots.map((spot, i) => (
        <span key={`i${spot.x}`} className={styles.item} data-active={stage === i + 1} style={at(spot)}>
          <Token object={object} size={80} world={world} />
        </span>
      ))}
      {spots.map((spot, i) => (
        <span key={`b${spot.x}`} className={styles.badge} data-show={stage >= i + 1} style={{ left: spot.x + 8, top: spot.y + 88 }}>
          <Digits value={i + 1} style={{ height: 36 }} />
        </span>
      ))}
      <span className={styles.tile} data-show={stage > n} style={{ left: 570, top: scatter ? 150 : 140 }}>
        <Digits value={n} style={{ height: 72 }} />
      </span>
    </>
  );
}

function Plate({ object, world, stage }: Omit<IdeaPanelProps, 'kind'>) {
  const n = DEMO_COUNT;
  return (
    <>
      <span className={styles.plate} />
      {PLATE.map((spot, i) => (
        <span key={`p${spot.x}`} className={styles.drop} data-show={stage >= i + 1} data-active={stage === i + 1} style={at(spot)}>
          <Token object={object} size={80} world={world} />
        </span>
      ))}
      <span className={styles.tile} data-show={stage > n} style={{ left: 570, top: 24 }}>
        <Digits value={n} style={{ height: 72 }} />
      </span>
    </>
  );
}

/** «Błysk!»: карта з «?», крапки на мить, потім цифра. */
function Flash({ stage }: Pick<IdeaPanelProps, 'stage'>) {
  const n = DEMO_COUNT;
  return (
    <span className={styles.flash} data-stage={stage}>
      {stage === 0 && <b className={styles.question}>?</b>}
      {stage === 1 && (
        <svg viewBox="0 0 220 220" aria-hidden="true" focusable="false" className={styles.dots}>
          {[62, 110, 158].slice(0, n).map((c) => <circle key={c} cx={c} cy={c} r="22" />)}
        </svg>
      )}
      {stage >= 2 && <Digits value={n} style={{ height: 130 }} />}
    </span>
  );
}

/** «Razem»: дві групи предметів, цифри зі знаками й результат (борд etap2/18). */
function Sum({ object, world, stage }: Omit<IdeaPanelProps, 'kind'>) {
  const [a, b] = DEMO_SUM;
  const total = a + b;
  const group = (count: number, left: number, width: number, ghost: boolean, hidden = false) => (
    <span className={styles.pill} data-show={!hidden} style={{ left, top: 33, width }}>
      {Array.from({ length: count }, (_, i) => <Token key={i} object={object} size={44} world={world} ghost={ghost} />)}
    </span>
  );
  const digits = stage >= 1;
  return (
    <>
      {group(a, 46, 162, stage >= 2)}
      <Plus style={{ left: 208, top: 60 }} />
      {group(b, 244, 118, stage >= 2)}
      <Equals style={{ left: 362, top: 60 }} />
      {group(total, 398, 250, false, stage < 2)}
      <span className={styles.digit} data-show={digits} style={{ left: 102, top: 170 }}><Digits value={a} style={{ height: 70 }} /></span>
      <Plus style={{ left: 208, top: 186, opacity: digits ? 1 : 0 }} />
      <span className={styles.digit} data-show={digits} style={{ left: 278, top: 170 }}><Digits value={b} style={{ height: 70 }} /></span>
      <Equals style={{ left: 362, top: 186, opacity: digits ? 1 : 0 }} />
      <span className={styles.tile} data-show={stage >= 2} style={{ left: 480, top: 160, width: 86, height: 90 }}>
        <Digits value={total} style={{ height: 70 }} />
      </span>
    </>
  );
}

/** Панель «Patrz, pokażę ci.» 700×300 (design etap2/18): коротка демонстрація нової ідеї рівня. Лише показ: стадії змінює сценарій у такт голосу. */
export function IdeaPanel(props: IdeaPanelProps) {
  const { kind, world } = props;
  return (
    <div className={styles.panel} data-kind={kind} data-world={world} aria-hidden="true">
      {kind === 'count' && <Count {...props} />}
      {kind === 'plate' && <Plate {...props} />}
      {kind === 'flash' && <Flash stage={props.stage} />}
      {kind === 'sum' && <Sum {...props} />}
    </div>
  );
}
