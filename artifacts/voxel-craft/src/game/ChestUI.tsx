import { useState } from 'react';
import { BlockType, BLOCK_COLORS, BLOCK_NAMES } from './blocks';

interface Props {
  contents:    BlockType[];
  counts:      Record<number, number>;
  onClose:     () => void;
  onContentsChange: (newContents: BlockType[], newCounts: Record<number, number>) => void;
}

function colorStr(t: BlockType): string {
  if (t === BlockType.AIR) return 'rgba(0,0,0,0.35)';
  const c = BLOCK_COLORS[t];
  if (!c) return '#555';
  return `rgb(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)})`;
}

function SlotCell({
  block, count, selected, onTouch, onClick,
}: {
  block: BlockType;
  count?: number;
  selected?: boolean;
  onTouch: () => void;
  onClick: () => void;
}) {
  return (
    <div
      data-touch-btn="1"
      onTouchStart={e => { e.stopPropagation(); e.preventDefault(); onTouch(); }}
      onClick={onClick}
      style={{
        width: 42, height: 42, borderRadius: 4,
        border: selected ? '2px solid #ffe030' : '2px solid rgba(255,255,255,0.18)',
        background: selected ? 'rgba(255,224,48,0.18)' : 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
      }}
    >
      {block !== BlockType.AIR && (
        <>
          <div style={{
            width: 28, height: 28, borderRadius: 3,
            background: colorStr(block),
            border: '1px solid rgba(0,0,0,0.5)',
            boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3)',
          }} />
          {count !== undefined && count > 0 && (
            <div style={{
              position: 'absolute', bottom: 2, right: 3,
              fontSize: 8, fontWeight: 700, color: '#fff',
              textShadow: '0 0 3px #000', lineHeight: 1,
            }}>{count}</div>
          )}
        </>
      )}
    </div>
  );
}

export default function ChestUI({ contents, counts, onClose, onContentsChange }: Props) {
  const [selected, setSelected] = useState<{ source: 'chest' | 'inv'; idx: number } | null>(null);

  const invBlocks: { type: BlockType; count: number }[] = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([k, c]) => ({ type: Number(k) as BlockType, count: c }));

  function handleChestSlot(idx: number) {
    const slot = contents[idx];
    if (!selected) {
      if (slot !== BlockType.AIR) setSelected({ source: 'chest', idx });
      return;
    }

    if (selected.source === 'chest' && selected.idx === idx) {
      setSelected(null);
      return;
    }

    if (selected.source === 'chest') {
      const newContents = [...contents];
      const tmp = newContents[idx];
      newContents[idx] = newContents[selected.idx];
      newContents[selected.idx] = tmp;
      onContentsChange(newContents, counts);
      setSelected(null);
      return;
    }

    if (selected.source === 'inv') {
      const item = invBlocks[selected.idx];
      if (!item) { setSelected(null); return; }
      const newContents = [...contents];
      const oldBlock = newContents[idx];
      newContents[idx] = item.type;
      const newCounts = { ...counts };
      newCounts[item.type] = (newCounts[item.type] || 0) - 1;
      if (newCounts[item.type] <= 0) delete newCounts[item.type];
      if (oldBlock !== BlockType.AIR) {
        newCounts[oldBlock] = (newCounts[oldBlock] || 0) + 1;
      }
      onContentsChange(newContents, newCounts);
      setSelected(null);
      return;
    }

    setSelected(null);
  }

  function handleInvSlot(idx: number) {
    const item = invBlocks[idx];
    if (!selected) {
      if (item) setSelected({ source: 'inv', idx });
      return;
    }

    if (selected.source === 'inv' && selected.idx === idx) {
      setSelected(null);
      return;
    }

    if (selected.source === 'chest') {
      const chestSlot = selected.idx;
      const takenBlock = contents[chestSlot];
      if (takenBlock === BlockType.AIR) { setSelected(null); return; }
      const newContents = [...contents];
      newContents[chestSlot] = BlockType.AIR;
      const newCounts = { ...counts };
      newCounts[takenBlock] = (newCounts[takenBlock] || 0) + 1;
      onContentsChange(newContents, newCounts);
      setSelected(null);
      return;
    }

    if (item) {
      const empty = contents.indexOf(BlockType.AIR);
      if (empty !== -1) {
        const newContents = [...contents];
        newContents[empty] = item.type;
        const newCounts = { ...counts };
        newCounts[item.type] = (newCounts[item.type] || 0) - 1;
        if (newCounts[item.type] <= 0) delete newCounts[item.type];
        onContentsChange(newContents, newCounts);
      }
      setSelected(null);
    }
  }

  const chestRows = [0, 1, 2].map(row => contents.slice(row * 9, row * 9 + 9));

  return (
    <div data-no-look="1" style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.80)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1205', border: '2px solid #8b6914',
          borderRadius: 10, padding: 18, color: '#fff',
          fontFamily: '"Courier New", monospace',
          display: 'flex', flexDirection: 'column', gap: 12,
          maxWidth: '96vw',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#e0b840', letterSpacing: 2 }}>📦 CHEST</div>
          <div
            data-touch-btn="1"
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); onClose(); }}
            onClick={onClose}
            style={{ cursor: 'pointer', fontSize: 18, color: '#aaa', padding: '0 4px' }}
          >✕</div>
        </div>

        <div style={{ fontSize: 10, color: '#888' }}>
          {selected
            ? `Selected: ${selected.source === 'chest'
                ? BLOCK_NAMES[contents[selected.idx]] ?? '?'
                : BLOCK_NAMES[invBlocks[selected.idx]?.type] ?? '?'
              } — click a slot to move it`
            : 'Click a slot to select, click another to move'
          }
        </div>

        {/* Chest grid: 3 rows × 9 cols */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {chestRows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 3 }}>
              {row.map((block, ci) => {
                const idx = ri * 9 + ci;
                return (
                  <SlotCell
                    key={idx}
                    block={block}
                    selected={selected?.source === 'chest' && selected.idx === idx}
                    onTouch={() => handleChestSlot(idx)}
                    onClick={() => handleChestSlot(idx)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: '#8b6914', margin: '4px 0' }} />

        {/* Inventory */}
        <div style={{ fontSize: 11, color: '#c8a040', marginBottom: 4 }}>YOUR INVENTORY</div>
        {invBlocks.length === 0 ? (
          <div style={{ fontSize: 11, color: '#666' }}>Empty</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 420 }}>
            {invBlocks.map((item, idx) => (
              <SlotCell
                key={idx}
                block={item.type}
                count={item.count}
                selected={selected?.source === 'inv' && selected.idx === idx}
                onTouch={() => handleInvSlot(idx)}
                onClick={() => handleInvSlot(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
