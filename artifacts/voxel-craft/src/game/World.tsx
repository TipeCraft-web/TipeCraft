import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldManager, CHUNK_SIZE, WORLD_HEIGHT, getChunkKey } from './worldGen';
import { BlockType, isSolid, isTransparent } from './blocks';
import { getAtlas, blockUV } from './textures';

const VIEW_DISTANCE = 4;
const MAX_CHUNKS_PER_FRAME = 2;

const FACES: { dir: [number,number,number]; corners: [number,number,number][]; light: number }[] = [
  { dir: [0, 1, 0],  corners: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], light: 1.0 },
  { dir: [0,-1, 0],  corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], light: 0.6 },
  { dir: [1, 0, 0],  corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], light: 0.8 },
  { dir: [-1,0, 0],  corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], light: 0.8 },
  { dir: [0, 0, 1],  corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], light: 0.7 },
  { dir: [0, 0,-1],  corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], light: 0.7 },
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
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const wx = ox + lx;
        const wz = oz + lz;
        const block = worldManager.getBlock(wx, y, wz);
        if (block === BlockType.AIR) continue;

        const transparent = isTransparent(block);
        const [u, v, uw, vh] = blockUV(block as number);

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

          // UV corners: V0→(u,v), V1→(u,v+vh), V2→(u+uw,v+vh), V3→(u+uw,v)
          const uvCorners = [
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
}

export default function World({ playerChunkRef }: WorldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const chunkMap = useRef<Map<string, ChunkEntry>>(new Map());

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

    for (const key of worldManager.dirtyChunks) {
      const [cxStr, czStr] = key.split(',');
      removeChunk(key);
      addChunk(parseInt(cxStr), parseInt(czStr));
    }
    worldManager.dirtyChunks.clear();

    let built = 0;
    for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE && built < MAX_CHUNKS_PER_FRAME; dx++) {
      for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE && built < MAX_CHUNKS_PER_FRAME; dz++) {
        const cx = pcx + dx, cz = pcz + dz;
        const key = getChunkKey(cx, cz);
        if (!chunkMap.current.has(key)) { addChunk(cx, cz); built++; }
      }
    }

    for (const key of Array.from(chunkMap.current.keys())) {
      const [cxStr, czStr] = key.split(',');
      const cx = parseInt(cxStr), cz = parseInt(czStr);
      if (Math.abs(cx - pcx) > VIEW_DISTANCE + 1 || Math.abs(cz - pcz) > VIEW_DISTANCE + 1) {
        removeChunk(key);
      }
    }
  });

  useEffect(() => {
    return () => {
      opaqueMat.current.dispose();
      transparentMat.current.dispose();
    };
  }, []);

  return <group ref={groupRef} />;
}
