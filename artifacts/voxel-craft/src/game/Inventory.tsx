import { useState, useMemo } from 'react';
import { BlockType, BLOCK_COLORS, BLOCK_NAMES } from './blocks';
import { blockTextureUrl } from './textures';

interface Props {
  mode: 'CREATIVE' | 'SURVIVAL';
  counts: Record<number, number>;
  hotbar: BlockType[];
  selectedSlot: number;
  onAssign: (slot: number, type: BlockType) => void;
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

export default function Inventory({ mode, counts, hotbar, selectedSlot, onAssign, onClose }: Props) {
  const [cat,    setCat]    = useState<Cat>('all');
  const [search, setSearch] = useState('');
  const [pickedSlot, setPickedSlot] = useState(selectedSlot);

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

  return (
    <div
      data-no-look="1"
      style={{
        position:'fixed', inset:0, zIndex:60,
        background:'rgba(0,0,0,0.82)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}
      onClick={onClose}
    >
      <div
        data-no-look="1"
        onClick={e => e.stopPropagation()}
        style={{
          background:'#12122a', border:'2px solid #4488cc',
          borderRadius:14, padding:16, width:460, maxWidth:'97vw',
          maxHeight:'92vh', display:'flex', flexDirection:'column', gap:10,
          color:'#fff', fontFamily:'"Courier New",monospace',
          overflow:'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#4ac', letterSpacing:2 }}>
            📦 {mode === 'CREATIVE' ? 'BLOCK PICKER' : 'INVENTORY'}
          </div>
          <div onClick={onClose} style={{ cursor:'pointer', fontSize:20, color:'#aaa', padding:'0 4px' }}>✕</div>
        </div>

        {/* Hotbar slot selector */}
        <div style={{ fontSize:10, color:'#888', marginBottom:2 }}>
          Tap a hotbar slot to select it, then click a block below to assign it:
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {hotbar.map((b, i) => (
            <div
              key={i}
              onClick={() => setPickedSlot(i)}
              style={{
                flex:1, height:44, borderRadius:6, cursor:'pointer',
                border: i === pickedSlot ? '2px solid #ffe030' : '2px solid rgba(255,255,255,0.18)',
                background: i === pickedSlot ? 'rgba(255,224,48,0.15)' : 'rgba(0,0,0,0.4)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
              }}
            >
              <div style={{
                width:22, height:22, borderRadius:3,
                background: b !== BlockType.AIR ? colorStr(b) : 'rgba(255,255,255,0.08)',
                border:'1px solid rgba(0,0,0,0.4)',
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
              background: cat === c.key ? '#4488cc' : '#222',
              color: cat === c.key ? '#fff' : '#aaa',
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
            background:'#1a1a3a', border:'1px solid #444', borderRadius:6,
            color:'#fff', padding:'6px 10px', fontSize:12, outline:'none',
            fontFamily:'"Courier New",monospace',
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
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.12)',
                  gap:4, transition:'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(68,136,204,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.05)')}
              >
                <div style={{
                  width:36, height:36, borderRadius:5,
                  background: colorStr(t),
                 backgroundImage: `url(${blockTextureUrl(t)})`,
                 backgroundSize:'cover',
                 imageRendering:'pixelated',
                  border:'1px solid rgba(0,0,0,0.5)',
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
                  fontSize:7, textAlign:'center', color:'#ccc', lineHeight:1.2,
                  maxWidth:64, overflow:'hidden',
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                }}>
                  {name}
                </div>
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
