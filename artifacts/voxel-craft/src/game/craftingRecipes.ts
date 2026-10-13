import { BlockType } from './blocks';

export interface CraftOutput {
  type: BlockType;
  count: number;
  consume: { type: BlockType; count: number }[];
}

const LOG_TO_PLANKS: Partial<Record<BlockType, BlockType>> = {
  [BlockType.WOOD]: BlockType.PLANKS,
  [BlockType.OAK_LOG]: BlockType.PLANKS,
  [BlockType.BIRCH_LOG]: BlockType.BIRCH_PLANKS,
  [BlockType.SPRUCE_LOG]: BlockType.SPRUCE_PLANKS,
  [BlockType.DARK_OAK_LOG]: BlockType.DARK_OAK_PLANKS,
  [BlockType.JUNGLE_LOG]: BlockType.JUNGLE_PLANKS,
  [BlockType.ACACIA_LOG]: BlockType.ACACIA_PLANKS,
  [BlockType.BAMBOO_BLOCK]: BlockType.BAMBOO_PLANKS,
};

const PLANK_TYPES = new Set<BlockType>([
  BlockType.PLANKS, BlockType.BIRCH_PLANKS, BlockType.SPRUCE_PLANKS,
  BlockType.DARK_OAK_PLANKS, BlockType.JUNGLE_PLANKS, BlockType.ACACIA_PLANKS,
  BlockType.BAMBOO_PLANKS,
]);

const RECIPE_MATERIALS: { material: BlockType; pickaxe: BlockType; sword: BlockType }[] = [
  { material: BlockType.PLANKS, pickaxe: BlockType.WOODEN_PICKAXE, sword: BlockType.WOODEN_SWORD },
  { material: BlockType.STONE, pickaxe: BlockType.STONE_PICKAXE, sword: BlockType.STONE_SWORD },
  { material: BlockType.IRON_INGOT, pickaxe: BlockType.IRON_PICKAXE, sword: BlockType.IRON_SWORD },
  { material: BlockType.DIAMOND, pickaxe: BlockType.DIAMOND_PICKAXE, sword: BlockType.DIAMOND_SWORD },
];

/**
 * Supports the small 2×2 inventory grid and the full 3×3 crafting table.
 * Recipes intentionally ignore empty positions for shapeless recipes, so
 * clicking or dragging materials into any available slot works naturally.
 */
export function getCraftOutput(grid: BlockType[]): CraftOutput | null {
  const filled = grid.filter(type => type !== BlockType.AIR);

  if (filled.length === 2 && filled.every(type => PLANK_TYPES.has(type))) {
    const plankCounts = new Map<BlockType, number>();
    filled.forEach(type => plankCounts.set(type, (plankCounts.get(type) ?? 0) + 1));
    return {
      type: BlockType.STICK,
      count: 4,
      consume: [...plankCounts].map(([type, count]) => ({ type, count })),
    };
  }

  for (const { material, pickaxe, sword } of RECIPE_MATERIALS) {
    const acceptedMaterials = material === BlockType.PLANKS
      ? filled.filter(type => PLANK_TYPES.has(type))
      : filled.filter(type => type === material);
    if (acceptedMaterials.length === 3 && filled.length === 5 &&
        filled.filter(type => type === BlockType.STICK).length === 2 &&
        acceptedMaterials.length + 2 === filled.length) {
      const consumedMaterial: { type: BlockType; count: number }[] = material === BlockType.PLANKS
        ? [...new Set(acceptedMaterials)].map(type => ({
            type,
            count: acceptedMaterials.filter(item => item === type).length,
          }))
        : [{ type: material, count: 3 }];
      return {
        type: pickaxe,
        count: 1,
        consume: [...consumedMaterial, { type: BlockType.STICK, count: 2 }],
      };
    }

    const swordMaterials = material === BlockType.PLANKS
      ? filled.filter(type => PLANK_TYPES.has(type))
      : filled.filter(type => type === material);
    if (filled.length === 4 && swordMaterials.length === 2 &&
        filled.filter(type => type === BlockType.STICK).length === 2 &&
        swordMaterials.length + 2 === filled.length) {
      const consumedMaterial: { type: BlockType; count: number }[] = material === BlockType.PLANKS
        ? [...new Set(swordMaterials)].map(type => ({
            type,
            count: swordMaterials.filter(item => item === type).length,
          }))
        : [{ type: material, count: 2 }];
      return {
        type: sword,
        count: 1,
        consume: [...consumedMaterial, { type: BlockType.STICK, count: 2 }],
      };
    }
  }

  if (filled.length === 1) {
    const result = LOG_TO_PLANKS[filled[0]];
    if (result !== undefined) {
      return { type: result, count: 4, consume: [{ type: filled[0], count: 1 }] };
    }
  }

  if (filled.length === 4 && filled.every(type => type === BlockType.PLANKS)) {
    return {
      type: BlockType.CRAFTING_TABLE,
      count: 1,
      consume: [{ type: BlockType.PLANKS, count: 4 }],
    };
  }

  if (grid.length >= 9 && filled.length === 8 && grid[4] === BlockType.AIR) {
    if (filled.every(type => type === BlockType.PLANKS)) {
      return {
        type: BlockType.CHEST,
        count: 1,
        consume: [{ type: BlockType.PLANKS, count: 8 }],
      };
    }
    if (filled.every(type => type === BlockType.COBBLESTONE)) {
      return {
        type: BlockType.FURNACE,
        count: 1,
        consume: [{ type: BlockType.COBBLESTONE, count: 8 }],
      };
    }
  }

  return null;
}