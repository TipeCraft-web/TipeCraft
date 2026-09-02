import * as THREE from 'three';
import { BlockType, BLOCK_COLORS } from './blocks';

const TILE = 16;
const BLOCK_COLS = 16;
const VARIANTS = 3;
const ATLAS_COLS = BLOCK_COLS * VARIANTS;
const ROWS = 16;
const ATW  = TILE * ATLAS_COLS;
const ATH  = TILE * ROWS;

type Pat = number[];

function prng(seed: number) {
  let s = ((seed * 9301) ^ 49297) | 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
}

function noisePat(seed: number, amp: number, base = 1.0): Pat {
  const rng = prng(seed);
  return Array.from({ length: 64 }, () => Math.max(0.05, base + (rng() - 0.5) * amp));
}

function spots(seed: number, spotV: number, density: number, bgAmp = 0.12): Pat {
  const rng = prng(seed);
  return Array.from({ length: 64 }, () => {
    const hit = rng() < density;
    return hit ? spotV : Math.max(0.05, 1 + (rng() - 0.5) * bgAmp * 2);
  });
}

function vStripes(dark = 0.82, light = 1.15): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      p.push(x % 2 === 0 ? dark : light);
  return p;
}

function hStripes(dark = 0.82, light = 1.15): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      p.push(y % 2 === 0 ? dark : light);
  return p;
}

function mosaic(seed: number): Pat {
  const rng = prng(seed);
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const border = x === 0 || y === 0 || x === 7 || y === 7 ||
        (x === 4 && y >= 2 && y <= 6) || (y === 4 && x >= 1 && x <= 5);
      p.push(border ? 0.40 + rng() * 0.12 : 0.82 + rng() * 0.30);
    }
  return p;
}

function wave(): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      p.push(0.78 + 0.38 * Math.sin(x * 0.9 + y * 0.55));
  return p;
}

function stillWater(): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      p.push(0.93 + (y % 4 === 0 ? -0.06 : 0.03));
  return p;
}

function cracked(seed: number): Pat {
  const p = noisePat(seed, 0.14);
  [9, 18, 19, 26, 35, 44, 37].forEach(i => { if (i < 64) p[i] = 0.36; });
  return p;
}

function checker(a = 0.62, b = 1.42): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      p.push((x + y) % 2 === 0 ? a : b);
  return p;
}

function tntPat(): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      p.push(y < 2 || y > 5 ? 1.45 : (x + y) % 3 === 0 ? 0.28 : 1.05);
  return p;
}

function magmaPat(): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      p.push((x + y) % 3 === 0 ? 1.68 : 0.70);
  return p;
}

function rings(): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const d = Math.sqrt((x - 3.5) ** 2 + (y - 3.5) ** 2);
      p.push(0.75 + 0.45 * Math.abs(Math.sin(d * 1.3)));
    }
  return p;
}

function chest(): Pat {
  const p: Pat = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const rim = x === 0 || y === 0 || x === 7 || y === 7;
      const lock = x >= 3 && x <= 4 && y >= 3 && y <= 5;
      const hinge = y === 3 && x >= 1 && x <= 6;
      p.push(rim ? 0.55 : lock ? 1.6 : hinge ? 0.65 : 0.9 + Math.sin(x + y * 0.7) * 0.12);
    }
  return p;
}

const PATS: Record<number, Pat> = {
  [BlockType.GRASS]:          noisePat(1, 0.28),
  [BlockType.DIRT]:           noisePat(2, 0.20, 0.95),
  [BlockType.STONE]:          noisePat(3, 0.07),
  [BlockType.BEDROCK]:        spots(4, 0.32, 0.18, 0.10),
  [BlockType.WOOD]:           vStripes(),
  [BlockType.LEAF]:           spots(6, 0.42, 0.10, 0.30),
  [BlockType.SAND]:           noisePat(7, 0.13),
  [BlockType.WATER]:          stillWater(),
  [BlockType.COAL_ORE]:       spots(9, 0.10, 0.20, 0.15),
  [BlockType.IRON_ORE]:       spots(10, 1.55, 0.20, 0.15),
  [BlockType.GLASS]:          noisePat(11, 0.05, 1.06),
  [BlockType.PLANKS]:         hStripes(),
  [BlockType.COBBLESTONE]:    mosaic(13),
  [BlockType.TNT]:            tntPat(),
  [BlockType.GRANITE]:        noisePat(15, 0.22),
  [BlockType.DIORITE]:        noisePat(17, 0.10),
  [BlockType.ANDESITE]:       noisePat(19, 0.14),
  [BlockType.DEEPSLATE]:      cracked(21),
  [BlockType.OAK_LOG]:        vStripes(),
  [BlockType.BIRCH_LOG]:      vStripes(0.88, 1.08),
  [BlockType.SPRUCE_LOG]:     vStripes(0.78, 1.18),
  [BlockType.BIRCH_LEAF]:     spots(49, 0.42, 0.10, 0.28),
  [BlockType.SPRUCE_LEAF]:    spots(50, 0.48, 0.10, 0.25),
  [BlockType.GOLD_ORE]:       spots(55, 1.68, 0.18, 0.14),
  [BlockType.DIAMOND_ORE]:    spots(56, 1.78, 0.18, 0.14),
  [BlockType.EMERALD_ORE]:    spots(57, 1.72, 0.18, 0.14),
  [BlockType.LAPIS_ORE]:      spots(58, 1.70, 0.18, 0.14),
  [BlockType.REDSTONE_ORE]:   spots(59, 1.65, 0.20, 0.14),
  [BlockType.IRON_BLOCK]:     noisePat(64, 0.06),
  [BlockType.GOLD_BLOCK]:     checker(0.82, 1.18),
  [BlockType.DIAMOND_BLOCK]:  checker(0.80, 1.20),
  [BlockType.GRAVEL]:         noisePat(78, 0.40),
  [BlockType.CLAY]:           noisePat(79, 0.07),
  [BlockType.SANDSTONE]:      hStripes(0.88, 1.08),
  [BlockType.ICE]:            noisePat(101, 0.07, 1.10),
  [BlockType.SNOW_BLOCK]:     noisePat(104, 0.04, 1.10),
  [BlockType.NETHERRACK]:     spots(105, 0.55, 0.12, 0.22),
  [BlockType.GLOWSTONE]:      checker(0.62, 1.48),
  [BlockType.OBSIDIAN]:       noisePat(126, 0.08, 0.65),
  [BlockType.MAGMA]:          magmaPat(),
  [BlockType.BIRCH_PLANKS]:   hStripes(0.85, 1.10),
  [BlockType.SPRUCE_PLANKS]:  hStripes(0.78, 1.18),
  [BlockType.STONE_BRICKS]:   mosaic(26),
  [BlockType.NETHER_BRICKS]:  mosaic(108),
  [BlockType.PODZOL]:         spots(81, 0.52, 0.20, 0.16),
  [BlockType.MYCELIUM]:       spots(82, 1.55, 0.15, 0.20),
  [BlockType.CHEST]:          chest(),
  [BlockType.CRAFTING_TABLE]: rings(),
  [BlockType.FURNACE]:        mosaic(18),
  [BlockType.LAVA]:           magmaPat(),
  [BlockType.COBBLED_DEEPSLATE]: mosaic(22),
  [BlockType.MOSS_BLOCK]:     noisePat(86, 0.22),
};

let _atlas: THREE.CanvasTexture | null = null;
let _atlasLoading = false;
const mobTextures = new Map<string, THREE.Texture>();

const blockKeys: Record<number, string> = {};
for (const [key, value] of Object.entries(BlockType)) {
  if (typeof value === 'number') blockKeys[value] = key.toLowerCase();
}

function assetUrl(path: string): string {
  return new URL(`${import.meta.env.BASE_URL}textures/${path}`, window.location.href).toString();
}

type BlockTextureVariant = 'top' | 'side' | 'down';

function variantName(variant: BlockTextureVariant): string {
  return variant[0].toUpperCase() + variant.slice(1);
}

export function blockTextureFile(bt: number, variant: BlockTextureVariant = 'side'): string {
  const key = (blockKeys[bt] ?? 'block').split('_')
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join('');
  return `${key}${variantName(variant)}.png`;
}

export function blockTextureUrl(bt: number, variant: BlockTextureVariant = 'side'): string {
  return assetUrl(`blocks/${blockTextureFile(bt, variant)}`);
}

export function getMobTexture(kind: string): THREE.Texture {
  const cached = mobTextures.get(kind);
  if (cached) return cached;

  const texture = new THREE.TextureLoader().load(assetUrl(`mobs/${kind}.png`));
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  mobTextures.set(kind, texture);
  return texture;
}

function drawFallback(ctx: CanvasRenderingContext2D, bt: number, variant: 0 | 1 | 2) {
  const baseColor = BLOCK_COLORS[bt as BlockType] ?? [0.5, 0.5, 0.5];
  const pat: Pat = PATS[bt] ?? noisePat(bt * 1337 + 7, 0.18);
  const [br, bg, bb] = baseColor;
  for (let py = 0; py < TILE; py++) {
    for (let px = 0; px < TILE; px++) {
      const m = Math.max(0.78, Math.min(1.35, pat[Math.floor(py / 2) * 8 + Math.floor(px / 2)] ?? 1));
      const r = Math.min(255, Math.round(br * 255 * m));
      const g = Math.min(255, Math.round(bg * 255 * m));
      const b = Math.min(255, Math.round(bb * 255 * m));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const col = (bt % BLOCK_COLS) * VARIANTS + variant;
      ctx.fillRect(col * TILE + px, Math.floor(bt / BLOCK_COLS) * TILE + py, 1, 1);
    }
  }
}

function loadBlockImages(canvas: HTMLCanvasElement, texture: THREE.CanvasTexture) {
  if (_atlasLoading) return;
  _atlasLoading = true;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  for (let bt = 1; bt < BLOCK_COLS * ROWS; bt++) {
    for (const [variant, name] of [[0, 'top'], [1, 'side'], [2, 'down']] as const) {
      const image = new Image();
      image.onload = () => {
        const col = (bt % BLOCK_COLS) * VARIANTS + variant;
        const row = Math.floor(bt / BLOCK_COLS);
        ctx.drawImage(image, col * TILE, row * TILE, TILE, TILE);
        texture.needsUpdate = true;
      };
      image.src = blockTextureUrl(bt, name);
    }
  }
}

export function getAtlas(): THREE.CanvasTexture {
  if (_atlas) return _atlas;

  const canvas = document.createElement('canvas');
  canvas.width  = ATW;
  canvas.height = ATH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, ATW, ATH);

  for (let bt = 1; bt < BLOCK_COLS * ROWS; bt++) {
    if (BLOCK_COLORS[bt as BlockType]) {
      drawFallback(ctx, bt, 0);
      drawFallback(ctx, bt, 1);
      drawFallback(ctx, bt, 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter  = THREE.NearestFilter;
  // The atlas UVs are calculated from the canvas' top-left pixel origin.
  // Disable Three's default source flip so face textures keep their vertical orientation.
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  _atlas = tex;
  loadBlockImages(canvas, tex);
  return tex;
}

export function blockUV(bt: number, faceIndex = 1): [number, number, number, number] {
  const variant = faceIndex === 0 ? 0 : faceIndex === 1 ? 2 : 1;
  const col = (bt % BLOCK_COLS) * VARIANTS + variant;
  const row = Math.floor(bt / BLOCK_COLS);
  return [col / ATLAS_COLS, 1 - (row + 1) / ROWS, 1 / ATLAS_COLS, 1 / ROWS];
}
