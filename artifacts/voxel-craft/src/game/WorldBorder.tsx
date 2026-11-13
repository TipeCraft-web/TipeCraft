import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_BORDER_LIMIT } from './worldGen';

interface Props {
  enabled: boolean;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
}

const BORDER_SEGMENT_LENGTH = 1_536;
const BORDER_HEIGHT = 512;

export default function WorldBorderVisual({ enabled, playerPosRef }: Props) {
  const meshesRef = useRef<Array<THREE.Mesh | null>>([null, null, null, null]);
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(BORDER_SEGMENT_LENGTH, BORDER_HEIGHT),
    [],
  );
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#087cff',
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), []);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    material.opacity = 0.12 + (Math.sin(clock.elapsedTime * 1.8) + 1) * 0.025;
    const player = playerPosRef.current;
    const positions: [number, number, number, number, boolean][] = [
      [WORLD_BORDER_LIMIT, 0, player.z, Math.PI / 2, Math.abs(WORLD_BORDER_LIMIT - player.x) <= camera.far + 24],
      [-WORLD_BORDER_LIMIT, 0, player.z, Math.PI / 2, Math.abs(-WORLD_BORDER_LIMIT - player.x) <= camera.far + 24],
      [player.x, 0, WORLD_BORDER_LIMIT, 0, Math.abs(WORLD_BORDER_LIMIT - player.z) <= camera.far + 24],
      [player.x, 0, -WORLD_BORDER_LIMIT, 0, Math.abs(-WORLD_BORDER_LIMIT - player.z) <= camera.far + 24],
    ];

    for (let i = 0; i < meshesRef.current.length; i++) {
      const mesh = meshesRef.current[i];
      if (!mesh) continue;
      const [x, y, z, rotationY, near] = positions[i];
      mesh.visible = enabled && near;
      mesh.position.set(x, y, z);
      mesh.rotation.set(0, rotationY, 0);
    }
  });

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  return (
    <>
      {meshesRef.current.map((_, index) => (
        <mesh
          key={index}
          ref={mesh => { meshesRef.current[index] = mesh; }}
          geometry={geometry}
          material={material}
          visible={false}
          renderOrder={2}
        />
      ))}
    </>
  );
}
