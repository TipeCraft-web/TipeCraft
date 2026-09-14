import { BlockType, BLOCK_COLORS } from './blocks';
import { blockTextureUrl } from './textures';

interface HUDProps {
  mode: 'CREATIVE' | 'SURVIVAL';
  health: number;
  hunger: number;
  hotbar: BlockType[];
  counts: Record<number, number>;
  selectedSlot: number;
  pos: { x: number; y: number; z: number };
  onSlotSelect: (i: number) => void;
}

function colorStyle(type: BlockType): string {
  if (type === BlockType.AIR) return 'rgba(255,255,255,0.08)';
  const [r, g, b] = BLOCK_COLORS[type];
  return `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
}

function PixelHeart({ full, half }: { full: boolean; half: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 16, height: 14, display: 'inline-block',
        clipPath: 'polygon(0 18%, 25% 18%, 25% 0, 42% 0, 50% 12%, 58% 0, 75% 0, 75% 18%, 100% 18%, 100% 48%, 50% 100%, 0 48%)',
        background: full
          ? '#e52b32'
          : half
            ? 'linear-gradient(90deg, #e52b32 0 50%, #343434 50% 100%)'
            : '#343434',
        filter: full || half ? 'drop-shadow(1px 1px 0 #240b0b)' : 'drop-shadow(1px 1px 0 #111)',
        imageRendering: 'pixelated',
      }}
    />
  );
}

function PixelDrumstick({ full, half }: { full: boolean; half: boolean }) {
  const fill = full
    ? '#d59a42'
    : half
      ? 'linear-gradient(90deg, #d59a42 0 50%, #343434 50% 100%)'
      : '#343434';
  return (
    <span
      aria-hidden="true"
      style={{
        width: 16, height: 17, display: 'inline-block', position: 'relative',
        filter: full || half ? 'drop-shadow(1px 1px 0 #2a1a0c)' : 'drop-shadow(1px 1px 0 #111)',
      }}
    >
      <span style={{
        position: 'absolute', top: 0, left: 1, width: 11, height: 10,
        borderRadius: '55% 55% 45% 45%', background: fill,
      }} />
      <span style={{
        position: 'absolute', top: 8, left: 8, width: 5, height: 8,
        borderRadius: '2px 4px 4px 2px', transform: 'rotate(-28deg)', background: fill,
      }} />
    </span>
  );
}

function StatusIcons({ val, max, kind }: { val: number; max: number; kind: 'health' | 'hunger' }) {
  return (
    <div style={{ display: 'flex', gap: 2, height: 18, alignItems: 'center' }}>
      {Array.from({ length: Math.ceil(max / 2) }).map((_, i) => {
        const full = val >= (i + 1) * 2;
        const half = !full && val >= i * 2 + 1;
        return kind === 'health'
          ? <PixelHeart key={i} full={full} half={half} />
          : <PixelDrumstick key={i} full={full} half={half} />;
      })}
    </div>
  );
}

export default function HUD({ mode, health, hunger, hotbar, counts, selectedSlot, pos, onSlotSelect }: HUDProps) {
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

      {/* Top-left: coordinates */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        color: '#fff', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6,
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.55)', padding: '3px 6px', borderRadius: 3, fontSize: 11,
        }}>
          X:{Math.floor(pos.x)} Y:{Math.floor(pos.y)} Z:{Math.floor(pos.z)}
        </div>
      </div>

      {/* Minecraft-style status row above the experience bar */}
      {mode === 'SURVIVAL' && (
        <div style={{
          position: 'absolute', bottom: 83, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '2px 6px', pointerEvents: 'none',
        }}>
          <StatusIcons val={health} max={20} kind="health" />
          <StatusIcons val={Math.round(hunger)} max={20} kind="hunger" />
        </div>
      )}

      {/* Experience bar — kept ready for future XP gains */}
      <div style={{
        position: 'absolute', bottom: 67, left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(390px, 72vw)', height: 7,
        background: '#202020', border: '2px solid #111',
        boxShadow: 'inset 0 1px 0 #4a4a4a',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '0%', height: '100%', background: '#78d52b',
          boxShadow: 'inset 0 1px 0 #c4ff71',
        }} />
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
        position: 'absolute', bottom: 10, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 3,
        background: '#383838', padding: 3, border: '2px solid #171717',
        boxShadow: '0 2px 0 #606060, 0 3px 8px rgba(0,0,0,0.55)',
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
                width: 42, height: 42,
                border: i === selectedSlot ? '2px solid #f5f5f5' : '2px solid #8b8b8b',
                background: i === selectedSlot ? '#777' : '#4b4b4b',
                display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.1s, background 0.1s',
                boxShadow: i === selectedSlot ? 'inset 0 0 0 1px #222' : 'inset 0 0 0 1px #242424',
                cursor: 'pointer', position: 'relative',
              }}
            >
              <div style={{
                width: 32, height: 32,
                background: colorStyle(block),
                 ...(block !== BlockType.AIR ? {
                   backgroundImage: `url(${blockTextureUrl(block)})`,
                   backgroundSize: 'cover',
                   imageRendering: 'pixelated' as const,
                 } : {}),
                border: '1px solid rgba(0,0,0,0.4)',
                boxShadow: block !== BlockType.AIR ? 'inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.15)' : 'none',
              }} />
              {hasCnt && cnt > 0 && (
                <div style={{
                  position: 'absolute', right: 2, bottom: 0,
                  fontSize: 11, fontWeight: 700, color: '#fff',
                  textShadow: '1px 1px 0 #000',
                }}>
                  {cnt}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute', top: 46, left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.35)', fontSize: 9, textAlign: 'center', whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        WASD · Space: Jump · 1–9: Hotbar · E: Craft · I: Inventory · Tab: Mode
      </div>
    </div>
  );
}
