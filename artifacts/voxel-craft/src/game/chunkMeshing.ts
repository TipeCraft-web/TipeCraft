import { BlockType, isSolid, isTransparent } from './blocks';
import {
  blockIndex,
  CHUNK_SIZE,
  DEFAULT_CHUNK_RENDER_MIN_Y,
  worldManager,
  WORLD_MAX_Y,
  WORLD_MIN_Y,
  type ChunkData,
} from './worldGen';

export interface ChunkGeometryBuffers {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export interface ChunkGeometryData {
  opaque: ChunkGeometryBuffers | null;
  transparent: ChunkGeometryBuffers | null;
}

const FACES: {
  dir: [number, number, number];
  corners: [number, number, number][];
  light: number;
}[] = [
  { dir: [0, 1, 0], corners: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], light: 1.0 },
  { dir: [0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], light: 0.78 },
  { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], light: 0.90 },
  { dir: [-1,0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], light: 0.90 },
  { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], light: 0.84 },
  { dir: [0, 0,-1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], light: 0.84 },
];

function blockUv(block: number, faceIndex: number): [number, number, number, number] {
  const variant = faceIndex === 0 ? 0 : faceIndex === 1 ? 2 : 1;
  const col = (block % 16) * 3 + variant;
  const row = Math.floor(block / 16);
  return [col / 48, 1 - (row + 1) / 16, 1 / 48, 1 / 16];
}

function makeBuffers(
  positions: number[],
  normals: number[],
  colors: number[],
  uvs: number[],
  indices: number[],
): ChunkGeometryBuffers | null {
  if (positions.length === 0) return null;
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  };
}

export function buildChunkGeometryData(
  cx: number,
  cz: number,
  data: ChunkData,
  renderMinY = worldManager.getChunkRenderMinY(cx, cz) ?? DEFAULT_CHUNK_RENDER_MIN_Y,
): ChunkGeometryData {
  const opaquePositions: number[] = [];
  const opaqueNormals: number[] = [];
  const opaqueColors: number[] = [];
  const opaqueUvs: number[] = [];
  const opaqueIndices: number[] = [];
  const transparentPositions: number[] = [];
  const transparentNormals: number[] = [];
  const transparentColors: number[] = [];
  const transparentUvs: number[] = [];
  const transparentIndices: number[] = [];
  let opaqueVertex = 0;
  let transparentVertex = 0;
  const originX = cx * CHUNK_SIZE;
  const originZ = cz * CHUNK_SIZE;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    const wx = originX + lx;
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wz = originZ + lz;
      for (let y = renderMinY; y <= WORLD_MAX_Y; y++) {
        const block = data[blockIndex(lx, y, lz)] as BlockType;
        if (block === BlockType.AIR) continue;

        const transparent = isTransparent(block);
        for (let faceIndex = 0; faceIndex < FACES.length; faceIndex++) {
          const face = FACES[faceIndex];
          const [dx, dy, dz] = face.dir;
          let neighbor: BlockType;
          const ny = y + dy;

          if (ny < WORLD_MIN_Y) neighbor = BlockType.BEDROCK;
          else if (ny > WORLD_MAX_Y) neighbor = BlockType.AIR;
          else {
            const nx = lx + dx;
            const nz = lz + dz;
            neighbor = nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE
              ? data[blockIndex(nx, ny, nz)] as BlockType
              : worldManager.getBlock(wx + dx, ny, wz + dz);
          }

          const showFace = transparent
            ? neighbor === BlockType.AIR || (isSolid(neighbor) && neighbor !== block)
            : isTransparent(neighbor);
          if (!showFace) continue;

          const [u, v, width, height] = blockUv(block, faceIndex);
          const uvCorners = faceIndex === 2 || faceIndex === 3 ? [
            u, v, u, v + height, u + width, v + height, u + width, v,
          ] : faceIndex === 4 || faceIndex === 5 ? [
            u, v, u + width, v, u + width, v + height, u, v + height,
          ] : [
            u, v, u, v + height, u + width, v + height, u + width, v,
          ];
          const positions = transparent ? transparentPositions : opaquePositions;
          const normals = transparent ? transparentNormals : opaqueNormals;
          const colors = transparent ? transparentColors : opaqueColors;
          const uvs = transparent ? transparentUvs : opaqueUvs;
          const indices = transparent ? transparentIndices : opaqueIndices;
          const vertex = transparent ? transparentVertex : opaqueVertex;
          const [normalX, normalY, normalZ] = face.dir;

          for (const [vx, vy, vz] of face.corners) {
            positions.push(wx + vx, y + vy, wz + vz);
            normals.push(normalX, normalY, normalZ);
            colors.push(face.light, face.light, face.light);
          }
          uvs.push(...uvCorners);
          indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
          if (transparent) transparentVertex += 4;
          else opaqueVertex += 4;
        }
      }
    }
  }

  return {
    opaque: makeBuffers(opaquePositions, opaqueNormals, opaqueColors, opaqueUvs, opaqueIndices),
    transparent: makeBuffers(transparentPositions, transparentNormals, transparentColors, transparentUvs, transparentIndices),
  };
}
