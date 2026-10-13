import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldManager, WORLD_MIN_Y, WORLD_MAX_Y } from './worldGen';
import { isSolid } from './blocks';
import { getMobTexture } from './textures';

const GRAVITY = 18;
const SPEED = 1.2;
const COUNT = 18;

export type AnimalType = 'cow' | 'pig' | 'sheep';

export interface Animal {
  id: number;
  type: AnimalType;
  pos: THREE.Vector3;
  health: number;
  dead: boolean;
  vy: number;
  dir: number;
  changeT: number;
  grounded: boolean;
}

const SPECS: Record<AnimalType, { w: number; h: number; d: number; color: number; headColor?: number }> = {
  cow:   { w: 1.0, h: 1.4, d: 1.8, color: 0x5C4033, headColor: 0x4a3327 },
  pig:   { w: 0.9, h: 0.9, d: 1.4, color: 0xFFB6C1, headColor: 0xf09090 },
  sheep: { w: 1.0, h: 1.2, d: 1.7, color: 0xDDDDDD, headColor: 0xaaaaaa },
};

// Deterministic pseudo-random
function prand(seed: number): number {
  const s = Math.sin(seed * 7919.131 + 2147.483) * 43758.5453;
  return s - Math.floor(s);
}

function spawnAnimals(): Animal[] {
  const animals: Animal[] = [];
  const types: AnimalType[] = ['cow', 'pig', 'sheep'];
  for (let i = 0; i < COUNT; i++) {
    const angle = i * 137.508 * (Math.PI / 180);
    const radius = 15 + (i * 6) % 35;
    const sx = Math.round(8 + Math.cos(angle) * radius);
    const sz = Math.round(8 + Math.sin(angle) * radius);
    animals.push({
      id: i,
      type: types[i % 3],
      pos: new THREE.Vector3(sx, 30, sz),
      health: 10,
      dead: false,
      vy: 0,
      dir: prand(i * 999) * Math.PI * 2,
      changeT: prand(i * 123) * 4,
      grounded: false,
    });
  }
  return animals;
}

const animals = spawnAnimals();

export function raycastAnimals(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  maxDist: number,
): { id: number; dist: number } | null {
  let best: { id: number; dist: number } | null = null;
  for (const animal of animals) {
    if (animal.dead) continue;
    const spec = SPECS[animal.type];
    const halfWidth = Math.hypot(spec.w, spec.d) * 0.5;
    const dist = rayBoxDistance(
      ox, oy, oz, dx, dy, dz,
      animal.pos.x - halfWidth, animal.pos.y, animal.pos.z - halfWidth,
      animal.pos.x + halfWidth, animal.pos.y + spec.h, animal.pos.z + halfWidth,
    );
    if (dist !== null && dist <= maxDist && (!best || dist < best.dist)) {
      best = { id: animal.id, dist };
    }
  }
  return best;
}

export function damageAnimal(id: number, amount: number): boolean {
  const animal = animals.find(candidate => candidate.id === id);
  if (!animal || animal.dead) return false;
  animal.health = Math.max(0, animal.health - amount);
  if (animal.health === 0) animal.dead = true;
  return true;
}

function rayBoxDistance(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number,
): number | null {
  let near = 0;
  let far = Infinity;
  const origins = [ox, oy, oz];
  const directions = [dx, dy, dz];
  const mins = [minX, minY, minZ];
  const maxs = [maxX, maxY, maxZ];
  for (let axis = 0; axis < 3; axis++) {
    if (Math.abs(directions[axis]) < 1e-8) {
      if (origins[axis] < mins[axis] || origins[axis] > maxs[axis]) return null;
      continue;
    }
    const first = (mins[axis] - origins[axis]) / directions[axis];
    const second = (maxs[axis] - origins[axis]) / directions[axis];
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) return null;
  }
  return far >= 0 ? near : null;
}

function findGround(x: number, z: number, startY: number): number {
  const top = Math.min(WORLD_MAX_Y, Math.floor(startY) + 4);
  for (let y = top; y >= WORLD_MIN_Y; y--) {
    if (isSolid(worldManager.getBlock(Math.floor(x), y, Math.floor(z)))) return y + 1;
  }
  return 0;
}

export default function Animals() {
  const animalsRef = useRef<Animal[]>(animals);
  const bodyRefs   = useRef<(THREE.Mesh | null)[]>(new Array(COUNT).fill(null));
  const headRefs   = useRef<(THREE.Mesh | null)[]>(new Array(COUNT).fill(null));
  const sheepHeadMaterials = useMemo(() => {
    const wool = SPECS.sheep.headColor ?? SPECS.sheep.color;
    return [
      new THREE.MeshLambertMaterial({ color: wool }),
      new THREE.MeshLambertMaterial({ color: wool }),
      new THREE.MeshLambertMaterial({ color: wool }),
      new THREE.MeshLambertMaterial({ color: wool }),
      new THREE.MeshLambertMaterial({ color: wool, map: getMobTexture('sheep') }),
      new THREE.MeshLambertMaterial({ color: wool }),
    ];
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;

    animalsRef.current.forEach((a, i) => {
      const body = bodyRefs.current[i];
      const head = headRefs.current[i];
      if (!body) return;
      body.visible = !a.dead;
      if (head) head.visible = !a.dead;
      if (a.dead) return;

      // Change direction
      a.changeT -= dt;
      if (a.changeT <= 0) {
        a.changeT = 2 + prand(time * 0.1 + a.id * 97) * 5;
        a.dir = (time * 0.3 + a.id * 2.618 + prand(a.id + time * 0.01) * Math.PI * 2) % (Math.PI * 2);
      }

      // Horizontal movement
      const vx = Math.sin(a.dir) * SPEED;
      const vz = Math.cos(a.dir) * SPEED;

      // Gravity
      a.vy -= GRAVITY * dt;
      a.vy = Math.max(a.vy, -30);

      // Move X
      const nx = a.pos.x + vx * dt;
      const gx = findGround(nx, a.pos.z, a.pos.y);
      if (Math.abs(gx - a.pos.y) < 1.5) a.pos.x = nx;

      // Move Z
      const nz = a.pos.z + vz * dt;
      const gz2 = findGround(a.pos.x, nz, a.pos.y);
      if (Math.abs(gz2 - a.pos.y) < 1.5) a.pos.z = nz;

      // Apply gravity + ground
      a.pos.y += a.vy * dt;
      const groundY = findGround(a.pos.x, a.pos.z, a.pos.y + 2);
      if (a.pos.y <= groundY) {
        a.pos.y = groundY;
        a.vy = 0;
        a.grounded = true;
      } else {
        a.grounded = false;
      }

      const spec = SPECS[a.type];
      const bob = a.grounded ? Math.abs(Math.sin(time * 3.5 + a.id)) * 0.04 : 0;

      body.position.set(a.pos.x, a.pos.y + spec.h / 2 + bob, a.pos.z);
      body.rotation.y = a.dir;

      if (head) {
        head.position.set(
          a.pos.x + Math.sin(a.dir) * (spec.d / 2 + 0.2),
          a.pos.y + spec.h * 0.8 + bob,
          a.pos.z + Math.cos(a.dir) * (spec.d / 2 + 0.2),
        );
        head.rotation.y = a.dir;
      }
    });
  });

  return (
    <group>
      {animalsRef.current.map((a, i) => {
        const spec = SPECS[a.type];
        return (
          <group key={a.id}>
            <mesh ref={(r) => { bodyRefs.current[i] = r; }}>
              <boxGeometry args={[spec.w, spec.h, spec.d]} />
              <meshLambertMaterial color={spec.color} map={a.type === 'sheep' ? undefined : getMobTexture(a.type)} />
            </mesh>
            <mesh
              ref={(r) => { headRefs.current[i] = r; }}
              material={a.type === 'sheep' ? sheepHeadMaterials : undefined}
            >
              <boxGeometry args={[spec.w * 0.7, spec.h * 0.6, spec.w * 0.7]} />
              {a.type !== 'sheep' && (
                <meshLambertMaterial color={spec.headColor ?? spec.color} map={getMobTexture(a.type)} />
              )}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
