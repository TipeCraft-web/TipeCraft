import type { MutableRefObject } from 'react';
import * as THREE from 'three';

interface Props {
  groupRef?: MutableRefObject<THREE.Group | null>;
  visible?: boolean;
}

const skin = '#c28c65';
const hair = '#3e2b18';
const shirt = '#2f7d3b';
const shirtLight = '#4d9a4f';
const pants = '#315a32';
const boots = '#4a3928';
const eyeWhite = '#e7e8df';
const eyeBlue = '#6eb4d6';
const pupil = '#34251c';

function Cube({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

export default function PlayerAvatar({ groupRef, visible = false }: Props) {
  return (
    <group ref={groupRef} visible={visible}>
      {/* Green outfit, blocky boots and articulated-looking limbs */}
      <Cube position={[-0.14, 0.42, 0]} size={[0.25, 0.78, 0.28]} color={pants} />
      <Cube position={[0.14, 0.42, 0]} size={[0.25, 0.78, 0.28]} color="#3c7040" />
      <Cube position={[-0.14, 0.08, -0.025]} size={[0.26, 0.16, 0.34]} color={boots} />
      <Cube position={[0.14, 0.08, -0.025]} size={[0.26, 0.16, 0.34]} color="#59432b" />

      <Cube position={[0, 1.08, 0]} size={[0.5, 0.62, 0.3]} color={shirt} />
      <Cube position={[0, 1.14, -0.154]} size={[0.28, 0.38, 0.012]} color={shirtLight} />
      <Cube position={[-0.34, 1.05, 0]} size={[0.2, 0.62, 0.28]} color={skin} />
      <Cube position={[0.34, 1.05, 0]} size={[0.2, 0.62, 0.28]} color={skin} />
      <Cube position={[-0.34, 0.76, 0]} size={[0.21, 0.13, 0.29]} color={shirt} />
      <Cube position={[0.34, 0.76, 0]} size={[0.21, 0.13, 0.29]} color="#286b35" />

      {/* Pixel-styled head facing forward (-Z), with a green adventurer's look */}
      <Cube position={[0, 1.59, 0]} size={[0.48, 0.48, 0.44]} color={skin} />
      <Cube position={[0, 1.83, 0.01]} size={[0.5, 0.08, 0.46]} color={hair} />
      <Cube position={[-0.225, 1.69, 0.085]} size={[0.05, 0.24, 0.32]} color={hair} />
      <Cube position={[0.225, 1.69, 0.085]} size={[0.05, 0.24, 0.32]} color={hair} />
      <Cube position={[-0.12, 1.64, -0.224]} size={[0.09, 0.07, 0.012]} color={eyeWhite} />
      <Cube position={[0.12, 1.64, -0.224]} size={[0.09, 0.07, 0.012]} color={eyeWhite} />
      <Cube position={[-0.105, 1.64, -0.233]} size={[0.04, 0.06, 0.01]} color={eyeBlue} />
      <Cube position={[0.135, 1.64, -0.233]} size={[0.04, 0.06, 0.01]} color={eyeBlue} />
      <Cube position={[-0.105, 1.64, -0.24]} size={[0.02, 0.045, 0.008]} color={pupil} />
      <Cube position={[0.135, 1.64, -0.24]} size={[0.02, 0.045, 0.008]} color={pupil} />
      <Cube position={[0, 1.55, -0.24]} size={[0.08, 0.1, 0.06]} color="#aa7655" />
      <Cube position={[0, 1.475, -0.224]} size={[0.12, 0.025, 0.012]} color="#754b3b" />
    </group>
  );
}
