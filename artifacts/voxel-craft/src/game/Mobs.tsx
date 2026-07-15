import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldManager } from './worldGen';
import { isSolid } from './blocks';
import { getMobs, spawnMob, cleanDeadMobs, MOB_SPECS, MobState, MobType } from './mobSystem';

const SPAWN_DIST   = 24;
const DESPAWN_DIST = 48;
const GRAVITY      = 18;
const MAX_SPAWN    = 25;
const SPAWN_INTERVAL = 8;

function pseudoRand(n: number) {
  const s = Math.sin(n * 9301.0 + 49297.0) * 233280.0;
  return s - Math.floor(s);
}

// ─── Single mob mesh — updates its own position via useFrame ────────────────
function MobMesh({ mobId, mobType }: { mobId: number; mobType: MobType }) {
  const groupRef   = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshLambertMaterial>(null);
  const headMatRef = useRef<THREE.MeshLambertMaterial>(null);

  const spec = MOB_SPECS[mobType];
  const bodyH  = mobType === 'spider' ? 0.5  : mobType === 'slime' ? 0.8 : 1.1;
  const bodyW  = spec.hw * 2;
  const headSz = mobType === 'spider' ? 0.35 : mobType === 'slime' ? 0.6 : 0.55;

  useFrame(() => {
    const mobs = getMobs();
    const mob  = mobs.find(m => m.id === mobId);
    const g    = groupRef.current;
    if (!g) return;

    if (!mob) { g.visible = false; return; }

    g.visible = true;
    g.position.set(mob.pos[0], mob.pos[1], mob.pos[2]);
    g.rotation.y = mob.yaw;

    // Death shrink animation
    if (mob.state === 'dead') {
      const s = Math.max(0.01, mob.deathTimer / 1.2);
      g.scale.set(s, s, s);
    } else {
      g.scale.set(1, 1, 1);
    }

    // Hit flash
    const color  = mob.hitFlash > 0 ? 0xff2020 : spec.color;
    const hColor = mob.hitFlash > 0 ? 0xff3030 : spec.headColor;
    if (bodyMatRef.current) bodyMatRef.current.color.setHex(color);
    if (headMatRef.current) headMatRef.current.color.setHex(hColor);
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, bodyH / 2, 0]}>
        <boxGeometry args={[bodyW, bodyH, bodyW * 0.8]} />
        <meshLambertMaterial ref={bodyMatRef} color={spec.color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, bodyH + headSz * 0.5 + 0.02, 0]}>
        <boxGeometry args={[headSz, headSz, headSz]} />
        <meshLambertMaterial ref={headMatRef} color={spec.headColor} />
      </mesh>
      {/* Eyes */}
      <mesh position={[ headSz * 0.27, bodyH + headSz * 0.6, -headSz * 0.51]}>
        <boxGeometry args={[0.09, 0.07, 0.02]} />
        <meshLambertMaterial color={0xff2020} />
      </mesh>
      <mesh position={[-headSz * 0.27, bodyH + headSz * 0.6, -headSz * 0.51]}>
        <boxGeometry args={[0.09, 0.07, 0.02]} />
        <meshLambertMaterial color={0xff2020} />
      </mesh>
    </group>
  );
}

// ─── AI + spawn controller ────────────────────────────────────────────────────
interface Props {
  playerPos: THREE.Vector3;
  onPlayerDamage: (amount: number) => void;
}

export default function Mobs({ playerPos, onPlayerDamage }: Props) {
  const [renderedMobs, setRenderedMobs] = useState<{ id: number; type: MobType }[]>([]);
  const spawnTimer    = useRef(2);
  const frameCount    = useRef(0);
  const prevIdsRef    = useRef<string>('');

  useFrame((_, delta) => {
    const dt   = Math.min(delta, 0.05);
    const mobs = getMobs();
    frameCount.current++;

    // ── Spawn ──────────────────────────────────────────────────────
    spawnTimer.current -= dt;
    if (spawnTimer.current <= 0 && mobs.length < MAX_SPAWN) {
      spawnTimer.current = SPAWN_INTERVAL;
      const seed  = Date.now() * 0.001;
      const angle = pseudoRand(seed) * Math.PI * 2;
      const dist  = SPAWN_DIST * 0.7 + pseudoRand(seed * 1.7) * SPAWN_DIST * 0.3;
      const sx    = playerPos.x + Math.cos(angle) * dist;
      const sz    = playerPos.z + Math.sin(angle) * dist;
      const sy    = worldManager.getTerrainHeight(Math.floor(sx), Math.floor(sz)) + 1;
      const types: MobType[] = ['zombie','zombie','zombie','skeleton','spider','creeper','slime'];
      spawnMob(types[Math.floor(pseudoRand(seed * 3.3) * types.length)], sx, sy, sz);
    }

    // ── AI update ─────────────────────────────────────────────────
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
      if (d < spec.aggroRange)                        mob.state = 'aggro';
      else if (mob.state === 'aggro' && d > spec.aggroRange * 1.3) mob.state = 'patrol';

      let vx = 0, vz = 0;

      if (mob.state === 'aggro' || mob.state === 'attack') {
        if (d > 0.01) {
          mob.yaw = Math.atan2(dx, dz);
          const spd = spec.speed * 60;
          vx = (dx / d) * spd;
          vz = (dz / d) * spd;
        }
        if (d < spec.attackRange && mob.attackCooldown <= 0) {
          onPlayerDamage(spec.attackDamage);
          mob.attackCooldown = mob.type === 'creeper' ? 2.5 : mob.type === 'skeleton' ? 1.5 : 1.0;
        }
      } else {
        if (mob.patrolTimer <= 0) {
          const a = pseudoRand(Date.now() * 0.001 + mob.id * 17) * Math.PI * 2;
          mob.patrolDir = [Math.cos(a) * 0.4, Math.sin(a) * 0.4];
          mob.patrolTimer = 2 + pseudoRand(mob.id * 3 + Date.now() * 0.0001) * 3;
          mob.state = 'patrol';
        }
        vx = mob.patrolDir[0] * 60;
        vz = mob.patrolDir[1] * 60;
        if (Math.abs(vx) + Math.abs(vz) > 0.01) mob.yaw = Math.atan2(vx, vz);
      }

      mob.vel[0] = vx; mob.vel[2] = vz;
      mob.vel[1] -= GRAVITY * dt;
      mob.vel[1]  = Math.max(mob.vel[1], -30);

      // Move X
      const nx  = mob.pos[0] + mob.vel[0] * dt;
      const flY = Math.floor(mob.pos[1]);
      const nlx = Math.floor(nx), mlz = Math.floor(mob.pos[2]);
      if (!isSolid(worldManager.getBlock(nlx, flY, mlz)) && !isSolid(worldManager.getBlock(nlx, flY + 1, mlz))) {
        mob.pos[0] = nx;
      } else {
        mob.vel[0] = 0;
        if (!isSolid(worldManager.getBlock(nlx, flY + 2, mlz))) { mob.pos[1] += 0.12; mob.pos[0] = nx; }
      }

      // Move Z
      const nz  = mob.pos[2] + mob.vel[2] * dt;
      const mlx = Math.floor(mob.pos[0]), nlz = Math.floor(nz);
      if (!isSolid(worldManager.getBlock(mlx, flY, nlz)) && !isSolid(worldManager.getBlock(mlx, flY + 1, nlz))) {
        mob.pos[2] = nz;
      } else { mob.vel[2] = 0; }

      // Move Y
      const ny  = mob.pos[1] + mob.vel[1] * dt;
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

    // ── Sync React state when mob list changes ─────────────────────
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
