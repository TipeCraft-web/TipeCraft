import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BlockType, isSolid } from './blocks';
import { getBlockDropTextures } from './textures';
import { worldManager } from './worldGen';

const DROP_GRAVITY = 22;
const DROP_HALF_SIZE = 0.17;

export interface DroppedItem {
  id: number;
  type: BlockType;
  position: { x: number; y: number; z: number };
}

interface ItemDropsProps {
  drops: DroppedItem[];
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  onCollect: (drop: DroppedItem) => void;
}

function DroppedBlock({ drop, meshRef }: {
  drop: DroppedItem;
  meshRef: (mesh: THREE.Mesh | null) => void;
}) {
  const [side, top, down] = getBlockDropTextures(drop.type);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.34, 0.34, 0.34), []);
  const materials = useMemo(() => [
    new THREE.MeshLambertMaterial({ map: side }),
    new THREE.MeshLambertMaterial({ map: side }),
    new THREE.MeshLambertMaterial({ map: top }),
    new THREE.MeshLambertMaterial({ map: down }),
    new THREE.MeshLambertMaterial({ map: side }),
    new THREE.MeshLambertMaterial({ map: side }),
  ], [side, top, down]);

  useEffect(() => () => {
    geometry.dispose();
    materials.forEach(material => material.dispose());
  }, [geometry, materials]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      position={[drop.position.x, drop.position.y + 0.28, drop.position.z]}
      castShadow
    />
  );
}

export default function ItemDrops({ drops, playerPosRef, onCollect }: ItemDropsProps) {
  const meshRefs = useRef(new Map<number, THREE.Mesh>());
  const verticalVelocity = useRef(new Map<number, number>());
  const collectedIds = useRef(new Set<number>());
  const tempPlayer = useRef(new THREE.Vector3());

  useEffect(() => {
    const activeIds = new Set(drops.map(drop => drop.id));
    for (const id of collectedIds.current) {
      if (!activeIds.has(id)) collectedIds.current.delete(id);
    }
    for (const id of verticalVelocity.current.keys()) {
      if (!activeIds.has(id)) verticalVelocity.current.delete(id);
    }
    for (const drop of drops) {
      if (!verticalVelocity.current.has(drop.id)) verticalVelocity.current.set(drop.id, 0);
    }
  }, [drops]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    tempPlayer.current.copy(playerPosRef.current);
    for (const drop of drops) {
      const mesh = meshRefs.current.get(drop.id);
      if (!mesh) continue;

      mesh.rotation.y += delta * 2.4;
      let velocity = verticalVelocity.current.get(drop.id) ?? 0;
      const blockX = Math.floor(drop.position.x);
      const blockZ = Math.floor(drop.position.z);
      let nextY = mesh.position.y;
      const supportY = Math.floor(mesh.position.y - DROP_HALF_SIZE - 0.001);
      const resting = velocity === 0 && isSolid(worldManager.getBlock(blockX, supportY, blockZ));
      if (!resting) {
        velocity = Math.max(-32, velocity - DROP_GRAVITY * dt);
        nextY += velocity * dt;

        const startBlockY = Math.floor(mesh.position.y - DROP_HALF_SIZE);
        const endBlockY = Math.floor(nextY - DROP_HALF_SIZE);
        for (let blockY = startBlockY; blockY >= endBlockY; blockY--) {
          if (!isSolid(worldManager.getBlock(blockX, blockY, blockZ))) continue;
          nextY = blockY + 1 + DROP_HALF_SIZE;
          velocity = 0;
          break;
        }
      }
      mesh.position.y = nextY;
      verticalVelocity.current.set(drop.id, velocity);

      if (!collectedIds.current.has(drop.id) &&
          mesh.position.distanceTo(tempPlayer.current) < 1.15) {
        collectedIds.current.add(drop.id);
        mesh.visible = false;
        onCollect(drop);
      }
    }
  });

  return (
    <group>
      {drops.map(drop => (
        <DroppedBlock
          key={drop.id}
          drop={drop}
          meshRef={mesh => {
            if (mesh) meshRefs.current.set(drop.id, mesh);
            else meshRefs.current.delete(drop.id);
          }}
        />
      ))}
    </group>
  );
}