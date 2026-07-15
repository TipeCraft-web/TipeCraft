import { BlockType, BLOCK_COLORS, BLOCK_NAMES } from './blocks';

interface HUDProps {
  mode: 'CREATIVE' | 'SURVIVAL';
  health: number;
  hunger: number;
  hotbar: BlockType[];
  counts: Record<number, number>;
  selectedSlot: number;
  pos: { x: number; y: number; z: number };
  onSlotSelect: (i: number) => void;
  onOpenInventory: () => void;
}

function colorStyle(type: BlockType): string {
  if (type === BlockType.AIR) return 'rgba(255,255,255,0.08)';
  const [r, g, b] = BLOCK_COLORS[type];
  return `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
}

function HeartRow({ val, max, color }: { val: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', maxWidth: 160 }}>
      {Array.from({ length: Math.ceil(max / 2) }).map((_, i) => {
        const full = val >= (i+1)*2;
        const half = !full && val >= i*2+1;
        return (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: 2, border: '1px solid rgba(0,0,0,0.5)',
            background: full ? color : half ? color + '88' : 'rgba(0,0,0,0.5)',
          }} />
        );
      })}
    </div>
  );
}

export default function HUD({ mode, health, hunger, hotbar, counts, selectedSlot, pos, onSlotSelect, onOpenInventory }: HUDProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      fontFamily: '"Courier New", monospace', userSelect: 'none',
      pointerEvents: 'none',
    }}>
      {/* Crosshair */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', width: 24, height: 24,
        pointerEvents: 'none',
      }}>
        <div style={{ position:'absolute', top:'50%', left:0, right:0, height:2, background:'rgba(255,255,255,0.85)', marginTop:-1, boxShadow:'0 0 2px #000' }} />
        <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:2, background:'rgba(255,255,255,0.85)', marginLeft:-1, boxShadow:'0 0 2px #000' }} />
      </div>

      {/* Top-left: health + coords */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        color: '#fff', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6,
        pointerEvents: 'none',
      }}>
        {mode === 'SURVIVAL' && (
          <>
            <div>
              <div style={{ fontSize: 10, color: '#ccc', marginBottom: 2 }}>HEALTH</div>
              <HeartRow val={health} max={20} color="#ff3333" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#ccc', marginBottom: 2 }}>HUNGER</div>
              <HeartRow val={Math.round(hunger)} max={20} color="#cc8800" />
            </div>
          </>
        )}
        <div style={{
          background: 'rgba(0,0,0,0.55)', padding: '3px 6px', borderRadius: 3, fontSize: 11,
        }}>
          X:{Math.floor(pos.x)} Y:{Math.floor(pos.y)} Z:{Math.floor(pos.z)}
        </div>
      </div>

      {/* Top-right: mode badge */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: mode === 'CREATIVE' ? 'rgba(0,100,220,0.75)' : 'rgba(180,40,40,0.75)',
        color: '#fff', fontSize: 11, fontWeight: 'bold',
        padding: '4px 10px', borderRadius: 4, letterSpacing: 1,
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}>
        {mode}
      </div>

      {/* Bottom: hotbar — interactive */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 3,
        background: 'rgba(0,0,0,0.6)', padding: '4px 5px', borderRadius: 5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      }}>
        {hotbar.map((block, i) => {
          const cnt = counts[block];
          const hasCnt = mode === 'SURVIVAL' && block !== BlockType.AIR && cnt !== undefined;
          return (
            <div
              key={i}
              data-touch-btn="1"
              onTouchStart={e => { e.stopPropagation(); onSlotSelect(i); }}
              onClick={() => onSlotSelect(i)}
              style={{
                width: 48, height: 48,
                border: i === selectedSlot ? '2px solid #ffe030' : '2px solid rgba(255,255,255,0.25)',
                background: i === selectedSlot ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.5)',
                borderRadius: 4,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 1, transition: 'border-color 0.1s',
                boxShadow: i === selectedSlot ? '0 0 0 1px rgba(255,224,48,0.4) inset' : 'none',
                cursor: 'pointer', position: 'relative',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 3,
                background: colorStyle(block),
                border: '1px solid rgba(0,0,0,0.4)',
                boxShadow: block !== BlockType.AIR ? 'inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.15)' : 'none',
              }} />
              {block !== BlockType.AIR && (
                <div style={{ color: '#ddd', fontSize: 7, textAlign: 'center', lineHeight: 1 }}>
                  {(BLOCK_NAMES[block] ?? '').slice(0, 7)}
                </div>
              )}
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7 }}>{i + 1}</div>
              {hasCnt && (
                <div style={{
                  position:'absolute', top:2, right:3,
                  fontSize:8, fontWeight:700, color:'#ffe',
                  textShadow:'0 0 3px #000',
                }}>
                  {cnt}
                </div>
              )}
            </div>
          );
        })}

        {/* Inventory button */}
        <div
          data-touch-btn="1"
          onTouchStart={e => { e.stopPropagation(); onOpenInventory(); }}
          onClick={onOpenInventory}
          style={{
            width:36, height:48, borderRadius:4, cursor:'pointer',
            border:'2px solid rgba(68,136,204,0.6)',
            background:'rgba(10,30,60,0.7)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:2, marginLeft:4,
          }}
        >
          <div style={{ fontSize:16 }}>📦</div>
          <div style={{ fontSize:7, color:'#7ac' }}>I</div>
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute', bottom: 72, left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.35)', fontSize: 9, textAlign: 'center', whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        WASD · Space: Jump · 1–9: Hotbar · E: Craft · I: Inventory · Tab: Mode
      </div>
    </div>
  );
}
