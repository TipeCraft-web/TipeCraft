import type { CSSProperties } from 'react';
import { BlockType } from './blocks';

type PickaxePalette = {
  outline: string;
  head: string;
  highlight: string;
  shade: string;
  handle: string;
  handleLight: string;
};

const PICKAXE_PALETTES: Partial<Record<BlockType, PickaxePalette>> = {
  [BlockType.WOODEN_PICKAXE]: {
    outline: '#382516', head: '#a96e38', highlight: '#e2bd76',
    shade: '#704324', handle: '#75441f', handleLight: '#bd8750',
  },
  [BlockType.STONE_PICKAXE]: {
    outline: '#33383b', head: '#858b8d', highlight: '#d3d7d7',
    shade: '#5a6062', handle: '#75441f', handleLight: '#bd8750',
  },
  [BlockType.IRON_PICKAXE]: {
    outline: '#41494c', head: '#b9c4c6', highlight: '#f4ffff',
    shade: '#78868a', handle: '#75441f', handleLight: '#bd8750',
  },
  [BlockType.DIAMOND_PICKAXE]: {
    outline: '#164b4b', head: '#37bbaa', highlight: '#a8fff0',
    shade: '#218478', handle: '#75441f', handleLight: '#bd8750',
  },
};

function pickaxeSvg(palette: PickaxePalette): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <path fill="${palette.outline}" d="M1 2h6v1h4v2h3v2h2v3h-3V9h-4V8H6v2H4V8H2V6H1z"/>
    <path fill="${palette.highlight}" d="M2 3h5v1h4v2h2v1H9V6H6V5H3v1H2z"/>
    <path fill="${palette.head}" d="M1 5h2v2h3V6h4v2h4v1h-5V8H6v2H4V8H2V6H1z"/>
    <path fill="${palette.shade}" d="M8 8h4v1h3v1h-5V9H8z"/>
    <path stroke="${palette.outline}" stroke-width="4" stroke-linecap="square" d="M4 13 10 7"/>
    <path stroke="${palette.handle}" stroke-width="2.2" stroke-linecap="square" d="M4 13 10 7"/>
    <path stroke="${palette.handleLight}" stroke-width="1" stroke-linecap="square" d="M4 13 10 7"/>
  </svg>`;
}

const PICKAXE_ICONS = new Map<BlockType, string>(
  Object.entries(PICKAXE_PALETTES).map(([type, palette]) => [
    Number(type) as BlockType,
    `url("data:image/svg+xml,${encodeURIComponent(pickaxeSvg(palette!))}")`,
  ]),
);

export function getToolIconStyle(type: BlockType): CSSProperties {
  const image = PICKAXE_ICONS.get(type);
  if (!image) return {};
  return {
    backgroundImage: image,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'contain',
    imageRendering: 'pixelated',
  };
}
