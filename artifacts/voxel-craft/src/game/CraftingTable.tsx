import { useMemo, useState } from 'react';
import { BlockType, BLOCK_COLORS, BLOCK_NAMES } from './blocks';
import { blockTextureUrl } from './textures';
import { getCraftOutput } from './craftingRecipes';

interface Props {
  mode: 'CREATIVE' | 'SURVIVAL';
  counts: Record<number, number>;
  onCraft: (result: BlockType, count: number, consume: { type: BlockType; count: number }[]) => void;
  onClose: () => void;
}

const ALL_BLOCKS: BlockType[] = Array.from({ length: 225 }, (_, i) => i + 1) as BlockType[];

function colorStr(type: BlockType): string {
  const color = BLOCK_COLORS[type];
  if (!color) return '#555';
  return `rgb(${Math.round(color[0] * 255)},${Math.round(color[1] * 255)},${Math.round(color[2] * 255)})`;
}

function blockSwatch(type: BlockType, size: number): React.CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: 2,
    background: colorStr(type),
    backgroundImage: `url(${blockTextureUrl(type)})`,
    backgroundSize: 'cover',
    imageRendering: 'pixelated',
    border: '2px solid #5c5c5c',
    boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.35), inset -2px -2px 0 rgba(0,0,0,0.3)',
  };
}

export default function CraftingTable({ mode, counts, onCraft, onClose }: Props) {
  const [grid, setGrid] = useState<BlockType[]>(Array(9).fill(BlockType.AIR));

  const availableBlocks = useMemo(() => (
    ALL_BLOCKS.filter(type => mode === 'CREATIVE' || (counts[type] || 0) > 0)
  ), [mode, counts]);

  const output = getCraftOutput(grid);

  const addBlock = (type: BlockType, requestedSlot?: number) => {
    const target = requestedSlot !== undefined && grid[requestedSlot] === BlockType.AIR
      ? requestedSlot
      : grid.indexOf(BlockType.AIR);
    if (target === -1) return;
    const alreadyUsed = grid.filter(item => item === type).length;
    if (mode === 'SURVIVAL' && alreadyUsed >= (counts[type] || 0)) return;
    setGrid(prev => prev.map((item, index) => index === target ? type : item));
  };

  const takeOutput = () => {
    if (!output) return;
    if (mode === 'SURVIVAL' && !output.consume.every(item => (counts[item.type] || 0) >= item.count)) return;
    onCraft(output.type, output.count, output.consume);
    setGrid(Array(9).fill(BlockType.AIR));
  };

  const dropIntoSlot = (event: React.DragEvent<HTMLDivElement>, slot: number) => {
    event.preventDefault();
    const type = Number(event.dataTransfer.getData('text/plain')) as BlockType;
    if (Number.isInteger(type) && type > BlockType.AIR && BLOCK_NAMES[type]) addBlock(type, slot);
  };

  return (
    <div
      data-no-look="1"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      <div
        data-no-look="1"
        onClick={event => event.stopPropagation()}
        onTouchStart={event => event.stopPropagation()}
        style={{
          width: 650, maxWidth: '96vw', maxHeight: '92vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: 16, border: '3px solid #333', borderRadius: 3,
          background: '#bcbcbc', color: '#111', fontFamily: 'Arial, sans-serif',
          touchAction: 'manipulation',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>CRAFTING TABLE · 3×3</div>
          <div
            data-touch-btn="1"
            onClick={onClose}
            onTouchStart={event => { event.stopPropagation(); event.preventDefault(); onClose(); }}
            style={{ cursor: 'pointer', fontSize: 20, color: '#555', padding: '0 4px' }}
          >✕</div>
        </div>

        <div style={{
          background: '#a4a4a4', border: '2px solid #555', padding: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 48px)', gap: 5 }}>
            {grid.map((type, index) => (
              <div
                key={index}
                data-touch-btn="1"
                onClick={() => type !== BlockType.AIR && setGrid(prev => prev.map((item, i) => i === index ? BlockType.AIR : item))}
                onTouchStart={event => { event.stopPropagation(); if (type !== BlockType.AIR) setGrid(prev => prev.map((item, i) => i === index ? BlockType.AIR : item)); }}
                onDragOver={event => event.preventDefault()}
                onDrop={event => dropIntoSlot(event, index)}
                style={{
                  width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#8e8e8e', border: '2px solid #e2e2e2',
                  boxShadow: 'inset 2px 2px 0 #5b5b5b',
                  cursor: type === BlockType.AIR ? 'default' : 'pointer',
                }}
              >
                {type !== BlockType.AIR && <div style={blockSwatch(type, 40)} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 30, color: '#555', fontWeight: 700 }}>➜</div>
          <div
            data-touch-btn="1"
            onClick={takeOutput}
            onTouchStart={event => { event.stopPropagation(); event.preventDefault(); takeOutput(); }}
            style={{
              width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: output ? '#9f9f9f' : '#777', border: '3px solid #e4e4e4',
              boxShadow: 'inset 2px 2px 0 #555', cursor: output ? 'pointer' : 'default',
              position: 'relative',
            }}
            title={output ? 'Output nehmen' : 'Kein gültiges Rezept'}
          >
            {output && (
              <>
                <div style={blockSwatch(output.type, 46)} />
                {output.count > 1 && (
                  <div style={{ position: 'absolute', right: 3, bottom: 2, color: '#fff', fontSize: 12, fontWeight: 700, textShadow: '1px 1px #000' }}>
                    {output.count}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#444' }}>
          Block anklicken oder aus dem Inventar hierher ziehen. Belegte Felder anklicken, um sie zu leeren.
        </div>

        <div style={{
          overflowY: 'auto', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 5,
        }}>
          {availableBlocks.map(type => (
            <div
              key={type}
              data-touch-btn="1"
              draggable
              onClick={() => addBlock(type)}
              onTouchStart={event => { event.stopPropagation(); event.preventDefault(); addBlock(type); }}
              onDragStart={event => {
                event.dataTransfer.setData('text/plain', String(type));
                event.dataTransfer.effectAllowed = 'copy';
              }}
              style={{
                minHeight: 52, padding: 4, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                background: '#a4a4a4', border: '1px solid #666', borderRadius: 4, cursor: 'pointer',
              }}
              title={BLOCK_NAMES[type]}
            >
              <div style={{ position: 'relative' }}>
                <div style={blockSwatch(type, 30)} />
                {mode === 'SURVIVAL' && (
                  <div style={{ position: 'absolute', right: -2, bottom: -2, background: '#333', color: '#fff', fontSize: 8, padding: '1px 3px', borderRadius: 2 }}>
                    {counts[type] || 0}
                  </div>
                )}
              </div>
              <div style={{ maxWidth: 58, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 7, color: '#222' }}>
                {BLOCK_NAMES[type]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}