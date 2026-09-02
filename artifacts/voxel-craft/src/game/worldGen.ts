import { createNoise2D } from 'simplex-noise';
import { BlockType, isSolid } from './blocks';
import { Biome, BIOME_DEFS, BiomeDef } from './biomes';
import { STRUCTURE_GENERATORS, StructureKey, BP } from './structures';

export const CHUNK_SIZE = 16;
export const WORLD_MIN_Y = -200;
export const WORLD_MAX_Y = 64;
export const WORLD_HEIGHT = WORLD_MAX_Y - WORLD_MIN_Y + 1;
export const SEA_LEVEL = 6;

export type ChunkData = Uint8Array;

export function getChunkKey(cx: number, cz: number): string { return `${cx},${cz}`; }
export function blockIndex(lx: number, y: number, lz: number): number {
  return lx + (y - WORLD_MIN_Y) * CHUNK_SIZE + lz * CHUNK_SIZE * WORLD_HEIGHT;
}

const terrainNoise = createNoise2D();
const terrainNoise2 = createNoise2D();
const terrainNoise3 = createNoise2D();
const biomeNoise    = createNoise2D();
const oreNoise      = createNoise2D();

function pseudoRand(seed: number): number {
  const s = Math.sin(seed * 7919.131 + 2147.483) * 43758.5453;
  return s - Math.floor(s);
}

function getBiome(wx: number, wz: number): Biome {
  const n = biomeNoise(wx * 0.003, wz * 0.003);
  return Math.min(9, Math.floor((n + 1) / 2 * 10)) as Biome;
}

function getTerrainHeightAtPoint(wx: number, wz: number, def: BiomeDef): number {
  const n1 = terrainNoise(wx * 0.012, wz * 0.012);
  const n2 = terrainNoise2(wx * 0.04, wz * 0.04) * 0.5;
  const n3 = terrainNoise3(wx * 0.09, wz * 0.09) * 0.25;
  return Math.floor(def.baseHeight + (n1 + n2 + n3) * def.heightVariation);
}

// Blend terrain height from nearby biomes to eliminate hard edges at biome boundaries
function getBlendedHeight(wx: number, wz: number): number {
  const n1 = terrainNoise(wx * 0.012, wz * 0.012);
  const n2 = terrainNoise2(wx * 0.04, wz * 0.04) * 0.5;
  const n3 = terrainNoise3(wx * 0.09, wz * 0.09) * 0.25;
  const noiseVal = n1 + n2 + n3;

  // Sample biome parameters from center + 8 surrounding points (Gaussian-like weights)
  const D = 16;
  const pts: [number, number, number][] = [
    [wx,     wz,     2.5],
    [wx-D,   wz,     1.0], [wx+D,   wz,     1.0],
    [wx,     wz-D,   1.0], [wx,     wz+D,   1.0],
    [wx-D,   wz-D,   0.5], [wx+D,   wz-D,   0.5],
    [wx-D,   wz+D,   0.5], [wx+D,   wz+D,   0.5],
  ];
  let totalW = 0, blendBase = 0, blendVar = 0;
  for (const [sx, sz, w] of pts) {
    const def = BIOME_DEFS[getBiome(sx, sz)];
    blendBase += def.baseHeight      * w;
    blendVar  += def.heightVariation * w;
    totalW    += w;
  }
  return Math.max(1, Math.floor(blendBase / totalW + noiseVal * (blendVar / totalW)));
}

// Biome structures mapping
const BIOME_STRUCTURES: Record<Biome, StructureKey[]> = {
  [Biome.PLAINS]:    ['OAK_HOUSE','VILLAGE_WELL','STONE_CIRCLE','GRAVEYARD','OUTPOST_TOWER'],
  [Biome.FOREST]:    ['OAK_HOUSE','ANCIENT_LIBRARY','MUSHROOM_HOLLOW','RUINED_TOWER'],
  [Biome.DESERT]:    ['DESERT_PYRAMID','DESERT_WELL','MESA_RUIN'],
  [Biome.OCEAN]:     ['UNDERWATER_RUIN','OCEAN_MONUMENT'],
  [Biome.TAIGA]:     ['TAIGA_CABIN','IGLOO','OUTPOST_TOWER','STONE_CIRCLE'],
  [Biome.JUNGLE]:    ['JUNGLE_TEMPLE','MUSHROOM_HOLLOW','ANCIENT_LIBRARY'],
  [Biome.SAVANNA]:   ['OAK_HOUSE','OUTPOST_TOWER','GRAVEYARD','STONE_CIRCLE'],
  [Biome.SWAMP]:     ['SWAMP_HUT','GRAVEYARD','MUSHROOM_HOLLOW'],
  [Biome.MOUNTAINS]: ['STONE_TOWER','RUINED_TOWER','MONOLITH','BEACON_SHRINE'],
  [Biome.MESA]:      ['MESA_RUIN','STONE_CIRCLE','BLACKSTONE_FORT','NETHER_SHRINE'],
};

function generateChunk(cx: number, cz: number): ChunkData {
  const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);

  // Determine the dominant biome for this chunk (center point)
  const chunkCenterX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
  const chunkCenterZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
  const chunkBiome = getBiome(chunkCenterX, chunkCenterZ);
  const def = BIOME_DEFS[chunkBiome];

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const biome = getBiome(wx, wz);
      const bd = BIOME_DEFS[biome];
      const height = getBlendedHeight(wx, wz);

      for (let y = WORLD_MIN_Y; y <= WORLD_MAX_Y; y++) {
        const idx = blockIndex(lx, y, lz);
        if (y === WORLD_MIN_Y) {
          data[idx] = BlockType.BEDROCK;
        } else if (y < height - 4) {
          // Ore generation
          const ore = oreNoise(wx * 0.25 + y * 0.7, wz * 0.25);
          if (y < 16 && ore > 0.72)       data[idx] = BlockType.COAL_ORE;
          else if (y < 30 && ore > 0.78)  data[idx] = BlockType.IRON_ORE;
          else if (y < 20 && ore > 0.82)  data[idx] = BlockType.GOLD_ORE;
          else if (y < 12 && ore > 0.86)  data[idx] = BlockType.DIAMOND_ORE;
          else if (y < 32 && ore > 0.84)  data[idx] = BlockType.COPPER_ORE;
          else if (y < 24 && ore > 0.88)  data[idx] = BlockType.EMERALD_ORE;
          else if (y < 16 && ore > 0.90)  data[idx] = BlockType.LAPIS_ORE;
          else if (y < 16 && ore > 0.92)  data[idx] = BlockType.REDSTONE_ORE;
          else if (y < 8)                 data[idx] = biome === Biome.MOUNTAINS ? BlockType.DEEPSLATE : BlockType.STONE;
          else                             data[idx] = BlockType.STONE;
        } else if (y < height) {
          data[idx] = bd.subSurfaceBlock;
        } else if (y === height) {
          if (biome === Biome.MOUNTAINS && height > 28) data[idx] = BlockType.SNOW_BLOCK;
          else if (biome === Biome.TAIGA && height > 22) data[idx] = BlockType.SNOW_BLOCK;
          else data[idx] = bd.surfaceBlock;
        } else if (y <= SEA_LEVEL) {
          data[idx] = biome === Biome.OCEAN ? BlockType.WATER : bd.seaFillBlock;
        } else {
          data[idx] = BlockType.AIR;
        }
      }

      // Tree generation
      if (bd.treeDensity > 0 && height > SEA_LEVEL && lx >= 2 && lx <= CHUNK_SIZE - 3 && lz >= 2 && lz <= CHUNK_SIZE - 3) {
        const treeRoll = pseudoRand(wx * 1234.567 + wz * 89.123);
        if (treeRoll < bd.treeDensity) {
          if (biome === Biome.DESERT) {
            // Cactus
            const cactusH = 2 + Math.floor(pseudoRand(wx + wz * 3) * 3);
            for (let ty = 1; ty <= cactusH; ty++) {
              const y = height + ty;
              if (y <= WORLD_MAX_Y) data[blockIndex(lx, y, lz)] = BlockType.CACTUS;
            }
          } else {
            const trunkH = bd.treeTrunkMin + Math.floor(pseudoRand(wx * 3 + wz) * (bd.treeTrunkMax - bd.treeTrunkMin + 1));
            // Trunk
            for (let ty = 1; ty <= trunkH; ty++) {
              const y = height + ty;
              if (y <= WORLD_MAX_Y) data[blockIndex(lx, y, lz)] = bd.treeLog;
            }
            // Leaves
            if (bd.treeLeafRadius > 0) {
              for (let ly = trunkH - 1; ly <= trunkH + 1; ly++) {
                const radius = ly <= trunkH ? bd.treeLeafRadius : Math.max(1, bd.treeLeafRadius - 1);
                for (let dx = -radius; dx <= radius; dx++) {
                  for (let dz2 = -radius; dz2 <= radius; dz2++) {
                    if (Math.abs(dx) === radius && Math.abs(dz2) === radius) continue;
                    const nlx = lx + dx; const nlz = lz + dz2;
                    const ny = height + ly;
                    if (nlx >= 0 && nlx < CHUNK_SIZE && nlz >= 0 && nlz < CHUNK_SIZE && ny <= WORLD_MAX_Y) {
                      if (data[blockIndex(nlx, ny, nlz)] === BlockType.AIR) {
                        data[blockIndex(nlx, ny, nlz)] = bd.treeLeaf;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Structure placement
  const structureRoll = pseudoRand(cx * 7919 + cz * 3571);
  if (structureRoll > 0.90) {
    const options = BIOME_STRUCTURES[chunkBiome];
    const sIdx = Math.floor(pseudoRand(cx * 13 + cz * 17) * options.length);
    const structureKey = options[sIdx];
    const generator = STRUCTURE_GENERATORS[structureKey];

    // Base position at chunk center surface
    const sCx = cx * CHUNK_SIZE + 4;
    const sCz = cz * CHUNK_SIZE + 4;
    // Find height at that point
    const sBiome = getBiome(sCx, sCz);
    const sDef = BIOME_DEFS[sBiome];
    const sH = getTerrainHeightAtPoint(sCx, sCz, sDef);

    // For dungeon: place underground
    const baseY = structureKey === 'DUNGEON' ? Math.max(5, sH - 8) : structureKey === 'UNDERWATER_RUIN' || structureKey === 'OCEAN_MONUMENT' ? Math.max(1, sH - 2) : sH;

    const placements: BP[] = generator(sCx, baseY, sCz);
    placements.forEach(([wx, wy, wz, type]) => {
      const lx = wx - cx * CHUNK_SIZE;
      const lz = wz - cz * CHUNK_SIZE;
      if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) return;
      if (wy < WORLD_MIN_Y || wy > WORLD_MAX_Y) return;
      data[blockIndex(lx, wy, lz)] = type;
    });
  }

  return data;
}

class WorldManager {
  chunks = new Map<string, ChunkData>();
  dirtyChunks = new Set<string>();

  getOrGenerateChunk(cx: number, cz: number): ChunkData {
    const key = getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) { chunk = generateChunk(cx, cz); this.chunks.set(key, chunk); }
    return chunk;
  }

  getBlock(x: number, y: number, z: number): BlockType {
    if (y < WORLD_MIN_Y) return BlockType.BEDROCK;
    if (y > WORLD_MAX_Y) return BlockType.AIR;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getOrGenerateChunk(cx, cz);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk[blockIndex(lx, y, lz)];
  }

  setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (y < WORLD_MIN_Y || y > WORLD_MAX_Y) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getOrGenerateChunk(cx, cz);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk[blockIndex(lx, y, lz)] = type;
    this.dirtyChunks.add(getChunkKey(cx, cz));
    if (lx === 0) this.dirtyChunks.add(getChunkKey(cx-1, cz));
    if (lx === CHUNK_SIZE-1) this.dirtyChunks.add(getChunkKey(cx+1, cz));
    if (lz === 0) this.dirtyChunks.add(getChunkKey(cx, cz-1));
    if (lz === CHUNK_SIZE-1) this.dirtyChunks.add(getChunkKey(cx, cz+1));
  }

  getTerrainHeight(x: number, z: number): number {
    for (let y = WORLD_MAX_Y; y >= WORLD_MIN_Y; y--) {
      if (isSolid(this.getBlock(x, y, z))) return y;
    }
    return 0;
  }
}

export const worldManager = new WorldManager();
