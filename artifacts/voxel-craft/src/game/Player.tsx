import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from './Game';
import { worldManager, CHUNK_SIZE } from './worldGen';
import { BlockType, isSolid } from './blocks';
import { raycastMobs, damageMob } from './mobSystem';
import type { TouchState } from './TouchControls';

const SPEED          = 5;
const CREATIVE_SPEED = 8;
const FLY_SPEED      = 12;
const JUMP_FORCE     = 7;
const GRAVITY        = 22;
const PLAYER_H       = 1.8;
const PLAYER_W       = 0.58;
const EYE_H          = 1.6;
const MAX_REACH_CREATIVE = 6;
const MAX_REACH_SURVIVAL = 4;
const BREAK_TIME_MS  = 900;

interface PlayerProps {
  mode:           'CREATIVE' | 'SURVIVAL';
  setMode:        (m: 'CREATIVE' | 'SURVIVAL') => void;
  playerChunkRef: React.MutableRefObject<{ x: number; z: number }>;
  onStateChange:  (s: {
    health: number; hunger: number;
    hotbar: BlockType[]; selectedSlot: number;
    pos: THREE.Vector3;
  }) => void;
  touchRef:       React.MutableRefObject<TouchState>;
  externalSlot:   number;
  externalHotbar: BlockType[];
  canPlace:       (type: BlockType) => boolean;
  onBlockBreak:   (type: BlockType, position: THREE.Vector3) => void;
  onBlockPlace:   (type: BlockType) => void;
  onChestOpen?:    (x: number, y: number, z: number) => void;
  isDead?:         boolean;
  respawnTrigger?: number;
  tpRef?:          React.MutableRefObject<{ x: number; y: number; z: number } | null>;
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
  if (tmx === 0) tmx = dtx; if (tmy === 0) tmy = dty; if (tmz === 0) tmz = dtz;
  let pbx = bx, pby = by, pbz = bz, nx = 0, ny = 0, nz = 0, t = 0;
  while (t < maxD) {
    if (isSolid(worldManager.getBlock(bx, by, bz)))
      return { hit:true, hitPos:new THREE.Vector3(bx,by,bz), prevPos:new THREE.Vector3(pbx,pby,pbz), normal:new THREE.Vector3(nx,ny,nz), dist:t };
    pbx=bx; pby=by; pbz=bz;
    if (tmx<tmy && tmx<tmz) { t=tmx; bx+=sx; tmx+=dtx; nx=-sx; ny=0;  nz=0; }
    else if (tmy<tmz)        { t=tmy; by+=sy; tmy+=dty; nx=0;  ny=-sy; nz=0; }
    else                      { t=tmz; bz+=sz; tmz+=dtz; nx=0;  ny=0;  nz=-sz; }
  }
  return { hit:false, hitPos:null, prevPos:null, normal:null, dist:maxD };
}

export default function Player({
  mode, setMode, playerChunkRef, onStateChange,
  touchRef, externalSlot, externalHotbar,
  canPlace, onBlockBreak, onBlockPlace, onChestOpen,
  isDead = false, respawnTrigger = 0,
}: PlayerProps) {
  const { camera, gl } = useThree();
  const [, getKeys] = useKeyboardControls<Controls>();

  const pos          = useRef(new THREE.Vector3(8, 30, 8));
  const vel          = useRef(new THREE.Vector3());
  const yaw          = useRef(0);
  const pitch        = useRef(0);
  const grounded     = useRef(false);
  const flying       = useRef(mode === 'CREATIVE');
  const modeRef      = useRef(mode);
  const hotbar       = useRef<BlockType[]>([...externalHotbar]);
  const slot         = useRef(0);
  const health       = useRef(20);
  const hunger       = useRef(20);
  const lmbDown      = useRef(false);
  const rmbDown      = useRef(false);
  const breakStart   = useRef(0);
  const breakPos     = useRef<THREE.Vector3 | null>(null);
  const lastPlace    = useRef(0);
  const stateT       = useRef(0);
  const spaceLastTap = useRef(0);
  const prevMode     = useRef(mode);
  const dir3         = useRef(new THREE.Vector3());
  const eyePos       = useRef(new THREE.Vector3());
  const tmpPos       = useRef(new THREE.Vector3());
  const lastHit      = useRef(0);
  const prevToggle   = useRef(false);
  const isDeadRef    = useRef(isDead);

  useEffect(() => { isDeadRef.current = isDead; }, [isDead]);

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const spawnY = worldManager.getTerrainHeight(8, 8) + 3;
    pos.current.set(8, spawnY, 8);
  }, [camera]);

  // Respawn trigger — reset position and vitals
  useEffect(() => {
    if (respawnTrigger === 0) return;
    const spawnY = worldManager.getTerrainHeight(8, 8) + 3;
    pos.current.set(8, spawnY, 8);
    vel.current.set(0, 0, 0);
    health.current = 20;
    hunger.current = 20;
    breakPos.current = null;
    breakStart.current = 0;
  }, [respawnTrigger]);

  useEffect(() => { hotbar.current = [...externalHotbar]; }, [externalHotbar]);
  useEffect(() => { slot.current = externalSlot; }, [externalSlot]);

  useEffect(() => {
    modeRef.current = mode;
    if (mode !== prevMode.current) {
      prevMode.current = mode;
      if (mode !== 'CREATIVE') flying.current = false;
    }
  }, [mode]);

  useEffect(() => {
    const el = gl.domElement;
    const lock = () => { if (document.pointerLockElement !== el && !isDeadRef.current) el.requestPointerLock?.(); };
    el.addEventListener('click', lock);
    return () => el.removeEventListener('click', lock);
  }, [gl.domElement]);

  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el || isDeadRef.current) return;
      yaw.current   -= e.movementX * 0.002;
      pitch.current -= e.movementY * 0.002;
      pitch.current  = Math.max(-1.5, Math.min(1.5, pitch.current));
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [gl]);

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

  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (isDeadRef.current) return;
      const n = parseInt(e.code.replace('Digit',''));
      if (n >= 1 && n <= 9) slot.current = n - 1;
      if (e.code === 'Space' && modeRef.current === 'CREATIVE') {
        const now = Date.now();
        if (now - spaceLastTap.current < 350) flying.current = !flying.current;
        spaceLastTap.current = now;
      }
    };
    const wh = (e: WheelEvent) => {
      if (isDeadRef.current) return;
      slot.current = ((slot.current + (e.deltaY > 0 ? 1 : -1)) + 9) % 9;
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('wheel', wh);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('wheel', wh); };
  }, []);

  useFrame((_, delta) => {
    if (isDeadRef.current) return;

    // Teleport command from 

    const dt = Math.min(delta, 0.05);
    const k  = getKeys();
    const t  = touchRef.current;
    const locked  = document.pointerLockElement === gl.domElement;
    const curMode = modeRef.current;

    if (t.lookDx !== 0 || t.lookDy !== 0) {
      yaw.current   -= t.lookDx * 0.004;
      pitch.current -= t.lookDy * 0.004;
      pitch.current  = Math.max(-1.5, Math.min(1.5, pitch.current));
      t.lookDx = 0; t.lookDy = 0;
    }

    if (t.toggleMode && !prevToggle.current) {
      setMode(curMode === 'CREATIVE' ? 'SURVIVAL' : 'CREATIVE');
    }
    prevToggle.current = t.toggleMode;

    const isFlying = flying.current && curMode === 'CREATIVE';
    const spd = isFlying ? FLY_SPEED : (curMode === 'CREATIVE' ? CREATIVE_SPEED : SPEED);
    const sinY = Math.sin(yaw.current), cosY = Math.cos(yaw.current);

    const fwd = k.forward || false, bk = k.back || false;
    const lft = k.left    || false, rgt = k.right || false;
    const jmp = k.jump || t.jump;

    let mx = 0, mz = 0;
    if (fwd) { mx -= sinY; mz -= cosY; }
    if (bk)  { mx += sinY; mz += cosY; }
    if (lft) { mx -= cosY; mz += sinY; }
    if (rgt) { mx += cosY; mz -= sinY; }
    if (t.dx !== 0 || t.dz !== 0) {
      mx = sinY * t.dz + cosY * t.dx;
      mz = cosY * t.dz - sinY * t.dx;
    }
    const ml = Math.sqrt(mx*mx + mz*mz);
    if (ml > 0) { mx /= ml; mz /= ml; }

    vel.current.x = mx * spd;
    vel.current.z = mz * spd;

    if (isFlying) {
      vel.current.y = 0;
      if (jmp)                  vel.current.y =  FLY_SPEED;
      if (k.sneak || t.flyDown) vel.current.y = -FLY_SPEED;
    } else {
      if (jmp && grounded.current) { vel.current.y = JUMP_FORCE; grounded.current = false; }
      vel.current.y -= GRAVITY * dt;
      vel.current.y  = Math.max(vel.current.y, -50);
    }

    const p = pos.current, v = vel.current;
    tmpPos.current.set(p.x + v.x * dt, p.y, p.z);
    if (!collidesAt(tmpPos.current)) p.x = tmpPos.current.x; else v.x = 0;

    tmpPos.current.set(p.x, p.y + v.y * dt, p.z);
    if (!collidesAt(tmpPos.current)) {
      p.y = tmpPos.current.y;
      if (!isFlying) grounded.current = false;
    } else {
      if (v.y < 0 && !isFlying) {
        grounded.current = true;
        if (curMode === 'SURVIVAL' && v.y < -12)
          health.current = Math.max(0, health.current - Math.floor((-v.y - 12) * 0.6));
      }
      v.y = 0;
    }

    tmpPos.current.set(p.x, p.y, p.z + v.z * dt);
    if (!collidesAt(tmpPos.current)) p.z = tmpPos.current.z; else v.z = 0;

    if (p.y < -10) {
      p.set(8, worldManager.getTerrainHeight(8, 8) + 3, 8);
      v.set(0, 0, 0);
      if (curMode === 'SURVIVAL') health.current = Math.max(0, health.current - 4);
    }

    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    eyePos.current.set(p.x, p.y + EYE_H, p.z);
    camera.position.copy(eyePos.current);
    playerChunkRef.current = { x: Math.floor(p.x / CHUNK_SIZE), z: Math.floor(p.z / CHUNK_SIZE) };

    const doBreak = lmbDown.current || t.doBreak;
    const doPlace = rmbDown.current || t.doPlace;

    if (locked || doBreak || doPlace) {
      camera.getWorldDirection(dir3.current);
      const reach = curMode === 'CREATIVE' ? MAX_REACH_CREATIVE : MAX_REACH_SURVIVAL;
      const ray   = castRay(eyePos.current, dir3.current, reach);

      const mobHit = doBreak
        ? raycastMobs(eyePos.current.x, eyePos.current.y, eyePos.current.z, dir3.current.x, dir3.current.y, dir3.current.z, reach)
        : null;

      if (mobHit && (!ray.hit || mobHit.dist < ray.dist)) {
        if (doBreak) {
          const now = Date.now();
          if (now - lastHit.current > 400) {
            damageMob(mobHit.id, curMode === 'CREATIVE' ? 10 : 5);
            lastHit.current = now;
          }
        }
      } else if (ray.hit && ray.hitPos) {
        if (doBreak) {
          const now = Date.now();
          const hp  = ray.hitPos;
          if (curMode === 'CREATIVE') {
            if (now - breakStart.current > 200) {
              worldManager.setBlock(hp.x, hp.y, hp.z, BlockType.AIR);
              breakStart.current = now;
            }
          } else {
            const samePos = breakPos.current?.equals(hp);
            if (!samePos) { breakPos.current = hp.clone(); breakStart.current = now; }
            if (now - breakStart.current >= BREAK_TIME_MS) {
              const blockType = worldManager.getBlock(hp.x, hp.y, hp.z);
              worldManager.setBlock(hp.x, hp.y, hp.z, BlockType.AIR);
              onBlockBreak(blockType, new THREE.Vector3(hp.x + 0.5, hp.y + 0.5, hp.z + 0.5));
              breakPos.current = null; breakStart.current = 0;
            }
          }
        } else { breakPos.current = null; breakStart.current = 0; }

        if (doPlace && ray.hitPos) {
          const hitBlock = worldManager.getBlock(ray.hitPos.x, ray.hitPos.y, ray.hitPos.z);
          const now = Date.now();
          if (hitBlock === BlockType.CHEST && onChestOpen) {
            if (now - lastPlace.current > 400) {
              onChestOpen(ray.hitPos.x, ray.hitPos.y, ray.hitPos.z);
              lastPlace.current = now;
            }
          } else if (ray.prevPos && now - lastPlace.current > 250) {
            const pp  = ray.prevPos;
            const blk = hotbar.current[slot.current];
            if (blk !== BlockType.AIR) {
              const canPl = curMode !== 'SURVIVAL' || canPlace(blk);
              if (canPl) {
                const hw = PLAYER_W / 2;
                const inside = pp.x >= Math.floor(p.x-hw) && pp.x <= Math.floor(p.x+hw-0.001)
                            && pp.y >= Math.floor(p.y)      && pp.y <= Math.floor(p.y+PLAYER_H-0.001)
                            && pp.z >= Math.floor(p.z-hw)   && pp.z <= Math.floor(p.z+hw-0.001);
                if (!inside) {
                  worldManager.setBlock(pp.x, pp.y, pp.z, blk);
                  lastPlace.current = now;
                  if (curMode === 'SURVIVAL') onBlockPlace(blk);
                }
              }
            }
          }
        }
      } else { breakPos.current = null; breakStart.current = 0; }
    }

    stateT.current += dt;
    if (stateT.current > 0.1) {
      stateT.current = 0;
      if (curMode === 'SURVIVAL') hunger.current = Math.max(0, hunger.current - 0.002);
      onStateChange({ health: health.current, hunger: hunger.current, hotbar: hotbar.current, selectedSlot: slot.current, pos: p.clone() });
    }
  });

  return null;
}
