import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType, HOTBAR_CREATIVE, isPlaceableBlock } from './blocks';
import { worldManager, CHUNK_SIZE, WORLD_MIN_Y, WORLD_MAX_Y, type WorldType } from './worldGen';
import GameOptionsPanel from './GameOptionsPanel';
import World, { type BreakingState } from './World';
import WorldBorderVisual from './WorldBorder';
import Player from './Player';
import Animals from './Animals';
import Mobs from './Mobs';
import HUD from './HUD';
import DayNight from './DayNight';
import TouchControls, { TouchState, createTouchState } from './TouchControls';
import Inventory from './Inventory';
import ChestUI from './ChestUI';
import Chat from './Chat';
import ItemDrops, { type DroppedItem } from './ItemDrops';
import CraftingTable from './CraftingTable';
import FurnaceUI, { type FurnaceContents } from './FurnaceUI';
import { createWorldArchive, readWorldArchive } from './worldArchive';
import {
  MultiplayerSession,
  type BlockChangeMessage,
  type MultiplayerGameMessage,
  type MultiplayerRole,
  type PlayerStateMessage,
  type WorldInitMessage,
} from './multiplayer';
import RemotePlayerAvatar, { type RemotePlayerSnapshot } from './RemotePlayerAvatar';
import startBackgroundUrl from '@assets/IMG_1402_1791524151994.jpeg';
import { playMenuClickSound } from './blockSounds';
import StartupSplash from './StartupSplash';

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

function runStartMenuAction(action: () => void): void {
  playMenuClickSound();
  action();
}

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
  const [multiplayerMenuOpen, setMultiplayerMenuOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [joiningCode, setJoiningCode] = useState('');
  const [multiplayerStatus, setMultiplayerStatus] = useState('');
  const [multiplayerRole, setMultiplayerRole] = useState<MultiplayerRole | null>(null);
  const [multiplayerCode, setMultiplayerCode] = useState('');
  const [connectedPlayerCount, setConnectedPlayerCount] = useState(0);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayerSnapshot[]>([]);
  const [selectedGameMode, setSelectedGameMode] = useState<'CREATIVE' | 'SURVIVAL'>('CREATIVE');
  const [survivalRulesLocked, setSurvivalRulesLocked] = useState(false);
  const [selectedWorldType, setSelectedWorldType] = useState<WorldType>('normal');
  const [worldRevision, setWorldRevision] = useState(0);
  const [viewDistance,   setViewDistance   ] = useState(8);
  const [fogEnabled,     setFogEnabled     ] = useState(true);
  const [worldBorderEnabled, setWorldBorderEnabled] = useState(true);
  const [thirdPerson, setThirdPerson] = useState(false);
  const [started,        setStarted]        = useState(false);
  const [worldLoading, setWorldLoading] = useState(false);
  const [worldLoadProgress, setWorldLoadProgress] = useState(0);
  const [gamePaused, setGamePaused] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inventoryOpen,  setInventoryOpen]  = useState(false);
  const [dead,           setDead]           = useState(false);
  const [respawnTrigger, setRespawnTrigger] = useState(0);
  const [openChest,      setOpenChest]      = useState<{ x: number; y: number; z: number } | null>(null);
  const [openCraftingTable, setOpenCraftingTable] = useState<{ x: number; y: number; z: number } | null>(null);
  const [openFurnace, setOpenFurnace] = useState<{ x: number; y: number; z: number } | null>(null);
  const [archiveMessage, setArchiveMessage] = useState('');
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
    progress: 0,
  });
  const touchRef       = useRef<TouchState>(createTouchState());
  const playerPosRef   = useRef(new THREE.Vector3(8, 30, 8));
  const worldFileInputRef = useRef<HTMLInputElement>(null);
  const countsRef      = useRef<Record<number, number>>({});
  const nextDropIdRef  = useRef(1);
  const chestsRef      = useRef<Map<string, BlockType[]>>(new Map());
  const furnacesRef    = useRef<Map<string, FurnaceContents>>(new Map());
  // Shared refs for Chat ↔ Player/DayNight communication
  const tpRef          = useRef<{ x: number; y: number; z: number } | null>(null);
  const pendingMobDamageRef = useRef(0);
  const dayTimeRef     = useRef<number>(0.5);
  const multiplayerSessionRef = useRef<MultiplayerSession | null>(null);
  const multiplayerRoleRef = useRef<MultiplayerRole | null>(null);
  const awaitingHostWorldRef = useRef(false);
  const blockHistoryRef = useRef<Map<string, BlockChangeMessage>>(new Map());
  const uiStateRef = useRef(uiState);
  const sessionSettingsRef = useRef({
    mode: uiState.mode,
    modeLocked: survivalRulesLocked,
    worldBorderEnabled,
    viewDistance,
    fogEnabled,
  });
  multiplayerRoleRef.current = multiplayerRole;
  uiStateRef.current = uiState;
  sessionSettingsRef.current = {
    mode: uiState.mode,
    modeLocked: survivalRulesLocked,
    worldBorderEnabled,
    viewDistance,
    fogEnabled,
  };

  const handleWorldInit = useCallback((message: WorldInitMessage) => {
    if (multiplayerRoleRef.current !== 'guest' || !awaitingHostWorldRef.current) return;
    if (!Number.isInteger(message.seed) ||
        (message.worldType !== 'normal' && message.worldType !== 'superflat') ||
        (message.mode !== 'CREATIVE' && message.mode !== 'SURVIVAL') ||
        !message.spawn ||
        ![message.spawn.x, message.spawn.y, message.spawn.z].every(Number.isFinite)) {
      setMultiplayerStatus('Der Host hat ungültige Weltinformationen gesendet.');
      return;
    }
    if (typeof message.modeLocked !== 'boolean' ||
        typeof message.worldBorderEnabled !== 'boolean' ||
        typeof message.fogEnabled !== 'boolean' ||
        !Number.isInteger(message.viewDistance) ||
        message.viewDistance < 5 || message.viewDistance > 32 ||
        message.spawn.y < WORLD_MIN_Y || message.spawn.y > WORLD_MAX_Y) {
      setMultiplayerStatus('Der Host hat ungültige Weltoptionen gesendet.');
      return;
    }

    worldManager.resetWorld(message.worldType, message.seed);
    blockHistoryRef.current.clear();
    const spawn = { x: message.spawn.x + 3, y: message.spawn.y, z: message.spawn.z + 3 };
    tpRef.current = spawn;
    playerChunkRef.current = {
      x: Math.floor(spawn.x / CHUNK_SIZE),
      z: Math.floor(spawn.z / CHUNK_SIZE),
    };
    playerPosRef.current.set(spawn.x, spawn.y, spawn.z);
    countsRef.current = {};
    chestsRef.current.clear();
    furnacesRef.current.clear();
    setSelectedWorldType(message.worldType);
    setSelectedGameMode(message.mode);
    setSurvivalRulesLocked(message.modeLocked);
    setWorldBorderEnabled(message.worldBorderEnabled);
    setViewDistance(Math.max(5, Math.min(32, message.viewDistance)));
    setFogEnabled(message.fogEnabled);
    setUiState(prev => ({
      ...prev,
      mode: message.mode,
      health: 20,
      hunger: 20,
      hotbar: message.mode === 'CREATIVE' ? [...HOTBAR_CREATIVE] : [...SURVIVAL_HOTBAR],
      selectedSlot: 0,
      counts: {},
      pos: spawn,
    }));
    awaitingHostWorldRef.current = false;
    setWorldLoadProgress(1);
    setWorldLoading(true);
    setStarted(false);
    setDead(false);
    setGamePaused(false);
    setMultiplayerStatus('Welt empfangen. Chunks werden lokal geladen …');
    setWorldRevision(revision => revision + 1);
  }, []);

  const handleMultiplayerData = useCallback((message: MultiplayerGameMessage) => {
    if (message.type === 'world-init') {
      handleWorldInit(message);
      return;
    }
    if (message.type === 'block-change') {
      const { x, y, z, blockType } = message;
      if (![x, y, z, blockType].every(Number.isInteger) ||
          Math.abs(x) > 1_048_576 || Math.abs(z) > 1_048_576 ||
          y < WORLD_MIN_Y || y > WORLD_MAX_Y ||
          (blockType !== BlockType.AIR && !isPlaceableBlock(blockType as BlockType))) return;
      worldManager.setBlock(x, y, z, blockType as BlockType);
      blockHistoryRef.current.set(`${x},${y},${z}`, message);
      return;
    }
    if (message.type === 'block-history') {
      for (const change of message.changes) {
        if (![change.x, change.y, change.z, change.blockType].every(Number.isInteger) ||
            Math.abs(change.x) > 1_048_576 || Math.abs(change.z) > 1_048_576 ||
            change.y < WORLD_MIN_Y || change.y > WORLD_MAX_Y ||
            (change.blockType !== BlockType.AIR && !isPlaceableBlock(change.blockType as BlockType))) continue;
        worldManager.setBlock(change.x, change.y, change.z, change.blockType as BlockType);
        blockHistoryRef.current.set(`${change.x},${change.y},${change.z}`, change);
      }
      return;
    }
    if (message.type === 'player-state') {
      if (!message.playerId || message.playerId === multiplayerSessionRef.current?.localPlayerId ||
          ![message.x, message.y, message.z, message.yaw].every(Number.isFinite) ||
          Math.abs(message.x) > 1_048_576 || Math.abs(message.z) > 1_048_576) return;
      const player: RemotePlayerSnapshot = {
        playerId: message.playerId,
        x: message.x,
        y: message.y,
        z: message.z,
        yaw: message.yaw,
      };
      setRemotePlayers(previous => {
        const next = previous.filter(entry => entry.playerId !== player.playerId);
        next.push(player);
        return next;
      });
    }
  }, [handleWorldInit]);

  const createMultiplayerSession = useCallback(() => new MultiplayerSession({
    onRoomCreated: code => {
      setMultiplayerCode(code);
      setMultiplayerStatus('Web-Welt bereit. Teile diesen Code mit deinen Mitspielern.');
    },
    onJoined: () => setMultiplayerStatus('Verbunden. Warte auf die Welt des Hosts …'),
    onPeerConnected: peerId => {
      setConnectedPlayerCount(count => multiplayerRoleRef.current === 'guest' ? 2 : count + 1);
      setMultiplayerStatus('Peer-to-Peer-Verbindung hergestellt.');
      if (multiplayerRoleRef.current !== 'host') return;

      const settings = sessionSettingsRef.current;
      multiplayerSessionRef.current?.sendToPlayer(peerId, {
        type: 'world-init',
        seed: worldManager.getWorldSeed(),
        worldType: worldManager.worldType,
        mode: settings.mode,
        modeLocked: settings.modeLocked,
        worldBorderEnabled: settings.worldBorderEnabled,
        viewDistance: settings.viewDistance,
        fogEnabled: settings.fogEnabled,
        spawn: {
          x: playerPosRef.current.x,
          y: playerPosRef.current.y,
          z: playerPosRef.current.z,
        },
      });
      const changes = [...blockHistoryRef.current.values()];
      for (let index = 0; index < changes.length; index += 200) {
        multiplayerSessionRef.current?.sendToPlayer(peerId, {
          type: 'block-history',
          changes: changes.slice(index, index + 200),
        });
      }
    },
    onPeerDisconnected: peerId => {
      setConnectedPlayerCount(count => Math.max(multiplayerRoleRef.current === 'host' ? 1 : 0, count - 1));
      setRemotePlayers(previous => multiplayerRoleRef.current === 'guest'
        ? []
        : previous.filter(player => player.playerId !== peerId));
    },
    onData: (_peerId, message) => handleMultiplayerData(message),
    onError: message => {
      setMultiplayerStatus(message);
      if (multiplayerRoleRef.current === 'guest' && awaitingHostWorldRef.current) {
        awaitingHostWorldRef.current = false;
        multiplayerSessionRef.current?.close();
        multiplayerSessionRef.current = null;
        multiplayerRoleRef.current = null;
        setMultiplayerRole(null);
        setWorldLoading(false);
        setMultiplayerMenuOpen(true);
      }
    },
    onRoomClosed: reason => {
      const wasWaitingForWorld = awaitingHostWorldRef.current;
      multiplayerSessionRef.current?.close();
      multiplayerSessionRef.current = null;
      multiplayerRoleRef.current = null;
      setMultiplayerRole(null);
      setMultiplayerCode('');
      setConnectedPlayerCount(0);
      setRemotePlayers([]);
      awaitingHostWorldRef.current = false;
      setMultiplayerStatus(reason);
      if (wasWaitingForWorld) {
        setWorldLoading(false);
        setMultiplayerMenuOpen(true);
      }
    },
  }), [handleMultiplayerData]);

  const handlePauseGame = useCallback(() => {
    setGamePaused(true);
    setChatOpen(false);
    setOptionsOpen(false);
    setInventoryOpen(false);
    setOpenChest(null);
    setOpenCraftingTable(null);
    setOpenFurnace(null);
    touchRef.current = createTouchState();
    breakingRef.current.active = false;
    document.exitPointerLock?.();
  }, []);

  const handleResumeGame = useCallback(() => {
    setGamePaused(false);
    setOptionsOpen(false);
  }, []);

  const handleInventoryToggle = useCallback(() => {
    const opening = !inventoryOpen;
    if (opening) document.exitPointerLock?.();
    setInventoryOpen(opening);
  }, [inventoryOpen]);

  const handleReturnToTitle = useCallback(() => {
    multiplayerSessionRef.current?.close();
    multiplayerSessionRef.current = null;
    multiplayerRoleRef.current = null;
    awaitingHostWorldRef.current = false;
    blockHistoryRef.current.clear();
    setMultiplayerRole(null);
    setMultiplayerCode('');
    setConnectedPlayerCount(0);
    setRemotePlayers([]);
    setMultiplayerMenuOpen(false);
    setLinksOpen(false);
    setMultiplayerStatus('');
    setGamePaused(false);
    setChatOpen(false);
    setStarted(false);
    setOptionsOpen(false);
    setSinglePlayerMenuOpen(false);
    setInventoryOpen(false);
    setOpenChest(null);
    setOpenCraftingTable(null);
    setOpenFurnace(null);
    touchRef.current = createTouchState();
    breakingRef.current.active = false;
    document.exitPointerLock?.();
  }, []);

  // Death detection
  useEffect(() => {
    if (uiState.mode === 'SURVIVAL' && uiState.health <= 0 && !dead && started) {
      setDead(true);
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
      if (e.code === 'KeyE') {
        e.preventDefault();
        if (e.repeat) return;
        if (openCraftingTable) setOpenCraftingTable(null);
        else handleInventoryToggle();
      }
      if (e.code === 'Escape') { setInventoryOpen(false); setOpenChest(null); setOpenCraftingTable(null); setOpenFurnace(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, dead, gamePaused, openCraftingTable, handleInventoryToggle, handlePauseGame, handleResumeGame]);

  const handleStateChange = useCallback((s: {
    health: number; hunger: number;
    hotbar: BlockType[]; selectedSlot: number;
    pos: THREE.Vector3;
    yaw: number;
  }) => {
    playerPosRef.current.copy(s.pos);
    const session = multiplayerSessionRef.current;
    if (session && multiplayerRoleRef.current) {
      const message: PlayerStateMessage = {
        type: 'player-state',
        playerId: session.localPlayerId,
        x: s.pos.x,
        y: s.pos.y,
        z: s.pos.z,
        yaw: s.yaw,
      };
      session.sendToAll(message);
    }
    setUiState(prev => ({
      ...prev,
      health: s.health, hunger: s.hunger,
      hotbar: s.hotbar, selectedSlot: s.selectedSlot,
      pos: { x: s.pos.x, y: s.pos.y, z: s.pos.z },
    }));
  }, []);

  const handleWorldBlockChange = useCallback((x: number, y: number, z: number, blockType: BlockType) => {
    if (!multiplayerRoleRef.current) return;
    const change: BlockChangeMessage = { type: 'block-change', x, y, z, blockType };
    blockHistoryRef.current.set(`${x},${y},${z}`, change);
    multiplayerSessionRef.current?.sendToAll(change);
  }, []);

  const handleMobDamage = useCallback((amount: number) => {
    if (uiState.mode !== 'SURVIVAL' || dead || !started) return;
    pendingMobDamageRef.current += amount;
  }, [uiState.mode, dead, started]);

  const handleSetMode = useCallback((m: 'CREATIVE' | 'SURVIVAL') => {
    if (survivalRulesLocked) return;
    countsRef.current = {};
    setDrops([]);
    setUiState(prev => ({
      ...prev, mode: m,
      hotbar: m === 'CREATIVE' ? [...HOTBAR_CREATIVE] : [...SURVIVAL_HOTBAR],
      counts: {},
    }));
  }, [survivalRulesLocked]);

  const handleWorldLoadProgress = useCallback((loadedChunks: number, totalChunks: number) => {
    const progress = Math.floor((loadedChunks / totalChunks) * 100);
    setWorldLoadProgress(previous => Math.max(previous, progress));
  }, []);

  const handleWorldReady = useCallback(() => {
    if (awaitingHostWorldRef.current) return;
    setWorldLoadProgress(100);
    setWorldLoading(false);
    setStarted(true);
  }, []);

  const handleExportWorld = useCallback(() => {
    try {
      const archive = createWorldArchive(worldManager.snapshot(), {
        mode: uiState.mode,
        modeLocked: survivalRulesLocked,
        health: uiState.health,
        hunger: uiState.hunger,
        hotbar: [...uiState.hotbar],
        selectedSlot: uiState.selectedSlot,
        counts: { ...countsRef.current },
        position: {
          x: playerPosRef.current.x,
          y: playerPosRef.current.y,
          z: playerPosRef.current.z,
        },
        viewDistance,
        fogEnabled,
        worldBorderEnabled,
        chests: [...chestsRef.current.entries()].map(([key, contents]) => [key, [...contents]]),
        furnaces: [...furnacesRef.current.entries()].map(([key, contents]) => [key, { ...contents }]),
      });
      const buffer = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `tipecraft-welt-${new Date().toISOString().slice(0, 10)}.tipeworld`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setArchiveMessage('Weltdatei wurde heruntergeladen.');
    } catch (error) {
      setArchiveMessage(error instanceof Error ? error.message : 'Welt konnte nicht exportiert werden.');
    }
  }, [uiState, viewDistance, fogEnabled, worldBorderEnabled, survivalRulesLocked]);

  const handleImportWorld = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (extension !== '.tipeworld' && extension !== '.tipworld') {
      setArchiveMessage('Bitte eine .tipeworld-Weltdatei auswählen.');
      event.target.value = '';
      return;
    }
    try {
      const archive = readWorldArchive(new Uint8Array(await file.arrayBuffer()));
      const { snapshot, game } = archive;
      worldManager.restore(snapshot);
      setSelectedWorldType(snapshot.worldType);
      setSelectedGameMode(game.mode);
      setSurvivalRulesLocked(game.modeLocked ?? (game.mode === 'SURVIVAL'));
      setViewDistance(game.viewDistance);
      setFogEnabled(game.fogEnabled);
      setWorldBorderEnabled(game.worldBorderEnabled);
      countsRef.current = { ...game.counts };
      chestsRef.current = new Map(game.chests.map(([key, contents]) => [key, contents as BlockType[]]));
      furnacesRef.current = new Map(game.furnaces.map(([key, contents]) => [key, { ...contents }]));
      playerPosRef.current.set(game.position.x, game.position.y, game.position.z);
      tpRef.current = { ...game.position };
      playerChunkRef.current = {
        x: Math.floor(game.position.x / CHUNK_SIZE),
        z: Math.floor(game.position.z / CHUNK_SIZE),
      };
      nextDropIdRef.current = 1;
      setDrops([]);
      setDead(false);
      setGamePaused(false);
      setSinglePlayerMenuOpen(false);
      setArchiveMessage('');
      setUiState({
        health: game.health,
        hunger: game.hunger,
        hotbar: game.hotbar as BlockType[],
        selectedSlot: game.selectedSlot,
        pos: { ...game.position },
        mode: game.mode,
        counts: { ...game.counts },
      });
      setWorldLoadProgress(1);
      setStarted(false);
      setWorldLoading(true);
      setWorldRevision(revision => revision + 1);
    } catch (error) {
      setArchiveMessage(error instanceof Error ? error.message : 'Diese Weltdatei kann nicht importiert werden.');
    } finally {
      event.target.value = '';
    }
  }, []);

  const handleCreateWorld = useCallback(() => {
    const modeLocked = selectedGameMode === 'SURVIVAL';
    sessionSettingsRef.current = {
      ...sessionSettingsRef.current,
      mode: selectedGameMode,
      modeLocked,
    };
    setSurvivalRulesLocked(modeLocked);
    worldManager.resetWorld(selectedWorldType);
    blockHistoryRef.current.clear();
    setWorldRevision(revision => revision + 1);
    playerChunkRef.current = { x: 0, z: 0 };
    breakingRef.current.active = false;
    countsRef.current = {};
    pendingMobDamageRef.current = 0;
    chestsRef.current.clear();
    furnacesRef.current.clear();
    nextDropIdRef.current = 1;
    setDrops([]);
    setDead(false);
    setWorldLoadProgress(1);
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

  const handleStartWebWorld = useCallback(async () => {
    setMultiplayerStatus('Erstelle Web-Welt …');
    setMultiplayerCode('');
    setConnectedPlayerCount(1);
    setRemotePlayers([]);
    blockHistoryRef.current.clear();
    multiplayerRoleRef.current = 'host';
    setMultiplayerRole('host');

    const session = createMultiplayerSession();
    multiplayerSessionRef.current?.close();
    multiplayerSessionRef.current = session;
    try {
      await session.createRoom();
      handleCreateWorld();
    } catch (error) {
      session.close();
      multiplayerSessionRef.current = null;
      multiplayerRoleRef.current = null;
      setMultiplayerRole(null);
      setConnectedPlayerCount(0);
      setMultiplayerStatus(error instanceof Error ? error.message : 'Web-Welt konnte nicht gestartet werden.');
    }
  }, [createMultiplayerSession, handleCreateWorld]);

  const handleJoinWebWorld = useCallback(async () => {
    const code = joiningCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setMultiplayerStatus('Bitte gib einen sechsstelligen Code ein.');
      return;
    }

    setMultiplayerStatus('Verbinde mit der Web-Welt …');
    setMultiplayerRole('guest');
    multiplayerRoleRef.current = 'guest';
    awaitingHostWorldRef.current = true;
    setWorldLoadProgress(1);
    setWorldLoading(true);
    setStarted(false);
    setConnectedPlayerCount(1);
    setRemotePlayers([]);
    setMultiplayerMenuOpen(false);

    const session = createMultiplayerSession();
    multiplayerSessionRef.current?.close();
    multiplayerSessionRef.current = session;
    try {
      await session.joinRoom(code);
    } catch (error) {
      session.close();
      multiplayerSessionRef.current = null;
      multiplayerRoleRef.current = null;
      awaitingHostWorldRef.current = false;
      setMultiplayerRole(null);
      setWorldLoading(false);
      setConnectedPlayerCount(0);
      setMultiplayerStatus(error instanceof Error ? error.message : 'Beitritt zur Web-Welt fehlgeschlagen.');
      setMultiplayerMenuOpen(true);
    }
  }, [createMultiplayerSession, joiningCode]);

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
    document.exitPointerLock?.();
    const key = `${x},${y},${z}`;
    if (!chestsRef.current.has(key)) chestsRef.current.set(key, Array(CHEST_SLOTS).fill(BlockType.AIR));
    setOpenChest({ x, y, z });
    setInventoryOpen(false);
    setOpenCraftingTable(null);
    setOpenFurnace(null);
  }, []);

  const handleCraftingTableOpen = useCallback((x: number, y: number, z: number) => {
    document.exitPointerLock?.();
    setOpenCraftingTable({ x, y, z });
    setInventoryOpen(false);
    setOpenChest(null);
    setOpenFurnace(null);
  }, []);

  const handleFurnaceOpen = useCallback((x: number, y: number, z: number) => {
    document.exitPointerLock?.();
    const key = `${x},${y},${z}`;
    if (!furnacesRef.current.has(key)) {
      furnacesRef.current.set(key, { ironOre: 0, coal: 0, ironIngots: 0 });
    }
    setOpenFurnace({ x, y, z });
    setOpenChest(null);
    setOpenCraftingTable(null);
    setInventoryOpen(false);
  }, []);

  const handleFurnaceChange = useCallback((
    contents: FurnaceContents,
    newCounts: Record<number, number>,
  ) => {
    if (!openFurnace) return;
    furnacesRef.current.set(`${openFurnace.x},${openFurnace.y},${openFurnace.z}`, contents);
    countsRef.current = { ...newCounts };
    setUiState(prev => {
      const hotbar = [...prev.hotbar];
      if (prev.mode === 'SURVIVAL') {
        for (let i = 0; i < hotbar.length; i++) {
          if (hotbar[i] !== BlockType.AIR && !newCounts[hotbar[i]]) hotbar[i] = BlockType.AIR;
        }
      }
      return { ...prev, hotbar, counts: { ...newCounts } };
    });
  }, [openFurnace]);

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
      <StartupSplash />

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
                {worldLoading
                  ? multiplayerRole === 'guest' ? multiplayerStatus || 'Verbinde mit dem Host …' : 'Deine Welt wird vorbereitet …'
                  : '226 Blöcke · 10 Biome · Crafting · Mobs · Tag/Nacht · Chat'}
          </div>
          {worldLoading ? (
            <div
              role="status"
              aria-live="polite"
              style={{ width:'min(360px, 84vw)', textAlign:'center' }}
            >
                <div style={{ fontSize:16, letterSpacing:2, marginBottom:12 }}>
                  {multiplayerRole === 'guest' ? 'WEB-WELT WIRD GELADEN' : 'WELT WIRD GELADEN'}
                </div>
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
          ) : !optionsOpen && !singlePlayerMenuOpen && !multiplayerMenuOpen && !linksOpen ? (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:10, width:'min(270px, 84vw)' }}>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => runStartMenuAction(() => setSinglePlayerMenuOpen(true))}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); runStartMenuAction(() => setSinglePlayerMenuOpen(true)); }}
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
                  onClick={() => runStartMenuAction(() => setMultiplayerMenuOpen(true))}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); runStartMenuAction(() => setMultiplayerMenuOpen(true)); }}
                  style={{
                    background:'rgba(35,35,35,0.88)', border:'2px solid #f1f1f1',
                    color:'#fff', padding:'12px 20px', fontSize:17, letterSpacing:2,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                    boxShadow:'0 3px 0 rgba(0,0,0,0.65)',
                  }}
                >MULTIPLAYER</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => runStartMenuAction(() => setOptionsOpen(true))}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); runStartMenuAction(() => setOptionsOpen(true)); }}
                  style={{
                    background:'rgba(35,35,35,0.88)', border:'2px solid #d7d7d7',
                    color:'#fff', padding:'12px 20px', fontSize:17, letterSpacing:2,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                    boxShadow:'0 3px 0 rgba(0,0,0,0.65)',
                  }}
                >OPTIONS</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => runStartMenuAction(() => setLinksOpen(true))}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); runStartMenuAction(() => setLinksOpen(true)); }}
                  style={{
                    background:'rgba(35,35,35,0.88)', border:'2px solid #d7d7d7',
                    color:'#fff', padding:'12px 20px', fontSize:17, letterSpacing:2,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                    boxShadow:'0 3px 0 rgba(0,0,0,0.65)',
                  }}
                >VERLINKUNGEN</button>
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
              worldBorderEnabled={worldBorderEnabled}
              onWorldBorderEnabledChange={setWorldBorderEnabled}
              onBack={() => runStartMenuAction(() => setOptionsOpen(false))}
            />
          ) : multiplayerMenuOpen ? (
            <div
              data-no-look="1"
              onClick={event => event.stopPropagation()}
              onTouchStart={event => event.stopPropagation()}
              style={{
                width:'min(390px, 92vw)', padding:22, boxSizing:'border-box',
                background:'rgba(30,30,30,0.94)', border:'2px solid #eee',
                boxShadow:'0 4px 0 rgba(0,0,0,0.7)', color:'#fff',
              }}
            >
              <div style={{ fontSize:21, letterSpacing:2, textAlign:'center', marginBottom:10 }}>
                MULTIPLAYER
              </div>
              <div style={{ fontSize:12, lineHeight:1.5, color:'#ddd', textAlign:'center', marginBottom:18 }}>
                Gib den sechsstelligen Code der Web-Welt ein. Die Welt läuft auf dem Host-PC.
              </div>
              <input
                aria-label="Sechsstelliger Web-Welt-Code"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={joiningCode}
                onChange={event => setJoiningCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={event => { if (event.key === 'Enter' && joiningCode.length === 6) void handleJoinWebWorld(); }}
                style={{
                  width:'100%', boxSizing:'border-box', padding:'12px 10px',
                  background:'#151515', border:'2px solid #aaa', color:'#fff',
                  fontFamily:'"Courier New", monospace', fontSize:24, letterSpacing:8,
                  textAlign:'center', outlineColor:'#84c86c',
                }}
              />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginTop:14 }}>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => runStartMenuAction(() => { setMultiplayerMenuOpen(false); setMultiplayerStatus(''); })}
                  onTouchStart={event => { event.stopPropagation(); event.preventDefault(); runStartMenuAction(() => { setMultiplayerMenuOpen(false); setMultiplayerStatus(''); }); }}
                  style={{
                    background:'rgba(55,55,55,0.95)', border:'2px solid #ddd',
                    color:'#fff', padding:'11px 8px', fontSize:13, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >ZURÜCK</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  disabled={joiningCode.length !== 6}
                  onClick={() => runStartMenuAction(() => { void handleJoinWebWorld(); })}
                  onTouchStart={event => { event.stopPropagation(); event.preventDefault(); if (joiningCode.length === 6) runStartMenuAction(() => { void handleJoinWebWorld(); }); }}
                  style={{
                    background:joiningCode.length === 6 ? 'rgba(75,130,60,0.96)' : '#454545',
                    border:'2px solid #efffdc', color:'#fff', padding:'11px 8px',
                    fontSize:13, letterSpacing:1, fontFamily:'"Courier New", monospace',
                    cursor:joiningCode.length === 6 ? 'pointer' : 'not-allowed',
                  }}
                >BEITRETEN</button>
              </div>
              {multiplayerStatus && (
                <div role="status" style={{ marginTop:12, color:'#d8f0c4', fontSize:12, textAlign:'center', lineHeight:1.4 }}>
                  {multiplayerStatus}
                </div>
              )}
            </div>
          ) : linksOpen ? (
            <div
              data-no-look="1"
              onClick={event => event.stopPropagation()}
              onTouchStart={event => event.stopPropagation()}
              style={{
                width:'min(430px, 92vw)', padding:22, boxSizing:'border-box',
                background:'rgba(30,30,30,0.95)', border:'2px solid #eee',
                boxShadow:'0 4px 0 rgba(0,0,0,0.7)', color:'#fff', textAlign:'center',
              }}
            >
              <div style={{ fontSize:22, letterSpacing:2, marginBottom:14 }}>VERLINKUNGEN</div>
              <p style={{ margin:'0 0 16px', fontSize:13, lineHeight:1.6, color:'#e5e5e5' }}>
                Möchtest du einen Fehler melden, mehr über TipeCraft erfahren oder den Quellcode ansehen?
                Im GitHub-Projekt findest du Informationen zum Spiel und kannst Fehler melden.
              </p>
              <a
                href="https://github.com/TipeCraft-web/TipeCraft"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'inline-block', marginBottom:18, color:'#c8f3b8',
                  fontSize:14, lineHeight:1.5, overflowWrap:'anywhere',
                  textDecoration:'underline', textUnderlineOffset:3,
                }}
              >https://github.com/TipeCraft-web/TipeCraft</a>
              <button
                type="button"
                data-touch-btn="1"
                onClick={() => runStartMenuAction(() => setLinksOpen(false))}
                onTouchStart={event => { event.stopPropagation(); event.preventDefault(); runStartMenuAction(() => setLinksOpen(false)); }}
                style={{
                  display:'block', width:'100%', background:'rgba(55,55,55,0.95)',
                  border:'2px solid #ddd', color:'#fff', padding:'11px 8px',
                  fontSize:13, letterSpacing:1, fontFamily:'"Courier New", monospace', cursor:'pointer',
                }}
              >ZURÜCK</button>
            </div>
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
                      onClick={() => runStartMenuAction(() => setSelectedGameMode(gameMode))}
                      onTouchStart={e => { e.stopPropagation(); e.preventDefault(); runStartMenuAction(() => setSelectedGameMode(gameMode)); }}
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
                      onClick={() => runStartMenuAction(() => setSelectedWorldType(world.type))}
                      onTouchStart={e => { e.stopPropagation(); e.preventDefault(); runStartMenuAction(() => setSelectedWorldType(world.type)); }}
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
                  onClick={() => runStartMenuAction(() => setSinglePlayerMenuOpen(false))}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); runStartMenuAction(() => setSinglePlayerMenuOpen(false)); }}
                  style={{
                    background:'rgba(55,55,55,0.95)', border:'2px solid #ddd',
                    color:'#fff', padding:'11px 8px', fontSize:13, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >ZURÜCK</button>
                <button
                  type="button"
                  data-touch-btn="1"
                  onClick={() => runStartMenuAction(handleCreateWorld)}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); runStartMenuAction(handleCreateWorld); }}
                  style={{
                    background:'rgba(75,130,60,0.96)', border:'2px solid #efffdc',
                    color:'#fff', padding:'11px 8px', fontSize:13, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >WELT ERSTELLEN</button>
              </div>
              <button
                type="button"
                data-touch-btn="1"
                onClick={() => runStartMenuAction(() => { void handleStartWebWorld(); })}
                onTouchStart={event => { event.stopPropagation(); event.preventDefault(); runStartMenuAction(() => { void handleStartWebWorld(); }); }}
                style={{
                  width:'100%', marginTop:10, background:'rgba(40,115,55,0.96)',
                  border:'2px solid #cbf0b8', color:'#fff', padding:'11px 8px',
                  fontSize:13, letterSpacing:1, fontFamily:'"Courier New", monospace', cursor:'pointer',
                }}
              >WEB-WELT STARTEN</button>
              <div style={{ marginTop:5, color:'#d5e8cd', fontSize:10, lineHeight:1.4, textAlign:'center' }}>
                Weltberechnung auf deinem PC · 6-stelliger Beitrittscode
              </div>
              {multiplayerStatus && (!multiplayerRole || (multiplayerRole === 'host' && !multiplayerCode)) && (
                <div role="status" style={{ marginTop:8, color:'#ffe0a0', fontSize:11, lineHeight:1.4, textAlign:'center' }}>
                  {multiplayerStatus}
                </div>
              )}
              <button
                type="button"
                data-touch-btn="1"
                onClick={() => runStartMenuAction(() => worldFileInputRef.current?.click())}
                onTouchStart={event => { event.stopPropagation(); event.preventDefault(); runStartMenuAction(() => worldFileInputRef.current?.click()); }}
                style={{
                  width:'100%', marginTop:10, background:'rgba(55,55,55,0.95)',
                  border:'2px solid #ddd', color:'#fff', padding:'10px 8px',
                  fontSize:12, letterSpacing:1, fontFamily:'"Courier New", monospace', cursor:'pointer',
                }}
              >WELTDATEI IMPORTIEREN</button>
              <input
                ref={worldFileInputRef}
                type="file"
                accept=".tipeworld,.tipworld"
                onChange={handleImportWorld}
                style={{ display:'none' }}
              />
              {archiveMessage && (
                <div role="status" style={{ marginTop:8, color:'#ffe0a0', fontSize:11, lineHeight:1.4 }}>
                  {archiveMessage}
                </div>
              )}
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
                worldBorderEnabled={worldBorderEnabled}
                onWorldBorderEnabledChange={setWorldBorderEnabled}
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
                  onClick={handleExportWorld}
                  onTouchStart={event => { event.stopPropagation(); event.preventDefault(); handleExportWorld(); }}
                  style={{
                    background:'rgba(55,95,125,0.95)', border:'2px solid #d5ecff',
                    color:'#fff', padding:'12px 10px', fontSize:14, letterSpacing:1,
                    fontFamily:'"Courier New", monospace', cursor:'pointer',
                  }}
                >WELT EXPORTIEREN (.tipeworld)</button>
                {archiveMessage && (
                  <div role="status" style={{ color:'#ffe0a0', fontSize:11, lineHeight:1.4, textAlign:'center' }}>
                    {archiveMessage}
                  </div>
                )}
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
          thirdPerson={thirdPerson}
          onToggleThirdPerson={() => setThirdPerson(value => !value)}
        />
      )}

      {/* ── Chat ─────────────────────────────────────────────── */}
      {started && !dead && (
        <Chat
          tpRef={tpRef}
          dayTimeRef={dayTimeRef}
          onSetMode={handleSetMode}
          currentMode={mode}
          commandsEnabled={!survivalRulesLocked}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      )}
      {started && !gamePaused && !worldBorderEnabled && (
        <div
          role="status"
          style={{
            position:'absolute', top:58, left:'50%', transform:'translateX(-50%)',
            zIndex:31, padding:'5px 10px', borderRadius:5,
            background:'rgba(90,20,12,0.86)', border:'1px solid #ff9b67',
            color:'#ffe0c8', fontSize:11, fontWeight:700, textAlign:'center',
            fontFamily:'"Courier New", monospace', pointerEvents:'none',
          }}
        >⚠ WELTGRENZE DEAKTIVIERT — Teleportieren und Reisen über die Grenze möglich</div>
      )}

      {started && !gamePaused && multiplayerRole && (
        <div
          data-no-look="1"
          style={{
            position:'absolute', top:56, right:10, zIndex:32,
            padding:'7px 9px', borderRadius:6,
            background:'rgba(10,35,20,0.88)', border:'1px solid rgba(135,210,140,0.75)',
            color:'#e8ffe8', fontFamily:'"Courier New", monospace',
            boxShadow:'0 2px 7px rgba(0,0,0,0.45)', textAlign:'center',
          }}
        >
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1 }}>
            WEB-WELT · {connectedPlayerCount} SPIELER
          </div>
          {multiplayerRole === 'host' && multiplayerCode && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, marginTop:4 }}>
              <span style={{ fontSize:18, fontWeight:700, letterSpacing:4 }}>{multiplayerCode}</span>
              <button
                type="button"
                data-touch-btn="1"
                aria-label="Web-Welt-Code kopieren"
                onClick={() => {
                  const clipboard = navigator.clipboard;
                  if (clipboard) {
                    void clipboard.writeText(multiplayerCode)
                      .then(() => setMultiplayerStatus('Code kopiert.'))
                      .catch(() => setMultiplayerStatus(`Code: ${multiplayerCode}`));
                  } else {
                    setMultiplayerStatus(`Code: ${multiplayerCode}`);
                  }
                }}
                style={{
                  padding:'4px 6px', border:'1px solid #bce6bc', borderRadius:4,
                  background:'rgba(55,105,58,0.9)', color:'#fff', fontSize:10,
                  cursor:'pointer', touchAction:'manipulation',
                }}
              >KOPIEREN</button>
            </div>
          )}
        </div>
      )}

      {/* ── Top toolbar (mobile) ─────────────────────────────── */}
      {started && !dead && (
        <div style={{
          position:'absolute', top:14, left:0, right:0, height:36,
          zIndex:30, pointerEvents:'none', filter:'grayscale(1)',
        }}>
          <div
            data-touch-btn="1"
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); handleInventoryToggle(); }}
            onClick={handleInventoryToggle}
            style={{ position:'absolute', top:0, right:'calc(50% + 50px)', padding:'6px 14px', borderRadius:16, background:'rgba(30,60,80,0.8)', border:'1px solid rgba(68,136,204,0.6)', color:'#7ac', fontSize:11, fontWeight:700, cursor:'pointer', userSelect:'none', pointerEvents:'auto' }}
          >📦 Bag</div>
          {!gamePaused && (
            <>
              <button
                type="button"
                aria-label="Pausenmenü öffnen"
                title="Pausenmenü"
                data-touch-btn="1"
                onClick={handlePauseGame}
                onTouchStart={event => { event.stopPropagation(); event.preventDefault(); handlePauseGame(); }}
                style={{
                  position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
                  padding:'7px 11px', borderRadius:8,
                  background:'rgba(30,30,30,0.88)', border:'1px solid rgba(220,220,220,0.72)',
                  boxShadow:'0 2px 5px rgba(0,0,0,0.55)',
                  color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
                  fontFamily:'"Courier New", monospace', touchAction:'manipulation', pointerEvents:'auto',
                }}
              >Ⅱ MENU</button>
              <button
                type="button"
                className="mobile-chat-toggle"
                aria-label={chatOpen ? 'Chat schließen' : 'Chat öffnen'}
                title="Chat"
                data-touch-btn="1"
                onClick={() => setChatOpen(open => !open)}
                onTouchStart={event => { event.stopPropagation(); event.preventDefault(); setChatOpen(open => !open); }}
                style={{
                  position:'absolute', top:0, left:'calc(50% + 50px)',
                  padding:'7px 11px', borderRadius:8,
                  background:'rgba(30,30,30,0.88)', border:'1px solid rgba(220,220,220,0.72)',
                  boxShadow:'0 2px 5px rgba(0,0,0,0.55)',
                  color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
                  fontFamily:'"Courier New", monospace', touchAction:'manipulation', pointerEvents:'auto',
                }}
              >💬 CHAT</button>
            </>
          )}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
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
          counts={mode === 'CREATIVE' ? (() => { const c: Record<number,number> = {}; for (let i=1;i<=BlockType.DIAMOND_SWORD;i++) c[i]=99; return c; })() : counts}
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
      {openFurnace && (
        <FurnaceUI
          mode={mode}
          counts={counts}
          contents={furnacesRef.current.get(`${openFurnace.x},${openFurnace.y},${openFurnace.z}`) ?? { ironOre: 0, coal: 0, ironIngots: 0 }}
          onChange={handleFurnaceChange}
          onClose={() => setOpenFurnace(null)}
        />
      )}

      {/* ── Touch controls ───────────────────────────────────── */}
      {started && !gamePaused && (
        <TouchControls
          stateRef={touchRef}
          allowModeToggle={!survivalRulesLocked}
          creativeMode={mode === 'CREATIVE'}
        />
      )}

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
          <WorldBorderVisual enabled={worldBorderEnabled} playerPosRef={playerPosRef} />
          <ItemDrops drops={drops} playerPosRef={playerPosRef} onCollect={onCollectDrop} />
          <Animals />

          {started && remotePlayers.map(player => (
            <RemotePlayerAvatar key={player.playerId} player={player} />
          ))}

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
                onWorldBlockChange={handleWorldBlockChange}
                onChestOpen={handleChestOpen}
                onCraftingTableOpen={handleCraftingTableOpen}
                onFurnaceOpen={handleFurnaceOpen}
                worldBorderEnabled={worldBorderEnabled}
                isDead={dead}
                respawnTrigger={respawnTrigger}
                tpRef={tpRef}
                pendingMobDamageRef={pendingMobDamageRef}
                thirdPerson={thirdPerson}
              />
            </>
          )}
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
