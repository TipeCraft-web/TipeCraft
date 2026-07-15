import { BlockType } from './blocks';

export enum Biome {
  PLAINS = 0,
  FOREST = 1,
  DESERT = 2,
  OCEAN = 3,
  TAIGA = 4,
  JUNGLE = 5,
  SAVANNA = 6,
  SWAMP = 7,
  MOUNTAINS = 8,
  MESA = 9,
}

export interface BiomeDef {
  name: string;
  baseHeight: number;
  heightVariation: number;
  surfaceBlock: BlockType;
  subSurfaceBlock: BlockType;
  underBlock: BlockType;
  seaFillBlock: BlockType;
  treeDensity: number;
  treeLog: BlockType;
  treeLeaf: BlockType;
  treeTrunkMin: number;
  treeTrunkMax: number;
  treeLeafRadius: number;
  snowCap: boolean;
  sandDesert: boolean;
  color: string;
}

export const BIOME_DEFS: Record<Biome, BiomeDef> = {
  [Biome.PLAINS]: {
    name: 'Plains', baseHeight: 12, heightVariation: 4,
    surfaceBlock: BlockType.GRASS, subSurfaceBlock: BlockType.DIRT, underBlock: BlockType.STONE,
    seaFillBlock: BlockType.WATER, treeDensity: 0.01, treeLog: BlockType.OAK_LOG,
    treeLeaf: BlockType.LEAF, treeTrunkMin: 4, treeTrunkMax: 5, treeLeafRadius: 2,
    snowCap: false, sandDesert: false, color: '#567D46',
  },
  [Biome.FOREST]: {
    name: 'Forest', baseHeight: 13, heightVariation: 6,
    surfaceBlock: BlockType.GRASS, subSurfaceBlock: BlockType.DIRT, underBlock: BlockType.STONE,
    seaFillBlock: BlockType.WATER, treeDensity: 0.10, treeLog: BlockType.OAK_LOG,
    treeLeaf: BlockType.LEAF, treeTrunkMin: 5, treeTrunkMax: 8, treeLeafRadius: 2,
    snowCap: false, sandDesert: false, color: '#2D6B3D',
  },
  [Biome.DESERT]: {
    name: 'Desert', baseHeight: 10, heightVariation: 3,
    surfaceBlock: BlockType.SAND, subSurfaceBlock: BlockType.SAND, underBlock: BlockType.SANDSTONE,
    seaFillBlock: BlockType.WATER, treeDensity: 0.005, treeLog: BlockType.CACTUS,
    treeLeaf: BlockType.CACTUS, treeTrunkMin: 2, treeTrunkMax: 4, treeLeafRadius: 0,
    snowCap: false, sandDesert: true, color: '#F4D04E',
  },
  [Biome.OCEAN]: {
    name: 'Ocean', baseHeight: 2, heightVariation: 3,
    surfaceBlock: BlockType.GRAVEL, subSurfaceBlock: BlockType.GRAVEL, underBlock: BlockType.STONE,
    seaFillBlock: BlockType.WATER, treeDensity: 0, treeLog: BlockType.STONE,
    treeLeaf: BlockType.STONE, treeTrunkMin: 0, treeTrunkMax: 0, treeLeafRadius: 0,
    snowCap: false, sandDesert: false, color: '#4169E1',
  },
  [Biome.TAIGA]: {
    name: 'Taiga', baseHeight: 13, heightVariation: 5,
    surfaceBlock: BlockType.PODZOL, subSurfaceBlock: BlockType.DIRT, underBlock: BlockType.STONE,
    seaFillBlock: BlockType.WATER, treeDensity: 0.07, treeLog: BlockType.SPRUCE_LOG,
    treeLeaf: BlockType.SPRUCE_LEAF, treeTrunkMin: 6, treeTrunkMax: 10, treeLeafRadius: 2,
    snowCap: true, sandDesert: false, color: '#3A6630',
  },
  [Biome.JUNGLE]: {
    name: 'Jungle', baseHeight: 14, heightVariation: 7,
    surfaceBlock: BlockType.GRASS, subSurfaceBlock: BlockType.DIRT, underBlock: BlockType.STONE,
    seaFillBlock: BlockType.WATER, treeDensity: 0.15, treeLog: BlockType.JUNGLE_LOG,
    treeLeaf: BlockType.JUNGLE_LEAF, treeTrunkMin: 8, treeTrunkMax: 14, treeLeafRadius: 3,
    snowCap: false, sandDesert: false, color: '#1B8B12',
  },
  [Biome.SAVANNA]: {
    name: 'Savanna', baseHeight: 11, heightVariation: 3,
    surfaceBlock: BlockType.COARSE_DIRT, subSurfaceBlock: BlockType.DIRT, underBlock: BlockType.STONE,
    seaFillBlock: BlockType.WATER, treeDensity: 0.02, treeLog: BlockType.ACACIA_LOG,
    treeLeaf: BlockType.ACACIA_LEAF, treeTrunkMin: 3, treeTrunkMax: 5, treeLeafRadius: 3,
    snowCap: false, sandDesert: false, color: '#A89050',
  },
  [Biome.SWAMP]: {
    name: 'Swamp', baseHeight: 6, heightVariation: 2,
    surfaceBlock: BlockType.MUD, subSurfaceBlock: BlockType.MUD, underBlock: BlockType.CLAY,
    seaFillBlock: BlockType.WATER, treeDensity: 0.04, treeLog: BlockType.DARK_OAK_LOG,
    treeLeaf: BlockType.DARK_OAK_LEAF, treeTrunkMin: 4, treeTrunkMax: 6, treeLeafRadius: 3,
    snowCap: false, sandDesert: false, color: '#4E6B3A',
  },
  [Biome.MOUNTAINS]: {
    name: 'Mountains', baseHeight: 18, heightVariation: 18,
    surfaceBlock: BlockType.STONE, subSurfaceBlock: BlockType.STONE, underBlock: BlockType.DEEPSLATE,
    seaFillBlock: BlockType.WATER, treeDensity: 0.02, treeLog: BlockType.SPRUCE_LOG,
    treeLeaf: BlockType.SPRUCE_LEAF, treeTrunkMin: 4, treeTrunkMax: 6, treeLeafRadius: 2,
    snowCap: true, sandDesert: false, color: '#888888',
  },
  [Biome.MESA]: {
    name: 'Mesa', baseHeight: 14, heightVariation: 10,
    surfaceBlock: BlockType.RED_SAND, subSurfaceBlock: BlockType.ORANGE_TERRACOTTA, underBlock: BlockType.TERRACOTTA,
    seaFillBlock: BlockType.WATER, treeDensity: 0.01, treeLog: BlockType.ACACIA_LOG,
    treeLeaf: BlockType.ACACIA_LEAF, treeTrunkMin: 3, treeTrunkMax: 5, treeLeafRadius: 2,
    snowCap: false, sandDesert: true, color: '#B85A28',
  },
};
