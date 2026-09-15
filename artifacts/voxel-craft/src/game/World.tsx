import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldManager, CHUNK_SIZE, WORLD_MAX_Y, getChunkKey } from './worldGen';
import { BlockType, isSolid, isTransparent } from './blocks';
import { getAtlas, blockUV } from './textures';

const MAX_CHUNKS_PER_FRAME = 1;

export interface BreakingState {
  active: boolean;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  progress: number;
}

const CRACK_PATHS: { stage: number; points: [number, number][] }[] = [
  { stage: 0, points: [[0.50, 0.98], [0.48, 0.78], [0.56, 0.63], [0.50, 0.48], [0.58, 0.31], [0.54, 0.08]] },
  { stage: 1, points: [[0.50, 0.48], [0.36, 0.42], [0.24, 0.47], [0.09, 0.42]] },
  { stage: 2, points: [[0.56, 0.63], [0.68, 0.56], [0.76, 0.44], [0.94, 0.39]] },
  { stage: 3, points: [[0.48, 0.78], [0.35, 0.68], [0.22, 0.70], [0.08, 0.62]] },
  { stage: 4, points: [[0.50, 0.48], [0.61, 0.38], [0.67, 0.23], [0.82, 0.13]] },
  { stage: 5, points: [[0.36, 0.42], [0.31, 0.28], [0.19, 0.20], [0.10, 0.08]] },
  { stage: 6, points: [[0.68, 0.56], [0.79, 0.67], [0.91, 0.72], [0.98, 0.88]] },
  { stage: 7, points: [[0.35, 0.68], [0.45, 0.84], [0.42, 0.96]] },
  { stage: 8, points: [[0.61, 0.38], [0.52, 0.28], [0.42, 0.25], [0.30, 0.10]] },
  { stage: 9, points: [[0.24, 0.47], [0.31, 0.56], [0.43, 0.58], [0.54, 0.50]] },
];

function createCrackTexture(stage: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(12, 12, 12, 0.95)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  for (const path of CRACK_PATHS) {
    if (path.stage > stage) continue;
    ctx.beginPath();
    path.points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x * 64, y * 64);
      else ctx.lineTo(x * 64, y * 64);
    });
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const FACES: { dir: [number,number,number]; corners: [number,number,number][]; light: number }[] = [
  { dir: [0, 1, 0],  corners: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], light: 1.0 },
  { dir: [0,-1, 0],  corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], light: 0.78 },
  { dir: [1, 0, 0],  corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], light: 0.90 },
  { dir: [-1,0, 0],  corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], light: 0.90 },
  { dir: [0, 0, 1],  corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], light: 0.84 },
  { dir: [0, 0,-1],  corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], light: 0.84 },
];

function buildChunkGeometry(cx: number, cz: number): {
  opaque: THREE.BufferGeometry | null;
  transparent: THREE.BufferGeometry | null;
} {
  const oPos: number[] = [], oNorm: number[] = [], oColor: number[] = [], oUV: number[] = [], oIdx: number[] = [];
  const tPos: number[] = [], tNorm: number[] = [], tColor: number[] = [], tUV: number[] = [], tIdx: number[] = [];
  let oV = 0, tV = 0;

  const ox = cx * CHUNK_SIZE;
  const oz = cz * CHUNK_SIZE;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const minY = worldManager.getChunkRenderMinY(cx, cz);
      for (let y = minY; y <= WORLD_MAX_Y; y++) {
        const wx = ox + lx;
        const wz = oz + lz;
        const block = worldManager.getBlock(wx, y, wz);
        if (block === BlockType.AIR) continue;

        const transparent = isTransparent(block);

        for (let fi = 0; fi < 6; fi++) {
          const face = FACES[fi];
          const [dx, dy, dz] = face.dir;
          const neighbor = worldManager.getBlock(wx + dx, y + dy, wz + dz);

          let show = false;
          if (!transparent) show = isTransparent(neighbor);
          else show = neighbor === BlockType.AIR || (isSolid(neighbor) && neighbor !== block);
          if (!show) continue;

          const lit = face.light;
          const [nx, ny, nz] = face.dir;
          const [u, v, uw, vh] = blockUV(block as number, fi);

          // Keep the grass cap horizontal at the top of every side face.
          // The z-facing faces use a different corner winding than the
          // x-facing faces, so they need their own UV order.
          const uvCorners = fi === 2 || fi === 3 ? [
            u,      v,
            u,      v + vh,
            u + uw, v + vh,
            u + uw, v,
          ] : fi === 4 || fi === 5 ? [
            u,      v,
            u + uw, v,
            u + uw, v + vh,
            u,      v + vh,
          ] : [
            u,      v,
            u,      v + vh,
            u + uw, v + vh,
            u + uw, v,
          ];

          if (!transparent) {
            for (const [vx, vy, vz] of face.corners) {
              oPos.push(wx + vx, y + vy, wz + vz);
              oNorm.push(nx, ny, nz);
              oColor.push(lit, lit, lit);
            }
            oUV.push(...uvCorners);
            oIdx.push(oV, oV+1, oV+2, oV, oV+2, oV+3);
            oV += 4;
          } else {
            for (const [vx, vy, vz] of face.corners) {
              tPos.push(wx + vx, y + vy, wz + vz);
              tNorm.push(nx, ny, nz);
              tColor.push(lit, lit, lit);
            }
            tUV.push(...uvCorners);
            tIdx.push(tV, tV+1, tV+2, tV, tV+2, tV+3);
            tV += 4;
          }
        }
      }
    }
  }

  function makeGeo(
    pos: number[], norm: number[], color: number[], uv: number[], idx: number[]
  ): THREE.BufferGeometry | null {
    if (pos.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(norm, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(color, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    return geo;
  }

  return {
    opaque:      makeGeo(oPos, oNorm, oColor, oUV, oIdx),
    transparent: makeGeo(tPos, tNorm, tColor, tUV, tIdx),
  };
}

interface ChunkEntry { opaque: THREE.Mesh | null; transparent: THREE.Mesh | null }

interface WorldProps {
  playerChunkRef: React.MutableRefObject<{ x: number; z: number }>;
  viewDistance: number;
  breakingRef: React.MutableRefObject<BreakingState>;
}

export default function World({ playerChunkRef, viewDistance, breakingRef }: WorldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const chunkMap = useRef<Map<string, ChunkEntry>>(new Map());
  const crackMeshRef = useRef<THREE.Mesh>(null);
  const crackMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const crackTextures = useMemo(
    () => Array.from({ length: 10 }, (_, stage) => createCrackTexture(stage)),
    [],
  );
  const crackGeometry = useMemo(() => new THREE.PlaneGeometry(1.002, 1.002), []);
  const crackNormal = useMemo(() => new THREE.Vector3(), []);
  const crackPosition = useMemo(() => new THREE.Vector3(), []);
  const crackQuaternion = useMemo(() => new THREE.Quaternion(), []);

  const atlas = getAtlas();

  const opaqueMat = useRef(new THREE.MeshLambertMaterial({
    vertexColors: true,
    map: atlas,
  }));
  const transparentMat = useRef(new THREE.MeshLambertMaterial({
    vertexColors: true,
    map: atlas,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  }));

  function addChunk(cx: number, cz: number) {
    if (!groupRef.current) return;
    const key = getChunkKey(cx, cz);
    const { opaque, transparent } = buildChunkGeometry(cx, cz);
    const entry: ChunkEntry = { opaque: null, transparent: null };
    if (opaque) {
      const m = new THREE.Mesh(opaque, opaqueMat.current);
      m.receiveShadow = true;
      groupRef.current.add(m);
      entry.opaque = m;
    }
    if (transparent) {
      const m = new THREE.Mesh(transparent, transparentMat.current);
      groupRef.current.add(m);
      entry.transparent = m;
    }
    chunkMap.current.set(key, entry);
  }

  function removeChunk(key: string) {
    const entry = chunkMap.current.get(key);
    if (!entry || !groupRef.current) return;
    if (entry.opaque)      { groupRef.current.remove(entry.opaque);      entry.opaque.geometry.dispose(); }
    if (entry.transparent) { groupRef.current.remove(entry.transparent); entry.transparent.geometry.dispose(); }
    chunkMap.current.delete(key);
  }

  useFrame(() => {
    if (!groupRef.current) return;
    const { x: pcx, z: pcz } = playerChunkRef.current;
    const breaking = breakingRef.current;
    const crackMesh = crackMeshRef.current;
    const crackMaterial = crackMaterialRef.current;

    if (crackMesh && crackMaterial) {
      if (!breaking.active) {
        crackMesh.visible = false;
      } else {
        crackNormal.set(breaking.nx, breaking.ny, breaking.nz);
        crackPosition.set(breaking.x + 0.5, breaking.y + 0.5, breaking.z + 0.5)
          .addScaledVector(crackNormal, 0.507);
        crackMesh.position.copy(crackPosition);
        crackQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), crackNormal);
        crackMesh.quaternion.copy(crackQuaternion);
        crackMesh.visible = true;

        const stage = Math.min(9, Math.floor(breaking.progress * 10));
        if (crackMaterial.map !== crackTextures[stage]) {
          crackMaterial.map = crackTextures[stage];
          crackMaterial.needsUpdate = true;
        }
      }
    }

    for (const key of worldManager.dirtyChunks) {
      const [cxStr, czStr] = key.split(',');
      removeChunk(key);
      addChunk(parseInt(cxStr), parseInt(czStr));
    }
    worldManager.dirtyChunks.clear();

    let built = 0;
    for (let dx = -viewDistance; dx <= viewDistance && built < MAX_CHUNKS_PER_FRAME; dx++) {
      for (let dz = -viewDistance; dz <= viewDistance && built < MAX_CHUNKS_PER_FRAME; dz++) {
        const cx = pcx + dx, cz = pcz + dz;
        const key = getChunkKey(cx, cz);
        if (!chunkMap.current.has(key)) { addChunk(cx, cz); built++; }
      }
    }

    for (const key of Array.from(chunkMap.current.keys())) {
      const [cxStr, czStr] = key.split(',');
      const cx = parseInt(cxStr), cz = parseInt(czStr);
      if (Math.abs(cx - pcx) > viewDistance + 1 || Math.abs(cz - pcz) > viewDistance + 1) {
        removeChunk(key);
      }
    }
  });

  useEffect(() => {
    return () => {
      opaqueMat.current.dispose();
      transparentMat.current.dispose();
      crackGeometry.dispose();
      crackMaterialRef.current?.dispose();
      crackTextures.forEach(texture => texture.dispose());
    };
  }, [crackGeometry, crackTextures]);

  return (
    <>
      <group ref={groupRef} />
      <mesh
        ref={crackMeshRef}
        visible={false}
        renderOrder={1000}
        geometry={crackGeometry}
      >
        <meshBasicMaterial
          ref={crackMaterialRef}
          transparent
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
          opacity={0.95}
        />
      </mesh>
    </>
  );
}
