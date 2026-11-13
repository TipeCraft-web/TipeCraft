import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PlayerAvatar from './PlayerAvatar';

export interface RemotePlayerSnapshot {
  playerId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export default function RemotePlayerAvatar({ player }: { player: RemotePlayerSnapshot }) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector3(player.x, player.y, player.z));
  const targetYaw = useRef(player.yaw);
  const initialized = useRef(false);
  const initialPosition = useMemo(
    () => [player.x, player.y, player.z] as [number, number, number],
    [],
  );

  target.current.set(player.x, player.y, player.z);
  targetYaw.current = player.yaw;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (!initialized.current) {
      group.position.copy(target.current);
      group.rotation.y = targetYaw.current;
      initialized.current = true;
      return;
    }

    const blend = 1 - Math.exp(-delta * 14);
    group.position.lerp(target.current, blend);
    const yawDelta = Math.atan2(
      Math.sin(targetYaw.current - group.rotation.y),
      Math.cos(targetYaw.current - group.rotation.y),
    );
    group.rotation.y += yawDelta * blend;
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      <PlayerAvatar visible />
    </group>
  );
}
