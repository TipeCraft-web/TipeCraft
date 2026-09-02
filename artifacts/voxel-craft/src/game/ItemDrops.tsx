import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BlockType } from './blocks';
import { getBlockDropTextures } from './textures';

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
  const collectedIds = useRef(new Set<number>());
  const tempPlayer = useRef(new THREE.Vector3());

  useEffect(() => {
    const activeIds = new Set(drops.map(drop => drop.id));
    for (const id of collectedIds.current) {
      if (!activeIds.has(id)) collectedIds.current.delete(id);
    }
  }, [drops]);

  useFrame(({ clock }, delta) => {
    tempPlayer.current.copy(playerPosRef.current);
    for (const drop of drops) {
      const mesh = meshRefs.current.get(drop.id);
      if (!mesh) continue;

      mesh.rotation.y += delta * 2.4;
      mesh.position.y = drop.position.y + 0.28 + Math.sin(clock.elapsedTime * 3 + drop.id) * 0.06;

      if (!collectedIds.current.has(drop.id) &&
          mesh.position.distanceTo(tempPlayer.current) < 1.15) {
        collectedIds.current.add(drop.id);
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