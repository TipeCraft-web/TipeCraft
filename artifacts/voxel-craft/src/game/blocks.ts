export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  BEDROCK = 4,
  WOOD = 5,
  LEAF = 6,
  SAND = 7,
  WATER = 8,
  COAL_ORE = 9,
  IRON_ORE = 10,
  GLASS = 11,
  PLANKS = 12,
  COBBLESTONE = 13,
  TNT = 14,
}

// RGB normalized [0-1]
export const BLOCK_COLORS: Record<BlockType, [number, number, number]> = {
  [BlockType.AIR]:        [0, 0, 0],
  [BlockType.GRASS]:      [0x56/255, 0x7d/255, 0x46/255],
  [BlockType.DIRT]:       [0x8B/255, 0x69/255, 0x14/255],
  [BlockType.STONE]:      [0x80/255, 0x80/255, 0x80/255],
  [BlockType.BEDROCK]:    [0x2d/255, 0x2d/255, 0x2d/255],
  [BlockType.WOOD]:       [0x6B/255, 0x44/255, 0x23/255],
  [BlockType.LEAF]:       [0x22/255, 0x8B/255, 0x22/255],
  [BlockType.SAND]:       [0xf4/255, 0xd0/255, 0x4e/255],
  [BlockType.WATER]:      [0x41/255, 0x69/255, 0xE1/255],
  [BlockType.COAL_ORE]:   [0x3a/255, 0x3a/255, 0x3a/255],
  [BlockType.IRON_ORE]:   [0x8B/255, 0x73/255, 0x55/255],
  [BlockType.GLASS]:      [0xad/255, 0xd8/255, 0xe6/255],
  [BlockType.PLANKS]:     [0xDE/255, 0xB8/255, 0x87/255],
  [BlockType.COBBLESTONE]:[0x9e/255, 0x9e/255, 0x9e/255],
  [BlockType.TNT]:        [0xff/255, 0x44/255, 0x44/255],
};

export const BLOCK_NAMES: Record<BlockType, string> = {
  [BlockType.AIR]:        'Air',
  [BlockType.GRASS]:      'Grass',
  [BlockType.DIRT]:       'Dirt',
  [BlockType.STONE]:      'Stone',
  [BlockType.BEDROCK]:    'Bedrock',
  [BlockType.WOOD]:       'Wood',
  [BlockType.LEAF]:       'Leaves',
  [BlockType.SAND]:       'Sand',
  [BlockType.WATER]:      'Water',
  [BlockType.COAL_ORE]:   'Coal Ore',
  [BlockType.IRON_ORE]:   'Iron Ore',
  [BlockType.GLASS]:      'Glass',
  [BlockType.PLANKS]:     'Planks',
  [BlockType.COBBLESTONE]:'Cobblestone',
  [BlockType.TNT]:        'TNT',
};

export function isSolid(type: BlockType): boolean {
  return type !== BlockType.AIR && type !== BlockType.WATER;
}

export function isTransparent(type: BlockType): boolean {
  return type === BlockType.AIR || type === BlockType.WATER || type === BlockType.LEAF || type === BlockType.GLASS;
}

export const HOTBAR_CREATIVE: BlockType[] = [
  BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.SAND,
  BlockType.WOOD, BlockType.LEAF, BlockType.PLANKS, BlockType.COBBLESTONE, BlockType.GLASS,
];

export const HOTBAR_SURVIVAL: BlockType[] = [
  BlockType.DIRT, BlockType.STONE, BlockType.SAND, BlockType.WOOD,
  BlockType.PLANKS, BlockType.COBBLESTONE, BlockType.AIR, BlockType.AIR, BlockType.AIR,
];
