import { useRef, useEffect } from 'react';

export interface TouchState {
  dx: number; dz: number;
  jump: boolean; doBreak: boolean; doPlace: boolean;
}

interface Props {
  stateRef: React.MutableRefObject<TouchState>;
}

const RADIUS = 48;

export default function TouchControls({ stateRef }: Props) {
  const baseRef  = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const touchId  = useRef<number | null>(null);
  const center   = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const base = baseRef.current;
    if (!base) return;

    const start = (e: TouchEvent) => {
      e.preventDefault();
      if (touchId.current !== null) return;
      const t = e.changedTouches[0];
      const r = base.getBoundingClientRect();
      touchId.current = t.identifier;
      center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const move = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== touchId.current) continue;
        const rx = t.clientX - center.current.x;
        const ry = t.clientY - center.current.y;
        const len = Math.sqrt(rx*rx + ry*ry);
        const clamped = Math.min(len, RADIUS);
        const nx = len > 0 ? rx / len * clamped / RADIUS : 0;
        const ny = len > 0 ? ry / len * clamped / RADIUS : 0;
        stateRef.current.dx = nx;
        stateRef.current.dz = ny;
        if (thumbRef.current) {
          thumbRef.current.style.transform = `translate(${nx * RADIUS}px,${ny * RADIUS}px)`;
        }
      }
    };

    const end = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId.current) {
          touchId.current = null;
          stateRef.current.dx = 0;
          stateRef.current.dz = 0;
          if (thumbRef.current) thumbRef.current.style.transform = '';
        }
      }
    };

    base.addEventListener('touchstart', start, { passive: false });
    base.addEventListener('touchmove',  move,  { passive: false });
    base.addEventListener('touchend',   end,   { passive: false });
    return () => {
      base.removeEventListener('touchstart', start);
      base.removeEventListener('touchmove',  move);
      base.removeEventListener('touchend',   end);
    };
  }, [stateRef]);

  const btnDown = (key: keyof TouchState) => (e: React.TouchEvent) => {
    e.preventDefault();
    (stateRef.current as any)[key] = true;
  };
  const btnUp = (key: keyof TouchState) => (e: React.TouchEvent) => {
    e.preventDefault();
    (stateRef.current as any)[key] = false;
  };

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:20 }}>
      {/* Joystick */}
      <div ref={baseRef} style={{
        position:'absolute', bottom:90, left:30,
        width:100, height:100, borderRadius:'50%',
        background:'rgba(255,255,255,0.12)', border:'2px solid rgba(255,255,255,0.25)',
        display:'flex', alignItems:'center', justifyContent:'center',
        pointerEvents:'auto', touchAction:'none',
      }}>
        <div ref={thumbRef} style={{
          width:44, height:44, borderRadius:'50%',
          background:'rgba(255,255,255,0.35)',
          pointerEvents:'none', transition:'none',
        }} />
      </div>

      {/* Right buttons */}
      <div style={{
        position:'absolute', bottom:80, right:24,
        display:'flex', flexDirection:'column', gap:10,
        pointerEvents:'auto',
      }}>
        {[
          { label:'Jump',  key:'jump'    as keyof TouchState, color:'#3399ff' },
          { label:'Break', key:'doBreak' as keyof TouchState, color:'#ff4444' },
          { label:'Place', key:'doPlace' as keyof TouchState, color:'#44cc44' },
        ].map(({ label, key, color }) => (
          <div key={key}
            onTouchStart={btnDown(key)} onTouchEnd={btnUp(key)}
            style={{
              width:66, height:44, background: color+'99',
              border:`2px solid ${color}`, borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:12, fontWeight:'bold',
              userSelect:'none', touchAction:'none', fontFamily:'monospace',
            }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
