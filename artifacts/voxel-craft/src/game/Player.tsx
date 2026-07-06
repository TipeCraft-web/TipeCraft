import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from './Game';
import { worldManager, CHUNK_SIZE } from './worldGen';
import { BlockType, isSolid, HOTBAR_CREATIVE, HOTBAR_SURVIVAL } from './blocks';

const SPEED = 5;
const CREATIVE_SPEED = 8;
const FLY_SPEED = 12;
const JUMP_FORCE = 7;
const GRAVITY = 22;
const PLAYER_H = 1.8;
const PLAYER_W = 0.58;
const EYE_H = 1.6;
const MAX_REACH_CREATIVE = 6;
const MAX_REACH_SURVIVAL = 4;
const BREAK_TIME_MS = 900;

interface PlayerProps {
  mode: 'CREATIVE' | 'SURVIVAL';
  setMode: (m: 'CREATIVE' | 'SURVIVAL') => void;
  playerChunkRef: React.MutableRefObject<{ x: number; z: number }>;
  onStateChange: (s: {
    health: number; hunger: number;
    hotbar: BlockType[]; selectedSlot: number;
    pos: THREE.Vector3;
  }) => void;
  touchRef: React.MutableRefObject<{ dx: number; dz: number; jump: boolean; doBreak: boolean; doPlace: boolean }>;
}

function collidesAt(pos: THREE.Vector3): boolean {
  const hw = PLAYER_W / 2;
  const x0 = Math.floor(pos.x - hw), x1 = Math.floor(pos.x + hw - 0.001);
  const y0 = Math.floor(pos.y),      y1 = Math.floor(pos.y + PLAYER_H - 0.001);
  const z0 = Math.floor(pos.z - hw), z1 = Math.floor(pos.z + hw - 0.001);
  for (let bx = x0; bx <= x1; bx++)
    for (let by = y0; by <= y1; by++)
      for (let bz = z0; bz <= z1; bz++)
        if (isSolid(worldManager.getBlock(bx, by, bz))) return true;
  return false;
}

function castRay(origin: THREE.Vector3, dir: THREE.Vector3, maxD: number) {
  const d = dir.clone().normalize();
  let bx = Math.floor(origin.x), by = Math.floor(origin.y), bz = Math.floor(origin.z);
  const sx = d.x > 0 ? 1 : -1, sy = d.y > 0 ? 1 : -1, sz = d.z > 0 ? 1 : -1;
  const dtx = d.x !== 0 ? Math.abs(1/d.x) : Infinity;
  const dty = d.y !== 0 ? Math.abs(1/d.y) : Infinity;
  const dtz = d.z !== 0 ? Math.abs(1/d.z) : Infinity;
  let tmx = d.x !== 0 ? (sx>0 ? Math.ceil(origin.x)-origin.x : origin.x-Math.floor(origin.x)) / Math.abs(d.x) : Infinity;
  let tmy = d.y !== 0 ? (sy>0 ? Math.ceil(origin.y)-origin.y : origin.y-Math.floor(origin.y)) / Math.abs(d.y) : Infinity;
  let tmz = d.z !== 0 ? (sz>0 ? Math.ceil(origin.z)-origin.z : origin.z-Math.floor(origin.z)) / Math.abs(d.z) : Infinity;
  if (tmx === 0) tmx = dtx;
  if (tmy === 0) tmy = dty;
  if (tmz === 0) tmz = dtz;
  let pbx = bx, pby = by, pbz = bz;
  let nx = 0, ny = 0, nz = 0;
  let t = 0;
  while (t < maxD) {
    if (isSolid(worldManager.getBlock(bx, by, bz))) {
      return { hit: true, hitPos: new THREE.Vector3(bx,by,bz), prevPos: new THREE.Vector3(pbx,pby,pbz), normal: new THREE.Vector3(nx,ny,nz) };
    }
    pbx = bx; pby = by; pbz = bz;
    if (tmx < tmy && tmx < tmz) { t = tmx; bx += sx; tmx += dtx; nx = -sx; ny = 0; nz = 0; }
    else if (tmy < tmz)          { t = tmy; by += sy; tmy += dty; nx = 0; ny = -sy; nz = 0; }
    else                          { t = tmz; bz += sz; tmz += dtz; nx = 0; ny = 0; nz = -sz; }
  }
  return { hit: false, hitPos: null, prevPos: null, normal: null };
}

export default function Player({ mode, setMode, playerChunkRef, onStateChange, touchRef }: PlayerProps) {
  const { camera, gl } = useThree();
  const [, getKeys] = useKeyboardControls<Controls>();

  const pos   = useRef(new THREE.Vector3(8, 30, 8));
  const vel   = useRef(new THREE.Vector3());
  const yaw   = useRef(0);
  const pitch = useRef(0);
  const grounded  = useRef(false);
  const flying    = useRef(mode === 'CREATIVE');
  const modeRef   = useRef(mode);
  const hotbar    = useRef<BlockType[]>([...HOTBAR_CREATIVE]);
  const slot      = useRef(0);
  const health    = useRef(20);
  const hunger    = useRef(20);
  const lmbDown   = useRef(false);
  const rmbDown   = useRef(false);
  const breakStart = useRef(0);
  const breakPos  = useRef<THREE.Vector3 | null>(null);
  const lastPlace = useRef(0);
  const stateT    = useRef(0);
  const spaceLastTap = useRef(0);
  const prevMode  = useRef(mode);
  const dir3      = useRef(new THREE.Vector3());
  const eyePos    = useRef(new THREE.Vector3());
  const tmpPos    = useRef(new THREE.Vector3());

  // Init camera
  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const spawnY = worldManager.getTerrainHeight(8, 8) + 3;
    pos.current.set(8, spawnY, 8);
    console.log('[VoxelCraft] Player spawned at y=', spawnY);
  }, [camera]);

  // Pointer lock
  useEffect(() => {
    const el = gl.domElement;

    const lock = () => {
      if (document.pointerLockElement !== el) {
        el.requestPointerLock();
      }
    };

    el.addEventListener('click', lock);
    el.addEventListener('touchstart', lock);

    return () => {
      el.removeEventListener('click', lock);
      el.removeEventListener('touchstart', lock);
    };
  }, [gl.domElement]);

  // Mouse look
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      yaw.current   -= e.movementX * 0.002;
      pitch.current -= e.movementY * 0.002;
      pitch.current  = Math.max(-1.5, Math.min(1.5, pitch.current));
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [gl]);

  // Mouse buttons
  useEffect(() => {
    const el = gl.domElement;
    const dn = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      if (e.button === 0) { lmbDown.current = true; breakStart.current = 0; breakPos.current = null; }
      if (e.button === 2) rmbDown.current = true;
    };
    const up = (e: MouseEvent) => {
      if (e.button === 0) { lmbDown.current = false; breakStart.current = 0; breakPos.current = null; }
      if (e.button === 2) rmbDown.current = false;
    };
    const ctx = (e: Event) => e.preventDefault();
    document.addEventListener('mousedown', dn);
    document.addEventListener('mouseup', up);
    document.addEventListener('contextmenu', ctx);
    return () => {
      document.removeEventListener('mousedown', dn);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('contextmenu', ctx);
    };
  }, [gl]);

  // Keyboard: numbers, scroll, double-space fly
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      const n = parseInt(e.code.replace('Digit',''));
      if (n >= 1 && n <= 9) slot.current = n - 1;
      if (e.code === 'Space' && modeRef.current === 'CREATIVE') {
        const now = Date.now();
        if (now - spaceLastTap.current < 350) flying.current = !flying.current;
        spaceLastTap.current = now;
      }
    };
    const wh = (e: WheelEvent) => {
      slot.current = ((slot.current + (e.deltaY > 0 ? 1 : -1)) + 9) % 9;
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('wheel', wh);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('wheel', wh); };
  }, []);

  // Sync mode
  useEffect(() => {
    modeRef.current = mode;
    if (mode !== prevMode.current) {
      prevMode.current = mode;
      hotbar.current = mode === 'CREATIVE' ? [...HOTBAR_CREATIVE] : [...HOTBAR_SURVIVAL];
      if (mode !== 'CREATIVE') flying.current = false;
    }
  }, [mode]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = getKeys();
    const t = touchRef.current;
    const locked = document.pointerLockElement === gl.domElement;

    // Movement
    const curMode = modeRef.current;
    const isFlying = flying.current && curMode === 'CREATIVE';
    const spd = isFlying ? FLY_SPEED : (curMode === 'CREATIVE' ? CREATIVE_SPEED : SPEED);
    const sinY = Math.sin(yaw.current), cosY = Math.cos(yaw.current);

    // Keyboard + touch combined
    const fwd = k.forward || false;
    const bk  = k.back    || false;
    const lft = k.left    || false;
    const rgt = k.right   || false;
    const jmp = k.jump    || t.jump;

    let mx = 0, mz = 0;
    if (fwd) { mx -= sinY; mz -= cosY; }
    if (bk)  { mx += sinY; mz += cosY; }
    if (lft) { mx -= cosY; mz += sinY; }
    if (rgt) { mx += cosY; mz -= sinY; }
    // Touch joystick
    if (t.dx !== 0 || t.dz !== 0) {
      mx = -sinY * t.dz - cosY * t.dx;
      mz = -cosY * t.dz + sinY * t.dx;
    }
    const ml = Math.sqrt(mx*mx + mz*mz);
    if (ml > 0) { mx /= ml; mz /= ml; }

    vel.current.x = mx * spd;
    vel.current.z = mz * spd;

    if (isFlying) {
      vel.current.y = 0;
      if (jmp) vel.current.y = FLY_SPEED;
      if (k.sneak) vel.current.y = -FLY_SPEED;
    } else {
      if (jmp && grounded.current) { vel.current.y = JUMP_FORCE; grounded.current = false; }
      vel.current.y -= GRAVITY * dt;
      vel.current.y = Math.max(vel.current.y, -50);
    }

    // AABB collision resolution
    const p = pos.current, v = vel.current;

    tmpPos.current.set(p.x + v.x * dt, p.y, p.z);
    if (!collidesAt(tmpPos.current)) p.x = tmpPos.current.x;
    else v.x = 0;

    tmpPos.current.set(p.x, p.y + v.y * dt, p.z);
    if (!collidesAt(tmpPos.current)) {
      p.y = tmpPos.current.y;
      if (!isFlying) grounded.current = false;
    } else {
      if (v.y < 0 && !isFlying) {
        grounded.current = true;
        if (curMode === 'SURVIVAL' && v.y < -12) {
          health.current = Math.max(0, health.current - Math.floor((-v.y - 12) * 0.6));
        }
      }
      v.y = 0;
    }

    tmpPos.current.set(p.x, p.y, p.z + v.z * dt);
    if (!collidesAt(tmpPos.current)) p.z = tmpPos.current.z;
    else v.z = 0;

    // Void safety
    if (p.y < -10) {
      p.set(8, worldManager.getTerrainHeight(8, 8) + 3, 8);
      v.set(0, 0, 0);
      if (curMode === 'SURVIVAL') health.current = Math.max(0, health.current - 4);
    }

    // Camera
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    eyePos.current.set(p.x, p.y + EYE_H, p.z);
    camera.position.copy(eyePos.current);

    // Chunk tracking
    playerChunkRef.current = { x: Math.floor(p.x / CHUNK_SIZE), z: Math.floor(p.z / CHUNK_SIZE) };

    // Block interaction
    if (locked || t.doBreak || t.doPlace) {
      camera.getWorldDirection(dir3.current);
      const reach = curMode === 'CREATIVE' ? MAX_REACH_CREATIVE : MAX_REACH_SURVIVAL;
      const ray = castRay(eyePos.current, dir3.current, reach);

      const doBreak = lmbDown.current || t.doBreak;
      const doPlace = rmbDown.current || t.doPlace;

      if (ray.hit && ray.hitPos) {
        if (doBreak) {
          const now = Date.now();
          const hp = ray.hitPos;
          if (curMode === 'CREATIVE') {
            if (now - breakStart.current > 200) {
              worldManager.setBlock(hp.x, hp.y, hp.z, BlockType.AIR);
              breakStart.current = now;
            }
          } else {
            const samePos = breakPos.current && breakPos.current.equals(hp);
            if (!samePos) { breakPos.current = hp.clone(); breakStart.current = now; }
            if (now - breakStart.current >= BREAK_TIME_MS) {
              worldManager.setBlock(hp.x, hp.y, hp.z, BlockType.AIR);
              breakPos.current = null; breakStart.current = 0;
            }
          }
        } else {
          breakPos.current = null; breakStart.current = 0;
        }

        if (doPlace && ray.prevPos) {
          const now = Date.now();
          if (now - lastPlace.current > 250) {
            const pp = ray.prevPos;
            const blk = hotbar.current[slot.current];
            if (blk !== BlockType.AIR) {
              // Don't place inside player
              const hw = PLAYER_W / 2;
              const px0 = Math.floor(p.x - hw), px1 = Math.floor(p.x + hw - 0.001);
              const py0 = Math.floor(p.y),       py1 = Math.floor(p.y + PLAYER_H - 0.001);
              const pz0 = Math.floor(p.z - hw), pz1 = Math.floor(p.z + hw - 0.001);
              const inside = pp.x >= px0 && pp.x <= px1 && pp.y >= py0 && pp.y <= py1 && pp.z >= pz0 && pp.z <= pz1;
              if (!inside) {
                worldManager.setBlock(pp.x, pp.y, pp.z, blk);
                lastPlace.current = now;
              }
            }
          }
        }
      } else {
        breakPos.current = null; breakStart.current = 0;
      }
    }

    // Hunger decay + HUD sync
    stateT.current += dt;
    if (stateT.current > 0.1) {
      stateT.current = 0;
      if (curMode === 'SURVIVAL') hunger.current = Math.max(0, hunger.current - 0.002);
      onStateChange({
        health: health.current, hunger: hunger.current,
        hotbar: hotbar.current, selectedSlot: slot.current,
        pos: p.clone(),
      });
    }
  });

  return null;
}
