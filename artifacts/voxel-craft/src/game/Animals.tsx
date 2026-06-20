import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldManager, WORLD_HEIGHT } from './worldGen';
import { isSolid } from './blocks';

const GRAVITY = 18;
const SPEED = 1.2;
const COUNT = 18;

type AnimalType = 'cow' | 'pig' | 'sheep';

interface Animal {
  id: number;
  type: AnimalType;
  pos: THREE.Vector3;
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
      vy: 0,
      dir: prand(i * 999) * Math.PI * 2,
      changeT: prand(i * 123) * 4,
      grounded: false,
    });
  }
  return animals;
}

function findGround(x: number, z: number, startY: number): number {
  const top = Math.min(WORLD_HEIGHT - 1, Math.floor(startY) + 4);
  for (let y = top; y >= 0; y--) {
    if (isSolid(worldManager.getBlock(Math.floor(x), y, Math.floor(z)))) return y + 1;
  }
  return 0;
}

export default function Animals() {
  const animalsRef = useRef<Animal[]>(spawnAnimals());
  const bodyRefs   = useRef<(THREE.Mesh | null)[]>(new Array(COUNT).fill(null));
  const headRefs   = useRef<(THREE.Mesh | null)[]>(new Array(COUNT).fill(null));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;

    animalsRef.current.forEach((a, i) => {
      const body = bodyRefs.current[i];
      const head = headRefs.current[i];
      if (!body) return;

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
              <meshLambertMaterial color={spec.color} />
            </mesh>
            <mesh ref={(r) => { headRefs.current[i] = r; }}>
              <boxGeometry args={[spec.w * 0.7, spec.h * 0.6, spec.w * 0.7]} />
              <meshLambertMaterial color={spec.headColor ?? spec.color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
