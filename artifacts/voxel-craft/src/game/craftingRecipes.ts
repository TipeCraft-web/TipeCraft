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

/**
 * Supports the small 2×2 inventory grid and the full 3×3 crafting table.
 * Recipes intentionally ignore empty positions for shapeless recipes, so
 * clicking or dragging materials into any available slot works naturally.
 */
export function getCraftOutput(grid: BlockType[]): CraftOutput | null {
  const filled = grid.filter(type => type !== BlockType.AIR);

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