import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType, HOTBAR_CREATIVE } from './blocks';
import World from './World';
import Player from './Player';
import Animals from './Animals';
import HUD from './HUD';
import TouchControls, { TouchState } from './TouchControls';

export enum Controls {
  forward = 'forward',
  back    = 'back',
  left    = 'left',
  right   = 'right',
  jump    = 'jump',
  sneak   = 'sneak',
}

const KEY_MAP = [
  { name: Controls.forward, keys: ['ArrowUp',    'KeyW'] },
  { name: Controls.back,    keys: ['ArrowDown',  'KeyS'] },
  { name: Controls.left,    keys: ['ArrowLeft',  'KeyA'] },
  { name: Controls.right,   keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.jump,    keys: ['Space'] },
  { name: Controls.sneak,   keys: ['ShiftLeft',  'ShiftRight'] },
];

interface UIState {
  health: number;
  hunger: number;
  hotbar: BlockType[];
  selectedSlot: number;
  pos: { x: number; y: number; z: number };
  mode: 'CREATIVE' | 'SURVIVAL';
}

export default function Game() {
  const [started, setStarted] = useState(false);
  const [uiState, setUiState] = useState<UIState>({
    health: 20, hunger: 20,
    hotbar: [...HOTBAR_CREATIVE], selectedSlot: 0,
    pos: { x: 0, y: 0, z: 0 },
    mode: 'CREATIVE',
  });

  const playerChunkRef = useRef({ x: 0, z: 0 });
  const touchRef = useRef<TouchState>({ dx: 0, dz: 0, jump: false, doBreak: false, doPlace: false });
  const modeRef = useRef<'CREATIVE' | 'SURVIVAL'>('CREATIVE');

  // Tab key for mode toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setUiState(prev => {
          const next = prev.mode === 'CREATIVE' ? 'SURVIVAL' : 'CREATIVE';
          modeRef.current = next;
          return { ...prev, mode: next };
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleStateChange = useCallback((s: {
    health: number; hunger: number;
    hotbar: BlockType[]; selectedSlot: number;
    pos: THREE.Vector3;
  }) => {
    setUiState(prev => ({
      ...prev,
      health: s.health, hunger: s.hunger,
      hotbar: s.hotbar, selectedSlot: s.selectedSlot,
      pos: { x: s.pos.x, y: s.pos.y, z: s.pos.z },
    }));
  }, []);

  return (
    <div style={{ width:'100vw', height:'100vh', overflow:'hidden', background:'#000', position:'relative' }}>

      {/* Start screen */}
      {!started && (
        <div onClick={() => setStarted(true)} style={{
          position:'absolute', inset:0, zIndex:100,
          background:'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection:'column', color:'#fff', cursor:'pointer',
          fontFamily:'"Courier New", monospace',
        }}>
          <div style={{
            fontSize:56, fontWeight:'bold',
            color:'#5cb85c', textShadow:'0 0 20px rgba(92,184,92,0.6), 0 4px 8px rgba(0,0,0,0.5)',
            letterSpacing:4, marginBottom:8,
          }}>
            VoxelCraft
          </div>
          <div style={{ fontSize:13, color:'#aaa', marginBottom:40, letterSpacing:1 }}>
            A 3D Voxel World
          </div>
          <div style={{
            background:'rgba(92,184,92,0.2)', border:'2px solid #5cb85c',
            borderRadius:8, padding:'12px 32px', fontSize:18, color:'#5cb85c',
            letterSpacing:2, boxShadow:'0 0 16px rgba(92,184,92,0.3)',
          }}>
            ▶  CLICK TO PLAY
          </div>
          <div style={{
            marginTop:40, fontSize:11, color:'rgba(255,255,255,0.4)',
            lineHeight:2, textAlign:'center',
          }}>
            WASD — Move &nbsp;|&nbsp; SPACE — Jump &nbsp;|&nbsp; SHIFT — Sneak (fly down)<br/>
            LMB — Break Block &nbsp;|&nbsp; RMB — Place Block &nbsp;|&nbsp; Scroll — Hotbar<br/>
            1-9 — Select Slot &nbsp;|&nbsp; Tab — Toggle Mode &nbsp;|&nbsp; Double-Space — Toggle Fly (Creative)
          </div>
        </div>
      )}

      {/* HUD */}
      {started && (
        <HUD
          mode={uiState.mode}
          health={uiState.health}
          hunger={uiState.hunger}
          hotbar={uiState.hotbar}
          selectedSlot={uiState.selectedSlot}
          pos={uiState.pos}
        />
      )}

      {/* Touch controls */}
      {started && <TouchControls stateRef={touchRef} />}

      {/* 3D Canvas */}
      <KeyboardControls map={KEY_MAP}>
        <Canvas
          camera={{ fov: 75, near: 0.05, far: 220 }}
          gl={{ antialias: false }}
          style={{ width:'100%', height:'100%' }}
        >
          <color attach="background" args={['#87CEEB']} />
          <fog attach="fog" args={['#aadcf0', 50, 110]} />

          <ambientLight intensity={0.45} />
          <directionalLight
            position={[50, 100, 30]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          <World playerChunkRef={playerChunkRef} />
          <Animals />

          {started && (
            <Player
              mode={uiState.mode}
              setMode={(m) => setUiState(prev => ({ ...prev, mode: m }))}
              playerChunkRef={playerChunkRef}
              onStateChange={handleStateChange}
              touchRef={touchRef}
            />
          )}
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
