import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType, HOTBAR_CREATIVE } from './blocks';
import World from './World';
import Player from './Player';
import Animals from './Animals';
import Mobs from './Mobs';
import HUD from './HUD';
import TouchControls, { TouchState, createTouchState } from './TouchControls';
import Crafting from './Crafting';
import Inventory from './Inventory';
import ChestUI from './ChestUI';

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

const SURVIVAL_HOTBAR: BlockType[] = Array(9).fill(BlockType.AIR);
const CHEST_SLOTS = 27;

interface UIState {
  health:      number;
  hunger:      number;
  hotbar:      BlockType[];
  selectedSlot: number;
  pos:         { x: number; y: number; z: number };
  mode:        'CREATIVE' | 'SURVIVAL';
  counts:      Record<number, number>;
}

export default function Game() {
  const [started,       setStarted]       = useState(false);
  const [craftingOpen,  setCraftingOpen]  = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [dead,          setDead]          = useState(false);
  const [respawnTrigger, setRespawnTrigger] = useState(0);
  const [openChest,     setOpenChest]     = useState<{ x: number; y: number; z: number } | null>(null);

  const [uiState, setUiState] = useState<UIState>({
    health: 20, hunger: 20,
    hotbar: [...HOTBAR_CREATIVE], selectedSlot: 0,
    pos: { x: 0, y: 0, z: 0 },
    mode: 'CREATIVE',
    counts: {},
  });

  const playerChunkRef = useRef({ x: 0, z: 0 });
  const touchRef       = useRef<TouchState>(createTouchState());
  const playerPos      = useRef(new THREE.Vector3(8, 30, 8));
  const countsRef      = useRef<Record<number, number>>({});
  // Chest storage: "x,y,z" → BlockType[27]
  const chestsRef      = useRef<Map<string, BlockType[]>>(new Map());

  // Death detection
  useEffect(() => {
    if (uiState.mode === 'SURVIVAL' && uiState.health <= 0 && !dead && started) {
      setDead(true);
      setCraftingOpen(false);
      setInventoryOpen(false);
      setOpenChest(null);
    }
  }, [uiState.health, uiState.mode, dead, started]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started || dead) return;
      if (e.code === 'KeyE') { e.preventDefault(); setCraftingOpen(o => !o); setInventoryOpen(false); }
      if (e.code === 'KeyI') { e.preventDefault(); setInventoryOpen(o => !o); setCraftingOpen(false); }
      if (e.code === 'Escape') { setCraftingOpen(false); setInventoryOpen(false); setOpenChest(null); }
      if (e.code === 'Tab') {
        e.preventDefault();
        countsRef.current = {};
        setUiState(prev => {
          const newMode = prev.mode === 'CREATIVE' ? 'SURVIVAL' : 'CREATIVE';
          return { ...prev, mode: newMode, hotbar: newMode === 'CREATIVE' ? [...HOTBAR_CREATIVE] : [...SURVIVAL_HOTBAR], counts: {} };
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, dead]);

  const handleStateChange = useCallback((s: {
    health: number; hunger: number;
    hotbar: BlockType[]; selectedSlot: number;
    pos: THREE.Vector3;
  }) => {
    playerPos.current.copy(s.pos);
    setUiState(prev => ({
      ...prev,
      health: s.health, hunger: s.hunger,
      hotbar: s.hotbar, selectedSlot: s.selectedSlot,
      pos: { x: s.pos.x, y: s.pos.y, z: s.pos.z },
    }));
  }, []);

  const handleMobDamage = useCallback((amount: number) => {
    setUiState(prev => {
      if (prev.mode !== 'SURVIVAL') return prev;
      return { ...prev, health: Math.max(0, prev.health - amount) };
    });
  }, []);

  const handleSetMode = useCallback((m: 'CREATIVE' | 'SURVIVAL') => {
    countsRef.current = {};
    setUiState(prev => ({
      ...prev, mode: m,
      hotbar: m === 'CREATIVE' ? [...HOTBAR_CREATIVE] : [...SURVIVAL_HOTBAR],
      counts: {},
    }));
  }, []);

  const canPlace = useCallback((type: BlockType) => (countsRef.current[type] || 0) > 0, []);

  const onBlockBreak = useCallback((type: BlockType) => {
    countsRef.current[type] = (countsRef.current[type] || 0) + 1;
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      if (!hotbar.includes(type)) {
        const ei = hotbar.indexOf(BlockType.AIR);
        if (ei !== -1) hotbar[ei] = type;
      }
      return { ...prev, hotbar, counts: { ...countsRef.current } };
    });
  }, []);

  const onBlockPlace = useCallback((type: BlockType) => {
    const newCnt = Math.max(0, (countsRef.current[type] || 0) - 1);
    countsRef.current[type] = newCnt;
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      if (newCnt === 0) {
        const i = hotbar.indexOf(type);
        if (i !== -1) hotbar[i] = BlockType.AIR;
      }
      return { ...prev, hotbar, counts: { ...countsRef.current } };
    });
  }, []);

  const handleSlotSelect = useCallback((i: number) => {
    setUiState(prev => ({ ...prev, selectedSlot: i }));
  }, []);

  const handleCraft = useCallback((result: BlockType, count: number, consume: { type: BlockType; count: number }[]) => {
    consume.forEach(ing => {
      countsRef.current[ing.type] = Math.max(0, (countsRef.current[ing.type] || 0) - ing.count);
      if (countsRef.current[ing.type] === 0) delete countsRef.current[ing.type];
    });
    countsRef.current[result] = (countsRef.current[result] || 0) + count;
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      consume.forEach(ing => {
        if ((countsRef.current[ing.type] || 0) === 0) {
          const idx = hotbar.indexOf(ing.type);
          if (idx !== -1) hotbar[idx] = BlockType.AIR;
        }
      });
      if (!hotbar.includes(result)) {
        const ei = hotbar.indexOf(BlockType.AIR);
        if (ei !== -1) hotbar[ei] = result;
      }
      return { ...prev, hotbar, counts: { ...countsRef.current } };
    });
  }, []);

  const handleInventoryAssign = useCallback((slotIdx: number, type: BlockType) => {
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      hotbar[slotIdx] = type;
      return { ...prev, hotbar, selectedSlot: slotIdx };
    });
  }, []);

  // Chest interaction
  const handleChestOpen = useCallback((x: number, y: number, z: number) => {
    const key = `${x},${y},${z}`;
    if (!chestsRef.current.has(key)) {
      chestsRef.current.set(key, Array(CHEST_SLOTS).fill(BlockType.AIR));
    }
    setOpenChest({ x, y, z });
    setCraftingOpen(false);
    setInventoryOpen(false);
  }, []);

  const handleChestChange = useCallback((newContents: BlockType[], newCounts: Record<number, number>) => {
    if (!openChest) return;
    const key = `${openChest.x},${openChest.y},${openChest.z}`;
    chestsRef.current.set(key, newContents);
    countsRef.current = { ...newCounts };
    setUiState(prev => ({ ...prev, counts: { ...newCounts } }));
  }, [openChest]);

  // Respawn
  const handleRespawn = useCallback(() => {
    setDead(false);
    setRespawnTrigger(t => t + 1);
    setUiState(prev => ({
      ...prev,
      health: 20, hunger: 20,
      hotbar: [...SURVIVAL_HOTBAR], counts: {},
    }));
    countsRef.current = {};
  }, []);

  const { mode, hotbar, selectedSlot, health, hunger, pos, counts } = uiState;

  const chestContents = openChest
    ? (chestsRef.current.get(`${openChest.x},${openChest.y},${openChest.z}`) ?? Array(CHEST_SLOTS).fill(BlockType.AIR))
    : null;

  return (
    <div style={{ width:'100vw', height:'100vh', overflow:'hidden', background:'#000', position:'relative' }}>

      {/* ── Start screen ─────────────────────────────────────── */}
      {!started && (
        <div onClick={() => setStarted(true)} style={{
          position:'absolute', inset:0, zIndex:100,
          background:'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection:'column', color:'#fff', cursor:'pointer',
          fontFamily:'"Courier New", monospace',
        }}>
          <div style={{ fontSize:52, fontWeight:'bold', color:'#5cb85c', textShadow:'0 0 20px rgba(92,184,92,0.6)', letterSpacing:4, marginBottom:8 }}>
            VoxelCraft
          </div>
          <div style={{ fontSize:13, color:'#aaa', marginBottom:40, letterSpacing:1 }}>
            226 Blocks · 10 Biomes · Crafting · Mobs · Pixel Textures
          </div>
          <div style={{ background:'rgba(92,184,92,0.2)', border:'2px solid #5cb85c', borderRadius:8, padding:'12px 32px', fontSize:18, color:'#5cb85c', letterSpacing:2 }}>
            ▶  CLICK TO PLAY
          </div>
          <div style={{ marginTop:40, fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:2, textAlign:'center' }}>
            WASD — Move &nbsp;|&nbsp; SPACE — Jump &nbsp;|&nbsp; SHIFT — Fly Down<br/>
            LMB — Break &nbsp;|&nbsp; RMB — Place / Open Chest &nbsp;|&nbsp; 1–9 — Hotbar<br/>
            E — Crafting &nbsp;|&nbsp; I — Inventory &nbsp;|&nbsp; Tab — Creative/Survival
          </div>
        </div>
      )}

      {/* ── Death screen ─────────────────────────────────────── */}
      {dead && (
        <div style={{
          position:'absolute', inset:0, zIndex:90,
          background:'rgba(80,0,0,0.82)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          fontFamily:'"Courier New", monospace', color:'#fff',
        }}>
          <div style={{ fontSize:48, fontWeight:'bold', color:'#ff3333', textShadow:'0 0 30px #ff000088', letterSpacing:4, marginBottom:16 }}>
            YOU DIED
          </div>
          <div style={{ fontSize:14, color:'#cc9999', marginBottom:40 }}>
            Better luck next time, adventurer.
          </div>
          <div
            data-touch-btn="1"
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); handleRespawn(); }}
            onClick={handleRespawn}
            style={{
              background:'rgba(200,40,40,0.3)', border:'2px solid #ff4444',
              borderRadius:8, padding:'14px 48px', fontSize:20,
              color:'#ffaaaa', letterSpacing:3, cursor:'pointer',
              fontFamily:'"Courier New", monospace',
            }}
          >
            ⟳ RESPAWN
          </div>
        </div>
      )}

      {/* ── HUD ──────────────────────────────────────────────── */}
      {started && !dead && (
        <HUD
          mode={mode} health={health} hunger={hunger}
          hotbar={hotbar} counts={counts}
          selectedSlot={selectedSlot} pos={pos}
          onSlotSelect={handleSlotSelect}
          onOpenInventory={() => { setInventoryOpen(o => !o); setCraftingOpen(false); }}
        />
      )}

      {/* ── Top toolbar (mobile) ─────────────────────────────── */}
      {started && !dead && (
        <div style={{
          position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
          zIndex:30, display:'flex', gap:8, pointerEvents:'auto',
        }}>
          <div
            data-touch-btn="1"
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setCraftingOpen(o => !o); setInventoryOpen(false); }}
            onClick={() => { setCraftingOpen(o => !o); setInventoryOpen(false); }}
            style={{
              padding:'6px 14px', borderRadius:16,
              background:'rgba(50,50,80,0.8)', border:'1px solid rgba(100,100,180,0.6)',
              color:'#aac', fontSize:11, fontWeight:700, cursor:'pointer', userSelect:'none',
            }}
          >⚒ Craft</div>
          <div
            data-touch-btn="1"
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setInventoryOpen(o => !o); setCraftingOpen(false); }}
            onClick={() => { setInventoryOpen(o => !o); setCraftingOpen(false); }}
            style={{
              padding:'6px 14px', borderRadius:16,
              background:'rgba(30,60,80,0.8)', border:'1px solid rgba(68,136,204,0.6)',
              color:'#7ac', fontSize:11, fontWeight:700, cursor:'pointer', userSelect:'none',
            }}
          >📦 Bag</div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      {craftingOpen && (
        <Crafting
          counts={mode === 'CREATIVE'
            ? (() => { const c: Record<number,number> = {}; for (let i=1;i<=225;i++) c[i]=99; return c; })()
            : counts}
          onCraft={handleCraft}
          onClose={() => setCraftingOpen(false)}
        />
      )}
      {inventoryOpen && (
        <Inventory
          mode={mode} counts={counts} hotbar={hotbar}
          selectedSlot={selectedSlot}
          onAssign={handleInventoryAssign}
          onClose={() => setInventoryOpen(false)}
        />
      )}
      {openChest && chestContents && (
        <ChestUI
          contents={chestContents}
          counts={mode === 'CREATIVE'
            ? (() => { const c: Record<number,number> = {}; for (let i=1;i<=225;i++) c[i]=99; return c; })()
            : counts}
          onContentsChange={handleChestChange}
          onClose={() => setOpenChest(null)}
        />
      )}

      {/* ── Touch controls ───────────────────────────────────── */}
      {started && <TouchControls stateRef={touchRef} />}

      {/* ── 3D Canvas ────────────────────────────────────────── */}
      <KeyboardControls map={KEY_MAP}>
        <Canvas
          camera={{ fov: 75, near: 0.05, far: 220 }}
          gl={{ antialias: false }}
          style={{ width:'100%', height:'100%' }}
        >
          <color attach="background" args={['#87CEEB']} />
          <fog attach="fog" args={['#aadcf0', 50, 110]} />
          <ambientLight intensity={0.45} />
          <directionalLight position={[50, 100, 30]} intensity={1.2} />

          <World playerChunkRef={playerChunkRef} />
          <Animals />

          {started && (
            <>
              <Mobs playerPos={playerPos.current} onPlayerDamage={handleMobDamage} />
              <Player
                mode={mode}
                setMode={handleSetMode}
                playerChunkRef={playerChunkRef}
                onStateChange={handleStateChange}
                touchRef={touchRef}
                externalSlot={selectedSlot}
                externalHotbar={hotbar}
                canPlace={canPlace}
                onBlockBreak={onBlockBreak}
                onBlockPlace={onBlockPlace}
                onChestOpen={handleChestOpen}
                isDead={dead}
                respawnTrigger={respawnTrigger}
              />
            </>
          )}
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
