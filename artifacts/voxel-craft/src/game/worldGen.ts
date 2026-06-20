import { createNoise2D } from 'simplex-noise';
import { BlockType, isSolid } from './blocks';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 64;
export const SEA_LEVEL = 5;

export type ChunkData = Uint8Array;

export function getChunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function blockIndex(lx: number, y: number, lz: number): number {
  return lx + y * CHUNK_SIZE + lz * CHUNK_SIZE * WORLD_HEIGHT;
}

const noise2DA = createNoise2D();
const noise2DB = createNoise2D();
const noise2DC = createNoise2D();

function getTerrainHeight(wx: number, wz: number): number {
  const n1 = noise2DA(wx * 0.012, wz * 0.012) * 10;
  const n2 = noise2DB(wx * 0.04, wz * 0.04) * 5;
  const n3 = noise2DC(wx * 0.08, wz * 0.08) * 2;
  return Math.floor(12 + n1 + n2 + n3);
}

// Deterministic pseudo-random based on position
function pseudoRand(seed: number): number {
  const s = Math.sin(seed * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function generateChunk(cx: number, cz: number): ChunkData {
  const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const height = getTerrainHeight(wx, wz);

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const idx = blockIndex(lx, y, lz);
        if (y === 0) {
          data[idx] = BlockType.BEDROCK;
        } else if (y < height - 3) {
          const ore = pseudoRand(wx * 31 + y * 97 + wz * 13);
          if (ore < 0.06 && y < 20) data[idx] = BlockType.COAL_ORE;
          else if (ore < 0.04 && y < 35) data[idx] = BlockType.IRON_ORE;
          else data[idx] = BlockType.STONE;
        } else if (y < height) {
          data[idx] = BlockType.DIRT;
        } else if (y === height) {
          data[idx] = y <= SEA_LEVEL + 1 ? BlockType.SAND : BlockType.GRASS;
        } else if (y <= SEA_LEVEL) {
          data[idx] = BlockType.WATER;
        } else {
          data[idx] = BlockType.AIR;
        }
      }

      // Trees
      if (height > SEA_LEVEL + 2 && lx >= 2 && lx <= CHUNK_SIZE - 3 && lz >= 2 && lz <= CHUNK_SIZE - 3) {
        const treeSeed = pseudoRand(wx * 1234.567 + wz * 89.123);
        if (treeSeed < 0.04) {
          const trunkH = 4 + Math.floor(pseudoRand(wx + wz * 7) * 2);
          for (let ty = 1; ty <= trunkH; ty++) {
            if (height + ty < WORLD_HEIGHT) {
              data[blockIndex(lx, height + ty, lz)] = BlockType.WOOD;
            }
          }
          // Leaves
          for (let ly = trunkH - 1; ly <= trunkH + 1; ly++) {
            const radius = ly <= trunkH ? 2 : 1;
            for (let dx = -radius; dx <= radius; dx++) {
              for (let dz2 = -radius; dz2 <= radius; dz2++) {
                if (Math.abs(dx) === radius && Math.abs(dz2) === radius) continue;
                const nlx = lx + dx;
                const nlz = lz + dz2;
                const ny = height + ly;
                if (nlx >= 0 && nlx < CHUNK_SIZE && nlz >= 0 && nlz < CHUNK_SIZE && ny < WORLD_HEIGHT) {
                  const nidx = blockIndex(nlx, ny, nlz);
                  if (data[nidx] === BlockType.AIR) data[nidx] = BlockType.LEAF;
                }
              }
            }
          }
        }
      }
    }
  }

  return data;
}

class WorldManager {
  chunks = new Map<string, ChunkData>();
  dirtyChunks = new Set<string>();

  getOrGenerateChunk(cx: number, cz: number): ChunkData {
    const key = getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = generateChunk(cx, cz);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  getBlock(x: number, y: number, z: number): BlockType {
    if (y < 0) return BlockType.BEDROCK;
    if (y >= WORLD_HEIGHT) return BlockType.AIR;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getOrGenerateChunk(cx, cz);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk[blockIndex(lx, y, lz)];
  }

  setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getOrGenerateChunk(cx, cz);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk[blockIndex(lx, y, lz)] = type;
    const key = getChunkKey(cx, cz);
    this.dirtyChunks.add(key);
    if (lx === 0) this.dirtyChunks.add(getChunkKey(cx - 1, cz));
    if (lx === CHUNK_SIZE - 1) this.dirtyChunks.add(getChunkKey(cx + 1, cz));
    if (lz === 0) this.dirtyChunks.add(getChunkKey(cx, cz - 1));
    if (lz === CHUNK_SIZE - 1) this.dirtyChunks.add(getChunkKey(cx, cz + 1));
  }

  getTerrainHeight(x: number, z: number): number {
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
      if (isSolid(this.getBlock(x, y, z))) return y;
    }
    return 0;
  }
}

export const worldManager = new WorldManager();
