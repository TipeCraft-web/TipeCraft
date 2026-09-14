import { useState, useMemo } from 'react';
import { BlockType, BLOCK_COLORS, BLOCK_NAMES } from './blocks';
import { blockTextureUrl } from './textures';

interface Props {
  mode: 'CREATIVE' | 'SURVIVAL';
  counts: Record<number, number>;
  hotbar: BlockType[];
  selectedSlot: number;
  onAssign: (slot: number, type: BlockType) => void;
  onCraft: (result: BlockType, count: number, consume: { type: BlockType; count: number }[]) => void;
  onClose: () => void;
}

function colorStr(t: BlockType): string {
  const c = BLOCK_COLORS[t];
  if (!c) return '#555';
  return `rgb(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)})`;
}

type Cat = 'all' | 'natural' | 'stone' | 'wood' | 'ores' | 'building' | 'color' | 'special';

function getBlockCat(t: BlockType): Cat {
  if (t >= 1  && t <= 14)  return 'natural';
  if (t >= 15 && t <= 34)  return 'stone';
  if (t >= 35 && t <= 54)  return 'wood';
  if (t >= 55 && t <= 77)  return 'ores';
  if (t >= 78 && t <= 126) return 'natural';
  if (t >= 127 && t <= 167) return 'color';
  if (t >= 168 && t <= 225) return 'building';
  return 'special';
}

const ALL_BLOCKS: BlockType[] = Array.from({ length: 225 }, (_, i) => i + 1) as BlockType[];
const CATS: { key: Cat; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'natural',  label: 'Natural'  },
  { key: 'stone',    label: 'Stone'    },
  { key: 'wood',     label: 'Wood'     },
  { key: 'ores',     label: 'Ores'     },
  { key: 'color',    label: 'Color'    },
  { key: 'building', label: 'Special'  },
];

interface CraftOutput {
  type: BlockType;
  count: number;
  consume: { type: BlockType; count: number }[];
}

const LOG_TO_PLANKS: Partial<Record<BlockType, BlockType>> = {
  [BlockType.WOOD]: BlockType.PLANKS,
  [BlockType.OAK_LOG]: BlockType.PLANKS,
  [BlockType.BIRCH_LOG]: BlockType.BIRCH_PLANKS,
  [BlockType.SPRUCE_LOG]: BlockType.SPRUCE_PLANKS,
  [BlockType.DARK_OAK_LOG]: BlockType.DARK_OAK_PLANKS,
  [BlockType.JUNGLE_LOG]: BlockType.JUNGLE_PLANKS,
  [BlockType.ACACIA_LOG]: BlockType.ACACIA_PLANKS,
  [BlockType.BAMBOO_BLOCK]: BlockType.BAMBOO_PLANKS,
};

function getCraftOutput(grid: BlockType[]): CraftOutput | null {
  const filled = grid.filter(type => type !== BlockType.AIR);
  if (filled.length === 1) {
    const result = LOG_TO_PLANKS[filled[0]];
    if (result !== undefined) {
      return { type: result, count: 4, consume: [{ type: filled[0], count: 1 }] };
    }
  }
  if (filled.length === 4 && filled.every(type => type === BlockType.PLANKS)) {
    return {
      type: BlockType.CRAFTING_TABLE,
      count: 1,
      consume: [{ type: BlockType.PLANKS, count: 4 }],
    };
  }
  return null;
}

function blockSwatch(type: BlockType, size: number): React.CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: 2,
    background: colorStr(type),
    backgroundImage: type !== BlockType.AIR ? `url(${blockTextureUrl(type)})` : undefined,
    backgroundSize: 'cover',
    imageRendering: 'pixelated',
    border: '2px solid #5c5c5c',
    boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.35), inset -2px -2px 0 rgba(0,0,0,0.3)',
  };
}

export default function Inventory({ mode, counts, hotbar, selectedSlot, onAssign, onCraft, onClose }: Props) {
  const [cat,    setCat]    = useState<Cat>('all');
  const [search, setSearch] = useState('');
  const [pickedSlot, setPickedSlot] = useState(selectedSlot);
  const [craftGrid, setCraftGrid] = useState<BlockType[]>(Array(4).fill(BlockType.AIR));

  const blocks = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_BLOCKS.filter(t => {
      if (mode === 'SURVIVAL' && (counts[t] || 0) === 0) return false;
      if (cat !== 'all' && getBlockCat(t) !== cat) return false;
      if (q && !(BLOCK_NAMES[t] ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mode, counts, cat, search]);

  const assign = (type: BlockType) => {
    onAssign(pickedSlot, type);
  };

  const addCraftItem = (type: BlockType) => {
    const target = craftGrid.indexOf(BlockType.AIR);
    if (target === -1) return;
    const alreadyUsed = craftGrid.filter(item => item === type).length;
    if (mode === 'SURVIVAL' && alreadyUsed >= (counts[type] || 0)) return;
    setCraftGrid(prev => {
      const next = [...prev];
      next[target] = type;
      return next;
    });
  };

  const clearCraftSlot = (index: number) => {
    setCraftGrid(prev => prev.map((type, i) => i === index ? BlockType.AIR : type));
  };

  const craftOutput = getCraftOutput(craftGrid);
  const takeCraftOutput = () => {
    if (!craftOutput) return;
    if (mode === 'SURVIVAL' && !craftOutput.consume.every(item =>
      (counts[item.type] || 0) >= item.count
    )) return;
    onCraft(craftOutput.type, craftOutput.count, craftOutput.consume);
    setCraftGrid(Array(4).fill(BlockType.AIR));
  };

  return (
    <div
      data-no-look="1"
      style={{
        position:'fixed', inset:0, zIndex:60,
        background:'rgba(0,0,0,0.82)',
        display:'flex', alignItems:'center', justifyContent:'center',
        filter:'grayscale(1)',
      }}
      onClick={onClose}
    >
      <div
        data-no-look="1"
        onClick={e => e.stopPropagation()}
        style={{
          background:'#bcbcbc', border:'3px solid #333',
          borderRadius:2, padding:12, width:620, maxWidth:'97vw',
          maxHeight:'92vh', display:'flex', flexDirection:'column', gap:10,
          color:'#111', fontFamily:'Arial, sans-serif',
          overflow:'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#111', letterSpacing:1 }}>
            INVENTAR
          </div>
          <div onClick={onClose} style={{ cursor:'pointer', fontSize:20, color:'#aaa', padding:'0 4px' }}>✕</div>
        </div>

        {/* 2×2 crafting grid and output */}
        <div style={{
          background:'#a4a4a4', border:'2px solid #555', padding:'8px 12px',
          display:'flex', alignItems:'center', gap:14,
        }}>
          <div style={{ fontWeight:700, fontSize:15, minWidth:72 }}>Handwerk</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 42px)', gap:4 }}>
            {craftGrid.map((type, index) => (
              <div
                key={index}
                data-touch-btn="1"
                onClick={() => type !== BlockType.AIR && clearCraftSlot(index)}
                onTouchStart={e => { e.stopPropagation(); if (type !== BlockType.AIR) clearCraftSlot(index); }}
                title={type === BlockType.AIR ? 'Block über + hinzufügen' : 'Klicken zum Entfernen'}
                style={{
                  width:42, height:42, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'#8e8e8e', border:'2px solid #e2e2e2',
                  boxShadow:'inset 2px 2px 0 #5b5b5b',
                  cursor:type === BlockType.AIR ? 'default' : 'pointer',
                }}
              >
                {type !== BlockType.AIR && <div style={blockSwatch(type, 34)} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize:30, color:'#555', fontWeight:700 }}>➜</div>
          <div
            data-touch-btn="1"
            onClick={takeCraftOutput}
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); takeCraftOutput(); }}
            title={craftOutput ? 'Output nehmen' : 'Kein gültiges Rezept'}
            style={{
              width:58, height:58, display:'flex', alignItems:'center', justifyContent:'center',
              background:craftOutput ? '#9f9f9f' : '#777',
              border:'3px solid #e4e4e4',
              boxShadow:'inset 2px 2px 0 #555',
              cursor:craftOutput ? 'pointer' : 'default',
              position:'relative',
            }}
          >
            {craftOutput && (
              <>
                <div style={blockSwatch(craftOutput.type, 42)} />
                {craftOutput.count > 1 && (
                  <div style={{
                    position:'absolute', right:2, bottom:1, color:'#fff',
                    fontSize:12, fontWeight:700, textShadow:'1px 1px #000',
                  }}>{craftOutput.count}</div>
                )}
              </>
            )}
          </div>
          <div style={{ fontSize:10, color:'#333', lineHeight:1.35 }}>
            Block auswählen und mit <b>+</b> ins Feld legen.<br />
            Stamm → 4 Bretter · 4 Bretter → Werkbank
          </div>
        </div>

        {/* Hotbar slot selector */}
        <div style={{ fontSize:10, color:'#444', marginBottom:2 }}>
          Hotbar-Slot auswählen, danach einen Block anklicken, um ihn zuzuweisen:
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {hotbar.map((b, i) => (
            <div
              key={i}
              onClick={() => setPickedSlot(i)}
              style={{
                flex:1, height:44, borderRadius:6, cursor:'pointer',
                border: i === pickedSlot ? '2px solid #222' : '2px solid #666',
                background: i === pickedSlot ? '#d2d2d2' : '#858585',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
              }}
            >
              <div style={{
                width:22, height:22, borderRadius:3,
                ...(b !== BlockType.AIR ? blockSwatch(b, 22) : {
                  background:'#777', border:'1px solid #444',
                }),
              }} />
              <div style={{ fontSize:7, color:'rgba(255,255,255,0.4)' }}>{i+1}</div>
            </div>
          ))}
        </div>

        {/* Category tabs */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {CATS.map(c => (
            <div key={c.key} onClick={() => setCat(c.key)} style={{
              padding:'3px 9px', borderRadius:6, fontSize:10, cursor:'pointer',
              background: cat === c.key ? '#555' : '#888',
              color: cat === c.key ? '#fff' : '#222',
              fontWeight:700,
            }}>
              {c.label}
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search blocks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background:'#dedede', border:'1px solid #555', borderRadius:2,
            color:'#111', padding:'6px 10px', fontSize:12, outline:'none',
            fontFamily:'Arial, sans-serif',
          }}
        />

        {/* Count */}
        <div style={{ fontSize:10, color:'#666' }}>
          {mode === 'SURVIVAL'
            ? `${blocks.length} block types owned`
            : `${blocks.length} blocks available`
          }
        </div>

        {/* Block grid */}
        <div style={{
          overflowY:'auto', display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(68px, 1fr))', gap:6,
        }}>
          {blocks.map(t => {
            const cnt = counts[t];
            const name = BLOCK_NAMES[t] ?? `#${t}`;
            return (
              <div
                key={t}
                onClick={() => assign(t)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center',
                  padding:'6px 4px', borderRadius:8, cursor:'pointer',
                  background:'#a4a4a4',
                  border:'1px solid #666',
                  gap:4, transition:'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background='#c8c8c8')}
                onMouseLeave={e => (e.currentTarget.style.background='#a4a4a4')}
              >
                <div style={{
                  width:36, height:36, borderRadius:5,
                  ...blockSwatch(t, 36),
                  boxShadow:'inset -2px -2px 5px rgba(0,0,0,0.3), inset 2px 2px 5px rgba(255,255,255,0.15)',
                  position:'relative',
                }}>
                  {cnt !== undefined && cnt > 0 && (
                    <div style={{
                      position:'absolute', bottom:-2, right:-2,
                      background:'#333', color:'#fff', fontSize:8,
                      padding:'1px 3px', borderRadius:3, fontWeight:700,
                    }}>{cnt}</div>
                  )}
                </div>
                <div style={{
                  fontSize:7, textAlign:'center', color:'#222', lineHeight:1.2,
                  maxWidth:64, overflow:'hidden',
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                }}>
                  {name}
                </div>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={e => { e.stopPropagation(); addCraftItem(t); }}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); addCraftItem(t); }}
                  style={{
                    border:'1px solid #555', background:'#d0d0d0', color:'#111',
                    width:24, height:20, lineHeight:'16px', padding:0, cursor:'pointer',
                    fontWeight:700, fontSize:14,
                  }}
                  aria-label={`${name} ins Crafting-Feld legen`}
                >+</button>
              </div>
            );
          })}
          {blocks.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', color:'#555', padding:20, fontSize:12 }}>
              {mode === 'SURVIVAL' ? 'Mine blocks to fill your inventory!' : 'No blocks match.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
