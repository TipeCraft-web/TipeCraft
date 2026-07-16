import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldManager } from './worldGen';
import { isSolid } from './blocks';
import { getMobs, spawnMob, cleanDeadMobs, MOB_SPECS, MobType } from './mobSystem';

const SPAWN_DIST     = 24;
const DESPAWN_DIST   = 48;
const GRAVITY        = 18;
const MAX_SPAWN      = 20;
const SPAWN_INTERVAL = 8;

function pseudoRand(n: number) {
  const s = Math.sin(n * 9301.0 + 49297.0) * 233280.0;
  return s - Math.floor(s);
}

// ─── Humanoid (Zombie / Skeleton) ────────────────────────────────────────────
function HumanoidMesh({
  bodyColor, headColor, eyeColor, legColor, armColor,
  mobId,
}: {
  bodyColor: number; headColor: number; eyeColor: number;
  legColor: number; armColor: number; mobId: number;
}) {
  const rootRef  = useRef<THREE.Group>(null);
  const lLegRef  = useRef<THREE.Group>(null);
  const rLegRef  = useRef<THREE.Group>(null);
  const lArmRef  = useRef<THREE.Group>(null);
  const rArmRef  = useRef<THREE.Group>(null);
  const bodyMat  = useRef<THREE.MeshLambertMaterial>(null);
  const headMat  = useRef<THREE.MeshLambertMaterial>(null);
  const walkPh   = useRef(0);

  useFrame((_, delta) => {
    const mobs = getMobs();
    const mob  = mobs.find(m => m.id === mobId);
    const g    = rootRef.current;
    if (!g) return;
    if (!mob) { g.visible = false; return; }
    g.visible = true;
    g.position.set(mob.pos[0], mob.pos[1], mob.pos[2]);
    g.rotation.y = mob.yaw;

    const isMoving = mob.state === 'aggro' || mob.state === 'patrol';
    if (mob.state === 'dead') {
      const s = Math.max(0.01, mob.deathTimer / 1.2);
      g.scale.set(s, s, s);
    } else {
      g.scale.set(1, 1, 1);
    }

    if (isMoving) walkPh.current += delta * 7;
    const sw = isMoving ? Math.sin(walkPh.current) * 0.55 : Math.sin(Date.now() * 0.001 + mobId) * 0.04;
    if (lLegRef.current)  lLegRef.current.rotation.x  =  sw;
    if (rLegRef.current)  rLegRef.current.rotation.x  = -sw;
    if (lArmRef.current)  lArmRef.current.rotation.x  = -sw;
    if (rArmRef.current)  rArmRef.current.rotation.x  =  sw;

    const flash = mob.hitFlash > 0;
    if (bodyMat.current) bodyMat.current.color.setHex(flash ? 0xff2020 : bodyColor);
    if (headMat.current) headMat.current.color.setHex(flash ? 0xff3030 : headColor);
  });

  return (
    <group ref={rootRef}>
      {/* Torso */}
      <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[0.52, 0.68, 0.28]} />
        <meshLambertMaterial ref={bodyMat} color={bodyColor} />
      </mesh>
      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 1.74, 0]}>
        <boxGeometry args={[0.54, 0.54, 0.54]} />
        <meshLambertMaterial ref={headMat} color={headColor} />
      </mesh>
      {/* Eyes */}
      <mesh position={[ 0.14, 1.82, -0.285]}>
        <boxGeometry args={[0.10, 0.07, 0.01]} />
        <meshLambertMaterial color={eyeColor} />
      </mesh>
      <mesh position={[-0.14, 1.82, -0.285]}>
        <boxGeometry args={[0.10, 0.07, 0.01]} />
        <meshLambertMaterial color={eyeColor} />
      </mesh>
      {/* Left leg (pivot at hip = y 0.85) */}
      <group ref={lLegRef} position={[-0.13, 0.85, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.42, 0]}>
          <boxGeometry args={[0.24, 0.84, 0.24]} />
          <meshLambertMaterial color={legColor} />
        </mesh>
      </group>
      {/* Right leg */}
      <group ref={rLegRef} position={[0.13, 0.85, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.42, 0]}>
          <boxGeometry args={[0.24, 0.84, 0.24]} />
          <meshLambertMaterial color={legColor} />
        </mesh>
      </group>
      {/* Left arm (pivot at shoulder = y 1.55) */}
      <group ref={lArmRef} position={[-0.38, 1.55, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.28, 0]}>
          <boxGeometry args={[0.22, 0.56, 0.22]} />
          <meshLambertMaterial color={armColor} />
        </mesh>
      </group>
      {/* Right arm */}
      <group ref={rArmRef} position={[0.38, 1.55, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.28, 0]}>
          <boxGeometry args={[0.22, 0.56, 0.22]} />
          <meshLambertMaterial color={armColor} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Creeper ────────────────────────────────────────────────────────────────
function CreeperMesh({ mobId }: { mobId: number }) {
  const rootRef = useRef<THREE.Group>(null);
  const legRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const bodyMat = useRef<THREE.MeshLambertMaterial>(null);
  const walkPh  = useRef(0);

  useFrame((_, delta) => {
    const mobs = getMobs();
    const mob  = mobs.find(m => m.id === mobId);
    const g    = rootRef.current;
    if (!g) return;
    if (!mob) { g.visible = false; return; }
    g.visible = true;
    g.position.set(mob.pos[0], mob.pos[1], mob.pos[2]);
    g.rotation.y = mob.yaw;
    if (mob.state === 'dead') { const s = Math.max(0.01, mob.deathTimer/1.2); g.scale.set(s,s,s); }
    else g.scale.set(1,1,1);
    const moving = mob.state === 'aggro' || mob.state === 'patrol';
    if (moving) walkPh.current += delta * 8;
    const sw = moving ? Math.sin(walkPh.current) * 0.4 : 0;
    legRefs[0].current && (legRefs[0].current.rotation.x =  sw);
    legRefs[1].current && (legRefs[1].current.rotation.x = -sw);
    legRefs[2].current && (legRefs[2].current.rotation.x = -sw);
    legRefs[3].current && (legRefs[3].current.rotation.x =  sw);
    if (bodyMat.current) bodyMat.current.color.setHex(mob.hitFlash > 0 ? 0xff2020 : 0x3a7a2a);
  });

  const legPositions: [number, number, number][] = [[-0.15, 0.3, -0.18], [0.15, 0.3, -0.18], [-0.15, 0.3, 0.18], [0.15, 0.3, 0.18]];
  return (
    <group ref={rootRef}>
      <mesh castShadow receiveShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[0.46, 0.78, 0.40]} />
        <meshLambertMaterial ref={bodyMat} color={0x3a7a2a} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.72, 0]}>
        <boxGeometry args={[0.50, 0.50, 0.50]} />
        <meshLambertMaterial color={0x4a9a36} />
      </mesh>
      {/* Face marks */}
      <mesh position={[ 0.13, 1.77, -0.26]}><boxGeometry args={[0.10, 0.08, 0.02]}/><meshLambertMaterial color={0x1a1a1a}/></mesh>
      <mesh position={[-0.13, 1.77, -0.26]}><boxGeometry args={[0.10, 0.08, 0.02]}/><meshLambertMaterial color={0x1a1a1a}/></mesh>
      <mesh position={[0, 1.63, -0.26]}><boxGeometry args={[0.18, 0.12, 0.02]}/><meshLambertMaterial color={0x1a1a1a}/></mesh>
      {/* 4 legs */}
      {legPositions.map((pos, i) => (
        <group key={i} ref={legRefs[i]} position={pos}>
          <mesh castShadow position={[0, -0.15, 0]}>
            <boxGeometry args={[0.20, 0.30, 0.20]} />
            <meshLambertMaterial color={0x3a7a2a} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Spider ──────────────────────────────────────────────────────────────────
function SpiderMesh({ mobId }: { mobId: number }) {
  const rootRef = useRef<THREE.Group>(null);
  const legRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const bodyMat = useRef<THREE.MeshLambertMaterial>(null);
  const walkPh  = useRef(0);

  useFrame((_, delta) => {
    const mobs = getMobs();
    const mob  = mobs.find(m => m.id === mobId);
    const g    = rootRef.current;
    if (!g) return;
    if (!mob) { g.visible = false; return; }
    g.visible = true;
    g.position.set(mob.pos[0], mob.pos[1], mob.pos[2]);
    g.rotation.y = mob.yaw;
    if (mob.state === 'dead') { const s = Math.max(0.01, mob.deathTimer/1.2); g.scale.set(s,s,s); }
    else g.scale.set(1,1,1);
    const moving = mob.state === 'aggro' || mob.state === 'patrol';
    if (moving) walkPh.current += delta * 9;
    const sw = moving ? Math.sin(walkPh.current) * 0.5 : 0;
    legRefs.forEach((r, i) => r.current && (r.current.rotation.z = (i%2===0 ? 1 : -1) * (0.5 + sw * 0.3)));
    if (bodyMat.current) bodyMat.current.color.setHex(mob.hitFlash > 0 ? 0xff2020 : 0x1a0a0a);
  });

  const legX: [number,number,number][] = [[-0.55, 0.35, -0.2],[0.55, 0.35, -0.2],[-0.55, 0.35, 0.1],[0.55, 0.35, 0.1]];
  return (
    <group ref={rootRef}>
      <mesh castShadow receiveShadow position={[0, 0.38, 0]}>
        <boxGeometry args={[0.72, 0.36, 0.44]} />
        <meshLambertMaterial ref={bodyMat} color={0x1a0a0a} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.55, -0.36]}>
        <boxGeometry args={[0.36, 0.30, 0.36]} />
        <meshLambertMaterial color={0x2a1a1a} />
      </mesh>
      <mesh position={[0.10, 0.64, -0.52]}><boxGeometry args={[0.09,0.07,0.02]}/><meshLambertMaterial color={0xff0000}/></mesh>
      <mesh position={[-0.10, 0.64, -0.52]}><boxGeometry args={[0.09,0.07,0.02]}/><meshLambertMaterial color={0xff0000}/></mesh>
      {legX.map((pos, i) => (
        <group key={i} ref={legRefs[i]} position={pos}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.07, 0.07]} />
            <meshLambertMaterial color={0x1a0a0a} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Slime ───────────────────────────────────────────────────────────────────
function SlimeMesh({ mobId }: { mobId: number }) {
  const rootRef  = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const bodyMat  = useRef<THREE.MeshLambertMaterial>(null);

  useFrame(() => {
    const mobs = getMobs();
    const mob  = mobs.find(m => m.id === mobId);
    const g    = rootRef.current;
    if (!g) return;
    if (!mob) { g.visible = false; return; }
    g.visible = true;
    g.position.set(mob.pos[0], mob.pos[1], mob.pos[2]);
    if (mob.state === 'dead') { const s = Math.max(0.01, mob.deathTimer/1.2); g.scale.set(s,s,s); return; }
    const bounce = 1 + Math.abs(Math.sin(Date.now() * 0.006 + mob.id)) * 0.15;
    const squish = 1 / bounce;
    g.scale.set(squish, bounce, squish);
    if (bodyMat.current) bodyMat.current.color.setHex(mob.hitFlash > 0 ? 0xff2020 : 0x4cbe4c);
  });

  return (
    <group ref={rootRef}>
      <mesh ref={outerRef} castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.82, 0.82, 0.82]} />
        <meshLambertMaterial ref={bodyMat} color={0x4cbe4c} transparent opacity={0.88} />
      </mesh>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.48, 0.48, 0.48]} />
        <meshLambertMaterial color={0x7aee7a} />
      </mesh>
      <mesh position={[0.14, 0.52, -0.42]}><boxGeometry args={[0.11,0.09,0.02]}/><meshLambertMaterial color={0x1a2a1a}/></mesh>
      <mesh position={[-0.14, 0.52, -0.42]}><boxGeometry args={[0.11,0.09,0.02]}/><meshLambertMaterial color={0x1a2a1a}/></mesh>
    </group>
  );
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
function MobMesh({ mobId, mobType }: { mobId: number; mobType: MobType }) {
  switch (mobType) {
    case 'zombie':
      return <HumanoidMesh mobId={mobId}
        bodyColor={0x3a6e2a} headColor={0x4d8c3a} eyeColor={0xff1a1a}
        legColor={0x2a4a6e} armColor={0x3a6e2a} />;
    case 'skeleton':
      return <HumanoidMesh mobId={mobId}
        bodyColor={0xd8d0c0} headColor={0xe8e0d0} eyeColor={0x222222}
        legColor={0xd0c8b8} armColor={0xc8c0b0} />;
    case 'creeper':
      return <CreeperMesh mobId={mobId} />;
    case 'spider':
      return <SpiderMesh mobId={mobId} />;
    case 'slime':
      return <SlimeMesh mobId={mobId} />;
    default:
      return <HumanoidMesh mobId={mobId}
        bodyColor={0x5a3a2a} headColor={0x7a5a4a} eyeColor={0xff2020}
        legColor={0x3a2a1a} armColor={0x5a3a2a} />;
  }
}

// ─── AI + spawn controller ────────────────────────────────────────────────────
interface Props {
  playerPos:      THREE.Vector3;
  onPlayerDamage: (amount: number) => void;
  dayTimeRef:     React.MutableRefObject<number>;
}

export default function Mobs({ playerPos, onPlayerDamage, dayTimeRef }: Props) {
  const [renderedMobs, setRenderedMobs] = useState<{ id: number; type: MobType }[]>([]);
  const spawnTimer  = useRef(2);
  const frameCount  = useRef(0);
  const prevIdsRef  = useRef<string>('');

  useFrame((_, delta) => {
    const dt   = Math.min(delta, 0.05);
    const mobs = getMobs();
    frameCount.current++;

    // ── Spawn — more mobs at night ──────────────────────────────────
    spawnTimer.current -= dt;
    const isNight = dayTimeRef.current < 0.22 || dayTimeRef.current > 0.78;
    const maxSpawn = isNight ? MAX_SPAWN + 10 : MAX_SPAWN;
    const spawnInterval = isNight ? SPAWN_INTERVAL * 0.6 : SPAWN_INTERVAL;

    if (spawnTimer.current <= 0 && mobs.length < maxSpawn) {
      spawnTimer.current = spawnInterval;
      const seed  = Date.now() * 0.001;
      const angle = pseudoRand(seed) * Math.PI * 2;
      const dist  = SPAWN_DIST * 0.7 + pseudoRand(seed * 1.7) * SPAWN_DIST * 0.3;
      const sx    = playerPos.x + Math.cos(angle) * dist;
      const sz    = playerPos.z + Math.sin(angle) * dist;
      const sy    = worldManager.getTerrainHeight(Math.floor(sx), Math.floor(sz)) + 1;
      const dayTypes: MobType[]   = ['slime', 'spider', 'spider'];
      const nightTypes: MobType[] = ['zombie', 'zombie', 'zombie', 'skeleton', 'skeleton', 'creeper', 'spider', 'slime'];
      const pool = isNight ? nightTypes : dayTypes;
      spawnMob(pool[Math.floor(pseudoRand(seed * 3.3) * pool.length)], sx, sy, sz);
    }

    // ── AI update ──────────────────────────────────────────────────
    for (const mob of mobs) {
      const spec = MOB_SPECS[mob.type];
      if (mob.hitFlash > 0)       mob.hitFlash       -= dt;
      if (mob.attackCooldown > 0) mob.attackCooldown -= dt;
      if (mob.patrolTimer > 0)    mob.patrolTimer    -= dt;
      if (mob.state === 'dead') { mob.deathTimer -= dt; continue; }

      const dx = playerPos.x - mob.pos[0];
      const dz = playerPos.z - mob.pos[2];
      const d  = Math.sqrt(dx * dx + dz * dz);

      if (d > DESPAWN_DIST) { mob.state = 'dead'; mob.deathTimer = 0; continue; }
      if (d < spec.aggroRange)                                   mob.state = 'aggro';
      else if (mob.state === 'aggro' && d > spec.aggroRange * 1.3) mob.state = 'patrol';

      let vx = 0, vz = 0;
      if (mob.state === 'aggro' || mob.state === 'attack') {
        if (d > 0.01) {
          mob.yaw = Math.atan2(dx, dz);
          const spd = spec.speed * 60;
          vx = (dx / d) * spd; vz = (dz / d) * spd;
        }
        if (d < spec.attackRange && mob.attackCooldown <= 0) {
          onPlayerDamage(spec.attackDamage);
          mob.attackCooldown = mob.type === 'creeper' ? 2.5 : mob.type === 'skeleton' ? 1.5 : 1.0;
        }
      } else {
        if (mob.patrolTimer <= 0) {
          const a = pseudoRand(Date.now() * 0.001 + mob.id * 17) * Math.PI * 2;
          mob.patrolDir   = [Math.cos(a) * 0.4, Math.sin(a) * 0.4];
          mob.patrolTimer = 2 + pseudoRand(mob.id * 3 + Date.now() * 0.0001) * 3;
          mob.state = 'patrol';
        }
        vx = mob.patrolDir[0] * 60; vz = mob.patrolDir[1] * 60;
        if (Math.abs(vx) + Math.abs(vz) > 0.01) mob.yaw = Math.atan2(vx, vz);
      }

      mob.vel[0] = vx; mob.vel[2] = vz;
      mob.vel[1] -= GRAVITY * dt;
      mob.vel[1]  = Math.max(mob.vel[1], -30);

      const nx = mob.pos[0] + mob.vel[0] * dt;
      const flY = Math.floor(mob.pos[1]);
      const nlx = Math.floor(nx), mlz = Math.floor(mob.pos[2]);
      if (!isSolid(worldManager.getBlock(nlx, flY, mlz)) && !isSolid(worldManager.getBlock(nlx, flY + 1, mlz))) {
        mob.pos[0] = nx;
      } else {
        mob.vel[0] = 0;
        if (!isSolid(worldManager.getBlock(nlx, flY + 2, mlz))) { mob.pos[1] += 0.12; mob.pos[0] = nx; }
      }

      const nz = mob.pos[2] + mob.vel[2] * dt;
      const mlx = Math.floor(mob.pos[0]), nlz = Math.floor(nz);
      if (!isSolid(worldManager.getBlock(mlx, flY, nlz)) && !isSolid(worldManager.getBlock(mlx, flY + 1, nlz))) {
        mob.pos[2] = nz;
      } else { mob.vel[2] = 0; }

      const ny = mob.pos[1] + mob.vel[1] * dt;
      const fx3 = Math.floor(mob.pos[0]), fz3 = Math.floor(mob.pos[2]);
      if (mob.vel[1] < 0) {
        if (isSolid(worldManager.getBlock(fx3, Math.floor(ny), fz3))) {
          mob.pos[1] = Math.floor(ny) + 1;
          mob.vel[1] = mob.type === 'slime' ? 4 : 0;
        } else { mob.pos[1] = ny; }
      } else {
        if (isSolid(worldManager.getBlock(fx3, Math.floor(ny + spec.h), fz3))) mob.vel[1] = 0;
        else mob.pos[1] = ny;
      }
    }

    if (frameCount.current % 15 === 0) cleanDeadMobs();
    const idStr = mobs.map(m => m.id).join(',');
    if (idStr !== prevIdsRef.current) {
      prevIdsRef.current = idStr;
      setRenderedMobs(mobs.map(m => ({ id: m.id, type: m.type })));
    }
  });

  return (
    <>
      {renderedMobs.map(({ id, type }) => (
        <MobMesh key={id} mobId={id} mobType={type} />
      ))}
    </>
  );
}
