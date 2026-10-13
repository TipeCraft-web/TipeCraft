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
    <g>
      <path fill="${palette.outline}" d="M1 1h8v2h3v2h3v3h-5V6H8v2H6v2H4V8H2V6H0V3h1z"/>
      <rect x="2" y="2" width="6" height="1" fill="${palette.highlight}"/>
      <rect x="1" y="4" width="9" height="1" fill="${palette.head}"/>
      <rect x="2" y="6" width="5" height="1" fill="${palette.shade}"/>
      <rect x="9" y="3" width="2" height="1" fill="${palette.head}"/>
      <path fill="${palette.outline}" d="M7 7h2v2H7v2H5v2H3v2H1v-2h2v-2h2v-2h2z"/>
      <rect x="7" y="7" width="1" height="1" fill="${palette.handleLight}"/>
      <rect x="5" y="9" width="1" height="1" fill="${palette.handle}"/>
      <rect x="3" y="11" width="1" height="1" fill="${palette.handleLight}"/>
      <rect x="1" y="13" width="1" height="1" fill="${palette.handle}"/>
    </g>
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
