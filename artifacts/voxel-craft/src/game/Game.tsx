import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType, HOTBAR_CREATIVE } from './blocks';
import { worldManager, type WorldType } from './worldGen';
import GameOptionsPanel from './GameOptionsPanel';
import World, { type BreakingState } from './World';
import Player from './Player';
import Animals from './Animals';
import Mobs from './Mobs';
import HUD from './HUD';
import DayNight from './DayNight';
import TouchControls, { TouchState, createTouchState } from './TouchControls';
import Crafting from './Crafting';
import Inventory from './Inventory';
import ChestUI from './ChestUI';
import Chat from './Chat';
import ItemDrops, { type DroppedItem } from './ItemDrops';
import CraftingTable from './CraftingTable';
import startBackgroundUrl from '@assets/IMG_1402_1791524151994.jpeg';

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

function SceneSettings({ viewDistance }: { viewDistance: number }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.far = Math.max(220, viewDistance * 16 + 64);
    camera.updateProjectionMatrix();
  }, [camera, viewDistance]);

  return null;
}

interface UIState {
  health:       number;
  hunger:       number;
  hotbar:       BlockType[];
  selectedSlot: number;
  pos:          { x: number; y: number; z: number };
  mode:         'CREATIVE' | 'SURVIVAL';
  counts:       Record<number, number>;
}

export default function Game() {
  const [optionsOpen,    setOptionsOpen    ] = useState(false);
  const [singlePlayerMenuOpen, setSinglePlayerMenuOpen] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<'CREATIVE' | 'SURVIVAL'>('CREATIVE');
  const [selectedWorldType, setSelectedWorldType] = useState<WorldType>('normal');
  const [worldRevision, setWorldRevision] = useState(0);
  const [viewDistance,   setViewDistance   ] = useState(8);
  const [fogEnabled,     setFogEnabled     ] = useState(true);
  const [started,        setStarted]        = useState(false);
  const [worldLoading, setWorldLoading] = useState(false);
  const [worldLoadProgress, setWorldLoadProgress] = useState(0);
  const [gamePaused, setGamePaused] = useState(false);
  const [craftingOpen,   setCraftingOpen]   = useState(false);
  const [inventoryOpen,  setInventoryOpen]  = useState(false);
  const [dead,           setDead]           = useState(false);
  const [respawnTrigger, setRespawnTrigger] = useState(0);
  const [openChest,      setOpenChest]      = useState<{ x: number; y: number; z: number } | null>(null);
  const [openCraftingTable, setOpenCraftingTable] = useState<{ x: number; y: number; z: number } | null>(null);
  const [drops,          setDrops]          = useState<DroppedItem[]>([]);

  const [uiState, setUiState] = useState<UIState>({
    health: 20, hunger: 20,
    hotbar: [...HOTBAR_CREATIVE], selectedSlot: 0,
    pos: { x: 0, y: 0, z: 0 },
    mode: 'CREATIVE',
    counts: {},
  });

  const playerChunkRef = useRef({ x: 0, z: 0 });
  const breakingRef = useRef<BreakingState>({
    active: false, x: 0, y: 0, z: 0,
    nx: 0, ny: 0, nz: 0, progress: 0,
  });
  const touchRef       = useRef<TouchState>(createTouchState());
  const playerPosRef   = useRef(new THREE.Vector3(8, 30, 8));
  const countsRef      = useRef<Record<number, number>>({});
  const nextDropIdRef  = useRef(1);
  const chestsRef      = useRef<Map<string, BlockType[]>>(new Map());
  // Shared refs for Chat ↔ Player/DayNight communication
  const tpRef          = useRef<{ x: number; y: number; z: number } | null>(null);
  const dayTimeRef     = useRef<number>(0.5);

  const handlePauseGame = useCallback(() => {
    setGamePaused(true);
    setOptionsOpen(false);
    setCraftingOpen(false);
    setInventoryOpen(false);
    setOpenChest(null);
    setOpenCraftingTable(null);
    touchRef.current = createTouchState();
    breakingRef.current.active = false;
    document.exitPointerLock?.();
  }, []);

  const handleResumeGame = useCallback(() => {
    setGamePaused(false);
    setOptionsOpen(false);
  }, []);

  const handleReturnToTitle = useCallback(() => {
    setGamePaused(false);
    setStarted(false);
    setOptionsOpen(false);
    setSinglePlayerMenuOpen(false);
    setCraftingOpen(false);
    setInventoryOpen(false);
    setOpenChest(null);
    setOpenCraftingTable(null);
    touchRef.current = createTouchState();
    breakingRef.current.active = false;
    document.exitPointerLock?.();
  }, []);

  // Death detection
  useEffect(() => {
    if (uiState.mode === 'SURVIVAL' && uiState.health <= 0 && !dead && started) {
      setDead(true);
      setCraftingOpen(false);
      setInventoryOpen(false);
      setOpenChest(null);
      setOpenCraftingTable(null);
    }
  }, [uiState.health, uiState.mode, dead, started]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started || dead) return;
      if (e.code === 'Tab') {
        e.preventDefault();
        if (e.repeat) return;
        if (gamePaused) handleResumeGame();
        else handlePauseGame();
        return;
      }
      if (gamePaused) return;

      // Don't intercept T (chat uses it) or when typing in an input
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isTyping) return;
      if (e.code === 'KeyE') { e.preventDefault(); setCraftingOpen(o => !o); setInventoryOpen(false); }
      if (e.code === 'KeyI') { e.preventDefault(); setInventoryOpen(o => !o); setCraftingOpen(false); }
      if (e.code === 'Escape') { setCraftingOpen(false); setInventoryOpen(false); setOpenChest(null); setOpenCraftingTable(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, dead, gamePaused, handlePauseGame, handleResumeGame]);

  const handleStateChange = useCallback((s: {
    health: number; hunger: number;
    hotbar: BlockType[]; selectedSlot: number;
    pos: THREE.Vector3;
  }) => {
    playerPosRef.current.copy(s.pos);
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
    setDrops([]);
    setUiState(prev => ({
      ...prev, mode: m,
      hotbar: m === 'CREATIVE' ? [...HOTBAR_CREATIVE] : [...SURVIVAL_HOTBAR],
      counts: {},
    }));
  }, []);

  const handleWorldLoadProgress = useCallback((loadedChunks: number, totalChunks: number) => {
    const progress = Math.floor((loadedChunks / totalChunks) * 100);
    setWorldLoadProgress(previous => Math.max(previous, progress));
  }, []);

  const handleWorldReady = useCallback(() => {
    setWorldLoadProgress(100);
    setWorldLoading(false);
    setStarted(true);
  }, []);

  const handleCreateWorld = useCallback(() => {
    worldManager.resetWorld(selectedWorldType);
    setWorldRevision(revision => revision + 1);
    playerChunkRef.current = { x: 0, z: 0 };
    breakingRef.current.active = false;
    countsRef.current = {};
    chestsRef.current.clear();
    nextDropIdRef.current = 1;
    setDrops([]);
    setDead(false);
    setWorldLoadProgress(0);
    setWorldLoading(true);
    setUiState(prev => ({
      ...prev,
      health: 20,
      hunger: 20,
      mode: selectedGameMode,
      hotbar: selectedGameMode === 'CREATIVE' ? [...HOTBAR_CREATIVE] : [...SURVIVAL_HOTBAR],
      selectedSlot: 0,
      counts: {},
    }));
    setSinglePlayerMenuOpen(false);
  }, [selectedGameMode, selectedWorldType]);

  const canPlace    = useCallback((type: BlockType) => (countsRef.current[type] || 0) > 0, []);

  const onBlockBreak = useCallback((type: BlockType, position: THREE.Vector3) => {
    if (type === BlockType.AIR) return;
    setDrops(prev => [...prev, {
      id: nextDropIdRef.current++,
      type,
      position: { x: position.x, y: position.y, z: position.z },
    }]);
  }, []);

  const onCollectDrop = useCallback((drop: DroppedItem) => {
    setDrops(prev => prev.filter(item => item.id !== drop.id));
    countsRef.current[drop.type] = (countsRef.current[drop.type] || 0) + 1;
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      if (!hotbar.includes(drop.type)) {
        const ei = hotbar.indexOf(BlockType.AIR);
        if (ei !== -1) hotbar[ei] = drop.type;
      }
      return { ...prev, hotbar, counts: { ...countsRef.current } };
    });
  }, []);

  const onBlockPlace = useCallback((type: BlockType) => {
    const newCnt = Math.max(0, (countsRef.current[type] || 0) - 1);
    countsRef.current[type] = newCnt;
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      if (newCnt === 0) { const i = hotbar.indexOf(type); if (i !== -1) hotbar[i] = BlockType.AIR; }
      return { ...prev, hotbar, counts: { ...countsRef.current } };
    });
  }, []);

  const handleSlotSelect = useCallback((i: number) => {
    setUiState(prev => ({ ...prev, selectedSlot: i }));
  }, []);

  const handleCraft = useCallback((result: BlockType, count: number, consume: { type: BlockType; count: number }[]) => {
    if (uiState.mode === 'SURVIVAL' && !consume.every(ing => (countsRef.current[ing.type] || 0) >= ing.count)) return;
    if (uiState.mode === 'SURVIVAL') {
      consume.forEach(ing => {
        countsRef.current[ing.type] = (countsRef.current[ing.type] || 0) - ing.count;
        if (countsRef.current[ing.type] <= 0) delete countsRef.current[ing.type];
      });
    }
    countsRef.current[result] = (countsRef.current[result] || 0) + count;
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      consume.forEach(ing => {
        if ((countsRef.current[ing.type] || 0) === 0) { const idx = hotbar.indexOf(ing.type); if (idx !== -1) hotbar[idx] = BlockType.AIR; }
      });
      if (!hotbar.includes(result)) { const ei = hotbar.indexOf(BlockType.AIR); if (ei !== -1) hotbar[ei] = result; }
      return { ...prev, hotbar, counts: { ...countsRef.current } };
    });
  }, [uiState.mode]);

  const handleInventoryAssign = useCallback((slotIdx: number, type: BlockType) => {
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      hotbar[slotIdx] = type;
      return { ...prev, hotbar, selectedSlot: slotIdx };
    });
  }, []);

  const handleChestOpen = useCallback((x: number, y: number, z: number) => {
    const key = `${x},${y},${z}`;
    if (!chestsRef.current.has(key)) chestsRef.current.set(key, Array(CHEST_SLOTS).fill(BlockType.AIR));
    setOpenChest({ x, y, z });
    setCraftingOpen(false);
    setInventoryOpen(false);
    setOpenCraftingTable(null);
  }, []);

  const handleCraftingTableOpen = useCallback((x: number, y: number, z: number) => {
    setOpenCraftingTable({ x, y, z });
    setCraftingOpen(false);
    setInventoryOpen(false);
    setOpenChest(null);
  }, []);

  const handleChestChange = useCallback((newContents: BlockType[], newCounts: Record<number, number>) => {
    if (!openChest) return;
    chestsRef.current.set(`${openChest.x},${openChest.y},${openChest.z}`, newContents);
    countsRef.current = { ...newCounts };
    setUiState(prev => ({ ...prev, counts: { ...newCounts } }));
  }, [openChest]);

  const handleRespawn = useCallback(() => {
    setDead(false);
    setRespawnTrigger(t => t + 1);
    setUiState(prev => ({ ...prev, health: 20, hunger: 20, hotbar: [...SURVIVAL_HOTBAR], counts: {} }));
    countsRef.current = {};
    setDrops([]);
  }, []);

  const { mode, hotbar, selectedSlot, health, hunger, pos, counts } = uiState;

  const chestContents = openChest
    ? (chestsRef.current.get(`${openChest.x},${openChest.y},${openChest.z}`) ?? Array(CHEST_SLOTS).fill(BlockType.AIR))
    : null;

  return (
    <div
      className="game-shell"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{
        overflow:'hidden', background:'#000', position:'relative',
        userSelect:'none', WebkitUserSelect:'none', WebkitTouchCallout:'none',
      }}
    >

      {/* ── Start screen ─────────────────────────────────────── */}
      {(!started || worldLoading) && (
        <div data-no-look="1" style={{
          position:'absolute', inset:0, zIndex:100,
          backgroundImage:`linear-gradient(180deg, rgba(8,16,28,0.1) 0%, rgba(8,12,20,0.58) 100%), url(${startBackgroundUrl})`,
          backgroundSize:'cover', backgroundPosition:'center',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection:'column', color:'#fff', cursor:'pointer',
          fontFamily:'"Courier New", monospace',
          padding:'24px', boxSizing:'border-box',
        }}>
          <div style={{ fontSize:'clamp(36px, 7vw, 60px)', fontWeight:'bold', color:'#fff', textShadow:'3px 4px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.7)', letterSpacing:4, marginBottom:8 }}>
             TipeCraft
          </div>
          <div style={{ fontSize:13, color:'#f0f0f0', textShadow:'1px 2px 0 #000', marginBottom:28, letterSpacing:1, textAlign:'center' }}>
            {worldLoading ? 'Deine Welt wird vorbereitet …' : '226 Blöcke · 10 Biome · Crafting · Mobs · Tag/Nacht · Chat'}
          </div>
          {worldLoading ? (
            <div
              role="status"
              aria-live="polite"
              style={{ width:'min(360px, 84vw)', textAlign:'center' }}
            >
              <div style={{ fontSize:16, letterSpacing:2, marginBottom:12 }}>WELT WIRD GELADEN</div>
              <div
                role="progressbar"
                aria-label="Welt wird geladen"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={worldLoadProgress}
                style={{
                  width:'100%', height:22, padding:3, boxSizing:'border-box',
                  background:'rgba(0,0,0,0.72)', border:'2px solid #f1f1f1',
                  boxShadow:'0 3px 0 rgba(0,0,0,0.65)',
                }}
              >
                <div style={{
                  width:`${worldLoadProgress}%`, height:'100%',
                  minWidth:worldLoadProgress > 0 ? 3 : 0,
                  background:'linear-gradient(90deg, #72bb45, #c2ef67)',
                  transition:'width 120ms linear',
                }} />
              </div>
              <div style={{ marginTop:9, fontSize:12, textShadow:'1px 2px 0 #000' }}>
                {worldLoadProgress}%
              </div>
            </div>
          ) : !optionsOpen && !singlePlayerMenuOpen ? (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:10, width:'min(270px, 84vw)' }}>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => setSinglePlayerMenuOpen(true)}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setSinglePlayerMenuOpen(true); }}
                  style={{
                    background:'rgba(35,35,35,0.88)', border:'2px solid #f1f1f1',
                    color:'#fff', padding:'12px 20px', fontSize:17, letterSpacing:2,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                    boxShadow:'0 3px 0 rgba(0,0,0,0.65)',
                  }}
                >SINGLEPLAYER</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  disabled
                  style={{
                    background:'rgba(35,35,35,0.65)', border:'2px solid rgba(210,210,210,0.55)',
                    color:'rgba(255,255,255,0.6)', padding:'12px 20px', fontSize:17, letterSpacing:2,
                    fontFamily:'"Courier New", monospace', cursor:'not-allowed',
                    boxShadow:'0 3px 0 rgba(0,0,0,0.5)',
                  }}
                >MULTIPLAYER</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => setOptionsOpen(true)}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setOptionsOpen(true); }}
                  style={{
                    background:'rgba(35,35,35,0.88)', border:'2px solid #d7d7d7',
                    color:'#fff', padding:'12px 20px', fontSize:17, letterSpacing:2,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                    boxShadow:'0 3px 0 rgba(0,0,0,0.65)',
                  }}
                >OPTIONS</button>
              </div>
              <div style={{ marginTop:30, fontSize:11, color:'rgba(255,255,255,0.84)', textShadow:'1px 1px 0 #000', lineHeight:2, textAlign:'center' }}>
                WASD — Bewegen &nbsp;|&nbsp; SPACE — Springen &nbsp;|&nbsp; SHIFT — Runter fliegen<br/>
                LMB — Abbauen &nbsp;|&nbsp; RMB — Platzieren / Truhe öffnen &nbsp;|&nbsp; 1–9 — Hotbar
              </div>
            </>
          ) : optionsOpen ? (
            <GameOptionsPanel
              viewDistance={viewDistance}
              onViewDistanceChange={setViewDistance}
              fogEnabled={fogEnabled}
              onFogEnabledChange={setFogEnabled}
              onBack={() => setOptionsOpen(false)}
            />
          ) : (
            <div
              data-no-look="1"
              onClick={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              style={{
                width:'min(430px, 92vw)', padding:22, boxSizing:'border-box',
                background:'rgba(30,30,30,0.94)', border:'2px solid #eee',
                boxShadow:'0 4px 0 rgba(0,0,0,0.7)', color:'#fff',
                maxHeight:'calc(100dvh - 36px)', overflowY:'auto',
              }}
            >
              <div style={{ fontSize:22, letterSpacing:2, textAlign:'center', marginBottom:22 }}>
                NEUE WELT
              </div>

              <div style={{ fontSize:13, letterSpacing:1, marginBottom:9 }}>SPIELMODUS</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:20 }}>
                {(['CREATIVE', 'SURVIVAL'] as const).map(gameMode => {
                  const active = selectedGameMode === gameMode;
                  return (
                    <button
                      key={gameMode}
                      type="button"
                      data-touch-btn="1"
                      aria-pressed={active}
                      onClick={() => setSelectedGameMode(gameMode)}
                      onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setSelectedGameMode(gameMode); }}
                      style={{
                        background:active ? 'rgba(91,142,75,0.95)' : 'rgba(45,45,45,0.92)',
                        border:`2px solid ${active ? '#d8ffb0' : '#aaa'}`,
                        color:'#fff', padding:'11px 8px', fontSize:13, letterSpacing:1,
                        fontFamily:'"Courier New", monospace', cursor:'pointer',
                      }}
                    >{gameMode === 'CREATIVE' ? 'KREATIV' : 'SURVIVAL'}</button>
                  );
                })}
              </div>

              <div style={{ fontSize:13, letterSpacing:1, marginBottom:9 }}>WELTTYP</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:22 }}>
                {([
                  { type:'normal' as const, label:'NORMAL', description:'Biom, Berge und Landschaften' },
                  { type:'superflat' as const, label:'SUPERFLACH', description:'Komplett flache Graswelt' },
                ]).map(world => {
                  const active = selectedWorldType === world.type;
                  return (
                    <button
                      key={world.type}
                      type="button"
                      data-touch-btn="1"
                      aria-pressed={active}
                      onClick={() => setSelectedWorldType(world.type)}
                      onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setSelectedWorldType(world.type); }}
                      style={{
                        minHeight:76, background:active ? 'rgba(91,142,75,0.95)' : 'rgba(45,45,45,0.92)',
                        border:`2px solid ${active ? '#d8ffb0' : '#aaa'}`,
                        color:'#fff', padding:'9px 7px', fontFamily:'"Courier New", monospace', cursor:'pointer',
                      }}
                    >
                      <span style={{ display:'block', fontSize:13, letterSpacing:1, marginBottom:5 }}>{world.label}</span>
                      <span style={{ display:'block', fontSize:10, lineHeight:1.35, color:'#ddd' }}>{world.description}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => setSinglePlayerMenuOpen(false)}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setSinglePlayerMenuOpen(false); }}
                  style={{
                    background:'rgba(55,55,55,0.95)', border:'2px solid #ddd',
                    color:'#fff', padding:'11px 8px', fontSize:13, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >ZURÜCK</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={handleCreateWorld}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); handleCreateWorld(); }}
                  style={{
                    background:'rgba(75,130,60,0.96)', border:'2px solid #efffdc',
                    color:'#fff', padding:'11px 8px', fontSize:13, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >WELT ERSTELLEN</button>
              </div>
            </div>
          )}
        </div>
      )}

      {started && !dead && gamePaused && (
        <div
          data-no-look="1"
          onClick={event => event.stopPropagation()}
          onTouchStart={event => event.stopPropagation()}
          style={{
            position:'absolute', inset:0, zIndex:120, padding:20, boxSizing:'border-box',
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(0,0,0,0.72)', color:'#fff',
            fontFamily:'"Courier New", monospace', touchAction:'manipulation',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-menu-title"
            style={{
              width:'min(380px, 92vw)', padding:22, boxSizing:'border-box',
              display:'flex', flexDirection:'column', alignItems:'stretch', gap:11,
              background:'rgba(30,30,30,0.96)', border:'2px solid #eee',
              boxShadow:'0 4px 0 rgba(0,0,0,0.7)',
            }}
          >
            {optionsOpen ? (
              <GameOptionsPanel
                viewDistance={viewDistance}
                onViewDistanceChange={setViewDistance}
                fogEnabled={fogEnabled}
                onFogEnabledChange={setFogEnabled}
                onBack={() => setOptionsOpen(false)}
              />
            ) : (
              <>
                <div id="pause-menu-title" style={{ fontSize:22, letterSpacing:2, textAlign:'center', marginBottom:10 }}>
                  PAUSED
                </div>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={handleResumeGame}
                  onTouchStart={event => { event.stopPropagation(); event.preventDefault(); handleResumeGame(); }}
                  style={{
                    background:'rgba(75,130,60,0.96)', border:'2px solid #efffdc',
                    color:'#fff', padding:'12px 10px', fontSize:15, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >FORTSETZEN</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => setOptionsOpen(true)}
                  onTouchStart={event => { event.stopPropagation(); event.preventDefault(); setOptionsOpen(true); }}
                  style={{
                    background:'rgba(55,55,55,0.95)', border:'2px solid #ddd',
                    color:'#fff', padding:'12px 10px', fontSize:15, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >OPTIONS</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={handleReturnToTitle}
                  onTouchStart={event => { event.stopPropagation(); event.preventDefault(); handleReturnToTitle(); }}
                  style={{
                    background:'rgba(55,55,55,0.95)', border:'2px solid #aaa',
                    color:'#fff', padding:'12px 10px', fontSize:13, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >TO TITLE-SCREEN</button>
                <div style={{ marginTop:2, fontSize:11, color:'#ddd', textAlign:'center' }}>TAB — FORTSETZEN</div>
              </>
            )}
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
          filter:'grayscale(1)',
        }}>
          <div style={{ fontSize:48, fontWeight:'bold', color:'#ff3333', textShadow:'0 0 30px #ff000088', letterSpacing:4, marginBottom:16 }}>
            YOU DIED
          </div>
          <div style={{ fontSize:14, color:'#cc9999', marginBottom:40 }}>
            Viel Glück beim nächsten Versuch, Abenteurer.
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
        />
      )}

      {/* ── Chat ─────────────────────────────────────────────── */}
      {started && !dead && (
        <Chat
          tpRef={tpRef}
          dayTimeRef={dayTimeRef}
          onSetMode={handleSetMode}
          currentMode={mode}
        />
      )}

      {/* ── Top toolbar (mobile) ─────────────────────────────── */}
      {started && !dead && (
        <div style={{
          position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
          zIndex:30, display:'flex', gap:8, pointerEvents:'auto',
          filter:'grayscale(1)',
        }}>
          <div
            data-touch-btn="1"
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setInventoryOpen(o => !o); setCraftingOpen(false); }}
            onClick={() => { setInventoryOpen(o => !o); setCraftingOpen(false); }}
            style={{ padding:'6px 14px', borderRadius:16, background:'rgba(30,60,80,0.8)', border:'1px solid rgba(68,136,204,0.6)', color:'#7ac', fontSize:11, fontWeight:700, cursor:'pointer', userSelect:'none' }}
          >📦 Bag</div>
        </div>
      )}
      {started && !dead && !gamePaused && (
        <button
          type="button"
          aria-label="Pausenmenü öffnen"
          title="Pausenmenü"
          data-touch-btn="1"
          onClick={handlePauseGame}
          onTouchStart={event => { event.stopPropagation(); event.preventDefault(); handlePauseGame(); }}
          style={{
            position:'absolute', top:42, right:12, zIndex:35,
            padding:'7px 11px', borderRadius:8,
            background:'rgba(30,30,30,0.88)', border:'1px solid rgba(220,220,220,0.72)',
            boxShadow:'0 2px 5px rgba(0,0,0,0.55)',
            color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
            fontFamily:'"Courier New", monospace', touchAction:'manipulation',
          }}
        >Ⅱ MENU</button>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      {craftingOpen && (
        <Crafting
          counts={mode === 'CREATIVE' ? (() => { const c: Record<number,number> = {}; for (let i=1;i<=225;i++) c[i]=99; return c; })() : counts}
          onCraft={handleCraft}
          onClose={() => setCraftingOpen(false)}
        />
      )}
      {inventoryOpen && (
        <Inventory
          mode={mode} counts={counts} hotbar={hotbar}
          selectedSlot={selectedSlot}
          onAssign={handleInventoryAssign}
           onCraft={handleCraft}
          onClose={() => setInventoryOpen(false)}
        />
      )}
      {openChest && chestContents && (
        <ChestUI
          contents={chestContents}
          counts={mode === 'CREATIVE' ? (() => { const c: Record<number,number> = {}; for (let i=1;i<=225;i++) c[i]=99; return c; })() : counts}
          onContentsChange={handleChestChange}
          onClose={() => setOpenChest(null)}
        />
      )}
      {openCraftingTable && (
        <CraftingTable
          mode={mode}
          counts={counts}
          onCraft={handleCraft}
          onClose={() => setOpenCraftingTable(null)}
        />
      )}

      {/* ── Touch controls ───────────────────────────────────── */}
      {started && !gamePaused && <TouchControls stateRef={touchRef} />}

      {/* ── 3D Canvas ────────────────────────────────────────── */}
      <KeyboardControls map={KEY_MAP}>
        <Canvas
          frameloop={gamePaused || (!started && !worldLoading) ? 'never' : 'always'}
          shadows
          camera={{ fov: 75, near: 0.05, far: Math.max(220, viewDistance * 16 + 64) }}
          gl={{ antialias: false }}
          style={{
            width:'100%', height:'100%',
            userSelect:'none', WebkitUserSelect:'none',
            WebkitTouchCallout:'none', touchAction:'none',
          }}
        >
          <SceneSettings viewDistance={viewDistance} />
          {fogEnabled && <fog attach="fog" args={['#9dcde8', Math.max(16, viewDistance * 16 - 64), viewDistance * 16 + 16]} />}

          <DayNight playerPosRef={playerPosRef} dayTimeRef={dayTimeRef} />
          <World
            playerChunkRef={playerChunkRef}
            viewDistance={viewDistance}
            breakingRef={breakingRef}
            worldRevision={worldRevision}
            isWorldLoading={worldLoading}
            onWorldLoadProgress={handleWorldLoadProgress}
            onWorldReady={handleWorldReady}
          />
          <ItemDrops drops={drops} playerPosRef={playerPosRef} onCollect={onCollectDrop} />
          <Animals />

          {started && (
            <>
              <Mobs
                playerPos={playerPosRef.current}
                onPlayerDamage={handleMobDamage}
                dayTimeRef={dayTimeRef}
              />
              <Player
                mode={mode}
                setMode={handleSetMode}
                playerChunkRef={playerChunkRef}
                onStateChange={handleStateChange}
                touchRef={touchRef}
                breakingRef={breakingRef}
                externalSlot={selectedSlot}
                externalHotbar={hotbar}
                canPlace={canPlace}
                onBlockBreak={onBlockBreak}
                onBlockPlace={onBlockPlace}
                onChestOpen={handleChestOpen}
                onCraftingTableOpen={handleCraftingTableOpen}
                isDead={dead}
                respawnTrigger={respawnTrigger}
                tpRef={tpRef}
              />
            </>
          )}
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
