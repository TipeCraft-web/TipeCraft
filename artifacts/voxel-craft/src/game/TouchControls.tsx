import { useRef, useEffect } from 'react';

export interface TouchState {
  dx: number; dz: number;
  jump: boolean; doBreak: boolean; doPlace: boolean;
  flyDown: boolean; toggleMode: boolean;
  lookDx: number; lookDy: number;
}

export function createTouchState(): TouchState {
  return { dx:0, dz:0, jump:false, doBreak:false, doPlace:false, flyDown:false, toggleMode:false, lookDx:0, lookDy:0 };
}

interface Props { stateRef: React.MutableRefObject<TouchState>; }

const RADIUS = 52;
const LONG_PRESS_MS = 450;
const ACTION_MOVE_TOLERANCE = 10;

export default function TouchControls({ stateRef }: Props) {
  const baseRef    = useRef<HTMLDivElement>(null);
  const thumbRef   = useRef<HTMLDivElement>(null);
  const joyTouchId = useRef<number | null>(null);
  const joyCenter  = useRef({ x: 0, y: 0 });
  const lookTouchId = useRef<number | null>(null);
  const lookPrev    = useRef({ x: 0, y: 0 });
  const actionTouchId = useRef<number | null>(null);
  const actionStart   = useRef({ x: 0, y: 0 });
  const actionMoved   = useRef(false);
  const actionLong    = useRef(false);
  const actionTimer   = useRef<number | null>(null);
  const placeTimer    = useRef<number | null>(null);

  useEffect(() => {
    const base = baseRef.current;
    if (!base) return;

    // ─── Joystick listeners (on the joystick element only) ───────────
    const joyStart = (e: TouchEvent) => {
      e.stopPropagation();
      if (joyTouchId.current !== null) return;
      const t = e.changedTouches[0];
      const r = base.getBoundingClientRect();
      joyTouchId.current = t.identifier;
      joyCenter.current  = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const joyMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== joyTouchId.current) continue;
        const rx = t.clientX - joyCenter.current.x;
        const ry = t.clientY - joyCenter.current.y;
        const len = Math.sqrt(rx*rx + ry*ry);
        const c = Math.min(len, RADIUS);
        const nx = len > 0 ? rx / len * c / RADIUS : 0;
        const ny = len > 0 ? ry / len * c / RADIUS : 0;
        stateRef.current.dx = nx;
        stateRef.current.dz = ny;          // positive ny = down = backward
        if (thumbRef.current) thumbRef.current.style.transform = `translate(${nx*RADIUS}px,${ny*RADIUS}px)`;
      }
    };

    const joyEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyTouchId.current) {
          joyTouchId.current = null;
          stateRef.current.dx = 0; stateRef.current.dz = 0;
          if (thumbRef.current) thumbRef.current.style.transform = '';
        }
      }
    };

    base.addEventListener('touchstart', joyStart, { passive: true });
    base.addEventListener('touchmove',  joyMove,  { passive: true });
    base.addEventListener('touchend',   joyEnd,   { passive: true });
    base.addEventListener('touchcancel',joyEnd,   { passive: true });

    // ─── Global look-zone listener (right half of screen) ───────────
    const docStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
        if (el?.closest('[data-touch-btn]') || el?.closest('[data-no-look]')) continue;

        // The joystick owns the left movement zone. Every other free screen
        // area can be used for tap-to-place / long-press-to-break.
        if (el?.closest('[data-joystick]')) continue;

        if (actionTouchId.current === null) {
          actionTouchId.current = t.identifier;
          actionStart.current = { x: t.clientX, y: t.clientY };
          actionMoved.current = false;
          actionLong.current = false;
          actionTimer.current = window.setTimeout(() => {
            if (actionTouchId.current === t.identifier && !actionMoved.current) {
              actionLong.current = true;
              stateRef.current.doBreak = true;
            }
          }, LONG_PRESS_MS);
        }

        // A touch on the right side also controls the camera while it moves.
        if (t.clientX >= window.innerWidth * 0.38 && lookTouchId.current === null) {
          lookTouchId.current = t.identifier;
          lookPrev.current = { x: t.clientX, y: t.clientY };
        }
      }
    };

    const docMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === actionTouchId.current) {
          const dx = t.clientX - actionStart.current.x;
          const dy = t.clientY - actionStart.current.y;
          if (Math.sqrt(dx * dx + dy * dy) > ACTION_MOVE_TOLERANCE) {
            actionMoved.current = true;
            if (actionTimer.current !== null) {
              window.clearTimeout(actionTimer.current);
              actionTimer.current = null;
            }
            stateRef.current.doBreak = false;
          }
        }
        if (t.identifier !== lookTouchId.current) continue;
        stateRef.current.lookDx += t.clientX - lookPrev.current.x;
        stateRef.current.lookDy += t.clientY - lookPrev.current.y;
        lookPrev.current = { x: t.clientX, y: t.clientY };
      }
    };

    const docEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touchId = e.changedTouches[i].identifier;
        if (touchId === actionTouchId.current) {
          if (actionTimer.current !== null) {
            window.clearTimeout(actionTimer.current);
            actionTimer.current = null;
          }
          stateRef.current.doBreak = false;
          if (!actionMoved.current && !actionLong.current) {
            stateRef.current.doPlace = true;
            if (placeTimer.current !== null) window.clearTimeout(placeTimer.current);
            placeTimer.current = window.setTimeout(() => {
              stateRef.current.doPlace = false;
              placeTimer.current = null;
            }, 80);
          }
          actionTouchId.current = null;
        }
        if (touchId === lookTouchId.current) lookTouchId.current = null;
      }
    };

    document.addEventListener('touchstart', docStart, { passive: true });
    document.addEventListener('touchmove',  docMove,  { passive: true });
    document.addEventListener('touchend',   docEnd,   { passive: true });
    document.addEventListener('touchcancel',docEnd,   { passive: true });

    return () => {
      base.removeEventListener('touchstart', joyStart);
      base.removeEventListener('touchmove',  joyMove);
      base.removeEventListener('touchend',   joyEnd);
      base.removeEventListener('touchcancel',joyEnd);
      document.removeEventListener('touchstart', docStart);
      document.removeEventListener('touchmove',  docMove);
      document.removeEventListener('touchend',   docEnd);
      document.removeEventListener('touchcancel',docEnd);
      if (actionTimer.current !== null) window.clearTimeout(actionTimer.current);
      if (placeTimer.current !== null) window.clearTimeout(placeTimer.current);
    };
  }, [stateRef]);

  const makeBtn = (label: string, key: keyof TouchState, bg: string, momentary = true) => ({
    onTouchStart: (e: React.TouchEvent) => { e.stopPropagation(); (stateRef.current as any)[key] = true; },
    onTouchEnd:   (e: React.TouchEvent) => { e.stopPropagation(); if (momentary) (stateRef.current as any)[key] = false; },
    'data-touch-btn': '1',
    style: {
      width:64, height:50, borderRadius:10, border:`2px solid ${bg}`,
      background: bg + '66', color:'#fff', fontSize:11, fontWeight:700,
      display:'flex', alignItems:'center', justifyContent:'center',
      userSelect:'none' as const, touchAction:'none',
    },
  });

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:20, filter:'grayscale(1)' }}>

      {/* Joystick */}
      <div
        ref={baseRef}
        data-joystick="1"
        style={{
          position:'absolute', bottom:80, left:24,
          width:108, height:108, borderRadius:'50%',
          background:'rgba(255,255,255,0.10)', border:'2px solid rgba(255,255,255,0.28)',
          display:'flex', alignItems:'center', justifyContent:'center',
          pointerEvents:'auto', touchAction:'none',
        }}
      >
        <div ref={thumbRef} style={{
          width:46, height:46, borderRadius:'50%',
          background:'rgba(255,255,255,0.38)',
          pointerEvents:'none', transition:'none',
        }} />
      </div>

      {/* Jump and flying controls. Block actions use screen taps/presses. */}
      <div
        data-touch-btn="1"
        style={{
          position:'absolute', bottom:80, right:16,
          display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8,
          pointerEvents:'auto',
        }}
      >
        <div {...makeBtn('↑ Jump',   'jump',    '#3399ff')} />
        <div {...makeBtn('↓ Fly Dn', 'flyDown', '#9966ff')} />
      </div>

      {/* Mode toggle (top-right) */}
      <div
        data-touch-btn="1"
        onTouchStart={(e) => { e.stopPropagation(); stateRef.current.toggleMode = true; }}
        onTouchEnd={(e)   => { e.stopPropagation(); stateRef.current.toggleMode = false; }}
        style={{
          position:'absolute', top:14, right:14, pointerEvents:'auto', touchAction:'none',
          padding:'7px 16px', borderRadius:20,
          background:'rgba(80,40,120,0.75)', border:'2px solid rgba(180,130,255,0.6)',
          color:'#ddd', fontSize:11, fontWeight:700,
          userSelect:'none',
        }}
      >
        ⚙ MODE
      </div>
    </div>
  );
}
