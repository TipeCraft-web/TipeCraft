import { BlockType, BLOCK_NAMES } from './blocks';

export interface FurnaceContents {
  ironOre: number;
  coal: number;
  ironIngots: number;
}

interface FurnaceUIProps {
  mode: 'CREATIVE' | 'SURVIVAL';
  counts: Record<number, number>;
  contents: FurnaceContents;
  onChange: (contents: FurnaceContents, counts: Record<number, number>) => void;
  onClose: () => void;
}

const buttonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '8px 12px',
  border: '2px solid #222',
  borderRadius: 3,
  background: '#777',
  color: '#fff',
  fontFamily: '"Courier New", monospace',
  fontWeight: 700,
  cursor: 'pointer',
  touchAction: 'manipulation',
};

export default function FurnaceUI({
  mode,
  counts,
  contents,
  onChange,
  onClose,
}: FurnaceUIProps) {
  const creative = mode === 'CREATIVE';
  const canAddOre = creative || (counts[BlockType.IRON_ORE] ?? 0) > 0;
  const canAddCoal = creative || (counts[BlockType.COAL] ?? 0) > 0;
  const canSmelt = contents.ironOre > 0 && contents.coal > 0 && contents.ironIngots < 64;

  const addItem = (item: BlockType) => {
    const nextCounts = { ...counts };
    if (!creative) {
      nextCounts[item] = Math.max(0, (nextCounts[item] ?? 0) - 1);
      if (nextCounts[item] === 0) delete nextCounts[item];
    }
    const nextContents = { ...contents };
    if (item === BlockType.IRON_ORE) nextContents.ironOre += 1;
    else nextContents.coal += 1;
    onChange(nextContents, nextCounts);
  };

  const smelt = () => {
    if (!canSmelt) return;
    onChange({
      ironOre: contents.ironOre - 1,
      coal: contents.coal - 1,
      ironIngots: contents.ironIngots + 1,
    }, { ...counts });
  };

  const collectIngots = () => {
    if (contents.ironIngots <= 0) return;
    const nextCounts = { ...counts, [BlockType.IRON_INGOT]: (counts[BlockType.IRON_INGOT] ?? 0) + contents.ironIngots };
    onChange({ ...contents, ironIngots: 0 }, nextCounts);
  };

  const touchAction = (action: () => void) => (event: React.TouchEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    action();
  };

  return (
    <div
      data-no-look="1"
      onClick={onClose}
      onTouchStart={event => event.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.78)',
        touchAction: 'none',
      }}
    >
      <section
        data-no-look="1"
        onClick={event => event.stopPropagation()}
        onTouchStart={event => event.stopPropagation()}
        style={{
          width: 'min(440px, 96vw)',
          padding: 18,
          border: '3px solid #222',
          background: '#b7b7b7',
          boxShadow: '0 8px 30px #0009',
          color: '#111',
          fontFamily: '"Courier New", monospace',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <strong style={{ fontSize: 20, letterSpacing: 2 }}>OFEN</strong>
          <button
            type="button"
            aria-label="Ofen schließen"
            data-touch-btn="1"
            onTouchStart={touchAction(onClose)}
            onClick={onClose}
            style={{ ...buttonStyle, minHeight: 34, padding: '2px 10px' }}
          >✕</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          <div style={{ padding: 10, minHeight: 74, background: '#555', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 10, marginBottom: 8 }}>ERZ</div>
            <b>{BLOCK_NAMES[BlockType.IRON_ORE]} × {contents.ironOre}</b>
          </div>
          <div style={{ padding: 10, minHeight: 74, background: '#555', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 10, marginBottom: 8 }}>BRENNSTOFF</div>
            <b>{BLOCK_NAMES[BlockType.COAL]} × {contents.coal}</b>
          </div>
          <div style={{ padding: 10, minHeight: 74, background: '#555', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 10, marginBottom: 8 }}>ERGEBNIS</div>
            <b>{BLOCK_NAMES[BlockType.IRON_INGOT]} × {contents.ironIngots}</b>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            type="button"
            data-touch-btn="1"
            disabled={!canAddOre}
            onTouchStart={touchAction(() => addItem(BlockType.IRON_ORE))}
            onClick={() => addItem(BlockType.IRON_ORE)}
            style={{ ...buttonStyle, opacity: canAddOre ? 1 : 0.5 }}
          >Eisenerz einlegen</button>
          <button
            type="button"
            data-touch-btn="1"
            disabled={!canAddCoal}
            onTouchStart={touchAction(() => addItem(BlockType.COAL))}
            onClick={() => addItem(BlockType.COAL)}
            style={{ ...buttonStyle, opacity: canAddCoal ? 1 : 0.5 }}
          >Kohle einlegen</button>
          <button
            type="button"
            data-touch-btn="1"
            disabled={!canSmelt}
            onTouchStart={touchAction(smelt)}
            onClick={smelt}
            style={{ ...buttonStyle, background: '#8a642a', opacity: canSmelt ? 1 : 0.5 }}
          >Eisen schmelzen</button>
          <button
            type="button"
            data-touch-btn="1"
            disabled={contents.ironIngots === 0}
            onTouchStart={touchAction(collectIngots)}
            onClick={collectIngots}
            style={{ ...buttonStyle, background: '#526e45', opacity: contents.ironIngots ? 1 : 0.5 }}
          >Barren aufnehmen</button>
        </div>

        <p style={{ margin: '14px 0 0', fontSize: 11, lineHeight: 1.5 }}>
          Nur Eisenerz lässt sich schmelzen. Für jeden Eisenbarren werden ein Eisenerz und eine Kohle verbraucht.
        </p>
      </section>
    </div>
  );
}
